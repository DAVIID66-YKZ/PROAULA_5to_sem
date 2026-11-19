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
        // Consultamos al endpoint que evalúa la ocupación total real por capacidad y sector
        const response = await fetch(`/reservas/ocupadas?fecha=${fecha}&sector=${encodeURIComponent(experienciaRadio.value)}&mesaId=${encodeURIComponent(experienciaRadio.value)}&invitados=${personas}`, {
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
        if (typeof mostrarToast === "function") {
            mostrarToast("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.", "advertencia", "Sesión Caducada");
        } else {
            alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        }
        window.location.href = "/login";
        return;
    }

    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const personas = parseInt(document.getElementById("personas").value);
    const experienciaRadio = document.querySelector('input[name="experiencia"]:checked');

    // Validación de seguridad de Front
    if (!fecha || !hora || !personas || !experienciaRadio) {
        if (typeof mostrarToast === "function") {
            mostrarToast("Por favor, completa todos los campos del formulario.", "advertencia");
        } else {
            alert("Por favor, completa todos los campos del manuscrito.");
        }
        return;
    }

    const { fechaHoy, horaActual } = obtenerFechaYHoraLocal();

    // Validación 1: Fecha no inferior a hoy
    if (fecha < fechaHoy) {
        if (typeof mostrarToast === "function") {
            mostrarToast("No se pueden realizar reservas para fechas pasadas.", "error");
        } else {
            alert("No se pueden realizar reservas para fechas pasadas.");
        }
        return;
    }

    // Validación 2: Si es el mismo día, hora no inferior a la actual
    if (fecha === fechaHoy && hora <= horaActual) {
        if (typeof mostrarToast === "function") {
            mostrarToast("La hora seleccionada para hoy ya ha pasado. Selecciona una hora posterior.", "advertencia");
        } else {
            alert("La hora seleccionada para el día de hoy ya ha pasado. Por favor selecciona una hora posterior.");
        }
        return;
    }

    if (personas > 12 || personas < 1) {
        if (typeof mostrarToast === "function") {
            mostrarToast("Nuestras mesas están diseñadas para un rango de 1 a 12 invitados.", "advertencia");
        } else {
            alert("Nuestras mesas están diseñadas para un rango de 1 a 12 invitados.");
        }
        return;
    }

    // Registra la reserva en estado PENDIENTE para su posterior confirmación y pago desde Mis Reservas
    const reservaData = {
        fecha: fecha,
        hora: hora,
        numeroPersonas: personas,
        usuarioId: idUsuarioActual,
        mesaId: experienciaRadio.value,
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
            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

            const platosTexto = totalPlatos > 0 ? `\n• Platos seleccionados: ${formatoCOP.format(totalPlatos)}` : "";
            const lang = (localStorage.getItem("adminIdioma") || localStorage.getItem("appIdioma") || "es") === "en" ? "en" : "es";

            const tituloMsg = lang === "en" ? "⏳ Reservation Registered (Pending)" : "⏳ Reserva Registrada (Pendiente)";
            const textoMsg = lang === "en"
                ? `Your booking for ${personas} guests on ${fecha} at ${hora} has been saved.${platosTexto}\nStatus: PENDING. Please confirm your table from 'My Reservations'.`
                : `Tu velada para ${personas} personas el ${fecha} a las ${hora} ha sido registrada.${platosTexto}\nEstado: PENDIENTE. Confirma tu mesa desde 'Mis Reservas'.`;

            if (typeof mostrarToast === "function") {
                mostrarToast(
                    textoMsg,
                    "info",
                    tituloMsg,
                    5000
                );
            } else {
                alert(`${tituloMsg}\n${textoMsg}`);
            }

            setTimeout(() => {
                window.location.href = "/cliente/mis-reservas";
            }, 1200);
        } else {
            const errorMsg = await response.text();

            if (response.status === 409) {
                if (typeof mostrarToast === "function") {
                    mostrarToast(errorMsg, "advertencia", "Horario no disponible");
                } else {
                    alert("Lo sentimos: " + errorMsg);
                }
            } else if (response.status === 401 || response.status === 403) {
                if (typeof mostrarToast === "function") {
                    mostrarToast("Sesión inválida. Reingresa a tu cuenta.", "error");
                } else {
                    alert("Sesión inválida. Reingresa a tu cuenta.");
                }
                setTimeout(() => { window.location.href = "/login"; }, 1500);
            } else {
                if (typeof mostrarToast === "function") {
                    mostrarToast(errorMsg, "error", "Atención del Manuscrito");
                } else {
                    alert("Atención del Manuscrito: " + errorMsg);
                }
            }
        }
    } catch (error) {
        console.error("Error crítico de conexión:", error);
        if (typeof mostrarToast === "function") {
            mostrarToast("Error de conexión con el servidor. Inténtalo más tarde.", "error");
        } else {
            alert("Error de conexión con el servidor. Inténtalo más tarde.");
        }
    }
}