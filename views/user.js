// user.js

// Función para obtener el nombre de usuario
function obtenerNombreUsuario() {
    // Supongamos que aquí obtienes el nombre de usuario de alguna manera
    // Por ejemplo, desde una variable global o desde una cookie
    // Aquí lo he simulado simplemente con una variable
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

// Llamar a la función para mostrar el nombre de usuario cuando la página se carga completamente
window.onload = function() {
    mostrarNombreUsuario();
};