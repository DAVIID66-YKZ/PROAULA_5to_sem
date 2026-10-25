// ================================================================
// DASHBOARD CLIENTE - GESTREST
// Muestra únicamente las próximas reservas a futuro.
// ================================================================

// 1. Guardián de Validación Inmediata de Sesión y Rol
(function() {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ROLE_CLIENTE" && rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const nombre = localStorage.getItem("nombreUsuario");
    const idUsuario = localStorage.getItem("usuarioId");

    // Mostrar Nombre de Usuario Realizado en Login
    if (nombre && document.getElementById("userName")) {
        document.getElementById("userName").textContent = nombre;
    }

    // Cargar Estructuras del Backend
    if (idUsuario && token) {
        cargarEstructuraDashboard(token, idUsuario);
    }
});

// Helper para determinar si una reserva pertenece al futuro
function esReservaFutura(reserva) {
    if (!reserva || !reserva.fecha) return false;

    // Descartar reservas canceladas o rechazadas
    const estado = String(reserva.estado || "").toUpperCase();
    if (estado === "CANCELADA" || estado === "RECHAZADA") {
        return false;
    }

    const ahora = new Date();
    const hora = reserva.hora ? (reserva.hora.length === 5 ? reserva.hora : reserva.hora.padStart(5, '0')) : "00:00";
    const fechaHoraReserva = new Date(`${reserva.fecha}T${hora}:00`);

    if (isNaN(fechaHoraReserva.getTime())) {
        const fechaHoy = ahora.toISOString().split("T")[0];
        return reserva.fecha >= fechaHoy;
    }

    return fechaHoraReserva >= ahora;
}

// Mapeo amigable de experiencias
function formatearNombreExperiencia(exp) {
    if (!exp) return "Salón Principal (Estándar)";
    const expLimpia = exp.trim();
    const mapa = {
        "Mesa-Estandar": "Salón Principal (Estándar)",
        "Mesa-Ventana": "Vista a la Ciudad (Ventana)",
        "Mesa-Alcoba": "Zona Privada (Alcoba)",
        "Estandar": "Salón Principal (Estándar)",
        "Ventana": "Vista a la Ciudad (Ventana)",
        "Alcoba": "Zona Privada (Alcoba)"
    };
    return mapa[expLimpia] || expLimpia.replace("Mesa-", "");
}

