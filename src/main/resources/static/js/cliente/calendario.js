// ================================================================
// LÓGICA DE CALENDARIO CLIENTE - GESTREST
// ================================================================

// 1. Guardián de navegación inmediato
(function() {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ROLE_CLIENTE" && rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
        window.location.href = "/login";
    }
})();

function getIdiomaActualCalendario() {
    return (localStorage.getItem("adminIdioma") || localStorage.getItem("appIdioma") || "es") === "en" ? "en" : "es";
}

function traducirExperienciaCalendario(exp, lang) {
    if (!exp) return lang === "en" ? "Standard Table" : "Mesa Estándar";
    const map = {
        "Mesa-Estandar": lang === "en" ? "Standard Table" : "Mesa Estándar",
        "Mesa-Ventana": lang === "en" ? "Window Table" : "Mesa Ventana",
        "Mesa-Alcoba": lang === "en" ? "Alcove Table" : "Mesa Alcoba",
        "Estandar": lang === "en" ? "Standard Table" : "Mesa Estándar",
        "Estándar": lang === "en" ? "Standard Table" : "Mesa Estándar",
        "Ventana": lang === "en" ? "Window Table" : "Mesa Ventana",
        "Alcoba": lang === "en" ? "Alcove Table" : "Mesa Alcoba",
        "Excelente": lang === "en" ? "Excellent" : "Excelente",
        "Regular": lang === "en" ? "Regular" : "Regular",
        "Buena": lang === "en" ? "Good" : "Buena"
    };
    return map[exp] || exp;
}

let googleCalendarUrlActual = "";

function cerrarModalCalendario() {
    const modal = document.getElementById("modalDetalleCalendario");
    if (modal) modal.style.display = "none";
}

