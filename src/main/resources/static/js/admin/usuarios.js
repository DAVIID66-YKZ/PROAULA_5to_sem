/* ================================================================
   GESTIÓN DE USUARIOS - GESTREST (PANEL ADMINISTRATIVO)
   CRUD Completo: Búsqueda en vivo, edición de roles, 
   creación, activación y desactivación suave (Soft-Delete)
   para preservar la integridad relacional con reservas.
   ================================================================ */

let todosLosUsuarios = [];
let paginaActualUsuarios = 1;
const itemsPorPaginaUsuarios = 8;

document.addEventListener("DOMContentLoaded", function () {
    verificarAutenticacionAdmin();
    cargarUsuarios();
    configurarFiltrosUsuarios();
});

// ===== VERIFICACIÓN DE SESIÓN =====
function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

function obtenerUsuarioActualId() {
    return localStorage.getItem("usuarioId") || "";
}

function verificarAutenticacionAdmin() {
    let token = obtenerTokenAdmin();
    let rol = (localStorage.getItem("rol") || "").toUpperCase();
    if (!token) {
        console.warn("No hay token activo para administración de usuarios.");
    }
}

// ===== CARGAR USUARIOS DE LA BASE DE DATOS =====
async function cargarUsuarios() {
    let token = obtenerTokenAdmin();
    let tbody = document.getElementById("usuariosTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center; color:#888; padding:45px;">
                <div style="display:inline-flex; align-items:center; gap:10px;">
                    <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
                    <span>Cargando usuarios desde la base de datos...</span>
                </div>
            </td>
        </tr>
    `;

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
            actualizarEstadisticasKPI(todosLosUsuarios);
            paginaActualUsuarios = 1;
            renderizarTablaUsuarios();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:40px;font-style:italic;">No se encontraron usuarios en la base de datos.</td></tr>';
            actualizarEstadisticasKPI([]);
            actualizarPaginacionUsuarios(1, 1, 0);
        }
    } catch (e) {
        console.error("Error al cargar usuarios:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:40px;">Error al conectar con el servicio de administración de usuarios.</td></tr>';
        actualizarEstadisticasKPI([]);
    }
}

// ===== ACTUALIZAR KPIS =====
function actualizarEstadisticasKPI(usuarios) {
    let total = usuarios.length;
    let activos = 0;
    let inactivos = 0;
    let admins = 0;

    usuarios.forEach(u => {
        let estaActivo = u.activo === undefined || u.activo === null ? true : Boolean(u.activo);
        if (estaActivo) {
            activos++;
        } else {
            inactivos++;
        }

        let rolStr = String(u.rol || "").toUpperCase().replace("ROLE_", "");
        if (rolStr === "ADMIN") {
            admins++;
        }
    });

    const elTotal = document.getElementById("kpiTotalUsuarios");
    const elActivos = document.getElementById("kpiUsuariosActivos");
    const elInactivos = document.getElementById("kpiUsuariosInactivos");
    const elAdmins = document.getElementById("kpiUsuariosAdmin");

    if (elTotal) elTotal.textContent = total;
    if (elActivos) elActivos.textContent = activos;
    if (elInactivos) elInactivos.textContent = inactivos;
    if (elAdmins) elAdmins.textContent = admins;
}

// ===== OBTENER LISTA FILTRADA =====
function obtenerListaFiltradaUsuarios() {
    let termino = (document.getElementById("buscarUsuario")?.value || "").toLowerCase().trim();
    let rol = (document.getElementById("filtroRol")?.value || "").toUpperCase().trim();
    let estado = (document.getElementById("filtroEstado")?.value || "").toUpperCase().trim();

    return todosLosUsuarios.filter(function (u) {
        // Filtro por término
        let matchTermino = true;
        if (termino) {
            let id = String(u.id || u._id || "").toLowerCase();
            let nombre = String(u.nombre || "").toLowerCase();
            let apellido = String(u.apellido || "").toLowerCase();
            let correo = String(u.correo || u.email || "").toLowerCase();
            let telefono = String(u.telefono || "").toLowerCase();
            let completo = `${nombre} ${apellido} ${correo} ${telefono} ${id}`;
            matchTermino = completo.includes(termino);
        }

        // Filtro por Rol
        let matchRol = true;
        if (rol) {
            let userRol = String(u.rol || "").toUpperCase().replace("ROLE_", "");
            matchRol = userRol === rol;
        }

        // Filtro por Estado
        let matchEstado = true;
        if (estado) {
            let estaActivo = u.activo === undefined || u.activo === null ? true : Boolean(u.activo);
            if (estado === "ACTIVO") {
                matchEstado = estaActivo;
            } else if (estado === "INACTIVO") {
                matchEstado = !estaActivo;
            }
        }

        return matchTermino && matchRol && matchEstado;
    });
}

// ===== RENDERIZAR TABLA =====
function renderizarTablaUsuarios(listaEspecifica) {
    let tbody = document.getElementById("usuariosTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let lista = listaEspecifica !== undefined ? listaEspecifica : obtenerListaFiltradaUsuarios();
    let total = lista.length;

    if (total === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#888; padding:45px; font-style:italic;">
                    No se encontraron usuarios coincidentes con los criterios de búsqueda.
                </td>
            </tr>
        `;
        actualizarPaginacionUsuarios(1, 1, 0);
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

        let id = u.id || u._id || "";
        let nombre = u.nombre || "";
        let apellido = u.apellido || "";
        let nombreCompleto = `${nombre} ${apellido}`.trim() || u.username || "Usuario";
        let correo = u.correo || u.email || "Sin correo registrado";
        let telefono = u.telefono || "No registrado";
        
        // Iniciales para avatar
        let iniciales = ((nombre ? nombre[0] : "") + (apellido ? apellido[0] : "")).toUpperCase() || "U";
        
        // Rol
        let rolKey = String(u.rol || "CLIENTE").trim().toUpperCase().replace("ROLE_", "");
        let badgeRolCls = "role-cliente";
        if (rolKey === "ADMIN") badgeRolCls = "role-admin";
        

        let rolDisplay = rolKey;
        if (typeof window.t === "function") {
            if (rolKey === "CLIENTE") rolDisplay = window.t("user.rolCliente", "CLIENTE");
            else if (rolKey === "ADMIN") rolDisplay = window.t("user.rolAdmin", "ADMINISTRADOR");
            
        }

        // Estado (Activo / Inactivo)
        let estaActivo = u.activo === undefined || u.activo === null ? true : Boolean(u.activo);
        let badgeEstadoCls = estaActivo ? "status-activo" : "status-inactivo";
        let dotCls = estaActivo ? "dot-activo" : "dot-inactivo";
        let textoEstado = estaActivo 
            ? (typeof t === "function" ? t("common.activo", "ACTIVO") : "ACTIVO")
            : (typeof t === "function" ? t("common.inactivo", "INACTIVO") : "INACTIVO");

        // Botón activar/desactivar seguro (soft-delete)
        let btnEstadoHtml = "";
        if (estaActivo) {
            let titleDesactivar = typeof t === "function" ? t("user.desactivarTitulo", "Desactivar cuenta") : "Desactivar cuenta (preserva reservas)";
            btnEstadoHtml = `
                <button type="button" class="action-btn mesa-delete-btn" title="${titleDesactivar}" onclick="abrirModalConfirmarDesactivar('${id}', false)">
                    <span class="material-symbols-outlined" style="font-size:18px;">person_off</span>
                </button>
            `;
        } else {
            let titleReactivar = typeof t === "function" ? t("user.reactivarTitulo", "Reactivar cuenta") : "Reactivar cuenta";
            btnEstadoHtml = `
                <button type="button" class="action-btn btn-success" title="${titleReactivar}" onclick="abrirModalConfirmarDesactivar('${id}', true)">
                    <span class="material-symbols-outlined" style="font-size:18px;">how_to_reg</span>
                </button>
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="user-flex-cell">
                    <div class="user-avatar-circle" title="${nombreCompleto}">
                        ${iniciales}
                    </div>
                    <div>
                        <span class="user-name-title">${nombreCompleto}</span>
                        <span class="user-sub-id">ID: ${id ? id.substring(0, 8) + '...' : 'N/A'}</span>
                    </div>
                </div>
            </td>
            <td>
                <span style="color:#dcdcdc; font-size:13px;">${correo}</span>
            </td>
            <td>
                <span class="status-badge ${badgeRolCls}">${rolDisplay}</span>
            </td>
            <td>
                <span style="color:#aaa; font-size:13px;">${telefono}</span>
            </td>
            <td>
                <span class="status-badge ${badgeEstadoCls}">
                    <span class="dot-indicator ${dotCls}"></span>
                    <span>${textoEstado}</span>
                </span>
            </td>
            <td>
                <div class="actions-cell-flex">
                    <button type="button" class="action-btn mesa-edit-btn" title="Editar detalles y rol" onclick="abrirModalEditarUsuario('${id}')"><span class="material-symbols-outlined action-icon">edit</span></button>
                    ${btnEstadoHtml}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    actualizarPaginacionUsuarios(paginaActualUsuarios, totalPags, total);
}

// ===== ACTUALIZAR CONTROLES DE PAGINACIÓN =====
function actualizarPaginacionUsuarios(actual, total, registros) {
    let elActual = document.getElementById("paginaActualUsuarios");
    let elTotal = document.getElementById("totalPaginasUsuarios");
    let elRegistros = document.getElementById("totalRegistrosUsuarios");

    if (elActual) elActual.textContent = actual;
    if (elTotal) elTotal.textContent = total;
    if (elRegistros) elRegistros.textContent = registros !== undefined ? registros : 0;

    let btnAnt = document.getElementById("btnPagAnteriorUsuarios");
    let btnSig = document.getElementById("btnPagSiguienteUsuarios");

    if (btnAnt) {
        btnAnt.disabled = actual <= 1;
        btnAnt.style.opacity = actual <= 1 ? "0.4" : "1";
        btnAnt.style.cursor = actual <= 1 ? "not-allowed" : "pointer";
    }

    if (btnSig) {
        btnSig.disabled = actual >= total;
        btnSig.style.opacity = actual >= total ? "0.4" : "1";
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
    let selectEstado = document.getElementById("filtroEstado");

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

    if (selectEstado) {
        selectEstado.addEventListener("change", function () {
            paginaActualUsuarios = 1;
            renderizarTablaUsuarios();
        });
    }
}

function limpiarFiltrosUsuarios() {
    let inputBuscar = document.getElementById("buscarUsuario");
    let selectRol = document.getElementById("filtroRol");
    let selectEstado = document.getElementById("filtroEstado");

    if (inputBuscar) inputBuscar.value = "";
    if (selectRol) selectRol.value = "";
    if (selectEstado) selectEstado.value = "";

    paginaActualUsuarios = 1;
    renderizarTablaUsuarios();
}

// ===== MODAL CREAR USUARIO =====
function abrirModalCrearUsuario() {
    const modal = document.getElementById("modalCrearUsuario");
    const form = document.getElementById("formCrearUsuario");
    if (form) form.reset();
    if (modal) modal.style.display = "flex";
}

function cerrarModalCrearUsuario() {
    const modal = document.getElementById("modalCrearUsuario");
    if (modal) modal.style.display = "none";
}

async function guardarNuevoUsuario(event) {
    event.preventDefault();

    const nombre = (document.getElementById("crearNombre")?.value || "").trim();
    const apellido = (document.getElementById("crearApellido")?.value || "").trim();
    const correo = (document.getElementById("crearCorreo")?.value || "").trim();
    const contrasena = document.getElementById("crearPassword")?.value || "";
    const rol = document.getElementById("crearRol")?.value || "CLIENTE";
    const telefono = (document.getElementById("crearTelefono")?.value || "").trim();
    const direccion = (document.getElementById("crearDireccion")?.value || "").trim();
    const activo = document.getElementById("crearActivo")?.value === "true";

    if (!nombre || !correo || !contrasena) {
        alert("Por favor completa los campos obligatorios (*).");
        return;
    }

    if (contrasena.length < 8) {
        alert("La contraseña debe tener un mínimo de 8 caracteres.");
        return;
    }

    const payload = {
        nombre,
        apellido,
        correo,
        contrasena,
        rol,
        telefono,
        direccion,
        activo
    };

    const token = obtenerTokenAdmin();
    const btnSubmit = document.getElementById("btnSubmitCrearUsuario");
    const textoOriginal = btnSubmit ? btnSubmit.textContent : "Crear Usuario";
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Guardando...";
    }

    try {
        const resp = await fetch("/api/admin/usuarios", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            cerrarModalCrearUsuario();
            alert("Usuario registrado correctamente en el sistema.");
            await cargarUsuarios();
        } else {
            let errorMsg = "No se pudo crear el usuario.";
            try {
                const errJson = await resp.json();
                if (errJson && errJson.message) errorMsg = errJson.message;
            } catch (_) {}
            alert("Error: " + errorMsg);
        }
    } catch (e) {
        console.error("Error al crear usuario:", e);
        alert("Error de conexión con el servidor.");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = textoOriginal;
        }
    }
}

// ===== MODAL EDITAR USUARIO =====
function abrirModalEditarUsuario(id) {
    const user = todosLosUsuarios.find(u => (u.id || u._id) === id);
    if (!user) {
        alert("Usuario no encontrado.");
        return;
    }

    document.getElementById("editarId").value = id;
    document.getElementById("editarNombre").value = user.nombre || "";
    document.getElementById("editarApellido").value = user.apellido || "";
    document.getElementById("editarCorreo").value = user.correo || user.email || "";
    document.getElementById("editarTelefono").value = user.telefono || "";
    document.getElementById("editarDireccion").value = user.direccion || "";
    document.getElementById("editarPassword").value = "";

    // Rol
    let userRol = String(user.rol || "CLIENTE").trim().toUpperCase().replace("ROLE_", "");
    let selectRol = document.getElementById("editarRol");
    if (selectRol) {
        selectRol.value = (userRol === "ADMIN") ? "ADMIN" : "CLIENTE";
    }

    // Estado
    let estaActivo = user.activo === undefined || user.activo === null ? true : Boolean(user.activo);
    let selectEstado = document.getElementById("editarEstado");
    if (selectEstado) {
        selectEstado.value = estaActivo ? "true" : "false";
    }

    // Avatar y subtítulo
    let iniciales = ((user.nombre ? user.nombre[0] : "") + (user.apellido ? user.apellido[0] : "")).toUpperCase() || "U";
    let avatarEl = document.getElementById("modalEditarAvatar");
    if (avatarEl) avatarEl.textContent = iniciales;

    let subtituloEl = document.getElementById("modalEditarSubtitulo");
    if (subtituloEl) {
        subtituloEl.textContent = user.correo || `ID: ${id}`;
    }

    const modal = document.getElementById("modalEditarUsuario");
    if (modal) modal.style.display = "flex";
}

function cerrarModalEditarUsuario() {
    const modal = document.getElementById("modalEditarUsuario");
    if (modal) modal.style.display = "none";
}

async function guardarEdicionUsuario(event) {
    event.preventDefault();

    const id = document.getElementById("editarId")?.value;
    if (!id) return;

    const nombre = (document.getElementById("editarNombre")?.value || "").trim();
    const apellido = (document.getElementById("editarApellido")?.value || "").trim();
    const correo = (document.getElementById("editarCorreo")?.value || "").trim();
    const telefono = (document.getElementById("editarTelefono")?.value || "").trim();
    const direccion = (document.getElementById("editarDireccion")?.value || "").trim();
    const rol = document.getElementById("editarRol")?.value || "CLIENTE";
    const activo = document.getElementById("editarEstado")?.value === "true";
    const nuevaPassword = document.getElementById("editarPassword")?.value || "";

    if (!nombre || !correo) {
        alert("El nombre y el correo electrónico son campos requeridos.");
        return;
    }

    if (nuevaPassword && nuevaPassword.length < 8) {
        alert("Si asignas una nueva contraseña, debe tener al menos 8 caracteres.");
        return;
    }

    const payload = {
        nombre,
        apellido,
        correo,
        telefono,
        direccion,
        rol,
        activo
    };

    if (nuevaPassword) {
        payload.contrasena = nuevaPassword;
    }

    const token = obtenerTokenAdmin();
    const btnSubmit = document.getElementById("btnSubmitEditarUsuario");
    const textoOriginal = btnSubmit ? btnSubmit.textContent : "Guardar Cambios";
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Actualizando...";
    }

    try {
        const resp = await fetch(`/api/admin/usuarios/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            cerrarModalEditarUsuario();
            alert("Usuario actualizado exitosamente.");
            await cargarUsuarios();
        } else {
            let errorMsg = "No se pudieron guardar los cambios.";
            try {
                const errJson = await resp.json();
                if (errJson && errJson.message) errorMsg = errJson.message;
            } catch (_) {}
            alert("Error: " + errorMsg);
        }
    } catch (e) {
        console.error("Error al actualizar usuario:", e);
        alert("Error de conexión al actualizar usuario.");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = textoOriginal;
        }
    }
}

