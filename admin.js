document.addEventListener('DOMContentLoaded', function() {
    // Función para cargar preguntas desde el servidor
    async function cargarPreguntas() {
        try {
            const response = await fetch('/api/preguntas');
            const preguntas = await response.json();

            const listaPreguntas = document.getElementById('question-list');
            listaPreguntas.innerHTML = ''; // Limpiar la lista antes de agregar nuevas preguntas

            preguntas.forEach(pregunta => {
                const li = document.createElement('li');
                li.textContent = `${pregunta.Pregunta} (A: ${pregunta.RespuestaA}, B: ${pregunta.RespuestaB}, C: ${pregunta.RespuestaC}, D: ${pregunta.RespuestaD}, Correcta: ${pregunta.RespuestaCorrecta})`;
                listaPreguntas.appendChild(li);
            });
        } catch (error) {
            console.error('Error al cargar las preguntas:', error);
        }
    }

    // Llamar a la función para cargar las preguntas cuando se cargue la página
    cargarPreguntas();
});