function generarGoogleCalendarUrl(tituloText, fechaStr, horaStr, invitados, lang) {
    const baseGoogleUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const titulo = encodeURIComponent(tituloText);

    // Parseo seguro de fecha y hora local con objeto Date para evitar desbordamientos
    const [hh, mm] = (horaStr || "20:00").split(":").map(Number);
    const [anio, mes, dia] = (fechaStr || new Date().toISOString().split("T")[0]).split("-").map(Number);

    const fechaInicio = new Date(anio, mes - 1, dia, hh, mm || 0, 0);
    const fechaFin = new Date(fechaInicio.getTime() + 2 * 60 * 60 * 1000); // 2 horas después

    const formatoGoogleUTC = (d) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const diaNum = String(d.getUTCDate()).padStart(2, "0");
        const h = String(d.getUTCHours()).padStart(2, "0");
        const min = String(d.getUTCMinutes()).padStart(2, "0");
        const s = String(d.getUTCSeconds()).padStart(2, "0");
        return `${y}${m}${diaNum}T${h}${min}${s}Z`;
    };

    const fechasParam = `${formatoGoogleUTC(fechaInicio)}/${formatoGoogleUTC(fechaFin)}`;

    const detallesText = lang === "en"
        ? `Your table for ${invitados} guests is coordinated under your GestRest reservations.`
        : `Tu mesa para ${invitados} personas ya se encuentra coordinada bajo tus reservas en GestRest.`;
    const detalles = encodeURIComponent(detallesText);

    return `${baseGoogleUrl}&text=${titulo}&dates=${fechasParam}&details=${detalles}&sf=true&output=xml`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const idUsuario = localStorage.getItem("usuarioId");

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const isMobile = window.innerWidth <= 768;
    let reservasCache = [];

    const langInicial = getIdiomaActualCalendario();

    // Inicialización de FullCalendar con detección de idioma
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: langInicial,
        firstDay: 1, // Lunes como primer día de la semana
        headerToolbar: isMobile ? {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        } : {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        buttonText: langInicial === 'en' ? {
            today: 'Today',
            month: 'Month',
            week: 'Week'
        } : {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana'
        },
        contentHeight: isMobile ? 650 : 'auto',
        expandRows: true,
        handleWindowResize: true,

        // 🔥 MODAL NO INVASIVO AL HACER CLIC EN UN EVENTO
        eventClick: function(info) {
            const extProps = info.event.extendedProps;
            const lang = getIdiomaActualCalendario();

            const expNombre = info.event.title;
            const fecha = info.event.startStr ? info.event.startStr.split("T")[0] : "-";
            const hora = extProps.hora || "-";
            const invitados = extProps.invitados || 2;
            const estado = (extProps.estado || "PENDIENTE").toUpperCase();

            // Llenar datos en el modal
            const elTitulo = document.getElementById("modalCalTitulo");
            const elFecha = document.getElementById("modalCalFecha");
            const elHora = document.getElementById("modalCalHora");
            const elInvitados = document.getElementById("modalCalInvitados");
            const elEstado = document.getElementById("modalCalEstado");
            const modal = document.getElementById("modalDetalleCalendario");

            if (elTitulo) elTitulo.textContent = expNombre;
            if (elFecha) elFecha.textContent = fecha;
            if (elHora) elHora.textContent = hora;
            if (elInvitados) elInvitados.textContent = `${invitados} ${lang === "en" ? (invitados === 1 ? "guest" : "guests") : (invitados === 1 ? "persona" : "personas")}`;

            if (elEstado) {
                let badgeClass = "status-pill";
                let badgeStyle = "background:rgba(224,170,62,0.15); color:#e0aa3e; border:1px solid rgba(224,170,62,0.4);";
                let textoEstado = estado;

                if (estado === "CONFIRMADA") {
                    badgeStyle = "background:rgba(46, 204, 113, 0.15); color:#2ecc71; border:1px solid rgba(46, 204, 113, 0.4);";
                    textoEstado = lang === "en" ? "Confirmed" : "Confirmada";
                } else if (estado === "CANCELADA") {
                    badgeStyle = "background:rgba(231, 76, 60, 0.15); color:#e74c3c; border:1px solid rgba(231, 76, 60, 0.4);";
                    textoEstado = lang === "en" ? "Cancelled" : "Cancelada";
                } else if (estado === "COMPLETADA") {
                    badgeStyle = "background:rgba(150, 150, 150, 0.15); color:#bbb; border:1px solid rgba(150, 150, 150, 0.4);";
                    textoEstado = lang === "en" ? "Completed" : "Completada";
                } else {
                    textoEstado = lang === "en" ? "Pending" : "Pendiente";
                }

                elEstado.style.cssText = badgeStyle;
                elEstado.textContent = textoEstado;
            }

            // Preparar el enlace de Google Calendar seguro
            const tituloGoogle = lang === "en"
                ? `Dinner: Experience ${expNombre} - GestRest`
                : `Cena: Experiencia ${expNombre} - GestRest`;
            googleCalendarUrlActual = generarGoogleCalendarUrl(tituloGoogle, fecha, hora, invitados, lang);

            const btnGoogle = document.getElementById("btnGoogleCalendar");
            if (btnGoogle) {
                btnGoogle.onclick = function() {
                    if (googleCalendarUrlActual) {
                        window.open(googleCalendarUrlActual, '_blank');
                    }
                };
            }

            if (modal) {
                modal.style.display = "flex";
            }
        }
    });

    calendar.render();

    function refrescarEventos(lang) {
        calendar.removeAllEvents();

        const eventosMapeados = reservasCache.map(reserva => {
            const expNombre = traducirExperienciaCalendario(reserva.experiencia, lang);
            const est = String(reserva.estado || "PENDIENTE").toUpperCase();

            // Colores temáticos acordes al estado de la reserva
            let colorFondo = "rgba(224, 170, 62, 0.25)";
            let colorBorde = "#e0aa3e";
            if (est === "CONFIRMADA") {
                colorFondo = "rgba(46, 204, 113, 0.25)";
                colorBorde = "#2ecc71";
            } else if (est === "CANCELADA") {
                colorFondo = "rgba(231, 76, 60, 0.2)";
                colorBorde = "#e74c3c";
            }

            return {
                title: `${reserva.hora || ''} ${expNombre}`,
                start: reserva.fecha,
                backgroundColor: colorFondo,
                borderColor: colorBorde,
                textColor: "#ffffff",
                extendedProps: {
                    hora: reserva.hora,
                    invitados: reserva.invitados || reserva.numeroPersonas || 2,
                    estado: reserva.estado,
                    experiencia: reserva.experiencia,
                    id: reserva.id
                }
            };
        });

        calendar.addEventSource(eventosMapeados);
    }

    // Escuchar evento de cambio de idioma global
    window.addEventListener("idiomaCambiado", (e) => {
        const nuevoLang = (e && e.detail) ? (e.detail === "en" ? "en" : "es") : getIdiomaActualCalendario();
        calendar.setOption("locale", nuevoLang);
        calendar.setOption("buttonText", nuevoLang === "en" ? {
            today: 'Today',
            month: 'Month',
            week: 'Week'
        } : {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana'
        });
        refrescarEventos(nuevoLang);
    });

    // Cargar reservas del usuario
    try {
        const response = await fetch(`/reservas/usuario/${idUsuario}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            reservasCache = await response.json();
            refrescarEventos(langInicial);
        } else if (response.status === 403 || response.status === 401) {
            console.error("No autorizado para descargar el payload del calendario.");
        }
    } catch (error) {
        console.error("Error de conexión con el subsistema de reservas:", error);
    }
});