// ===== MODAL DE CONFIRMACIÓN: ACTIVACIÓN / DESACTIVACIÓN (SOFT-DELETE) =====
function abrirModalConfirmarDesactivar(id, nuevoEstado) {
    const user = todosLosUsuarios.find(u => (u.id || u._id) === id);
    if (!user) {
        alert("Usuario no encontrado.");
        return;
    }

    const currentUserId = obtenerUsuarioActualId();
    if (currentUserId && String(currentUserId) === String(id) && !nuevoEstado) {
        alert("No puedes desactivar tu propia cuenta de administrador en la sesión activa.");
        return;
    }

    document.getElementById("modalConfirmarId").value = id;
    document.getElementById("modalConfirmarNuevoEstado").value = nuevoEstado ? "true" : "false";

    const modal = document.getElementById("modalConfirmarDesactivar");
    const tituloEl = document.getElementById("modalConfirmarTitulo");
    const mensajeEl = document.getElementById("modalConfirmarMensaje");
    const btnAccion = document.getElementById("btnConfirmarAccionEstado");
    const nombreCompleto = `${user.nombre || ""} ${user.apellido || ""}`.trim() || user.correo || "este usuario";

    if (nuevoEstado) {
        // Reactivación
        if (tituloEl) {
            tituloEl.textContent = "¿Reactivar Cuenta?";
            tituloEl.style.color = "#81c784";
        }
        if (mensajeEl) {
            mensajeEl.innerHTML = `
                ¿Deseas reactivar el acceso de <strong style="color:#fff;">${nombreCompleto}</strong>?
                <br><br>
                El usuario podrá volver a ingresar al sistema y realizar reservas con normalidad.
            `;
        }
        if (btnAccion) {
            btnAccion.textContent = "Reactivar Cuenta";
            btnAccion.style.background = "#2e7d32";
        }
    } else {
        // Desactivación suave (Soft-delete)
        if (tituloEl) {
            tituloEl.textContent = "¿Desactivar Cuenta?";
            tituloEl.style.color = "#ef5350";
        }
        if (mensajeEl) {
            mensajeEl.innerHTML = `
                Al desactivar la cuenta de <strong style="color:#fff;">${nombreCompleto}</strong>, se le impedirá el inicio de sesión.
                <br><br>
                <span style="color:#f5d77f;">✔ Sus registros históricos y reservas vinculadas permanecerán 100% íntegros en la base de datos.</span>
            `;
        }
        if (btnAccion) {
            btnAccion.textContent = "Desactivar Cuenta";
            btnAccion.style.background = "#e53935";
        }
    }

    if (modal) modal.style.display = "flex";
}

