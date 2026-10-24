/* ================================================================
   GESTIÓN DE USUARIOS - GESTREST
   Lógica de administración de usuarios conectada a MongoDB
   Con paginación de 8 elementos por página y controles Siguiente/Anterior
   ================================================================ */

let todosLosUsuarios = [];
let paginaActualUsuarios = 1;
let itemsPorPaginaUsuarios = 8;

document.addEventListener("DOMContentLoaded", function () {
    cargarUsuarios();
    configurarFiltrosUsuarios();
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

// ===== CARGAR USUARIOS DE LA BASE DE DATOS =====
async function cargarUsuarios() {
    let token = obtenerTokenAdmin();
    let tbody = document.getElementById("usuariosTableBody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:40px;">Cargando usuarios registrados en la base de datos...</td></tr>';

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
            todosLosUsuarios = await resp.json();
            paginaActualUsuarios = 1;
            renderizarTablaUsuarios();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:40px;font-style:italic;">No se encontraron usuarios en la base de datos.</td></tr>';
            actualizarPaginacionUsuarios(1, 1);
        }
    } catch (e) {
        console.error("Error al cargar usuarios:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:40px;">Error al conectar con el servicio de usuarios.</td></tr>';
    }
}

// ===== OBTENER LISTA FILTRADA =====
function obtenerListaFiltradaUsuarios() {
    let termino = (document.getElementById("buscarUsuario")?.value || "").toLowerCase().trim();
    let rol = (document.getElementById("filtroRol")?.value || "").toUpperCase().trim();

    return todosLosUsuarios.filter(function (u) {
        let matchTermino = true;
        if (termino) {
            let texto = `${u.nombre || ""} ${u.apellido || ""} ${u.correo || ""} ${u.email || ""} ${u.telefono || ""}`.toLowerCase();
            matchTermino = texto.includes(termino);
        }

        let matchRol = true;
        if (rol) {
            let userRol = String(u.rol || "").toUpperCase().replace("ROLE_", "");
            matchRol = userRol === rol;
        }

        return matchTermino && matchRol;
    });
}

// ===== RENDERIZAR TABLA DE USUARIOS (MÁXIMO 8 POR PÁGINA) =====
function renderizarTablaUsuarios(listaFiltrada) {
    let tbody = document.getElementById("usuariosTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let lista = listaFiltrada !== undefined ? listaFiltrada : obtenerListaFiltradaUsuarios();
    let total = lista.length;

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:40px;font-style:italic;">No hay usuarios para mostrar con los filtros actuales.</td></tr>';
        actualizarPaginacionUsuarios(1, 1);
        return;
    }

    let totalPags = Math.max(1, Math.ceil(total / itemsPorPaginaUsuarios));
    if (paginaActualUsuarios > totalPags) {
        paginaActualUsuarios = totalPags;
    }

    let inicio = (paginaActualUsuarios - 1) * itemsPorPaginaUsuarios;
    let fin = inicio + itemsPorPaginaUsuarios;
    let visibles = lista.slice(inicio, fin);

    visibles.forEach(function (u) {
        let tr = document.createElement("tr");

        let id = u.id || u._id;
        let nombreCompleto = `${u.nombre || ""} ${u.apellido || ""}`.trim() || u.username || "Usuario";
        let rolKey = String(u.rol || "CLIENTE").trim().toUpperCase();

        let badgeCls = "status-pending";
        if (rolKey === "ADMIN" || rolKey === "ROLE_ADMIN") badgeCls = "status-confirmed";
        if (rolKey === "MESERO" || rolKey === "ROLE_MESERO") badgeCls = "status-arrived";

        tr.innerHTML = `
            <td>
                <div class="huesped-info">
                    <span class="huesped-nombre">${nombreCompleto}</span>
                    <span class="huesped-tipo">ID: ${id ? id.substring(0, 8) + '...' : 'N/A'}</span>
                </div>
            </td>
            <td>${u.correo || u.email || "Sin correo"}</td>
            <td><span class="status-badge ${badgeCls}">${rolKey}</span></td>
            <td>${u.telefono || "No especificado"}</td>
            <td>${u.direccion || "No especificada"}</td>
            <td>
                <button type="button" class="action-btn mesa-delete-btn" title="Eliminar Usuario" onclick="eliminarUsuario('${id}')">
                    <span class="material-symbols-outlined action-icon" style="color:#f44336;">delete</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    actualizarPaginacionUsuarios(paginaActualUsuarios, totalPags);
}

// ===== ACTUALIZAR CONTROLES DE PAGINACIÓN =====
function actualizarPaginacionUsuarios(actual, total) {
    let elActual = document.getElementById("paginaActualUsuarios");
    let elTotal = document.getElementById("totalPaginasUsuarios");
    if (elActual) elActual.textContent = actual;
    if (elTotal) elTotal.textContent = total;

    let btnAnt = document.getElementById("btnPagAnteriorUsuarios");
    let btnSig = document.getElementById("btnPagSiguienteUsuarios");

    if (btnAnt) {
        btnAnt.disabled = actual <= 1;
        btnAnt.style.opacity = actual <= 1 ? "0.45" : "1";
        btnAnt.style.cursor = actual <= 1 ? "not-allowed" : "pointer";
    }

    if (btnSig) {
        btnSig.disabled = actual >= total;
        btnSig.style.opacity = actual >= total ? "0.45" : "1";
        btnSig.style.cursor = actual >= total ? "not-allowed" : "pointer";
    }
}

function paginaAnteriorUsuarios() {
    if (paginaActualUsuarios > 1) {
        paginaActualUsuarios--;
        renderizarTablaUsuarios();
    }
}

function paginaSiguienteUsuarios() {
    let lista = obtenerListaFiltradaUsuarios();
    let totalPags = Math.ceil(lista.length / itemsPorPaginaUsuarios);
    if (paginaActualUsuarios < totalPags) {
        paginaActualUsuarios++;
        renderizarTablaUsuarios(lista);
    }
}

// ===== FILTROS Y BÚSQUEDA =====
function configurarFiltrosUsuarios() {
    let inputBuscar = document.getElementById("buscarUsuario");
    let selectRol = document.getElementById("filtroRol");

    if (inputBuscar) {
        inputBuscar.addEventListener("input", function () {
            paginaActualUsuarios = 1;
            renderizarTablaUsuarios();
        });
    }

    if (selectRol) {
        selectRol.addEventListener("change", function () {
            paginaActualUsuarios = 1;
            renderizarTablaUsuarios();
        });
    }
}

function filtrarUsuarios() {
    paginaActualUsuarios = 1;
    renderizarTablaUsuarios();
}

// ===== ELIMINAR USUARIO =====
async function eliminarUsuario(id) {
    let currentUserId = localStorage.getItem("usuarioId");
    if (currentUserId && String(currentUserId) === String(id)) {
        alert("No puedes eliminar tu propia cuenta de administrador en sesión.");
        return;
    }

    if (!confirm("¿Está seguro de eliminar este usuario permanentemente del sistema?")) return;

    let token = obtenerTokenAdmin();

    try {
        let resp = await fetch(`/api/admin/usuarios/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (resp.ok) {
            alert("Usuario eliminado correctamente de la base de datos.");
            await cargarUsuarios();
        } else {
            alert("No se pudo eliminar el usuario en el servidor.");
        }
    } catch (e) {
        console.error("Error al eliminar usuario:", e);
        alert("Error de red al eliminar el usuario.");
    }
}
