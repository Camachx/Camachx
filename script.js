document.addEventListener('DOMContentLoaded', function() {
    const db = firebase.firestore();
    const meserosCollection = db.collection('meseros');

    const meserosGrid = document.querySelector('.meseros-grid');
    const fotoEmpleadoMes = document.getElementById('foto-empleado-mes');
    const nombreEmpleadoMes = document.getElementById('nombre-empleado-mes');
    const descripcionEmpleadoMes = document.getElementById('descripcion-empleado-mes');

    // La lista de meseros por los que este dispositivo ya votó se guarda en el almacenamiento local.
    let meserosVotadosLocalmente = JSON.parse(localStorage.getItem('meserosVotados')) || [];

    // Esta función escucha cambios en la base de datos EN TIEMPO REAL.
    meserosCollection.orderBy("id", "asc").onSnapshot(function(snapshot) {
        const todosLosMeseros = [];
        snapshot.forEach(function(doc) {
            todosLosMeseros.push(doc.data());
        });
        
        if (todosLosMeseros.length === 0) {
            meserosGrid.innerHTML = "<h2>Aún no hay datos en la base de datos. Abre la consola (F12) y ejecuta: inicializarBaseDeDatos()</h2>";
        } else {
            renderizarMeseros(todosLosMeseros);
            actualizarEmpleadoDelMes(todosLosMeseros);
        }
    });

    function renderizarMeseros(listaDeMeseros) {
        meserosGrid.innerHTML = '';
        listaDeMeseros.forEach(function(mesero) {
            const card = document.createElement('div');
            card.classList.add('mesero-card');

            const yaVotado = meserosVotadosLocalmente.includes(mesero.id);
            const claseDisabled = yaVotado ? 'disabled' : '';

            card.innerHTML =
                '<div class="mesero-info">' +
                    '<img src="' + mesero.foto + '" alt="' + mesero.nombre + '">' +
                    '<h3>' + mesero.nombre + '</h3>' +
                    '<p>' + mesero.descripcion + '</p>' +
                '</div>' +
                '<div class="mesero-rating">' +
                    '<h4>' + (yaVotado ? 'Ya evaluaste a:' : 'Evaluar:') + '</h4>' +
                    '<div class="stars ' + claseDisabled + '" data-mesero-id="' + mesero.id + '">' +
                        [1,2,3,4,5].map(function(v){return '<i class="far fa-star" data-value="'+v+'"></i>'}).join('')+
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

    function registrarCalificacion(meseroId, valor) {
        if (meserosVotadosLocalmente.includes(meseroId)) {
            alert("Ya has calificado a este miembro del equipo en este dispositivo.");
            return;
        }
        const meseroRef = meserosCollection.doc(meseroId);
        meseroRef.update({
            calificacion: firebase.firestore.FieldValue.increment(valor),
            votos: firebase.firestore.FieldValue.increment(1)
        }).then(function() {
            console.log("Voto registrado en la nube.");
            meserosVotadosLocalmente.push(meseroId);
            localStorage.setItem('meserosVotados', JSON.stringify(meserosVotadosLocalmente));
        }).catch(function(error) {
            console.error("Error al votar:", error);
        });
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
    
    function agregarListenersEstrellas() {
        const allStarsContainers = document.querySelectorAll('.stars');
        allStarsContainers.forEach(function(container) {
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
    
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function(item) {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        question.addEventListener('click', function() {
            const isActive = question.classList.contains('active');
            faqItems.forEach(function(otherItem) {
                otherItem.querySelector('.faq-question').classList.remove('active');
                otherItem.querySelector('.faq-answer').style.maxHeight = null;
            });
            if (!isActive) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
})