function cerrarModalConfirmar() {
    const modal = document.getElementById("modalConfirmarDesactivar");
    if (modal) modal.style.display = "none";
}

async function ejecutarCambioEstadoConfirmado() {
    const id = document.getElementById("modalConfirmarId")?.value;
    const nuevoEstado = document.getElementById("modalConfirmarNuevoEstado")?.value === "true";
    if (!id) return;

    const token = obtenerTokenAdmin();
    const btnAccion = document.getElementById("btnConfirmarAccionEstado");
    const textoOriginal = btnAccion ? btnAccion.textContent : "Confirmar";
    if (btnAccion) {
        btnAccion.disabled = true;
        btnAccion.textContent = "Procesando...";
    }

    try {
        const resp = await fetch(`/api/admin/usuarios/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ activo: nuevoEstado })
        });

        if (resp.ok) {
            cerrarModalConfirmar();
            alert(nuevoEstado 
                ? "Cuenta activada correctamente." 
                : "Cuenta desactivada correctamente. Se conservó el historial de reservas intacto.");
            await cargarUsuarios();
        } else {
            let errorMsg = "No se pudo actualizar el estado del usuario.";
            try {
                const errJson = await resp.json();
                if (errJson && errJson.message) errorMsg = errJson.message;
            } catch (_) {}
            alert("Error: " + errorMsg);
        }
    } catch (e) {
        console.error("Error al cambiar estado:", e);
        alert("Error de conexión al cambiar el estado del usuario.");
    } finally {
        if (btnAccion) {
            btnAccion.disabled = false;
            btnAccion.textContent = textoOriginal;
        }
    }
}

// ===== EXPOSICIÓN GLOBAL Y EVENTOS =====
window.renderizarTablaUsuarios = renderizarTablaUsuarios;
window.addEventListener("idiomaCambiado", function () {
    if (typeof renderizarTablaUsuarios === "function") {
        renderizarTablaUsuarios();
    }
});