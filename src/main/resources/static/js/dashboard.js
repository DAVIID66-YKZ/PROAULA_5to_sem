
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    // Imprime en consola para que tú mismo veas qué está llegando
    console.log("Validando sesión - Rol encontrado:", rol);

    // Validamos que exista el token y que el rol sea exactamente CLIENTE
    if (!token || String(rol).trim().toUpperCase() !== "CLIENTE") {
        console.warn("Acceso denegado. Redirigiendo al login...");
        window.location.href = "/login";
    }
})();
document.addEventListener("DOMContentLoaded", () => {
    // 1. Validar Sesión
    const token = localStorage.getItem("token");
    const nombre = localStorage.getItem("nombreUsuario"); // Asegúrate de guardar esto en login.js

    if (!token) {
        window.location.href = "/login";
        return;
    }

    // 2. Mostrar nombre de usuario
    if (nombre) {
        document.getElementById("userName").textContent = nombre;
    }

    // 3. (Opcional) Cargar las reservas reales del usuario desde el servidor
    // cargarReservasUsuario(token);
});

async function cargarReservasUsuario(token) {

}