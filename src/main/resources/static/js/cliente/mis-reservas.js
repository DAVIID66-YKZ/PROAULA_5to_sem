/* ================================================================
   LÓGICA DE MIS RESERVAS - GESTREST
   Visualización de platos, cálculo de anticipo (5% o mín 10k),
   filtrado interactivo por estado y confirmación/cancelación fluida.
   Soporte completo internacionalización (ES / EN).
   ================================================================ */

(function () {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ROLE_CLIENTE" && rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
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
let filtroEstadoActual = "TODAS";

function getIdiomaMisReservas() {
    return (localStorage.getItem("adminIdioma") || localStorage.getItem("appIdioma") || "es") === "en" ? "en" : "es";
}

function formatearExperienciaCliente(exp, lang) {
    if (!exp) return lang === "en" ? "Standard Table" : "Mesa Estándar";
    const mapEn = {
        "Mesa-Estandar": "Standard Table",
        "Mesa-Ventana": "Window Table",
        "Mesa-Alcoba": "Alcove Table",
        "Estandar": "Standard Table",
        "Estándar": "Standard Table",
        "Ventana": "Window Table",
        "Alcoba": "Alcove Table",
        "Excelente": "Excellent",
        "Regular": "Regular",
        "Buena": "Good"
    };
    const mapEs = {
        "Mesa-Estandar": "Mesa Estándar",
        "Mesa-Ventana": "Mesa Ventana",
        "Mesa-Alcoba": "Mesa Alcoba",
        "Estandar": "Mesa Estándar",
        "Estándar": "Mesa Estándar",
        "Ventana": "Mesa Ventana",
        "Alcoba": "Mesa Alcoba",
        "Excelente": "Excelente",
        "Regular": "Regular",
        "Buena": "Buena"
    };
    return (lang === "en" ? mapEn[exp] : mapEs[exp]) || exp.replace("Mesa-", "");
}

// Reactividad ante cambio de idioma
window.addEventListener("idiomaCambiado", () => {
    cargarMisReservas();
});

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
                if (getIdiomaMisReservas() === "en" && typeof window.traducirDinamico === "function" && p.nombre) {
                    window.traducirDinamico(p.nombre, "es", "en");
                }
            });
        }
    } catch (e) {
        console.warn("No se pudo cargar el catálogo de platos en JSON:", e);
    }

    await cargarMisReservas();
}

/**
 * Obtiene las reservas del usuario desde el servidor y refresca la tabla
 */
async function cargarMisReservas() {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const idUsuario = localStorage.getItem("usuarioId");
    const tbody = document.getElementById("listaReservasBody");
    const lang = getIdiomaMisReservas();

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
            renderizarTablaReservas();
        } else if (response.status === 403 || response.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error al cargar:", error);
        const errorMsg = lang === "en" ? "Connection error with server." : "Error de conexión con el servidor.";
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: #ff4444; padding: 20px;">${errorMsg}</td></tr>`;
    }
}

/**
 * Filtra las reservas por estado al pulsar las pastillas
 */
function filtrarReservasPorEstado(estado, botonClickeado) {
    filtroEstadoActual = estado;

    document.querySelectorAll(".btn-filtro-reserva").forEach(b => b.classList.remove("active"));
    if (botonClickeado) {
        botonClickeado.classList.add("active");
    }

    renderizarTablaReservas();
}

/**
 * Renderiza la lista filtrada de reservas en el DOM
 */
