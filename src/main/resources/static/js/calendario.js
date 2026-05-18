// 1. Guardián de navegación inmediato
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || String(rol).trim().toUpperCase() !== "CLIENTE") {
        window.location.href = "/login";
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem("token");
    const idUsuario = localStorage.getItem("usuarioId");
    
    const calendarEl = document.getElementById('calendar');

    // Inicialización de FullCalendar en español
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        firstDay: 1, // Lunes como primer día de la semana
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana'
        },
        // Evento gatillado al hacer clic en una reserva del calendario
        eventClick: function(info) {
            const extProps = info.event.extendedProps;
            
            // Generación de URL formateada para Google Calendar API
            const baseGoogleUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
            const titulo = encodeURIComponent(`Cena: Experiencia ${info.event.title} - The Culinary Manuscript`);
            
            // Re-formatear fecha y hora para el estándar de Google Calendar (YYYYMMDDTHHMMSSZ)
            const fechaLimpia = info.event.startStr.replace(/-/g, "").split("T")[0]; // YYYYMMDD
            const horaLimpia = extProps.hora.replace(/:/g, "") + "00"; // HHMMSS
            const fechasParam = `${fechaLimpia}T${horaLimpia}/${fechaLimpia}T${parseInt(horaLimpia.substring(0,2))+2}${horaLimpia.substring(2)}`; 

            const detalles = encodeURIComponent(`Tu mesa para ${extProps.invitados} personas ya se encuentra coordinada bajo los archivos de tu manuscrito.`);
            
            const googleCalendarUrl = `${baseGoogleUrl}&text=${titulo}&dates=${fechasParam}&details=${detalles}&sf=true&output=xml`;
            
            // Redirección directa en pestaña externa
            window.open(googleCalendarUrl, '_blank');
        }
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
            const reservas = await response.json();
            
            // Mapeo y transformación de propiedades para mapear los objetos de negocio a FullCalendar DTOs
            const eventosMapeados = reservas.map(reserva => {
                return {
                    title: reserva.experiencia || "Estándar",
                    start: reserva.fecha, // Espera formato YYYY-MM-DD
                    extendedProps: {
                        hora: reserva.hora, // Propiedades personalizadas para el link de Google
                        invitados: reserva.invitados || 2
                    }
                };
            });

            // Inyección y renderizado atómico de eventos
            calendar.addEventSource(eventosMapeados);
            calendar.render();

        } else if (response.status === 403) {
            console.error("No autorizado para descargar el payload del calendario.");
        }
    } catch (error) {
        console.error("Error de conexión con el subsistema de reservas:", error);
    }
});