// 1. Guardián de Validación Inmediata de Sesión y Rol
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ADMIN")) {
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
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
            const reservas = await response.json();

            if (!reservas || reservas.length === 0) {
                featuredContainer.innerHTML = `<div class="card-empty">Aún no tienes reservas programadas. Reserva tu mesa creando una nueva experiencia.</div>`;
                futureContainer.innerHTML = `<div class="card-empty">No se encontraron próximas reservas.</div>`;
                return;
            }

            // Ordenar cronológicamente (La más cercana primero)
            reservas.sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));

            // 1. Renderizar la Reserva Más Cercana (Featured)
            const masCercana = reservas[0];
            featuredContainer.innerHTML = generateFeaturedCardHtml(masCercana);

            // 2. Renderizar el resto en la lista inferior (A partir del índice 1)
            const futuras = reservas.slice(1);
            if (futuras.length === 0) {
                futureContainer.innerHTML = `<div class="card-empty">No tienes más reservas programadas.</div>`;
            } else {
                futureContainer.innerHTML = futuras.map(res => generateListItemHtml(res)).join('');
            }

        } else if (response.status === 403) {
            console.error("Error de autorización. Verificando token.");
            localStorage.clear();
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        featuredContainer.innerHTML = `<div class="card-empty" style="color: #ff4444;">Error al cargar tus reservas.</div>`;
    }
}

// Inyección de Componente Destacado Dinámico
function generateFeaturedCardHtml(reserva) {
    const experiencia = reserva.experiencia || "Estándar";
    // Mapeo dinámico de imágenes según el sector elegido
    let imgSrc = "/imagenes/reserva.webp"; 
    if(experiencia.toUpperCase() === "VENTANA") imgSrc = "/imagenes/tables/grand-conservatory.jpg";
    if(experiencia.toUpperCase() === "ALCOBA") imgSrc = "/imagenes/tables/library-nook.jpg";

    return `
        <article class="card featured-booking">
            <div class="card-status-bar">
                <span class="status-dot"></span>
                TU PRÓXIMA VELADA
            </div>
            <div class="featured-content">
                <div class="booking-image-wrapper">
                    <img src="${imgSrc}" alt="${experiencia}">
                </div>
                <div class="booking-details-wrapper">
                    <h2 class="serif-title">Experiencia: ${experiencia}</h2>
                    <p class="booking-description">Tu mesa está confirmada. Prepárate para disfrutar de una velada gastronómica inolvidable.</p>
                    
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
                            <span class="meta-label">PERSONAS</span>
                            <span class="meta-value">${reserva.invitados || 2} personas</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">ESTADO</span>
                            <span class="meta-value" style="color: #d4af37; font-weight:700;">${(reserva.estado || "CONFIRMADA").toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// Inyección de Lista de Elementos Sucesivos
function generateListItemHtml(reserva) {
    return `
        <div class="booking-list-item">
            <div class="item-icon-box">
                <span class="material-symbols-outlined">calendar_today</span>
            </div>
            <div class="item-description">
                <h4 class="serif-sub-title">Experiencia: ${reserva.experiencia || "Estándar"}</h4>
                <p>Mesa confirmada en nuestras instalaciones.</p>
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
                <span class="meta-label">PERSONAS</span>
                <span class="meta-value">${reserva.invitados || 2} personas</span>
            </div>
        </div>
    `;
}