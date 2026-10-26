/* ================================================================
   GESTIÓN DE MESAS - GESTREST
   Lógica completa de administración de mesas conectada a MongoDB
   ================================================================ */

let todasLasMesas = [];
let mesaIdEnEdicion = null;

document.addEventListener("DOMContentLoaded", function () {
    cargarMesas();
    configurarFormularioMesa();
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

// ===== CARGAR MESAS DE LA BASE DE DATOS =====
async function cargarMesas() {
    let token = obtenerTokenAdmin();
    let container = document.getElementById("mesasListContainer");
    if (!container) return;

    container.innerHTML = '<p style="color:#888;text-align:center;padding:30px;">Cargando mesas del restaurante en vivo...</p>';

    try {
        let resp = await fetch("/api/admin/mesas", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!resp.ok && resp.status === 404) {
            resp = await fetch("/mesas/listar", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        if (resp.ok) {
            todasLasMesas = await resp.json();
            renderizarListaMesas(todasLasMesas);
            actualizarBadgesMesas();
        } else {
            container.innerHTML = '<p style="color:#888;text-align:center;padding:30px;font-style:italic;">No hay mesas registradas en la base de datos.</p>';
            actualizarBadgesMesas();
        }
    } catch (e) {
        console.error("Error al cargar mesas:", e);
        container.innerHTML = '<p style="color:#f44336;text-align:center;padding:30px;">Error de conexión con el servicio de mesas.</p>';
    }
}

// ===== RENDERIZAR LISTA DE MESAS =====
function renderizarListaMesas(lista) {
    let container = document.getElementById("mesasListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!lista || lista.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:30px;font-style:italic;">No hay mesas para mostrar.</p>';
        return;
    }

    lista.forEach(function (m) {
        let activa = m.disponible !== undefined ? m.disponible : (m.activa !== undefined ? m.activa : true);
        let badgeHtml = activa
            ? '<span class="status-badge status-confirmed">DISPONIBLE</span>'
            : '<span class="status-badge status-cancelada">OCUPADA</span>';

        let id = m.id || m._id;
        let numDisplay = m.numero !== undefined ? m.numero : (m.numeroMesa || id);
        let sectorDisplay = m.sector ? m.sector.replace("Mesa-", "") : "Comedor Principal";
        let capDisplay = m.capacidad || 4;

        let div = document.createElement("div");
        div.className = "mesa-item";
        div.innerHTML = `
            <div class="mesa-info">
                <div class="mesa-number">Mesa ${numDisplay}</div>
                <div class="mesa-details">${sectorDisplay} · ${capDisplay} personas</div>
            </div>
            <div class="mesa-status">
                ${badgeHtml}
                <button type="button" class="action-btn mesa-edit-btn" title="Editar Mesa" onclick="prepararEdicionMesa('${id}')">
                    <span class="material-symbols-outlined action-icon">edit</span>
                </button>
                <button type="button" class="action-btn mesa-delete-btn" title="Eliminar Mesa" onclick="eliminarMesa('${id}')">
                    <span class="material-symbols-outlined action-icon">delete</span>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ===== ACTUALIZAR CONTADORES =====
function actualizarBadgesMesas() {
    let activas = todasLasMesas.filter(function (m) {
        return m.disponible !== undefined ? m.disponible : (m.activa !== undefined ? m.activa : true);
    }).length;

    let elAct = document.getElementById("mesasActivas");
    let elTot = document.getElementById("mesasTotales");
    if (elAct) elAct.textContent = activas;
    if (elTot) elTot.textContent = todasLasMesas.length;
}

// ===== FILTRAR MESAS =====
function filtrarMesas() {
    let input = document.getElementById("buscarMesa");
    if (!input) return;
    let termino = input.value.toLowerCase().trim();

    let filtradas = termino ? todasLasMesas.filter(function (m) {
        let num = String(m.numero !== undefined ? m.numero : m.numeroMesa || "").toLowerCase();
        let sec = String(m.sector || "").toLowerCase();
        return num.includes(termino) || sec.includes(termino);
    }) : todasLasMesas;

    renderizarListaMesas(filtradas);
}

// ===== FORMULARIO CREAR / EDITAR MESA =====
function configurarFormularioMesa() {
    let form = document.getElementById("formMesa");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        let token = obtenerTokenAdmin();

        let numStr = document.getElementById("numeroMesa").value.trim();
        let numero = parseInt(numStr.replace(/\D/g, ""), 10) || parseInt(numStr, 10) || 1;
        let capacidad = parseInt(document.getElementById("capacidad").value, 10) || 4;
        let activa = document.getElementById("activa").checked;

        let sectorRadio = document.querySelector('input[name="sector"]:checked');
        let sector = sectorRadio ? sectorRadio.value : "Mesa-Estandar";

        let payload = {
            numero: numero,
            capacidad: capacidad,
            sector: sector,
            disponible: activa
        };

        try {
            let url = mesaIdEnEdicion ? `/api/admin/mesas/${mesaIdEnEdicion}` : "/api/admin/mesas";
            let method = mesaIdEnEdicion ? "PUT" : "POST";

            let resp = await fetch(url, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (resp.ok) {
                alert(mesaIdEnEdicion ? "Mesa actualizada exitosamente en la base de datos." : "Mesa registrada exitosamente en la base de datos.");
                limpiarFormularioMesa();
                await cargarMesas();
            } else {
                let errText = await resp.text();
                alert("Error al procesar la mesa: " + (errText || resp.statusText));
            }
        } catch (err) {
            console.error("Error al guardar mesa:", err);
            alert("Error de red al guardar la mesa.");
        }
    });
}

function prepararEdicionMesa(id) {
    let m = todasLasMesas.find(function (item) { return String(item.id || item._id) === String(id); });
    if (!m) return;

    mesaIdEnEdicion = id;
    let inputNumero = document.getElementById("numeroMesa");
    let inputCapacidad = document.getElementById("capacidad");
    let inputActiva = document.getElementById("activa");

    if (inputNumero) inputNumero.value = m.numero !== undefined ? m.numero : (m.numeroMesa || "");
    if (inputCapacidad) inputCapacidad.value = m.capacidad || 4;

    let activa = m.disponible !== undefined ? m.disponible : (m.activa !== undefined ? m.activa : true);
    if (inputActiva) inputActiva.checked = activa;

    let sectorVal = m.sector || "Mesa-Estandar";
    let radio = document.querySelector(`input[name="sector"][value="${sectorVal}"]`);
    if (radio) radio.checked = true;

    let btnSubmit = document.querySelector("#formMesa .btn-save");
    if (btnSubmit) btnSubmit.textContent = "ACTUALIZAR MESA";

    // Scroll suave hacia el formulario en mobile
    let form = document.getElementById("formMesa");
    if (form && window.innerWidth < 768) {
        form.scrollIntoView({ behavior: "smooth" });
    }
}

function limpiarFormularioMesa() {
    mesaIdEnEdicion = null;
    let form = document.getElementById("formMesa");
    if (form) form.reset();

    let radioDefault = document.querySelector('input[name="sector"][value="Mesa-Estandar"]');
    if (radioDefault) radioDefault.checked = true;

    let btnSubmit = document.querySelector("#formMesa .btn-save");
    if (btnSubmit) btnSubmit.textContent = "GUARDAR MESA";
}

async function eliminarMesa(id) {
    if (!confirm("¿Está seguro de eliminar esta mesa de la base de datos?")) return;

    let token = obtenerTokenAdmin();

    try {
        let resp = await fetch(`/api/admin/mesas/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (resp.ok) {
            alert("Mesa eliminada con éxito de la base de datos.");
            await cargarMesas();
        } else {
            alert("No se pudo eliminar la mesa en el servidor.");
        }
    } catch (e) {
        console.error("Error al eliminar mesa:", e);
        alert("Error de red al eliminar la mesa.");
    }
}

// ===== EXPOSICIÓN GLOBAL Y EVENTOS =====
window.renderizarListaMesas = renderizarListaMesas;
window.todasLasMesas = todasLasMesas;
window.addEventListener("idiomaCambiado", function () {
    if (typeof renderizarListaMesas === "function" && todasLasMesas) {
        renderizarListaMesas(todasLasMesas);
    }
});