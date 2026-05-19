/* ================================================================
   LÓGICA DE RESERVAS - THE CULINARY MANUSCRIPT
   ================================================================ */
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
    const horaSelect = document.getElementById("hora");
    const experiencias = document.querySelectorAll('input[name="experiencia"]');
    
    // Configurar la fecha mínima (Hoy)
    const hoy = new Date().toISOString().split("T")[0];
    if (fechaInput) {
        fechaInput.setAttribute("min", hoy);
        
        // Escuchar cambios para recalcular horas disponibles
        fechaInput.addEventListener("change", comprobarHorariosDisponibles);
    }

    experiencias.forEach(radio => {
        radio.addEventListener("change", comprobarHorariosDisponibles);
    });
});

/**
 * Consulta las reservas del día y deshabilita las horas bloqueadas por el rango de 2 horas
 */
async function comprobarHorariosDisponibles() {
    const fecha = document.getElementById("fecha").value;
    const experienciaRadio = document.querySelector('input[name="experiencia"]:checked');
    const horaSelect = document.getElementById("hora");
    const token = localStorage.getItem("token");

    if (!fecha || !experienciaRadio) return;

    try {
        // Consultamos las reservas existentes para ese sector y fecha
        const response = await fetch(`/reservas/ocupadas?fecha=${fecha}&mesaId=${experienciaRadio.value}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const reservasOcupadas = await response.json();
            
            // Habilitar todas las opciones inicialmente para resetear el estado
            Array.from(horaSelect.options).forEach(option => {
                option.disabled = false;
                option.style.color = "#fff";
                option.text = option.text.replace(" (Ocupado)", "");
            });

            // Analizar los conflictos de 2 horas para cada opción del select
            reservasOcupadas.forEach(reserva => {
                const [oHora, oMin] = reserva.hora.split(":").map(Number);
                const tiempoOcupadoMinutos = oHora * 60 + oMin;

                Array.from(horaSelect.options).forEach(option => {
                    const [sHora, sMin] = option.value.split(":").map(Number);
                    const tiempoSelectMinutos = sHora * 60 + sMin;

                    // Calcular la diferencia absoluta en minutos
                    const diferencia = Math.abs(tiempoSelectMinutos - tiempoOcupadoMinutos);

                    // Si la diferencia es menor a 120 minutos (2 horas), se bloquea la celda
                    if (diferencia < 120) {
                        option.disabled = true;
                        option.style.color = "#444"; // Color gris oscuro de bloqueado
                        if (!option.text.includes("(Ocupado)")) {
                            option.text += " (Ocupado)";
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error al mapear horarios disponibles:", error);
    }
}

/**
 * Envía los datos de la reserva al Backend
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

    if (!fecha || !hora || !personas || !experienciaRadio) {
        alert("Por favor, completa todos los campos del manuscrito.");
        return;
    }

// En tu archivo reserva.js, dentro de la función guardarReserva:
const reservaData = {
    fecha: fecha,
    hora: hora,
    numeroPersonas: personas, // 🔥 CAMBIADO: De 'invitados' a 'numeroPersonas'
    usuarioId: idUsuarioActual,
    mesaId: experienciaRadio.value, 
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
            if (response.status === 409 || errorMsg.includes("Conflicto")) {
                alert(errorMsg);
            } else {
                alert("Atención: " + errorMsg);
            }
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error crítico de conexión con el servidor.");
    }
}