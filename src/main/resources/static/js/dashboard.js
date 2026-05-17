// 1. Guardián de Validación Inmediata de Sesión y Rol
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || String(rol).trim().toUpperCase() !== "CLIENTE") {
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
                featuredContainer.innerHTML = `<div class="card-empty">You have no scheduled experiences yet. Modernize your evening by creating a new reservation.</div>`;
                futureContainer.innerHTML = `<div class="card-empty">No upcoming mappings discovered.</div>`;
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
                futureContainer.innerHTML = `<div class="card-empty">No other subsequent entries recorded.</div>`;
            } else {
                futureContainer.innerHTML = futuras.map(res => generateListItemHtml(res)).join('');
            }

        } else if (response.status === 403) {
            console.error("Subsystem Authorization Error. Checking lifecycle token.");
            localStorage.clear();
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Critical Connection Error:", error);
        featuredContainer.innerHTML = `<div class="card-empty" style="color: #ff4444;">Failed to sync with the manuscript vault.</div>`;
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
                YOUR NEXT EXPERTLY CURATED EVENING
            </div>
            <div class="featured-content">
                <div class="booking-image-wrapper">
                    <img src="${imgSrc}" alt="${experiencia} viewpoint">
                </div>
                <div class="booking-details-wrapper">
                    <h2 class="serif-title">Experience: ${experiencia}</h2>
                    <p class="booking-description">Your table is secure. Prepare your palate for a symphony of historical flavors.</p>
                    
                    <div class="booking-meta-info">
                        <div class="meta-item">
                            <span class="meta-label">DATE</span>
                            <span class="meta-value">${reserva.fecha}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">TIME</span>
                            <span class="meta-value">${reserva.hora}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">GUESTS</span>
                            <span class="meta-value">${reserva.invitados || 2} People</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">STATUS</span>
                            <span class="meta-value" style="color: #d4af37; font-weight:700;">CONFIRMED</span>
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
                <h4 class="serif-sub-title">Experience: ${reserva.experiencia || "Estándar"}</h4>
                <p>Secured placement in our architectural layout.</p>
            </div>
            <div class="item-meta">
                <span class="meta-label">DATE</span>
                <span class="meta-value">${reserva.fecha}</span>
            </div>
            <div class="item-meta">
                <span class="meta-label">TIME</span>
                <span class="meta-value">${reserva.hora}</span>
            </div>
            <div class="item-meta">
                <span class="meta-label">GUESTS</span>
                <span class="meta-value">${reserva.invitados || 2} People</span>
            </div>
        </div>
    `;
}