/* ================================================================
   HISTÓRICO Y GESTIÓN DE RESERVAS - GESTREST
   Lógica completa de visualización y edición conectada a MongoDB
   ================================================================ */

let todasLasReservas = [];
let paginaActualTodas = 1;
let itemsPorPaginaTodas = 8;
let reservaSeleccionada = null;

document.addEventListener("DOMContentLoaded", function () {
    cargarTodasLasReservas();
    configurarFiltrosReservas();
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

// ===== CARGAR TODAS LAS RESERVAS DE LA BASE DE DATOS =====
async function cargarTodasLasReservas() {
    let token = obtenerTokenAdmin();
    let tbody = document.getElementById("reservasAllTableBody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;padding:40px;">Cargando histórico de reservas desde el manuscrito en vivo...</td></tr>';

    try {
        let resp = await fetch("/api/admin/reservas-recientes?pagina=0&tamanio=9999", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch("/api/admin/dashboardAdmin/reservas-recientes?pagina=0&tamanio=9999", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (!resp.ok) {
            // Último fallback directo a reservas/listar
            resp = await fetch("/reservas/listar", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (resp.ok) {
            todasLasReservas = await resp.json();
            paginaActualTodas = 1;
            renderizarTablaReservasTodas();
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;padding:40px;font-style:italic;">No hay reservas registradas en el sistema.</td></tr>';
            actualizarPaginacion(1, 1);
        }
    } catch (e) {
        console.error("Error al cargar reservas:", e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#f44336;padding:40px;">Error al conectar con la base de reservas.</td></tr>';
    }
}

// ===== RENDERIZAR TABLA =====
function renderizarTablaReservasTodas(listaFiltrada) {
    let tbody = document.getElementById("reservasAllTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let lista = listaFiltrada !== undefined ? listaFiltrada : todasLasReservas;
    let total = lista.length;

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;padding:40px;font-style:italic;">No se encontraron reservas con ese criterio.</td></tr>';
        actualizarPaginacion(1, 1);
        return;
    }

    let inicio = (paginaActualTodas - 1) * itemsPorPaginaTodas;
    let fin = inicio + itemsPorPaginaTodas;
    let visibles = lista.slice(inicio, fin);

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
        let nombreHuesped = r.nombreHuesped || r.nombre || r.cliente || "Huésped";
        let correoSub = r.correoHuesped || r.email || r.correo || r.tipoEvento || "";
        let fechaHora = r.fechaHora || ((r.fecha || "") + " " + (r.hora || "")).trim() || "N/A";
        let personas = r.cantidadPersonas || r.numeroPersonas || 2;
        let mesa = r.numeroMesa || r.mesa || (r.mesaId ? "Mesa asignada" : "Sin asignar");
        let experiencia = r.tipoEvento || r.experiencia || "Cena Carta";

        tr.innerHTML = `
            <td>
                <div class="huesped-info">
                    <span class="huesped-nombre">${nombreHuesped}</span>
                    <span class="huesped-tipo">${correoSub}</span>
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
            <td>${experiencia}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="action-btn" title="Editar Estado" onclick="abrirModalEdicionReserva('${id}')">
                        <span class="material-symbols-outlined action-icon">edit</span>
                    </button>
                    <button type="button" class="action-btn" title="Eliminar Reserva" onclick="eliminarReserva('${id}')">
                        <span class="material-symbols-outlined action-icon" style="color:#f44336;">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    let totalPags = Math.max(1, Math.ceil(total / itemsPorPaginaTodas));
    actualizarPaginacion(paginaActualTodas, totalPags);
}

function actualizarPaginacion(actual, total) {
    let elActual = document.getElementById("paginaActualTodas");
    let elTotal = document.getElementById("totalPaginasTodas");
    if (elActual) elActual.textContent = actual;
    if (elTotal) elTotal.textContent = total;
}

function paginaAnteriorTodas() {
    if (paginaActualTodas > 1) {
        paginaActualTodas--;
        aplicarFiltrosReservas();
    }
}

function paginaSiguienteTodas() {
    let lista = obtenerListaFiltrada();
    let totalPags = Math.ceil(lista.length / itemsPorPaginaTodas);
    if (paginaActualTodas < totalPags) {
        paginaActualTodas++;
        renderizarTablaReservasTodas(lista);
    }
}

// ===== FILTROS Y BÚSQUEDA =====
function configurarFiltrosReservas() {
    let inputBuscar = document.getElementById("buscarReserva");
    let selectEstado = document.getElementById("filtroEstado");

    if (inputBuscar) {
        inputBuscar.addEventListener("input", function () {
            paginaActualTodas = 1;
            aplicarFiltrosReservas();
        });
    }

    if (selectEstado) {
        selectEstado.addEventListener("change", function () {
            paginaActualTodas = 1;
            aplicarFiltrosReservas();
        });
    }
}

function obtenerListaFiltrada() {
    let termino = (document.getElementById("buscarReserva")?.value || "").toLowerCase().trim();
    let estado = (document.getElementById("filtroEstado")?.value || "").toUpperCase().trim();

    return todasLasReservas.filter(function (r) {
        let matchTermino = true;
        if (termino) {
            let texto = `${r.nombreHuesped || ""} ${r.cliente || ""} ${r.correoHuesped || ""} ${r.email || ""} ${r.numeroMesa || ""} ${r.fechaHora || ""} ${r.tipoEvento || ""}`.toLowerCase();
            matchTermino = texto.includes(termino);
        }

        let matchEstado = true;
        if (estado) {
            matchEstado = String(r.estado || "").toUpperCase() === estado;
        }

        return matchTermino && matchEstado;
    });
}

function aplicarFiltrosReservas() {
    let filtradas = obtenerListaFiltrada();
    renderizarTablaReservasTodas(filtradas);
}

// ===== MODAL DE EDICIÓN =====
function abrirModalEdicionReserva(id) {
    let r = todasLasReservas.find(function (item) { return String(item.id || item._id) === String(id); });
    if (!r) return;

    reservaSeleccionada = r;
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
            alert("Estado de reserva actualizado en la base de datos.");
            cerrarModalReserva();
            await cargarTodasLasReservas();
        } else {
            alert("No se pudo actualizar el estado de la reserva.");
        }
    } catch (e) {
        console.error("Error al actualizar reserva:", e);
        alert("Error de red al actualizar estado de reserva.");
    }
}

async function eliminarReserva(id) {
    if (!confirm("¿Está seguro de eliminar esta reserva permanentemente de la base de datos?")) return;

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
            await cargarTodasLasReservas();
        } else {
            alert("No se pudo eliminar la reserva en el servidor.");
        }
    } catch (e) {
        console.error("Error al eliminar reserva:", e);
        alert("Error de red al eliminar la reserva.");
    }
}
