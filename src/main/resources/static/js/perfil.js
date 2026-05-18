// 1. Guardián de Validación Inmediata de Sesión y Rol
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || String(rol).trim().toUpperCase() !== "CLIENTE") {
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const idUsuario = localStorage.getItem("usuarioId");

    // Cargar la información actual del usuario al abrir la vista
    if (idUsuario && token) {
        obtenerDatosUsuario(token, idUsuario);
    }

    // Escuchador del evento Submit para actualizar datos
    const perfilForm = document.getElementById("perfilForm");
    perfilForm.addEventListener("submit", (e) => {
        e.preventDefault();
        actualizarDatosUsuario(token, idUsuario);
    });
});

// Función para consultar los datos del usuario en la Base de Datos
async function obtenerDatosUsuario(token, idUsuario) {
    try {
        // Asumiendo que tienes un endpoint genérico /usuarios/{id} o /auth/perfil/{id}
        const response = await fetch(`/usuarios/${idUsuario}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const usuario = await response.json();
            
            // Poblar las cajas del formulario HTML
            document.getElementById("perfilNombre").value = usuario.nombre || "";
            document.getElementById("perfilApellido").value = usuario.apellido || "";
            document.getElementById("perfilCorreo").value = usuario.correo || "";
            document.getElementById("perfilTelefono").value = usuario.telefono || "";
            document.getElementById("perfilDireccion").value = usuario.direccion || "";
        } else {
            console.error("Error al obtener los metadatos del usuario.");
        }
    } catch (error) {
        console.error("Error de comunicación en el subsistema de perfil:", error);
    }
}

// Función para enviar los datos modificados al servidor (MongoDB)
async function actualizarDatosUsuario(token, idUsuario) {
    const nombre = document.getElementById("perfilNombre").value;
    const apellido = document.getElementById("perfilApellido").value;
    const telefono = document.getElementById("perfilTelefono").value;
    const direccion = document.getElementById("perfilDireccion").value;

    try {
        // Petición PUT pasándole las modificaciones estructuradas en JSON
        const response = await fetch(`/usuarios/actualizar/${idUsuario}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, apellido, telefono, direccion })
        });

        if (response.ok) {
            // Actualizar también las variables locales para mantener la sincronía del Navbar
            localStorage.setItem("nombreUsuario", nombre);
            
            // Refrescar el componente visual del nombre si aplica
            const navUser = document.getElementById("userName");
            if (navUser) navUser.textContent = nombre;

            alert("Manuscrito de cuenta actualizado con éxito.");
        } else {
            alert("No se pudo actualizar el perfil. Intente nuevamente.");
        }
    } catch (error) {
        console.error("Error crítico durante el guardado de datos:", error);
        alert("Ocurrió un error al conectar con el servidor.");
    }
}