/* ================================================================
   LÓGICA DE RESERVAS - THE CULINARY MANUSCRIPT
   ================================================================ */
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    // Si no hay token o el rol no es CLIENTE, redirigir al login inmediatamente
    if (!token || rol !== "CLIENTE") {
        console.warn("Acceso no autorizado detectado. Redirigiendo...");
        window.location.href = "/login";
    }
})();
document.addEventListener("DOMContentLoaded", () => {
    const fechaInput = document.getElementById("fecha");
    
    // --- REGLA 1: No permitir fechas pasadas ---
    // Obtenemos la fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split("T")[0];
    if (fechaInput) {
        fechaInput.setAttribute("min", hoy);
    }
});

/**
 * Envia los datos de la reserva al Backend
 */
async function guardarReserva(event) {
    event.preventDefault();

    // 1. COMPROBACIÓN DE CREDENCIALES
    const token = localStorage.getItem("token");
    const idUsuarioActual = localStorage.getItem("usuarioId");

    if (!token || !idUsuarioActual) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        window.location.href = "/login";
        return;
    }

    // 2. CAPTURA DE DATOS DEL FORMULARIO
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const personas = parseInt(document.getElementById("personas").value);
    
    // Capturamos el Radio Button seleccionado para la experiencia
    const experienciaRadio = document.querySelector('input[name="experiencia"]:checked');

    // 3. VALIDACIONES DE FRONTEND (Reglas de Negocio)
    
    if (!fecha || !hora || !personas || !experienciaRadio) {
        alert("Por favor, completa todos los campos del manuscrito.");
        return;
    }

    // --- REGLA 2: Límite de invitados (1 a 12) ---
    if (personas > 12 || personas < 1) {
        alert("Nuestras mesas están diseñadas para un máximo de 12 invitados.");
        return;
    }

    // --- REGLA 3: Horario de atención (10 AM a 10 PM) ---
    const horaNum = parseInt(hora.split(":")[0]);
    if (horaNum < 10 || horaNum > 22) {
        alert("El restaurante atiende de 10:00 AM a 10:00 PM.");
        return;
    }

    // 4. ESTRUCTURA DEL OBJETO PARA EL BACKEND
    const reservaData = {
        fecha: fecha,
        hora: hora,
        numeroPersonas: personas,
        usuarioId: idUsuarioActual,
        // mesaId se envía inicialmente con el nombre del sector (Mesa-Ventana / Mesa-Alcoba)
        // para que el Service busque la mesa disponible en ese sector.
        mesaId: experienciaRadio.value, 
        // 🔥 Nueva variable para persistir el nombre legible de la experiencia
        experiencia: experienciaRadio.value 
    };

    // 5. ENVÍO AL SERVIDOR
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
            window.location.href = "/dashboard"; // Redirige al panel principal
        } else {
            const errorMsg = await response.text();
            
            // --- REGLA 4: Manejo de Mesa/Hora ocupada ---
            if (response.status === 409 || errorMsg.includes("ocupada") || errorMsg.includes("disponibles")) {
                alert("Lo sentimos: Ya existe una reserva para esa hora o no hay mesas disponibles en ese sector.");
            } else if (response.status === 401 || response.status === 403) {
                alert("Sesión inválida. Reingresa a tu cuenta.");
                window.location.href = "/login";
            } else {
                alert("Atención: " + errorMsg);
            }
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error crítico de conexión con el servidor. Inténtalo más tarde.");
    }
}