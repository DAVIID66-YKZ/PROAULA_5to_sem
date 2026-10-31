/* ================================================================
   PANEL ADMIN (DASHBOARD) - GESTREST
   Lógica para KPIs y reservas recientes conectadas a MongoDB
   ================================================================ */

let datosReservasRecientes = [];
let listaActualFiltrada = null;
let paginaActualRecientes = 1;
let itemsPorPaginaRecientes = 5;
let reservaEnEdicion = null;

document.addEventListener("DOMContentLoaded", function () {
    cargarEstadisticasDashboard();
    cargarTotalUsuariosDashboard();
    cargarReservasRecientes();
    configurarBusquedasDashboard();
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

// ===== CARGAR ESTADÃSTICAS REALES DE LA BASE DE DATOS =====
async function cargarEstadisticasDashboard() {
    let token = obtenerTokenAdmin();

    try {
        let resp = await fetch("/api/admin/estadisticas", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // Intentar fallback si el primer prefijo falla
        if (!resp.ok && resp.status === 404) {
            resp = await fetch("/api/admin/dashboardAdmin/estadisticas", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (resp.ok) {
            let data = await resp.json();
            let elOcup = document.getElementById("ocupancia");
            let elHues = document.getElementById("totalHuespedes");
            let elEsp = document.getElementById("listaEspera");

            if (elOcup) elOcup.textContent = (data.ocupanciaTotal !== undefined ? data.ocupanciaTotal : 0) + "%";
            if (elHues) elHues.textContent = data.totalHuespedes || 0;
            if (elEsp) elEsp.textContent = String(data.listaEsperaCount !== undefined ? data.listaEsperaCount : 0).padStart(2, "0");
        }
    } catch (e) {
        console.error("Error al cargar estadÃ­sticas:", e);
    }
}

// ===== CARGAR TOTAL DE USUARIOS (IDÃ‰NTICO A GESTIÃ“N DE USUARIOS) =====
async function cargarTotalUsuariosDashboard() {
    let elTotal = document.getElementById("kpiTotalUsuarios") || document.getElementById("totalUsuarios");
    if (!elTotal) return;

    let token = obtenerTokenAdmin();
    try {
        let resp = await fetch("/api/admin/usuarios", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch("/usuarios/listar", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (resp.ok) {
            let usuarios = await resp.json();
            if (Array.isArray(usuarios)) {
                elTotal.textContent = usuarios.length;
            }
        }
    } catch (e) {
        console.error("Error al cargar total de usuarios:", e);
    }
}

// ===== CARGAR RESERVAS RECIENTES DE LA BASE DE DATOS =====
async function cargarReservasRecientes() {
    let token = obtenerTokenAdmin();
    let tbody = document.getElementById("reservasTableBody");
    if (!tbody) return;

    if (window.SkeletonTable) {
        window.SkeletonTable.attach("reservasTableBody", { columns: 6, rows: 5, type: "reservas" });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:35px;">Consultando manuscrito de reservas en vivo...</td></tr>';
    }

    try {
        let resp = await fetch("/api/admin/reservas-recientes?pagina=0&tamanio=200", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch("/api/admin/dashboardAdmin/reservas-recientes?pagina=0&tamanio=200", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (resp.ok) {
            datosReservasRecientes = await resp.json();
            paginaActualRecientes = 1;
            filtrarReservasRecientes();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:35px;font-style:italic;">No hay reservas registradas en el sistema.</td></tr>';
            actualizarPaginacionRecientes(1, 1);
        }
    } catch (e) {
        console.error("Error al cargar reservas recientes:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:35px;">Error al conectar con la base de datos.</td></tr>';
    }
}

function obtenerListaActiva() {
    return listaActualFiltrada !== null ? listaActualFiltrada : datosReservasRecientes;
}

// ===== RENDERIZAR TABLA =====
function renderizarTablaRecientes(lista) {
    let tbody = document.getElementById("reservasTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let datos = lista !== undefined ? lista : obtenerListaActiva();
    let total = datos.length;

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:35px;font-style:italic;">No se encontraron reservas con ese criterio.</td></tr>';
        actualizarPaginacionRecientes(1, 1);
        return;
    }

    let inicio = (paginaActualRecientes - 1) * itemsPorPaginaRecientes;
    let fin = inicio + itemsPorPaginaRecientes;
    let visibles = datos.slice(inicio, fin);

    visibles.forEach(function (r) {
        let tr = document.createElement("tr");

        let statusMap = {
            CONFIRMADA: "status-confirmed",
            PENDIENTE: "status-pending",
            LLEGADA: "status-arrived",
            CANCELADA: "status-cancelada",
            COMPLETADA: "status-completada"
        };
        let estadoKey = String(r.estado || "PENDIENTE").trim().toUpperCase();
        let cls = statusMap[estadoKey] || "status-pending";

        let id = r.id || r._id;
        let nombreHuesped = r.nombreHuesped || r.cliente || "Huésped";
        let subtitulo = r.tipoEvento || r.tipoHuesped || r.experiencia || "Reserva Estándar";
        let fechaHora = r.fechaHora || ((r.fecha || "") + " " + (r.hora || "")).trim() || "N/A";
        let personas = r.cantidadPersonas || r.numeroPersonas || 2;
        let mesa = r.numeroMesa || r.mesa || "Mesa asignada";

        tr.innerHTML = `
            <td>
                <div class="huesped-info">
                    <span class="huesped-nombre">${nombreHuesped}</span>
                    <span class="huesped-tipo">${subtitulo}</span>
                </div>
            </td>
            <td>
                <div class="fecha-info">
                    <span class="fecha">${fechaHora}</span>
                </div>
            </td>
            <td>${personas} personas</td>
            <td><strong style="color:var(--gold-light, #e0aa3e);">${mesa}</strong></td>
            <td><span class="status-badge ${cls}">${estadoKey}</span></td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="action-btn" title="Editar Estado" onclick="editarReservaDashboard('${id}')">
                        <span class="material-symbols-outlined action-icon">edit</span>
                    </button>
                    <button type="button" class="action-btn" title="Eliminar Reserva" onclick="eliminarReservaDashboard('${id}')">
                        <span class="material-symbols-outlined action-icon" style="color:#f44336;">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (window.SkeletonTable) {
        tbody.classList.remove("skeleton-fade-in");
        void tbody.offsetWidth;
        tbody.classList.add("skeleton-fade-in");
    }

    let totalPags = Math.max(1, Math.ceil(total / itemsPorPaginaRecientes));
    actualizarPaginacionRecientes(paginaActualRecientes, totalPags);
}

function actualizarPaginacionRecientes(actual, total) {
    let elPag = document.getElementById("paginaActual");
    let elTot = document.getElementById("totalPaginas");
    if (elPag) elPag.textContent = actual;
    if (elTot) elTot.textContent = total;

    let btnAnterior = document.getElementById("btnPagAnteriorRecientes");
    let btnSiguiente = document.getElementById("btnPagSiguienteRecientes");

    if (btnAnterior) {
        btnAnterior.disabled = actual <= 1;
        btnAnterior.style.opacity = actual <= 1 ? "0.4" : "1";
        btnAnterior.style.cursor = actual <= 1 ? "not-allowed" : "pointer";
    }
    if (btnSiguiente) {
        btnSiguiente.disabled = actual >= total;
        btnSiguiente.style.opacity = actual >= total ? "0.4" : "1";
        btnSiguiente.style.cursor = actual >= total ? "not-allowed" : "pointer";
    }
}

function paginaAnterior() {
    if (paginaActualRecientes > 1) {
        paginaActualRecientes--;
        renderizarTablaRecientes(obtenerListaActiva());
    }
}

function paginaSiguiente() {
    let datos = obtenerListaActiva();
    let totalPags = Math.max(1, Math.ceil(datos.length / itemsPorPaginaRecientes));
    if (paginaActualRecientes < totalPags) {
        paginaActualRecientes++;
        renderizarTablaRecientes(datos);
    }
}

// ===== BUSCADOR Y FILTROS =====
function configurarBusquedasDashboard() {
    let buscarHuesped = document.getElementById("buscarHuesped");
    if (buscarHuesped) {
        buscarHuesped.addEventListener("input", function () {
            paginaActualRecientes = 1;
            filtrarReservasRecientes();
        });
    }
}

function toggleFiltroPanel() {
    let panel = document.getElementById("filtroPanel");
    if (panel) {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    }
}

function filtrarReservasRecientes() {
    let filtro = document.getElementById("filtroEstadoRecientes");
    let estado = filtro ? filtro.value.trim().toUpperCase() : "";
    let buscarHuesped = document.getElementById("buscarHuesped");
    let termino = buscarHuesped ? buscarHuesped.value.toLowerCase().trim() : "";

    paginaActualRecientes = 1;

    let filtradas = datosReservasRecientes.filter(function (r) {
        let matchEstado = true;
        if (estado) {
            matchEstado = String(r.estado || "").trim().toUpperCase() === estado;
        }

        let matchTermino = true;
        if (termino) {
            let texto = `${r.nombreHuesped || ""} ${r.cliente || ""} ${r.correoHuesped || ""} ${r.numeroMesa || ""} ${r.fechaHora || ""} ${r.tipoEvento || ""}`.toLowerCase();
            matchTermino = texto.includes(termino);
        }

        return matchEstado && matchTermino;
    });

    listaActualFiltrada = filtradas;
    renderizarTablaRecientes(filtradas);
}

// ===== ACCIONES SOBRE RESERVAS =====
function editarReservaDashboard(id) {
    let r = datosReservasRecientes.find(function (item) { return String(item.id || item._id) === String(id); });
    if (!r) return;

    reservaEnEdicion = r;
    let modal = document.getElementById("modalEditarReserva");
    if (!modal) return;

    document.getElementById("modalReservaId").value = id;
    document.getElementById("modalHuespedNombre").textContent = r.nombreHuesped || r.cliente || "Huésped";
    document.getElementById("modalSelectEstado").value = r.estado || "PENDIENTE";
    modal.style.display = "flex";
}

function cerrarModalReserva() {
    let modal = document.getElementById("modalEditarReserva");
    if (modal) modal.style.display = "none";
}

async function guardarEdicionReserva() {
    let id = document.getElementById("modalReservaId").value;
    let nuevoEstado = document.getElementById("modalSelectEstado").value;
    let token = obtenerTokenAdmin();

    try {
        let resp = await fetch(`/api/admin/reservas/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch(`/reservas/${id}/estado`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
        }

        if (resp.ok) {
            alert("Estado de la reserva actualizado exitosamente en la base de datos.");
            cerrarModalReserva();
            await cargarReservasRecientes();
            await cargarEstadisticasDashboard();
        } else {
            alert("No se pudo actualizar el estado de la reserva en el servidor.");
        }
    } catch (e) {
        console.error("Error al guardar reserva:", e);
        alert("Error de red al actualizar reserva.");
    }
}

async function eliminarReservaDashboard(id) {
    if (!confirm("¿Está seguro de eliminar esta reserva del sistema?")) return;

    let token = obtenerTokenAdmin();

    try {
        let resp = await fetch(`/api/admin/reservas/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch(`/reservas/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        }

        if (resp.ok) {
            alert("Reserva eliminada con éxito.");
            await cargarReservasRecientes();
            await cargarEstadisticasDashboard();
        } else {
            alert("No se pudo eliminar la reserva del servidor.");
        }
    } catch (e) {
        console.error("Error al eliminar reserva:", e);
        alert("Error de red al eliminar la reserva.");
    }
}
