document.addEventListener("DOMContentLoaded", function() {
    mostrarNombreUsuario();
});

function obtenerNombreUsuario() {
    const nombreUsuario = "Usuario Ejemplo";
    return nombreUsuario;
}

function mostrarNombreUsuario() {
    const userElement = document.getElementById("user-info");
    if (userElement) {
        const nombreUsuario = obtenerNombreUsuario();
        userElement.textContent = nombreUsuario;
    } else {
        console.error("Elemento 'user-info' no encontrado");
    }
}