function renderizarTablaReservas() {
    const tbody = document.getElementById("listaReservasBody");
    if (!tbody) return;

    const lang = getIdiomaMisReservas();
    const ahora = new Date();

    tbody.innerHTML = "";

    if (!listaReservasActuales || listaReservasActuales.length === 0) {
        const mensajeVacio = lang === "en"
            ? "You haven't written chapters in your culinary story yet."
            : "Aún no has escrito capítulos en tu historia culinaria.";
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 80px; color: #666;">
                    <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 10px;">history_edu</span>
                    ${mensajeVacio}
                </td>
            </tr>`;
        return;
    }

    // Filtrar según la pastilla activa
    const reservasFiltradas = listaReservasActuales.filter(res => {
        if (filtroEstadoActual === "TODAS") return true;

        const est = String(res.estado || "PENDIENTE").toUpperCase();
        const fechaReserva = new Date(`${res.fecha}T${res.hora || "00:00"}`);
        const yaPaso = fechaReserva < ahora;

        if (filtroEstadoActual === "CANCELADA") return est === "CANCELADA";
        if (filtroEstadoActual === "COMPLETADA") return est === "COMPLETADA" || (yaPaso && est !== "CANCELADA");
        if (filtroEstadoActual === "PENDIENTE") return est === "PENDIENTE" && !yaPaso;
        if (filtroEstadoActual === "CONFIRMADA") return est === "CONFIRMADA" && !yaPaso;

        return true;
    });

    if (reservasFiltradas.length === 0) {
        const textoSinResultados = lang === "en"
            ? `No reservations found under "${filtroEstadoActual}".`
            : `No se encontraron reservas con el filtro "${filtroEstadoActual}".`;
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 45px; color: #888;">
                    ${textoSinResultados}
                </td>
            </tr>`;
        return;
    }

    reservasFiltradas.forEach(res => {
        const nombreExperiencia = formatearExperienciaCliente(res.experiencia, lang);

        const fechaReserva = new Date(`${res.fecha}T${res.hora || "00:00"}`);
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

        const anticipo = Math.max(10000, Math.round(totalPlatos * 0.05));

        // Columna de platos
        let platosHtml = "";
        if (platosIds.length > 0) {
            const textoPlato = lang === "en"
                ? `${platosIds.length} ${platosIds.length > 1 ? "dishes" : "dish"}`
                : `${platosIds.length} plato${platosIds.length > 1 ? "s" : ""}`;
            const tooltipPlatos = lang === "en" ? "View selected dishes" : "Ver platos seleccionados";
            platosHtml = `
                <button type="button" class="btn-ver-platos" onclick="verDetallePlatos('${res.id}')" title="${tooltipPlatos}">
                    <span>🍽️ ${textoPlato}</span>
                    <span class="platos-precio-tag">(${formatoCOP.format(totalPlatos)})</span>
                </button>
            `;
        } else {
            const textoSinPlatos = lang === "en" ? "No dishes (Base table $10k)" : "Sin platos (Mesa base $10k)";
            platosHtml = `<span class="sin-platos-tag">${textoSinPlatos}</span>`;
        }

        const estadoRes = String(res.estado || "PENDIENTE").toUpperCase();
        let estadoBadge = "";
        let botonesAcciones = "";

        const textoPersonas = `${res.numeroPersonas} ${lang === "en" ? (res.numeroPersonas === 1 ? "guest" : "guests") : (res.numeroPersonas === 1 ? "persona" : "personas")}`;

        if (estadoRes === "CANCELADA") {
            estadoBadge = `
                <span class="status-pill" style="background:rgba(231, 76, 60, 0.15); color:#e74c3c; border:1px solid rgba(231, 76, 60, 0.4);">
                    ${lang === "en" ? "Cancelled" : "Cancelada"}
                </span>
            `;
            botonesAcciones = `<span style="color:#777; font-size: 13px;">—</span>`;
        } else if (yaPaso || estadoRes === "COMPLETADA") {
            estadoBadge = `<span class="status-pill pill-past">${lang === "en" ? "Completed" : "Completada"}</span>`;

            const tieneComentario = res.comentario && res.comentario !== "null" && res.comentario.trim() !== "";
            const icono = tieneComentario ? "rate_review" : "chat_bubble";
            const estiloDorado = tieneComentario ? "style='color: #d4af37;'" : "";
            const comentarioSanitizado = tieneComentario ? encodeURIComponent(res.comentario) : "";
            const tooltipComentario = lang === "en" ? "Leave Review" : "Dejar Reseña";

            botonesAcciones = `
                <button class="btn-icon-table" onclick="abrirModalComentario('${res.id}', '${comentarioSanitizado}')" title="${tooltipComentario}">
                    <span class="material-symbols-outlined" ${estiloDorado}>${icono}</span>
                </button>
            `;
        } else if (estadoRes === "PENDIENTE") {
            const tooltipAnticipo = `${lang === "en" ? "Required deposit: " : "Anticipo requerido: "}${formatoCOP.format(anticipo)}`;
            const labelPendiente = `${lang === "en" ? "Pending" : "Pendiente"} (${formatoCOP.format(anticipo)})`;
            const tooltipConfirmar = lang === "en" ? "Confirm this reservation" : "Confirmar esta reserva";
            const btnConfirmarTexto = lang === "en" ? "Confirm" : "Confirmar";
            const tooltipCancelar = lang === "en" ? "Cancel Reservation" : "Cancelar Reserva";

            estadoBadge = `
                <span class="status-pill" style="background:rgba(224,170,62,0.15); color:#e0aa3e; border:1px solid rgba(224,170,62,0.4);" title="${tooltipAnticipo}">
                    ${labelPendiente}
                </span>
            `;

            botonesAcciones = `
                <button type="button" class="btn-confirmar-tabla" onclick="confirmarReserva('${res.id}', '${res.fecha}', '${res.hora}', ${totalPlatos}, ${anticipo})" title="${tooltipConfirmar}">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>${btnConfirmarTexto}</span>
                </button>
                <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="${tooltipCancelar}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
        } else {
            // CONFIRMADA
            const tooltipCancelar = lang === "en" ? "Cancel Reservation" : "Cancelar Reserva";
            estadoBadge = `
                <span class="status-pill" style="background:rgba(46, 204, 113, 0.15); color:#2ecc71; border:1px solid rgba(46, 204, 113, 0.4);">
                    ${lang === "en" ? "Confirmed" : "Confirmada"}
                </span>
            `;

            botonesAcciones = `
                <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="${tooltipCancelar}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td class="serif-gold">${res.fecha}</td>
                <td>${res.hora}</td>
                <td>${textoPersonas}</td>
                <td><span class="gold-text">${nombreExperiencia}</span></td>
                <td>${platosHtml}</td>
                <td>${estadoBadge}</td>
                <td>${botonesAcciones}</td>
            </tr>
        `;
    });
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

        const nombreSpan = document.createElement("span");
        nombreSpan.className = "plato-nombre";

        const langActual = getIdiomaMisReservas();
        if (langActual === "en" && typeof window.traducirDinamico === "function") {
            const cached = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(nombre, "es", "en") : null;
            nombreSpan.textContent = cached || nombre;
            if (!cached && plato && plato.nombre) {
                window.traducirDinamico(nombre, "es", "en").then(res => {
                    if (nombreSpan.isConnected && getIdiomaMisReservas() === "en") {
                        nombreSpan.textContent = res;
                    }
                });
            }
        } else {
            nombreSpan.textContent = nombre;
        }

        const precioSpan = document.createElement("span");
        precioSpan.className = "plato-precio";
        precioSpan.textContent = formatoCOP.format(precio);

        fila.appendChild(nombreSpan);
        fila.appendChild(precioSpan);
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
 * Confirma una reserva pendiente usando modal temático y toast
 */
async function confirmarReserva(id, fecha, hora, totalPlatos, anticipo) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const lang = getIdiomaMisReservas();
    if (!token) {
        window.location.href = "/login";
        return;
    }

    const mensaje = lang === "en"
        ? `Confirm reservation for ${fecha} at ${hora}?\nTotal in products: ${formatoCOP.format(totalPlatos)}.`
        : `¿Deseas confirmar definitivamente tu reserva para el ${fecha} a las ${hora}?\nTotal en productos: ${formatoCOP.format(totalPlatos)}.`;

    let confirmacion = false;
    if (typeof mostrarConfirmacion === "function") {
        confirmacion = await mostrarConfirmacion({
            titulo: lang === "en" ? "Confirm Reservation" : "Confirmar Reserva",
            mensaje: mensaje,
            textoConfirmar: lang === "en" ? "Confirm Table" : "Asegurar Mesa",
            textoCancelar: lang === "en" ? "Cancel" : "Volver",
            icono: "check_circle"
        });
    } else {
        confirmacion = confirm(mensaje);
    }

    if (!confirmacion) return;

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
            const exitoMsg = lang === "en"
                ? "Reservation confirmed! Your table is secured."
                : "¡Reserva confirmada con éxito! Tu mesa ha sido asegurada.";
            if (typeof mostrarToast === "function") {
                mostrarToast(exitoMsg, "exito", "✨ ¡Confirmada!");
            } else {
                alert(exitoMsg);
            }
            cargarMisReservas();
        } else {
            const err = await response.text();
            if (typeof mostrarToast === "function") {
                mostrarToast(err, "error", "No se pudo confirmar");
            } else {
                alert(err);
            }
        }
    } catch (e) {
        console.error("Error al confirmar reserva:", e);
        if (typeof mostrarToast === "function") {
            mostrarToast("Error de conexión al confirmar la reserva.", "error");
        } else {
            alert("Error de conexión al confirmar la reserva.");
        }
    }
}

/**
 * Cancela una reserva usando modal de confirmación temático y toast
 */
async function cancelarReserva(id) {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const lang = getIdiomaMisReservas();

    const titulo = lang === "en" ? "Cancel Reservation?" : "¿Cancelar Reserva?";
    const mensaje = lang === "en"
        ? "This action will release your table in the manuscript records and cannot be undone."
        : "Esta acción liberará tu mesa en el restaurante y no se puede deshacer.";

    let confirmacion = false;
    if (typeof mostrarConfirmacion === "function") {
        confirmacion = await mostrarConfirmacion({
            titulo: titulo,
            mensaje: mensaje,
            textoConfirmar: lang === "en" ? "Yes, Cancel" : "Sí, Cancelar",
            textoCancelar: lang === "en" ? "Keep Reservation" : "Mantener Reserva",
            peligroso: true,
            icono: "delete_forever"
        });
    } else {
        confirmacion = confirm(mensaje);
    }

    if (!confirmacion) return;

    try {
        const response = await fetch(`/reservas/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const msg = lang === "en" ? "Reservation cancelled. Table released." : "Reserva cancelada con éxito. La mesa ha sido liberada.";
            if (typeof mostrarToast === "function") {
                mostrarToast(msg, "info", "Reserva Cancelada");
            } else {
                alert(msg);
            }
            cargarMisReservas();
        } else {
            const msg = await response.text();
            if (typeof mostrarToast === "function") {
                mostrarToast(msg, "error");
            } else {
                alert(msg);
            }
        }
    } catch (error) {
        if (typeof mostrarToast === "function") {
            mostrarToast("Error al conectar con el servidor.", "error");
        } else {
            alert("Error al conectar con el servidor.");
        }
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
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const lang = getIdiomaMisReservas();

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
            const msg = lang === "en" ? "Your review has been saved in our records." : "Tu reseña ha sido guardada en las páginas de nuestro manuscrito.";
            if (typeof mostrarToast === "function") {
                mostrarToast(msg, "exito", "Reseña Guardada");
            } else {
                alert(msg);
            }
            cerrarModal();
            cargarMisReservas();
        } else {
            if (typeof mostrarToast === "function") {
                mostrarToast("Error al guardar la reseña.", "error");
            } else {
                alert("Error al guardar la reseña.");
            }
        }
    } catch (error) {
        console.error("Error en PATCH:", error);
        if (typeof mostrarToast === "function") {
            mostrarToast("Error de conexión.", "error");
        } else {
            alert("Error de conexión.");
        }
    }
}
