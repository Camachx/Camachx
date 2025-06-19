document.addEventListener('DOMContentLoaded', function() {
    // --- CONEXIÓN A FIREBASE ---
    const db = firebase.firestore();
    const meserosCollection = db.collection('meseros');

    // --- REFERENCIAS A ELEMENTOS DEL HTML ---
    const meserosGrid = document.querySelector('.meseros-grid');
    const fotoEmpleadoMes = document.getElementById('foto-empleado-mes');
    const nombreEmpleadoMes = document.getElementById('nombre-empleado-mes');
    const descripcionEmpleadoMes = document.getElementById('descripcion-empleado-mes');

    // --- LÓGICA PARA "VOTAR UNA SOLA VEZ" (Usa el almacenamiento local del navegador) ---
    // Carga la lista de IDs por los que ya se votó en este dispositivo. Si no hay, crea un array vacío.
    let meserosVotadosLocalmente = JSON.parse(localStorage.getItem('meserosVotados')) || [];

    // ==================================================================
    // FUNCIÓN PRINCIPAL: SE CONECTA Y ESCUCHA CAMBIOS EN TIEMPO REAL
    // ==================================================================
    meserosCollection.orderBy("id", "asc").onSnapshot(function(snapshot) {
        const todosLosMeseros = [];
        snapshot.forEach(function(doc) {
            todosLosMeseros.push(doc.data());
        });
        
        // Si no hay datos en la nube, muestra un mensaje.
        if (todosLosMeseros.length === 0) {
            meserosGrid.innerHTML = "<h2>No se encontraron datos en la base de datos.</h2>";
        } else {
            // Si hay datos, dibuja todo en la pantalla.
            renderizarMeseros(todosLosMeseros);
            actualizarEmpleadoDelMes(todosLosMeseros);
        }
    });

    // --- FUNCIONES PARA DIBUJAR LA PÁGINA ---

    function renderizarMeseros(listaDeMeseros) {
        meserosGrid.innerHTML = ''; // Limpia la sección antes de volver a dibujar
        listaDeMeseros.forEach(function(mesero) {
            const card = document.createElement('div');
            card.classList.add('mesero-card');

            // Revisa si el ID del mesero actual está en nuestra lista local de "ya votados"
            const yaVotado = meserosVotadosLocalmente.includes(mesero.id);
            const claseDisabled = yaVotado ? 'disabled' : ''; // Si ya se votó, deshabilita las estrellas

            card.innerHTML =
                '<div class="mesero-info">' +
                    '<img src="' + mesero.foto + '" alt="' + mesero.nombre + '">' +
                    '<h3>' + mesero.nombre + '</h3>' +
                    '<p>' + mesero.descripcion + '</p>' +
                '</div>' +
                '<div class="mesero-rating">' +
                    '<h4>' + (yaVotado ? 'Ya evaluaste a:' : 'Evaluar:') + '</h4>' +
                    '<div class="stars ' + claseDisabled + '" data-mesero-id="' + mesero.id + '">' +
                        [1,2,3,4,5].map(function(v){return '<i class="far fa-star" data-value="'+v+'"></i>'}).join('') +
                    '</div>' +
                    '<p>Calificación: ' +
                        '<span class="current-rating">' + (mesero.votos > 0 ? (mesero.calificacion / mesero.votos).toFixed(1) : 'N/A') + '</span> ' +
                        '(' + mesero.votos + ' votos)' +
                    '</p>' +
                '</div>';

            meserosGrid.appendChild(card);
            actualizarEstrellasVisuales(card.querySelector('.stars'), mesero.votos > 0 ? (mesero.calificacion / mesero.votos) : 0);
        });
        agregarListenersEstrellas();
    }

    function actualizarEmpleadoDelMes(listaDeMeseros) {
        let mejorMesero = null;
        let maxRatingPromedio = -1;
        listaDeMeseros.forEach(function(mesero) {
            if (mesero.votos > 0) {
                const promedio = mesero.calificacion / mesero.votos;
                if (promedio > maxRatingPromedio) {
                    maxRatingPromedio = promedio;
                    mejorMesero = mesero;
                } else if (promedio === maxRatingPromedio && mejorMesero && mesero.votos > mejorMesero.votos) {
                    mejorMesero = mesero;
                }
            }
        });

        if (mejorMesero) {
            fotoEmpleadoMes.src = mejorMesero.foto; 
            fotoEmpleadoMes.alt = mejorMesero.nombre;
            nombreEmpleadoMes.textContent = mejorMesero.nombre;
            descripcionEmpleadoMes.textContent = '¡Felicidades! Con un promedio de ' + maxRatingPromedio.toFixed(1) + ' estrellas en ' + mejorMesero.votos + ' valoraciones.';
        } else {
            fotoEmpleadoMes.src = "images/empleado_destacado.jpg";
            fotoEmpleadoMes.alt = "Empleado del Mes";
            nombreEmpleadoMes.textContent = "Aún por determinar";
            descripcionEmpleadoMes.textContent = "El miembro con la mejor valoración aparecerá aquí.";
        }
    }

    // --- FUNCIONES DE INTERACCIÓN ---

    function registrarCalificacion(meseroId, valor) {
        // Primero, revisa si la persona ya votó por este mesero en este dispositivo
        if (meserosVotadosLocalmente.includes(meseroId)) {
            alert("Ya has calificado a este miembro del equipo en este dispositivo.");
            return; // Detiene la función aquí si ya votó
        }

        // Si no ha votado, procede a actualizar en Firebase
        const meseroRef = meserosCollection.doc(meseroId);
        meseroRef.update({
            calificacion: firebase.firestore.FieldValue.increment(valor),
            votos: firebase.firestore.FieldValue.increment(1)
        }).then(function() {
            console.log("Voto registrado en la nube.");
            // Si el voto fue exitoso, AÑADE el ID a la lista local y guárdala
            meserosVotadosLocalmente.push(meseroId);
            localStorage.setItem('meserosVotados', JSON.stringify(meserosVotadosLocalmente));
        }).catch(function(error) {
            console.error("Error al votar:", error);
        });
    }
    
    function agregarListenersEstrellas() {
        document.querySelectorAll('.stars').forEach(function(container) {
            if (container.classList.contains('disabled')) return;
            
            container.querySelectorAll('.fa-star').forEach(function(star) {
                star.addEventListener('click', function() {
                    const meseroId = container.dataset.meseroId;
                    const valor = parseInt(star.dataset.value);
                    registrarCalificacion(meseroId, valor);
                });
            });
        });
    }

    function actualizarEstrellasVisuales(starsContainer, ratingPromedio) {
        starsContainer.querySelectorAll('.fa-star').forEach(function(star) {
            star.classList.remove('fas', 'far');
            star.classList.add(star.dataset.value <= Math.round(ratingPromedio) ? 'fas' : 'far');
        });
    }
    
    // --- CÓDIGO DEL FAQ (No cambia) ---
    document.querySelectorAll('.faq-item').forEach(function(item) {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        question.addEventListener('click', function() {
            const isActive = question.classList.contains('active');
            document.querySelectorAll('.faq-item .faq-question').forEach(function(otherItem) {
                otherItem.classList.remove('active');
                otherItem.nextElementSibling.style.maxHeight = null;
            });
            if (!isActive) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});
