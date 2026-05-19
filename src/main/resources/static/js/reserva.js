/* ================================================================
   LÓGICA DE RESERVAS - THE CULINARY MANUSCRIPT
   ================================================================ */

// 1. Guardián de navegación inmediato
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || rol !== "CLIENTE") {
        console.warn("Acceso no autorizado detectado. Redirigiendo...");
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const fechaInput = document.getElementById("fecha");
    const experiencias = document.querySelectorAll('input[name="experiencia"]');
    const personasInput = document.getElementById("personas");
    
    // --- Configurar la fecha mínima (Hoy) ---
    const hoy = new Date().toISOString().split("T")[0];
    if (fechaInput) {
        fechaInput.setAttribute("min", hoy);
        
        // Escuchar cambios para recalcular horas disponibles
        fechaInput.addEventListener("change", comprobarHorariosDisponibles);
    }

    // Escuchar cambios en la selección de experiencia (Sector)
    experiencias.forEach(radio => {
        radio.addEventListener("change", comprobarHorariosDisponibles);
    });

    // Escuchar cambios en el número de comensales para ajustar la capacidad de mesas físicas
    if (personasInput) {
        personasInput.addEventListener("change", comprobarHorariosDisponibles);
    }
});

/**
 * Consulta las horas completamente colapsadas del sector y deshabilita las opciones
 */
async function comprobarHorariosDisponibles() {
    const fecha = document.getElementById("fecha").value;
    const experienciaRadio = document.querySelector('input[name="experiencia"]:checked');
    const personas = parseInt(document.getElementById("personas").value) || 2;
    const horaSelect = document.getElementById("hora");
    const token = localStorage.getItem("token");

    // Detener la ejecución si el formulario no tiene datos mínimos seleccionados
    if (!fecha || !experienciaRadio) return;

    try {
        // Consultamos al nuevo endpoint que evalúa la ocupación total real por capacidad
        const response = await fetch(`/reservas/ocupadas?fecha=${fecha}&mesaId=${experienciaRadio.value}&invitados=${personas}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            // El backend retorna un array de strings directo con las horas muertas, ej: ["12:00", "19:00"]
            const horasColapsadas = await response.json(); 
            
            // Resetear y habilitar todas las opciones inicialmente
            Array.from(horaSelect.options).forEach(option => {
                option.disabled = false;
                option.style.color = "#fff";
                option.text = option.text.replace(" (Ocupado)", "");
            });

            // Deshabilitar únicamente las horas que el backend confirmó que no tienen mesas libres
            Array.from(horaSelect.options).forEach(option => {
                if (horasColapsadas.includes(option.value)) {
                    option.disabled = true;
                    option.style.color = "#444"; // Tono gris opaco
                    if (!option.text.includes("(Ocupado)")) {
                        option.text += " (Ocupado)";
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al procesar la grilla de disponibilidad horaria:", error);
    }
}

/**
 * Envía la estructura JSON de la reserva al Backend en Spring Boot
 */
async function guardarReserva(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    const idUsuarioActual = localStorage.getItem("usuarioId");

    if (!token || !idUsuarioActual) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        window.location.href = "/login";
        return;
    }

    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const personas = parseInt(document.getElementById("personas").value);
    const experienciaRadio = document.querySelector('input[name="experiencia"]:checked');

    // Validación de seguridad de Front
    if (!fecha || !hora || !personas || !experienciaRadio) {
        alert("Por favor, completa todos los campos del manuscrito.");
        return;
    }

    if (personas > 12 || personas < 1) {
        alert("Nuestras mesas están diseñadas para un rango de 1 a 12 invitados.");
        return;
    }

    // Estructura JSON mapeada con precisión para evitar que llegue en '0' a MongoDB
    const reservaData = {
        fecha: fecha,
        hora: hora,
        numeroPersonas: personas, // Mapea directo con el int de Java
        usuarioId: idUsuarioActual,
        mesaId: experienciaRadio.value,   // Enviado inicialmente como sector para evaluación
        experiencia: experienciaRadio.value 
    };

    try {
        const response = await fetch("/reservas/guardar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(reservaData)
        });

        if (response.ok) {
            alert("¡Reserva exitosa! Su mesa ha sido preparada en nuestros registros.");
            window.location.href = "/dashboard"; 
        } else {
            const errorMsg = await response.text();
            
            // Captura de excepciones controladas de lógica de negocio (409 Conflict)
            if (response.status === 409 || errorMsg.includes("Conflicto") || errorMsg.includes("ocupadas")) {
                alert(errorMsg);
            } else if (response.status === 401 || response.status === 403) {
                alert("Sesión inválida. Reingresa a tu cuenta.");
                window.location.href = "/login";
            } else {
                alert("Atención del Manuscrito: " + errorMsg);
            }
        }
    } catch (error) {
        console.error("Error crítico de conexión:", error);
        alert("Error de conexión con el servidor. Inténtalo más tarde.");
    }
}