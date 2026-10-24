/* ================================================================
   LÓGICA DE RESERVAS - GESTREST
   ================================================================ */

// 1. Guardián de navegación inmediato
(function () {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ROLE_CLIENTE" && rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
        console.warn("Acceso no autorizado detectado. Redirigiendo a registro...");
        window.location.replace("/register");
    } else if (rolUpper === "ADMIN" || rolUpper === "ROLE_ADMIN") {
        window.location.replace("/admin/reservas");
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
        if (!fechaInput.value) {
            fechaInput.value = hoy;
        }

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
function obtenerFechaYHoraLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    return {
        fechaHoy: `${anio}-${mes}-${dia}`,
        horaActual: `${horas}:${minutos}`
    };
}

async function comprobarHorariosDisponibles() {
    const fecha = document.getElementById("fecha").value;
    const experienciaRadio = document.querySelector('input[name="experiencia"]:checked');
    const personas = parseInt(document.getElementById("personas").value) || 2;
    const horaSelect = document.getElementById("hora");
    const token = localStorage.getItem("token");

    // Detener la ejecución si el formulario no tiene datos mínimos seleccionados
    if (!fecha || !experienciaRadio) return;

    const { fechaHoy, horaActual } = obtenerFechaYHoraLocal();
    const esMismoDia = (fecha === fechaHoy);
    const esPasado = (fecha < fechaHoy);

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
            const horasColapsadas = await response.json();

            Array.from(horaSelect.options).forEach(option => {
                const estaOcupada = horasColapsadas.includes(option.value);
                const esHoraPasada = esMismoDia && (option.value <= horaActual);
                const noDisponible = estaOcupada || esHoraPasada || esPasado;

                option.disabled = noDisponible;

                let etiqueta = option.value;
                if (esPasado) {
                    etiqueta += " (Fecha pasada)";
                } else if (esHoraPasada) {
                    etiqueta += " (Hora pasada)";
                } else if (estaOcupada) {
                    etiqueta += " (Ocupado)";
                }

                option.text = etiqueta;
                option.style.color = noDisponible ? "#555" : "#fff";
            });

            // Si la opción seleccionada quedó deshabilitada, seleccionar la primera libre
            if (horaSelect.selectedOptions[0] && horaSelect.selectedOptions[0].disabled) {
                const primeraLibre = Array.from(horaSelect.options).find(o => !o.disabled);
                if (primeraLibre) horaSelect.value = primeraLibre.value;
            }
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

    const { fechaHoy, horaActual } = obtenerFechaYHoraLocal();

    // Validación 1: Fecha no inferior a hoy
    if (fecha < fechaHoy) {
        alert("No se pueden realizar reservas para fechas pasadas.");
        return;
    }

    // Validación 2: Si es el mismo día, hora no inferior a la actual
    if (fecha === fechaHoy && hora <= horaActual) {
        alert("La hora seleccionada para el día de hoy ya ha pasado. Por favor selecciona una hora posterior.");
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
        experiencia: experienciaRadio.value,
        platos: Array.from(document.querySelectorAll(".reserva-plato-checkbox:checked"))
            .map(checkbox => checkbox.value),
        estado: "PENDIENTE"
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
            let totalPlatos = 0;
            document.querySelectorAll(".reserva-plato-checkbox:checked").forEach(cb => {
                totalPlatos += parseFloat(cb.dataset.precio || 0);
            });
            const anticipo = Math.max(10000, Math.round(totalPlatos * 0.05));
            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

            const aviso =
                `✨ ¡SOLICITUD DE RESERVA REGISTRADA! ✨\n\n` +
                `• Estado: PENDIENTE\n` +
                `• Total en productos: ${formatoCOP.format(totalPlatos)}\n` +
                `• Anticipo para apartar mesa: ${formatoCOP.format(anticipo)} (5% con tarifa base mínima de $10.000 COP)\n\n` +
                `Tu reserva ha quedado guardada en estado PENDIENTE. En "Mis Reservas" podrás ver tus platos y confirmarla.`;

            alert(aviso);
            window.location.href = "/cliente/mis-reservas";
        } else {
            const errorMsg = await response.text();

            // Captura de excepciones controladas de lógica de negocio (409 Conflict)
            if (response.status === 409) {
                alert("Lo sentimos: " + errorMsg);
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