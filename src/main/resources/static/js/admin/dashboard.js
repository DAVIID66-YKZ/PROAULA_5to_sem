/* ================================================================
   PANEL ADMIN (DASHBOARD) - THE CULINARY MANUSCRIPT
   Lógica para KPIs y reservas recientes conectadas a MongoDB
   ================================================================ */

let datosReservasRecientes = [];
let paginaActualRecientes = 1;
let itemsPorPaginaRecientes = 5;
let reservaEnEdicion = null;

document.addEventListener("DOMContentLoaded", function () {
    cargarEstadisticasDashboard();
    cargarReservasRecientes();
    configurarBusquedasDashboard();
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

// ===== CARGAR ESTADÍSTICAS REALES DE LA BASE DE DATOS =====
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
            if (elEsp) elEsp.textContent = String(data.listaEsperaCount || 0).padStart(2, "0");
        }
    } catch (e) {
        console.error("Error al cargar estadísticas:", e);
    }
}

// ===== CARGAR RESERVAS RECIENTES DE LA BASE DE DATOS =====
async function cargarReservasRecientes() {
    let token = obtenerTokenAdmin();
    let tbody = document.getElementById("reservasTableBody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:35px;">Consultando manuscrito de reservas en vivo...</td></tr>';

    try {
        let resp = await fetch("/api/admin/reservas-recientes?pagina=0&tamanio=50", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch("/api/admin/dashboardAdmin/reservas-recientes?pagina=0&tamanio=50", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (resp.ok) {
            datosReservasRecientes = await resp.json();
            paginaActualRecientes = 1;
            renderizarTablaRecientes();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:35px;font-style:italic;">No hay reservas registradas en el sistema.</td></tr>';
        }
    } catch (e) {
        console.error("Error al cargar reservas recientes:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:35px;">Error al conectar con la base de datos.</td></tr>';
    }
}

// ===== RENDERIZAR TABLA =====
function renderizarTablaRecientes(lista) {
    let tbody = document.getElementById("reservasTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let datos = lista !== undefined ? lista : datosReservasRecientes;
    let total = datos.length;

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:35px;font-style:italic;">No se encontraron reservas registradas.</td></tr>';
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
        let estadoKey = String(r.estado || "CONFIRMADA").trim().toUpperCase();
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

    let totalPags = Math.max(1, Math.ceil(total / itemsPorPaginaRecientes));
    actualizarPaginacionRecientes(paginaActualRecientes, totalPags);
}

function actualizarPaginacionRecientes(actual, total) {
    let elPag = document.getElementById("paginaActual");
    let elTot = document.getElementById("totalPaginas");
    if (elPag) elPag.textContent = actual;
    if (elTot) elTot.textContent = total;
}

function paginaAnterior() {
    if (paginaActualRecientes > 1) {
        paginaActualRecientes--;
        renderizarTablaRecientes();
    }
}

function paginaSiguiente() {
    let totalPags = Math.ceil(datosReservasRecientes.length / itemsPorPaginaRecientes);
    if (paginaActualRecientes < totalPags) {
        paginaActualRecientes++;
        renderizarTablaRecientes();
    }
}

// ===== BUSCADOR Y FILTROS =====
function configurarBusquedasDashboard() {
    let buscarHuesped = document.getElementById("buscarHuesped");
    if (buscarHuesped) {
        buscarHuesped.addEventListener("input", function () {
            let termino = this.value.toLowerCase().trim();
            paginaActualRecientes = 1;
            let filtradas = datosReservasRecientes.filter(function (r) {
                let texto = `${r.nombreHuesped || ""} ${r.cliente || ""} ${r.numeroMesa || ""} ${r.fechaHora || ""} ${r.tipoEvento || ""}`.toLowerCase();
                return texto.includes(termino);
            });
            renderizarTablaRecientes(filtradas);
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
    if (!filtro) return;
    let estado = filtro.value;

    paginaActualRecientes = 1;
    let filtradas = estado ? datosReservasRecientes.filter(function (r) {
        return String(r.estado || "").toUpperCase() === estado.toUpperCase();
    }) : datosReservasRecientes;

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
    document.getElementById("modalSelectEstado").value = r.estado || "CONFIRMADA";
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
