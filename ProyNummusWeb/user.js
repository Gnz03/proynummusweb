document.addEventListener("DOMContentLoaded", function() {
    mostrarNombreUsuario();
});

function obtenerNombreUsuario() {
    // Aquí deberías obtener el nombre de usuario de alguna manera
    // Por ejemplo, desde una variable global o una cookie
    // Simularemos un nombre de usuario aquí
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
