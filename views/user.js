
// Función para obtener el nombre de usuario
function obtenerNombreUsuario() {
    const nombreUsuario = "Usuario Ejemplo";
    return nombreUsuario;
}

// Función para mostrar el nombre de usuario en el elemento "user-info"
function mostrarNombreUsuario() {
    const userElement = document.getElementById("user-info");
    if (userElement) {
        const nombreUsuario = obtenerNombreUsuario();
        userElement.textContent = nombreUsuario;
    } else {
        console.error("Elemento 'user-info' no encontrado");
    }
}


window.onload = function() {
    mostrarNombreUsuario();
};