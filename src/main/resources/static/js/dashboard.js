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
    // Aquí podrías hacer un fetch a un endpoint que traiga 
    // las reservas del usuarioId guardado
}