async function cargarEstructuraDashboard(token, idUsuario) {
    const featuredContainer = document.getElementById("featuredBookingContainer");
    const futureContainer = document.getElementById("futureBookingsContainer");

    try {
        const response = await fetch(`/reservas/usuario/${idUsuario}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const todasLasReservas = await response.json();

            // Filtrar ÚNICAMENTE las reservas a futuro (excluyendo todas las pasadas)
            const reservasFuturas = (Array.isArray(todasLasReservas) ? todasLasReservas : [])
                .filter(res => esReservaFutura(res));

            if (!reservasFuturas || reservasFuturas.length === 0) {
                featuredContainer.innerHTML = `
                    <div class="card-empty" style="padding: 45px 20px;">
                        <span class="material-symbols-outlined" style="font-size: 42px; color: #d4af37; display: block; margin-bottom: 12px;">event_available</span>
                        <h3 style="color: #ffffff; font-size: 1.3rem; margin-bottom: 8px; font-family: 'Noto Serif', serif;">No tienes reservas programadas próximamente</h3>
                        <p style="color: #888888; font-size: 0.95rem; max-width: 520px; margin: 0 auto 22px; line-height: 1.5;">
                            Tu mesa te espera. Puedes reservar tu próxima velada gastronómica o consultar tus visitas anteriores en tu historial.
                        </p>
                        <a href="/reserva" class="btn-new-reservation" style="display: inline-flex; margin: 0 auto; text-decoration: none;">
                            <span class="material-symbols-outlined icon-small">menu_book</span>
                            Reservar Ahora
                        </a>
                    </div>
                `;
                futureContainer.innerHTML = `
                    <div class="card-empty">
                        No hay más reservas futuras. Consulta tu historial de visitas pasadas en <a href="/mis-reservas" style="color: #d4af37; text-decoration: underline;">Mis Reservas</a>.
                    </div>
                `;
                return;
            }

            // Ordenar cronológicamente (la reserva futura más próxima va primero)
            reservasFuturas.sort((a, b) => {
                const dateA = new Date(`${a.fecha}T${(a.hora || "00:00")}:00`);
                const dateB = new Date(`${b.fecha}T${(b.hora || "00:00")}:00`);
                return dateA - dateB;
            });

            // 1. Renderizar la Reserva Más Cercana en el Futuro (Featured)
            const masCercana = reservasFuturas[0];
            featuredContainer.innerHTML = generateFeaturedCardHtml(masCercana);

            // 2. Renderizar el resto de reservas futuras en la lista inferior
            const siguientesFuturas = reservasFuturas.slice(1);
            if (siguientesFuturas.length === 0) {
                futureContainer.innerHTML = `
                    <div class="card-empty">
                        No tienes más reservas programadas próximamente. Puedes ver tu historial de visitas pasadas en <a href="/mis-reservas" style="color: #d4af37; text-decoration: underline;">Mis Reservas</a>.
                    </div>
                `;
            } else {
                futureContainer.innerHTML = siguientesFuturas.map(res => generateListItemHtml(res)).join('');
            }

        } else if (response.status === 401 || response.status === 403) {
            console.error("Error de autorización. Redirigiendo al login.");
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error de conexión al cargar reservas del dashboard:", error);
        featuredContainer.innerHTML = `<div class="card-empty" style="color: #ff5555;">Error al consultar las próximas reservas.</div>`;
    }
}

// Inyección de Componente Destacado Dinámico (Próxima Velada Futura)
function generateFeaturedCardHtml(reserva) {
    const experienciaTexto = formatearNombreExperiencia(reserva.experiencia);
    const expUpper = String(reserva.experiencia || "").toUpperCase();

    // Mapeo dinámico de imágenes según el sector elegido
    let imgSrc = "/imagenes/reserva.webp"; 
    if (expUpper.includes("VENTANA")) imgSrc = "/imagenes/tables/grand-conservatory.jpg";
    if (expUpper.includes("ALCOBA")) imgSrc = "/imagenes/tables/library-nook.jpg";

    const invitados = reserva.numeroPersonas || reserva.invitados || 2;
    const estado = (reserva.estado || "PENDIENTE").toUpperCase();
    const colorEstado = estado === "CONFIRMADA" ? "#4caf50" : "#d4af37";

    return `
        <article class="card featured-booking">
            <div class="card-status-bar">
                <span class="status-dot"></span>
                TU PRÓXIMA VELADA
            </div>
            <div class="featured-content">
                <div class="booking-image-wrapper">
                    <img src="${imgSrc}" alt="${experienciaTexto}" onerror="this.src='/imagenes/reserva.webp'">
                </div>
                <div class="booking-details-wrapper">
                    <h2 class="serif-title">${experienciaTexto}</h2>
                    <p class="booking-description">Tu mesa está apartada en el Manuscrito Culinario. Prepárate para disfrutar de una velada gastronómica memorable.</p>
                    
                    <div class="booking-meta-info">
                        <div class="meta-item">
                            <span class="meta-label">FECHA</span>
                            <span class="meta-value">${reserva.fecha}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">HORA</span>
                            <span class="meta-value">${reserva.hora}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">INVITADOS</span>
                            <span class="meta-value">${invitados} persona${invitados > 1 ? 's' : ''}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">ESTADO</span>
                            <span class="meta-value" style="color: ${colorEstado}; font-weight:700;">${estado}</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// Inyección de Lista de Elementos Sucesivos a Futuro
function generateListItemHtml(reserva) {
    const experienciaTexto = formatearNombreExperiencia(reserva.experiencia);
    const invitados = reserva.numeroPersonas || reserva.invitados || 2;
    const estado = (reserva.estado || "PENDIENTE").toUpperCase();

    return `
        <div class="booking-list-item">
            <div class="item-icon-box">
                <span class="material-symbols-outlined">calendar_today</span>
            </div>
            <div class="item-description">
                <h4 class="serif-sub-title">${experienciaTexto}</h4>
                <p>Mesa reservada • <strong style="color: #d4af37;">${estado}</strong></p>
            </div>
            <div class="item-meta">
                <span class="meta-label">FECHA</span>
                <span class="meta-value">${reserva.fecha}</span>
            </div>
            <div class="item-meta">
                <span class="meta-label">HORA</span>
                <span class="meta-value">${reserva.hora}</span>
            </div>
            <div class="item-meta">
                <span class="meta-label">INVITADOS</span>
                <span class="meta-value">${invitados} persona${invitados > 1 ? 's' : ''}</span>
            </div>
        </div>
    `;
}