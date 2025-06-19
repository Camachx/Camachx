
    // ** TUS DATOS ESTÁN AQUÍ **
    // He tomado los datos que me pasaste y los he adaptado para Firebase.
    // Asegúrate que la ruta de la foto sea correcta (ej: 'images/duki.jpg')
    const datosIniciales = [
        { id: "1", nombre: "Jorge Camacho", descripcion: "Sobrevive", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "2", nombre: "Mesero/a 1", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "3", nombre: "Mesero/a 2", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "4", nombre: "Mesero/a 3", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "5", nombre: "Mesero/a 4", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "6", nombre: "Mesero/a 5", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "7", nombre: "Mesero/a 6", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "8", nombre: "Mesero/a 7", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "9", nombre: "Mesero/a 8", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "10", nombre: "Mesero/a 9", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "11", nombre: "Mesero/a 10", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "12", nombre: "Mesero/a 11", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "13", nombre: "Mesero/a 12", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "14", nombre: "Mesero/a 13", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 },
        { id: "15", nombre: "Mesero/a 14", descripcion: "[descripcion]", foto: "duki.jpg", calificacion: 0, votos: 0 }
    ];

    const batch = db.batch();
    datosIniciales.forEach(function(mesero) {
        // Usamos el 'id' como el nombre del documento en la base de datos
        const docRef = meserosCollection.doc(mesero.id);
        batch.set(docRef, mesero);
    });

    batch.commit()
        .then(function() {
            alert("¡Base de datos inicializada con éxito! Recarga la página para ver los cambios.");
        })
        .catch(function(error) {
            console.error("Error al inicializar:", error);
            alert("Hubo un error al inicializar. Revisa la consola (F12).");
        });
}


// El resto de tu código se ejecuta cuando el HTML está listo.
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
