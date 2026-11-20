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
let catalogoPlatosLista = [];
let listaReservasActuales = [];
let filtroEstadoActual = "TODAS";
let reservaActualViendoPlatos = null;
let idReservaEditandoPlatos = null;
let platosSeleccionadosTemp = new Set();

/**
 * Valida si una reserva permite edición de platos (Regla: hasta 2 horas antes de la hora de la reserva)
 */
function puedeEditarPlatosReserva(reserva) {
    if (!reserva) return false;
    const est = String(reserva.estado || "").toUpperCase().trim();
    if (est === "CANCELADA" || est === "COMPLETADA") return false;

    if (!reserva.fecha || !reserva.hora) return false;

    const horaNorm = reserva.hora.trim().length === 5 ? `${reserva.hora.trim()}:00` : reserva.hora.trim();
    const fechaHoraReserva = new Date(`${reserva.fecha.trim()}T${horaNorm}`);

    if (isNaN(fechaHoraReserva.getTime())) return false;

    const ahora = new Date();
    // Límite: exactamente 2 horas antes del inicio de la reserva
    const dosHorasAntes = new Date(fechaHoraReserva.getTime() - (2 * 60 * 60 * 1000));

    return ahora < dosHorasAntes;
}

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
            catalogoPlatosLista = Array.isArray(platos) ? platos : [];
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

        if (filtroEstadoActual === "CANCELADA") return est === "CANCELADA" || est === "EXPIRADA";
        if (filtroEstadoActual === "COMPLETADA") return est === "COMPLETADA" || (yaPaso && est !== "CANCELADA" && est !== "EXPIRADA");
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
        const puedeEditarEste = puedeEditarPlatosReserva(res);
        if (platosIds.length > 0) {
            const textoPlato = lang === "en"
                ? `${platosIds.length} ${platosIds.length > 1 ? "dishes" : "dish"}`
                : `${platosIds.length} plato${platosIds.length > 1 ? "s" : ""}`;
            const tooltipPlatos = puedeEditarEste
                ? (lang === "en" ? "View or edit selected dishes" : "Ver o modificar platos seleccionados")
                : (lang === "en" ? "View selected dishes" : "Ver platos seleccionados");
            platosHtml = `
                <button type="button" class="btn-ver-platos" onclick="verDetallePlatos('${res.id}')" title="${tooltipPlatos}">
                    <span>🍽️ ${textoPlato}</span>
                    <span class="platos-precio-tag">(${formatoCOP.format(totalPlatos)})</span>
                </button>
            `;
        } else {
            const textoSinPlatos = lang === "en" ? "No dishes (Base table $10k)" : "Sin platos (Mesa base $10k)";
            const tooltipSin = puedeEditarEste
                ? (lang === "en" ? "Click to add dishes to your reservation (available until 2h before)" : "Haz clic para agregar platos a tu reserva (disponible hasta 2h antes)")
                : (lang === "en" ? "No dishes selected" : "Sin platos seleccionados");
            platosHtml = `
                <button type="button" class="btn-sin-platos" onclick="verDetallePlatos('${res.id}')" title="${tooltipSin}">
                    <span class="sin-platos-tag">${textoSinPlatos} ${puedeEditarEste ? '➕' : ''}</span>
                </button>
            `;
        }

        const estadoRes = String(res.estado || "PENDIENTE").toUpperCase();
        let estadoBadge = "";
        let botonesAcciones = "";

        const textoPersonas = `${res.numeroPersonas} ${lang === "en" ? (res.numeroPersonas === 1 ? "guest" : "guests") : (res.numeroPersonas === 1 ? "persona" : "personas")}`;

        if (estadoRes === "CANCELADA" || estadoRes === "EXPIRADA") {
            const esExpirada = estadoRes === "EXPIRADA";
            const textoBadge = esExpirada
                ? (lang === "en" ? "Expired" : "Expirada")
                : (lang === "en" ? "Cancelled" : "Cancelada");
            estadoBadge = `
                <span class="status-pill" style="background:rgba(231, 76, 60, 0.15); color:#e74c3c; border:1px solid rgba(231, 76, 60, 0.4);">
                    ${textoBadge}
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
            const tooltipReprogramar = lang === "en" ? "Reschedule / Edit" : "Reprogramar o Modificar";
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
                <button class="btn-icon-table btn-reprogramar" onclick="abrirModalReprogramar('${res.id}')" title="${tooltipReprogramar}">
                    <span class="material-symbols-outlined">edit_calendar</span>
                </button>
                <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="${tooltipCancelar}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
        } else {
            // CONFIRMADA
            const tooltipReprogramar = lang === "en" ? "Reschedule / Edit" : "Reprogramar o Modificar";
            const tooltipCancelar = lang === "en" ? "Cancel Reservation" : "Cancelar Reserva";
            estadoBadge = `
                <span class="status-pill" style="background:rgba(46, 204, 113, 0.15); color:#2ecc71; border:1px solid rgba(46, 204, 113, 0.4);">
                    ${lang === "en" ? "Confirmed" : "Confirmada"}
                </span>
            `;

            botonesAcciones = `
                <button class="btn-icon-table btn-reprogramar" onclick="abrirModalReprogramar('${res.id}')" title="${tooltipReprogramar}">
                    <span class="material-symbols-outlined">edit_calendar</span>
                </button>
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

    reservaActualViendoPlatos = idReserva;

    const listaEl = document.getElementById("modalPlatosLista");
    const totalEl = document.getElementById("modalPlatosTotalProductos");
    const anticipoEl = document.getElementById("modalPlatosAnticipo");
    const modalEl = document.getElementById("modalDetallePlatos");
    const avisoTiempoEl = document.getElementById("modalPlatosAvisoTiempo");
    const btnEditarPlatos = document.getElementById("btnIrAEditarPlatos");
    const langActual = getIdiomaMisReservas();

    if (!listaEl || !totalEl || !anticipoEl || !modalEl) return;

    listaEl.innerHTML = "";
    const platosIds = Array.isArray(reserva.platos) ? reserva.platos : [];
    let totalPlatos = 0;

        if (platosIds.length === 0) {
            const vacioMsg = langActual === "en"
                ? "No dishes pre-ordered for this reservation yet."
                : "Aún no has preordenado platos para esta velada.";
            listaEl.innerHTML = `
            <div style="text-align: center; padding: 25px 10px; color: #888;">
                <span class="material-symbols-outlined notranslate" style="font-size: 38px; display: block; margin-bottom: 8px; color: #d4af37;">restaurant</span>
                <span>${vacioMsg}</span>
            </div>
        `;
        } else {
            platosIds.forEach(id => {
                const plato = catalogoPlatosMap[id];
                const nombre = plato ? plato.nombre : `Plato #${id.substring(0, 6)}`;
                const precio = plato && plato.precio ? Number(plato.precio) : 0;
                totalPlatos += precio;

                const fila = document.createElement("div");
                fila.className = "modal-plato-fila";

                const nombreSpan = document.createElement("span");
                nombreSpan.className = "plato-nombre";

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
}

const anticipo = Math.max(10000, Math.round(totalPlatos * 0.05));
totalEl.textContent = formatoCOP.format(totalPlatos);
anticipoEl.textContent = formatoCOP.format(anticipo);

// Validación de la regla de 2 horas para edición de platos
const puedeEditar = puedeEditarPlatosReserva(reserva);

if (avisoTiempoEl) {
    if (puedeEditar) {
        const textoHabilitado = langActual === "en"
            ? "Dishes can be modified up to 2 hours before your booking time."
            : "Puedes modificar o agregar platos a tu velada hasta 2 horas antes de la reserva.";
        avisoTiempoEl.innerHTML = `
                <div class="aviso-regla-tiempo habilitado">
                    <span class="material-symbols-outlined notranslate" style="font-size: 20px;">timer</span>
                    <span>${textoHabilitado}</span>
                </div>
            `;
    } else {
        const textoBloqueado = langActual === "en"
            ? "Dishes locked: Less than 2 hours remain or the event ended (kitchen in preparation)."
            : "Platos bloqueados: Faltan menos de 2 horas para la reserva o la velada culminó (cocina en preparación).";
        avisoTiempoEl.innerHTML = `
                <div class="aviso-regla-tiempo bloqueado">
                    <span class="material-symbols-outlined notranslate" style="font-size: 20px;">lock_clock</span>
                    <span>${textoBloqueado}</span>
                </div>
            `;
    }
}

if (btnEditarPlatos) {
    if (puedeEditar) {
        btnEditarPlatos.style.display = "inline-flex";
        btnEditarPlatos.onclick = () => abrirModalEditarPlatos(reserva.id);
        const btnTexto = platosIds.length > 0
            ? (langActual === "en" ? "Edit Dishes" : "Modificar Platos")
            : (langActual === "en" ? "Select Dishes" : "Seleccionar Platos");
        btnEditarPlatos.innerHTML = `
                <span class="material-symbols-outlined notranslate" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">restaurant_menu</span>
                <span>${btnTexto}</span>
            `;
    } else {
        btnEditarPlatos.style.display = "none";
    }
}

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

// ================================================================
// GESTIÓN DE REPROGRAMACIÓN / EDICIÓN DE RESERVA
// ================================================================

const MAPA_HORAS_AMPM = {
    "10:00": "10:00 AM",
    "11:00": "11:00 AM",
    "12:00": "12:00 PM",
    "13:00": "01:00 PM",
    "14:00": "02:00 PM",
    "15:00": "03:00 PM",
    "16:00": "04:00 PM",
    "17:00": "05:00 PM",
    "18:00": "06:00 PM",
    "19:00": "07:00 PM",
    "20:00": "08:00 PM",
    "21:00": "09:00 PM",
    "22:00": "10:00 PM"
};

/**
 * Abre el modal de reprogramación prellenado con los datos de la reserva seleccionada
 */
function abrirModalReprogramar(id) {
    const reserva = listaReservasActuales.find(r => r.id === id);
    if (!reserva) return;

    const lang = getIdiomaMisReservas();
    const idInput = document.getElementById("reprogramarReservaId");
    const fechaInput = document.getElementById("reprogramarFecha");
    const horaSelect = document.getElementById("reprogramarHora");
    const invitadosInput = document.getElementById("reprogramarInvitados");
    const sectorSelect = document.getElementById("reprogramarSector");
    const avisoPlatos = document.getElementById("reprogramarAvisoPlatos");
    const modalEl = document.getElementById("modalReprogramar");

    if (!modalEl || !idInput || !fechaInput || !horaSelect || !invitadosInput || !sectorSelect) return;

    idInput.value = reserva.id;
    fechaInput.value = reserva.fecha || "";

    // Restringir a fechas desde hoy
    const hoyStr = new Date().toISOString().split("T")[0];
    fechaInput.min = hoyStr;

    invitadosInput.value = reserva.numeroPersonas || 2;
    sectorSelect.value = reserva.experiencia || "Mesa-Estandar";
    horaSelect.value = reserva.hora || "19:00";

    const cantPlatos = Array.isArray(reserva.platos) ? reserva.platos.length : 0;
    const puedeEditar = puedeEditarPlatosReserva(reserva);
    const btnEditarPlatosReprog = document.getElementById("btnEditarPlatosDesdeReprogramar");

    if (btnEditarPlatosReprog) {
        btnEditarPlatosReprog.style.display = puedeEditar ? "inline-block" : "none";
    }

    if (avisoPlatos) {
        if (cantPlatos > 0) {
            avisoPlatos.textContent = lang === "en"
                ? `Your ${cantPlatos} pre-ordered dish(es) will be safely preserved for this booking.`
                : `Tus ${cantPlatos} plato(s) preordenados se mantendrán intactos para esta velada.`;
        } else {
            avisoPlatos.textContent = lang === "en"
                ? "This reservation has no pre-ordered dishes."
                : "Esta reserva no contiene platos preordenados.";
        }
    }

    // Vincular reactividad para comprobar disponibilidad en tiempo real
    if (!fechaInput.dataset.listenersBound) {
        fechaInput.addEventListener("change", () => recalcularHorasReprogramar());
        invitadosInput.addEventListener("input", () => recalcularHorasReprogramar());
        sectorSelect.addEventListener("change", () => recalcularHorasReprogramar());
        fechaInput.dataset.listenersBound = "true";
    }

    recalcularHorasReprogramar(reserva.hora);
    modalEl.style.display = "flex";
}

/**
 * Cierra el modal de reprogramación
 */
function cerrarModalReprogramar() {
    const modalEl = document.getElementById("modalReprogramar");
    if (modalEl) modalEl.style.display = "none";
}

/**
 * Consulta la disponibilidad de mesas en el backend para la fecha, invitados y sector elegidos,
 * deshabilitando los turnos sin mesas y manteniendo la hora actual del usuario si no entra en conflicto.
 */
async function recalcularHorasReprogramar(horaPreferida) {
    const id = document.getElementById("reprogramarReservaId") ? document.getElementById("reprogramarReservaId").value : null;
    const reserva = listaReservasActuales.find(r => r.id === id);
    const fechaInput = document.getElementById("reprogramarFecha");
    const horaSelect = document.getElementById("reprogramarHora");
    const invitadosInput = document.getElementById("reprogramarInvitados");
    const sectorSelect = document.getElementById("reprogramarSector");

    if (!fechaInput || !horaSelect || !invitadosInput || !sectorSelect) return;

    const fecha = fechaInput.value;
    const invitados = parseInt(invitadosInput.value, 10) || 1;
    const sector = sectorSelect.value;
    const lang = getIdiomaMisReservas();

    if (!fecha) return;

    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split("T")[0];
    const horaActualStr = ahora.toTimeString().substring(0, 5);
    const limite30 = new Date(ahora.getTime() + 30 * 60 * 1000);
    const horaLimite30Str = `${String(limite30.getHours()).padStart(2, "0")}:${String(limite30.getMinutes()).padStart(2, "0")}`;
    const esMismoDia = (fecha === hoyStr);
    const esPasado = (fecha < hoyStr);

    try {
        const url = `/reservas/ocupadas?fecha=${fecha}&sector=${encodeURIComponent(sector)}&mesaId=${encodeURIComponent(sector)}&invitados=${invitados}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const horasOcupadas = response.ok ? await response.json() : [];

        Array.from(horaSelect.options).forEach(opt => {
            const esSuHoraActual = reserva && (reserva.fecha === fecha) && (reserva.hora === opt.value) && (reserva.experiencia === sector);
            const estaOcupada = horasOcupadas.includes(opt.value) && !esSuHoraActual;
            const esHoraPasada = esMismoDia && (opt.value <= horaActualStr);
            const esMenos30Min = esMismoDia && (opt.value <= horaLimite30Str);
            const noDisponible = estaOcupada || esHoraPasada || esMenos30Min || esPasado;

            opt.disabled = noDisponible;

            const baseLabel = MAPA_HORAS_AMPM[opt.value] || opt.value;
            let sufijo = "";
            if (esPasado) {
                sufijo = lang === "en" ? " (Past date)" : " (Fecha pasada)";
            } else if (esHoraPasada) {
                sufijo = lang === "en" ? " (Past time)" : " (Hora pasada)";
            } else if (esMenos30Min) {
                sufijo = lang === "en" ? " (Min. 30m advance)" : " (Mín. 30 min anticipación)";
            } else if (estaOcupada) {
                sufijo = lang === "en" ? " (Full)" : " (Ocupado)";
            } else if (esSuHoraActual) {
                sufijo = lang === "en" ? " (Current)" : " (Actual)";
            }

            opt.text = `${baseLabel}${sufijo}`;
            opt.style.color = noDisponible ? "#666" : "#fff";
        });

        // Intentar preservar la hora deseada si sigue disponible
        const objetivo = horaPreferida || horaSelect.value;
        const optObjetivo = Array.from(horaSelect.options).find(o => o.value === objetivo && !o.disabled);
        if (optObjetivo) {
            horaSelect.value = objetivo;
        } else if (horaSelect.selectedOptions[0] && horaSelect.selectedOptions[0].disabled) {
            const primeraLibre = Array.from(horaSelect.options).find(o => !o.disabled);
            if (primeraLibre) horaSelect.value = primeraLibre.value;
        }
    } catch (e) {
        console.error("Error al recalcular horas disponibles:", e);
    }
}

/**
 * Envía la solicitud PUT al servidor para reprogramar la reserva con reasignación Best-Fit
 */
async function guardarReprogramacion(event) {
    if (event) event.preventDefault();

    const id = document.getElementById("reprogramarReservaId").value;
    const fecha = document.getElementById("reprogramarFecha").value;
    const hora = document.getElementById("reprogramarHora").value;
    const numeroPersonas = parseInt(document.getElementById("reprogramarInvitados").value, 10);
    const experiencia = document.getElementById("reprogramarSector").value;
    const btnGuardar = document.getElementById("btnGuardarReprogramacion");
    const lang = getIdiomaMisReservas();

    if (!id || !fecha || !hora || !numeroPersonas || !experiencia) {
        const advertencia = lang === "en" ? "Please fill in all fields." : "Por favor completa todos los campos requeridos.";
        if (typeof mostrarToast === "function") {
            mostrarToast(advertencia, "advertencia");
        } else {
            alert(advertencia);
        }
        return;
    }

    const ahora = new Date();
    const hoyStr = ahora.toISOString().split("T")[0];
    const limite30 = new Date(ahora.getTime() + 30 * 60 * 1000);
    const horaLimite30Str = `${String(limite30.getHours()).padStart(2, "0")}:${String(limite30.getMinutes()).padStart(2, "0")}`;

    if (fecha === hoyStr && hora <= horaLimite30Str) {
        const aviso30 = lang === "en"
            ? "Reservations for today must be rescheduled at least 30 minutes in advance."
            : "Las reservas para el día de hoy deben reprogramarse con al menos 30 minutos de anticipación.";
        if (typeof mostrarToast === "function") {
            mostrarToast(aviso30, "advertencia", "Mínimo 30 min de anticipación");
        } else {
            alert(aviso30);
        }
        return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = lang === "en" ? "Saving..." : "Guardando...";
    }

    try {
        const response = await fetch(`/reservas/${id}/reprogramar`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fecha: fecha,
                hora: hora,
                numeroPersonas: numeroPersonas,
                experiencia: experiencia
            })
        });

        if (response.ok) {
            cerrarModalReprogramar();
            const exitoMsg = lang === "en"
                ? "Reservation rescheduled successfully! Your table was updated and your dishes preserved."
                : "¡Reserva reprogramada con éxito! Tu mesa fue reasignada y tus platos preordenados se mantuvieron intactos.";
            if (typeof mostrarToast === "function") {
                mostrarToast(exitoMsg, "exito", "✨ Reprogramación Exitosa");
            } else {
                alert(exitoMsg);
            }
            await cargarMisReservas();
        } else {
            const errorMsg = await response.text();
            if (typeof mostrarToast === "function") {
                mostrarToast(errorMsg, "advertencia", "No fue posible reprogramar");
            } else {
                alert(errorMsg);
            }
        }
    } catch (e) {
        console.error("Error al reprogramar la reserva:", e);
        const errRed = lang === "en" ? "Connection error while updating reservation." : "Error de conexión al actualizar la reserva.";
        if (typeof mostrarToast === "function") {
            mostrarToast(errRed, "error");
        } else {
            alert(errRed);
        }
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = lang === "en" ? "Save Changes" : "Guardar Cambios";
        }
    }
}

// ================================================================
// GESTIÓN DE MODIFICACIÓN DE PLATOS (REGLA DE 2 HORAS)
// ================================================================

function formatearCategoriaPlato(cat, lang) {
    const map = {
        "ENTRADAS": lang === "en" ? "Appetizer" : "Entrada",
        "PLATOS_FUERTES": lang === "en" ? "Main Course" : "Plato Fuerte",
        "BEBIDAS": lang === "en" ? "Beverage" : "Bebida",
        "POSTRES": lang === "en" ? "Dessert" : "Postre",
        "OTROS": lang === "en" ? "Special" : "Especial"
    };
    return map[cat] || cat;
}

/**
 * Abre el editor interactivo de platos permitiendo seleccionar/deseleccionar platos de la carta
 */
function abrirModalEditarPlatos(idReserva) {
    const id = idReserva || reservaActualViendoPlatos;
    const reserva = listaReservasActuales.find(r => r.id === id);
    if (!reserva) return;

    const lang = getIdiomaMisReservas();

    if (!puedeEditarPlatosReserva(reserva)) {
        const msgBloqueo = lang === "en"
            ? "Cannot edit dishes: Less than 2 hours remain for this reservation."
            : "No es posible modificar los platos: Faltan menos de 2 horas para la reserva (la cocina ya está preparando el servicio).";
        if (typeof mostrarToast === "function") {
            mostrarToast(msgBloqueo, "advertencia", "Tiempo límite superado");
        } else {
            alert(msgBloqueo);
        }
        return;
    }

    cerrarModalPlatos();
    cerrarModalReprogramar();

    idReservaEditandoPlatos = id;
    platosSeleccionadosTemp = new Set(Array.isArray(reserva.platos) ? reserva.platos : []);

    const modalEditar = document.getElementById("modalEditarPlatos");
    const contenedor = document.getElementById("contenedorPlatosEditor");
    const subtitulo = document.getElementById("subtituloEditarPlatos");

    if (!modalEditar || !contenedor) return;

    if (subtitulo) {
        const infoReserva = lang === "en"
            ? `Reservation on ${reserva.fecha} at ${reserva.hora} • Editable until 2h before event`
            : `Reserva para el ${reserva.fecha} a las ${reserva.hora} • Modificable hasta 2h antes de la velada`;
        subtitulo.textContent = infoReserva;
    }

    contenedor.innerHTML = "";

    const platosList = (catalogoPlatosLista && catalogoPlatosLista.length > 0)
        ? catalogoPlatosLista
        : Object.values(catalogoPlatosMap);

    if (platosList.length === 0) {
        contenedor.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #888; padding: 30px;">${lang === "en" ? "Unable to load menu." : "No se pudo cargar la carta de platos."}</p>`;
    } else {
        platosList.forEach(plato => {
            const estaSeleccionado = platosSeleccionadosTemp.has(plato.id);
            const precioNum = Number(plato.precio || 0);
            const cat = (plato.categoria || "OTROS").toUpperCase();

            const card = document.createElement("label");
            card.className = `editor-plato-card ${estaSeleccionado ? "checked" : ""}`;
            card.dataset.categoria = cat;
            card.dataset.id = plato.id;

            const check = document.createElement("input");
            check.type = "checkbox";
            check.value = plato.id;
            check.checked = estaSeleccionado;
            check.disabled = (plato.disponible === false);

            check.addEventListener("change", (e) => {
                if (e.target.checked) {
                    platosSeleccionadosTemp.add(plato.id);
                    card.classList.add("checked");
                } else {
                    platosSeleccionadosTemp.delete(plato.id);
                    card.classList.remove("checked");
                }
                actualizarTotalesEditor();
            });

            const info = document.createElement("div");
            info.className = "editor-plato-info";

            const nombreSpan = document.createElement("span");
            nombreSpan.className = "editor-plato-nombre";
            nombreSpan.textContent = plato.nombre;

            if (lang === "en" && typeof window.traducirDinamico === "function") {
                const cached = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(plato.nombre, "es", "en") : null;
                nombreSpan.textContent = cached || plato.nombre;
                if (!cached && plato.nombre) {
                    window.traducirDinamico(plato.nombre, "es", "en").then(res => {
                        if (nombreSpan.isConnected && getIdiomaMisReservas() === "en") nombreSpan.textContent = res;
                    });
                }
            }

            const subSpan = document.createElement("span");
            subSpan.className = "editor-plato-sub";
            subSpan.textContent = formatearCategoriaPlato(cat, lang);

            info.appendChild(nombreSpan);
            info.appendChild(subSpan);

            const precioSpan = document.createElement("span");
            precioSpan.className = "editor-plato-precio";
            precioSpan.textContent = formatoCOP.format(precioNum);

            card.appendChild(check);
            card.appendChild(info);
            card.appendChild(precioSpan);

            contenedor.appendChild(card);
        });
    }

    // Resetear filtros
    document.querySelectorAll(".btn-cat-plato").forEach(b => b.classList.remove("active"));
    const primerFiltro = document.querySelector(".btn-cat-plato");
    if (primerFiltro) primerFiltro.classList.add("active");

    actualizarTotalesEditor();
    modalEditar.style.display = "flex";
}

/**
 * Cierra el modal del editor de platos
 */
function cerrarModalEditarPlatos() {
    const modalEditar = document.getElementById("modalEditarPlatos");
    if (modalEditar) modalEditar.style.display = "none";
}

/**
 * Filtra los platos mostrados en el editor según la categoría seleccionada
 */
function filtrarCategoriaEditor(catKey, btn) {
    document.querySelectorAll(".btn-cat-plato").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const cards = document.querySelectorAll("#contenedorPlatosEditor .editor-plato-card");
    cards.forEach(card => {
        if (catKey === "TODOS" || card.dataset.categoria === catKey) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

/**
 * Actualiza en tiempo real los contadores y anticipo del editor
 */
function actualizarTotalesEditor() {
    let total = 0;
    platosSeleccionadosTemp.forEach(id => {
        const plato = catalogoPlatosMap[id];
        if (plato && plato.precio) {
            total += Number(plato.precio);
        }
    });

    const cant = platosSeleccionadosTemp.size;
    const anticipo = Math.max(10000, Math.round(total * 0.05));
    const lang = getIdiomaMisReservas();

    const contadorEl = document.getElementById("contadorPlatosSeleccionados");
    const totalEl = document.getElementById("editorTotalProductos");
    const anticipoEl = document.getElementById("editorAnticipo");

    if (contadorEl) {
        contadorEl.textContent = lang === "en"
            ? `${cant} dish${cant === 1 ? "" : "es"} selected`
            : `${cant} plato${cant === 1 ? "" : "s"} seleccionado${cant === 1 ? "" : "s"}`;
    }
    if (totalEl) totalEl.textContent = formatoCOP.format(total);
    if (anticipoEl) anticipoEl.textContent = formatoCOP.format(anticipo);
}

/**
 * Guarda los platos modificados en el servidor vía PUT /reservas/{id}/platos
 */
async function guardarEdicionPlatos() {
    if (!idReservaEditandoPlatos) return;

    const reserva = listaReservasActuales.find(r => r.id === idReservaEditandoPlatos);
    const lang = getIdiomaMisReservas();

    if (!puedeEditarPlatosReserva(reserva)) {
        const msg = lang === "en"
            ? "Cannot edit dishes: Less than 2 hours remain for this reservation."
            : "Los platos ya no se pueden modificar porque faltan menos de 2 horas para la velada.";
        if (typeof mostrarToast === "function") {
            mostrarToast(msg, "advertencia", "Tiempo límite superado");
        } else {
            alert(msg);
        }
        cerrarModalEditarPlatos();
        return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    const btnGuardar = document.getElementById("btnGuardarPlatos");
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = lang === "en" ? "Saving..." : "Guardando...";
    }

    try {
        const platosArray = Array.from(platosSeleccionadosTemp);
        const response = await fetch(`/reservas/${idReservaEditandoPlatos}/platos`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(platosArray)
        });

        if (response.ok) {
            cerrarModalEditarPlatos();
            const exitoMsg = lang === "en"
                ? "Dishes updated successfully!"
                : "¡Selección de platos actualizada con éxito!";
            if (typeof mostrarToast === "function") {
                mostrarToast(exitoMsg, "exito", "✨ Carta Actualizada");
            } else {
                alert(exitoMsg);
            }
            await cargarMisReservas();
        } else {
            const errorMsg = await response.text();
            if (typeof mostrarToast === "function") {
                mostrarToast(errorMsg, "advertencia", "Atención");
            } else {
                alert(errorMsg);
            }
        }
    } catch (e) {
        console.error("Error al actualizar platos:", e);
        const errRed = lang === "en" ? "Connection error while updating dishes." : "Error de conexión al actualizar platos.";
        if (typeof mostrarToast === "function") {
            mostrarToast(errRed, "error");
        } else {
            alert(errRed);
        }
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = lang === "en" ? "Save Dishes" : "Guardar Platos";
        }
    }
}

/**
 * Permite saltar desde el modal de reprogramación al editor de platos
 */
function editarPlatosDesdeReprogramar() {
    const id = document.getElementById("reprogramarReservaId") ? document.getElementById("reprogramarReservaId").value : null;
    if (id) {
        abrirModalEditarPlatos(id);
    }
}
