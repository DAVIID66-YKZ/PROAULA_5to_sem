/* ================================================================
   LÓGICA DE MIS RESERVAS - GESTREST
   Visualización de platos, cálculo de anticipo (5% o mín 10k)
   y confirmación de reservas en estado Pendiente.
   ================================================================ */

(function () {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ADMIN")) {
        console.warn("Acceso no autorizado detectado. Redirigiendo...");
        window.location.href = "/login";
    }
})();

const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// Cache local de platos y reservas cargadas
let catalogoPlatosMap = {};
let listaReservasActuales = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarPlatosYReservas();
});

/**
 * Carga el catálogo de platos desde la API pública y luego las reservas del usuario
 */
async function cargarPlatosYReservas() {
    try {
        const resMenu = await fetch("/menu/api/listar");
        if (resMenu.ok) {
            const platos = await resMenu.json();
            catalogoPlatosMap = {};
            platos.forEach(p => {
                catalogoPlatosMap[p.id] = p;
            });
        }
    } catch (e) {
        console.warn("No se pudo cargar el catálogo de platos en JSON:", e);
    }

    await cargarMisReservas();
}

/**
 * Obtiene las reservas del usuario desde el servidor y llena la tabla
 */
async function cargarMisReservas() {
    const token = localStorage.getItem("token");
    const idUsuario = localStorage.getItem("usuarioId");
    const tbody = document.getElementById("listaReservasBody");

    if (!token || !idUsuario) {
        window.location.href = "/login";
        return;
    }

    try {
        const response = await fetch(`/reservas/usuario/${idUsuario}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            listaReservasActuales = await response.json();
            tbody.innerHTML = "";

            if (listaReservasActuales.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding: 80px; color: #666;">
                            <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 10px;">history_edu</span>
                            Aún no has escrito capítulos en tu historia culinaria.
                        </td>
                    </tr>`;
                return;
            }

            const ahora = new Date();

            listaReservasActuales.forEach(res => {
                const nombreExperiencia = res.experiencia ? res.experiencia.replace("Mesa-", "") : "Estándar";

                // Comparación cronológica con la hora del sistema
                const fechaReserva = new Date(`${res.fecha}T${res.hora}`);
                const yaPaso = fechaReserva < ahora;

                // Cálculo de platos y anticipo
                const platosIds = Array.isArray(res.platos) ? res.platos : [];
                let totalPlatos = 0;
                platosIds.forEach(id => {
                    const plato = catalogoPlatosMap[id];
                    if (plato && plato.precio) {
                        totalPlatos += Number(plato.precio);
                    }
                });

                // Regla del 5% con base mínima de 10k
                const anticipo = Math.max(10000, Math.round(totalPlatos * 0.05));

                // HTML de la columna de platos
                let platosHtml = "";
                if (platosIds.length > 0) {
                    platosHtml = `
                        <button type="button" class="btn-ver-platos" onclick="verDetallePlatos('${res.id}')" title="Ver platos seleccionados">
                            <span>🍽️ ${platosIds.length} plato${platosIds.length > 1 ? "s" : ""}</span>
                            <span class="platos-precio-tag">(${formatoCOP.format(totalPlatos)})</span>
                        </button>
                    `;
                } else {
                    platosHtml = `<span class="sin-platos-tag">Sin platos (Mesa base $10k)</span>`;
                }

                const estadoRes = String(res.estado || "PENDIENTE").toUpperCase();
                let estadoBadge = "";
                let botonesAcciones = "";

                if (yaPaso) {
                    estadoBadge = `<span class="status-pill pill-past">Completada</span>`;

                    const tieneComentario = res.comentario && res.comentario !== "null" && res.comentario.trim() !== "";
                    const icono = tieneComentario ? "rate_review" : "chat_bubble";
                    const estiloDorado = tieneComentario ? "style='color: #d4af37;'" : "";
                    const comentarioSanitizado = tieneComentario ? encodeURIComponent(res.comentario) : "";

                    botonesAcciones = `
                        <button class="btn-icon-table" onclick="abrirModalComentario('${res.id}', '${comentarioSanitizado}')" title="Dejar Comentario">
                            <span class="material-symbols-outlined" ${estiloDorado}>${icono}</span>
                        </button>
                    `;
                } else if (estadoRes === "PENDIENTE") {
                    estadoBadge = `
                        <span class="status-pill" style="background:rgba(224,170,62,0.15); color:#e0aa3e; border:1px solid rgba(224,170,62,0.4);" title="Anticipo requerido: ${formatoCOP.format(anticipo)}">
                            Pendiente (${formatoCOP.format(anticipo)})
                        </span>
                    `;

                    botonesAcciones = `
                        <button type="button" class="btn-confirmar-tabla" onclick="confirmarReserva('${res.id}', '${res.fecha}', '${res.hora}', ${totalPlatos}, ${anticipo})" title="Confirmar esta reserva">
                            <span class="material-symbols-outlined">check_circle</span>
                            <span>Confirmar</span>
                        </button>
                        <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="Cancelar Reserva">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    `;
                } else {
                    // CONFIRMADA
                    estadoBadge = `
                        <span class="status-pill" style="background:rgba(46, 204, 113, 0.15); color:#2ecc71; border:1px solid rgba(46, 204, 113, 0.4);">
                            Confirmada
                        </span>
                    `;

                    botonesAcciones = `
                        <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="Cancelar Reserva">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    `;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="serif-gold">${res.fecha}</td>
                        <td>${res.hora}</td>
                        <td>${res.numeroPersonas} personas</td>
                        <td><span class="gold-text">${nombreExperiencia}</span></td>
                        <td>${platosHtml}</td>
                        <td>${estadoBadge}</td>
                        <td>${botonesAcciones}</td>
                    </tr>
                `;
            });

        } else if (response.status === 403 || response.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error al cargar:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: #ff4444; padding: 20px;">Error de conexión con el servidor.</td></tr>`;
    }
}

/**
 * Muestra el modal con el detalle completo de platos preordenados de una reserva
 */
function verDetallePlatos(idReserva) {
    const reserva = listaReservasActuales.find(r => r.id === idReserva);
    if (!reserva) return;

    const listaEl = document.getElementById("modalPlatosLista");
    const totalEl = document.getElementById("modalPlatosTotalProductos");
    const anticipoEl = document.getElementById("modalPlatosAnticipo");
    const modalEl = document.getElementById("modalDetallePlatos");

    if (!listaEl || !totalEl || !anticipoEl || !modalEl) return;

    listaEl.innerHTML = "";
    const platosIds = Array.isArray(reserva.platos) ? reserva.platos : [];
    let totalPlatos = 0;

    platosIds.forEach(id => {
        const plato = catalogoPlatosMap[id];
        const nombre = plato ? plato.nombre : `Plato #${id.substring(0, 6)}`;
        const precio = plato && plato.precio ? Number(plato.precio) : 0;
        totalPlatos += precio;

        const fila = document.createElement("div");
        fila.className = "modal-plato-fila";
        fila.innerHTML = `
            <span class="plato-nombre">${nombre}</span>
            <span class="plato-precio">${formatoCOP.format(precio)}</span>
        `;
        listaEl.appendChild(fila);
    });

    const anticipo = Math.max(10000, Math.round(totalPlatos * 0.05));

    totalEl.textContent = formatoCOP.format(totalPlatos);
    anticipoEl.textContent = formatoCOP.format(anticipo);

    modalEl.style.display = "flex";
}

function cerrarModalPlatos() {
    const modalEl = document.getElementById("modalDetallePlatos");
    if (modalEl) modalEl.style.display = "none";
}

/**
 * Confirma una reserva que se encuentra en estado PENDIENTE
 */
async function confirmarReserva(id, fecha, hora, totalPlatos, anticipo) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    const mensajePregunta =
        `¿Deseas confirmar definitivamente tu reserva para el ${fecha} a las ${hora}?\n\n` +
        `• Total en productos: ${formatoCOP.format(totalPlatos)}\n` +
        `• Anticipo para apartar mesa: ${formatoCOP.format(anticipo)} (5% del consumo, mínimo $10.000 COP)\n\n` +
        `Tu mesa pasará a estado CONFIRMADA en nuestro restaurante.`;

    if (!confirm(mensajePregunta)) {
        return;
    }

    try {
        const response = await fetch(`/reservas/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado: "CONFIRMADA" })
        });

        if (response.ok) {
            alert("🎉 ¡Reserva confirmada con éxito! Tu mesa ha sido asegurada.");
            cargarMisReservas();
        } else {
            const err = await response.text();
            alert("No se pudo confirmar la reserva: " + err);
        }
    } catch (e) {
        console.error("Error al confirmar reserva:", e);
        alert("Ocurrió un error de conexión al confirmar la reserva.");
    }
}

/**
 * Elimina una reserva del sistema
 */
async function cancelarReserva(id) {
    const token = localStorage.getItem("token");

    if (!confirm("¿Deseas cancelar esta reserva? Esta acción liberará tu mesa en el manuscrito y no se puede deshacer.")) {
        return;
    }

    try {
        const response = await fetch(`/reservas/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Reserva cancelada con éxito. La mesa ha sido liberada.");
            cargarMisReservas();
        } else {
            const msg = await response.text();
            alert("No se pudo cancelar: " + msg);
        }
    } catch (error) {
        alert("Error al conectar con el servidor.");
    }
}

// --- GESTIÓN INTERACTIVA DEL MODAL DE COMENTARIOS ---
function abrirModalComentario(id, comentarioCodificado) {
    document.getElementById("modalReservaId").value = id;
    const comentarioReal = comentarioCodificado ? decodeURIComponent(comentarioCodificado) : "";
    document.getElementById("txtComentario").value = comentarioReal;
    document.getElementById("modalComentario").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modalComentario").style.display = "none";
}

async function guardarComentarioServidor() {
    const id = document.getElementById("modalReservaId").value;
    const comentario = document.getElementById("txtComentario").value;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/reservas/${id}/comentario`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(comentario)
        });

        if (response.ok) {
            alert("Tu reseña ha sido guardada en las páginas de nuestro manuscrito.");
            cerrarModal();
            cargarMisReservas();
        } else {
            alert("Error al guardar el comentario.");
        }
    } catch (error) {
        console.error("Error en PATCH:", error);
        alert("Error de conexión.");
    }
}