// 1. Guardián de navegación inmediato
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || String(rol).trim().toUpperCase() !== "CLIENTE") {
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

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem("token");
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
        // Evento gatillado al hacer clic en una reserva del calendario
        eventClick: function(info) {
            const extProps = info.event.extendedProps;
            const lang = getIdiomaActualCalendario();
            
            // Generación de URL formateada para Google Calendar API
            const baseGoogleUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
            const tituloText = lang === "en"
                ? `Dinner: Experience ${info.event.title} - GestRest`
                : `Cena: Experiencia ${info.event.title} - GestRest`;
            const titulo = encodeURIComponent(tituloText);
            
            // Re-formatear fecha y hora para el estándar de Google Calendar (YYYYMMDDTHHMMSSZ)
            const fechaLimpia = info.event.startStr.replace(/-/g, "").split("T")[0]; // YYYYMMDD
            const horaLimpia = (extProps.hora || "20:00").replace(/:/g, "") + "00"; // HHMMSS
            const fechasParam = `${fechaLimpia}T${horaLimpia}/${fechaLimpia}T${parseInt(horaLimpia.substring(0,2))+2}${horaLimpia.substring(2)}`; 

            const detallesText = lang === "en"
                ? `Your table for ${extProps.invitados} guests is coordinated under your manuscript records.`
                : `Tu mesa para ${extProps.invitados} personas ya se encuentra coordinada bajo los archivos de tu manuscrito.`;
            const detalles = encodeURIComponent(detallesText);
            
            const googleCalendarUrl = `${baseGoogleUrl}&text=${titulo}&dates=${fechasParam}&details=${detalles}&sf=true&output=xml`;
            
            // Redirección directa en pestaña externa
            window.open(googleCalendarUrl, '_blank');
        }
    });

    // Renderizado inmediato
    calendar.render();

    function refrescarEventos(lang) {
        // Remover eventos existentes
        calendar.removeAllEvents();

        const eventosMapeados = reservasCache.map(reserva => {
            return {
                title: traducirExperienciaCalendario(reserva.experiencia, lang),
                start: reserva.fecha,
                extendedProps: {
                    hora: reserva.hora,
                    invitados: reserva.invitados || reserva.numeroPersonas || 2
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

    // 2. Fetch asíncrono pasándole el token por cabecera de seguridad
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
        } else if (response.status === 403) {
            console.error("No autorizado para descargar el payload del calendario.");
        }
    } catch (error) {
        console.error("Error de conexión con el subsistema de reservas:", error);
    }
});
