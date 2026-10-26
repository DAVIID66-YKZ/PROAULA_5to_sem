// 1. Guardián de Validación Inmediata de Sesión y Rol ADMIN
(function () {
  let token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
  let rol = localStorage.getItem("rol");
  let rolUpper = String(rol || "").trim().toUpperCase();

  if (!token || (rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
    console.warn("Acceso denegado: Se requiere rol ADMIN. Redirigiendo a login...");
    window.location.href = "/login";
  }
})();

// ===== CONFIGURACIÓN DE API =====
let API_BASE = "/api/admin/dashboardAdmin";
let TOKEN = localStorage.getItem("token") || localStorage.getItem("jwtToken");

// ===== VARIABLES GLOBALES (Detección dinámica sin constantes fijas de prueba) =====
let datosReservas = [];
let datosReservasTodas = [];
let datosMesas = [];
let todasLasMesas = [];

let paginaActualReservas = 1;
let paginaActualMesas = 1;
let paginaActualReservasTodas = 1;

let ITEMS_POR_PAGINA = 5;
let mesaIdParaEditar = null;
let conectadoAlBackend = false;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Dashboard Admin iniciado");

  // Mostrar nombre real del admin en el perfil
  cargarPerfilAdmin();

  // Cargar datos reales del backend
  await cargarDatosDelBackend();

  // Renderizar UI
  actualizarEstadisticas();
  cargarReservasEnTabla();
  cargarMesasEnTabla();
  actualizarBadgesMesas();

  // Configurar eventos
  configurarNavegacion();
  configurarFormularioMesas();
  configurarBusquedas();

  console.log("Dashboard completamente cargado");
});

// ===== PERFIL ADMIN =====
function cargarPerfilAdmin() {
  let nombre =
    localStorage.getItem("nombreUsuario") ||
    localStorage.getItem("nombre") ||
    "Admin";
  let iniciales = nombre
    .split(" ")
    .map(function (p) { return p[0]; })
    .join("")
    .substring(0, 2)
    .toUpperCase();

  document.querySelectorAll(".profile-name").forEach(function (el) {
    el.textContent = nombre.toUpperCase();
  });
  document.querySelectorAll(".profile-avatar").forEach(function (el) {
    el.textContent = iniciales;
    el.style.color = "#1a1a1a";
    el.style.fontWeight = "700";
    el.style.fontSize = "14px";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
  });
}

// ===== CONECTAR CON BACKEND =====
async function cargarDatosDelBackend() {
  TOKEN = localStorage.getItem("token") || localStorage.getItem("jwtToken");
  if (!TOKEN) {
    console.warn("No hay Token JWT disponible.");
    datosMesas = [];
    todasLasMesas = [];
    datosReservas = [];
    datosReservasTodas = [];
    conectadoAlBackend = false;
    return;
  }

  try {
    // Cargar mesas reales
    let resMesas = await fetch(`${API_BASE}/mesas`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (resMesas.ok) {
      datosMesas = await resMesas.json();
      todasLasMesas = [...datosMesas];
      conectadoAlBackend = true;
      console.log("Mesas cargadas:", datosMesas.length);
    } else {
      console.warn("Error al cargar mesas: HTTP", resMesas.status);
      datosMesas = [];
      todasLasMesas = [];
    }

    // Cargar reservas recientes
    let resReservas = await fetch(
      `${API_BASE}/reservas-recientes?pagina=0&tamanio=9999`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (resReservas.ok) {
      datosReservas = await resReservas.json();
      datosReservasTodas = [...datosReservas];
      console.log("Reservas cargadas:", datosReservas.length);
    } else {
      console.warn("Error al cargar reservas: HTTP", resReservas.status);
      datosReservas = [];
      datosReservasTodas = [];
    }
  } catch (err) {
    console.error("Backend no disponible o error de red:", err);
    datosMesas = [];
    todasLasMesas = [];
    datosReservas = [];
    datosReservasTodas = [];
    conectadoAlBackend = false;
  }
}

// ===== ESTADÍSTICAS =====
async function actualizarEstadisticas() {
  try {
    if (conectadoAlBackend && TOKEN) {
      let res = await fetch(`${API_BASE}/estadisticas`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (res.ok) {
        let stats = await res.json();
        setEl("ocupancia", (stats.ocupanciaTotal || 0) + "%");
        setEl("totalHuespedes", stats.totalHuespedes || 0);
        if (stats.totalUsuarios !== undefined) { setEl("kpiTotalUsuarios", stats.totalUsuarios); setEl("totalUsuarios", stats.totalUsuarios); }
                setEl("listaEspera", String(stats.listaEsperaCount || 0).padStart(2, "0"));
        setEl("mesasActivas", stats.mesasActivas || 0);
        setEl("mesasTotales", stats.mesasTotales || 0);
        return;
      }
    }
  } catch (e) {
    console.warn("No se pudo obtener estadísticas directamente:", e);
  }

  // Cálculo en base a los datos recuperados
  let mesasDisponibles = datosMesas.filter(function (m) {
    return m.disponible !== undefined ? m.disponible : m.activa;
  }).length;
  let total = datosMesas.length;
  let ocupadas = total - mesasDisponibles;
  let ocupancia = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
  let totalHuespedes = datosReservas.reduce(function (s, r) {
    return s + (r.cantidadPersonas || r.numeroPersonas || 0);
  }, 0);
  let pendientes = datosReservas.filter(function (r) {
    return r.estado === "PENDIENTE";
  }).length;

  setEl("ocupancia", ocupancia + "%");
  setEl("totalHuespedes", totalHuespedes);
  setEl("listaEspera", String(pendientes).padStart(2, "0"));
  setEl("mesasActivas", mesasDisponibles);
  setEl("mesasTotales", total);
}

function setEl(id, val) {
  let el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===================================================================
// SECCIÓN: RESERVAS RECIENTES (Panel principal)
// ===================================================================

function cargarReservasEnTabla() {
  let tbody = document.getElementById("reservasTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  let inicio = (paginaActualReservas - 1) * ITEMS_POR_PAGINA;
  let fin = inicio + ITEMS_POR_PAGINA;
  let visibles = datosReservas.slice(inicio, fin);
  let total = datosReservas.length;

  if (total === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:#888;padding:40px;font-style:italic;">No hay reservas registradas en el manuscrito.</td></tr>';
  } else {
    visibles.forEach(function (r) {
      tbody.appendChild(crearFilaReserva(r));
    });
  }

  let totalPags = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));
  setEl("paginaActual", paginaActualReservas);
  setEl("totalPaginas", totalPags);
}

function crearFilaReserva(r) {
  let statusMap = {
    CONFIRMADA: "status-confirmed",
    PENDIENTE: "status-pending",
    LLEGADA: "status-arrived",
    CANCELADA: "status-cancelada",
    COMPLETADA: "status-completada",
  };
  let estadoKey = String(r.estado || "CONFIRMADA").trim().toUpperCase();
  let cls = statusMap[estadoKey] || "status-pending";
  let iniciales =
    r.iniciales || (r.nombreHuesped || "U").substring(0, 2).toUpperCase();
  let personas = r.cantidadPersonas || r.numeroPersonas || 0;
  let mesa = r.numeroMesa || r.mesaId || "S/A";
  let fechaHora = r.fechaHora || ((r.fecha || "") + " " + (r.hora || "")).trim() || "N/A";

  let tr = document.createElement("tr");
  tr.innerHTML = `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar">${iniciales}</div>
                <div class="guest-info">
                    <h4>${r.nombreHuesped || "Cliente"}</h4>
                    <p>${r.tipoEvento || "Experiencia Estándar"}</p>
                </div>
            </div>
        </td>
        <td>${fechaHora}</td>
        <td>${personas} personas</td>
        <td><strong class="gold-text">${mesa}</strong></td>
        <td><span class="status-badge ${cls}">${estadoKey}</span></td>
        <td>
            <div class="action-buttons">
                <button class="action-btn" title="Editar" onclick="editarReserva('${r.id}')">
                    <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
                </button>
                <button class="action-btn" title="Eliminar" onclick="eliminarReservaAdmin('${r.id}')">
                    <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                </button>
            </div>
        </td>`;
  return tr;
}

// ===== ACCIONES SOBRE RESERVAS =====
function editarReserva(id) {
  let r = datosReservas.find(function (res) { return String(res.id) === String(id); });
  if (!r) {
    alert("Reserva no encontrada.");
    return;
  }

  let nuevoEstado = prompt(
    `Editar estado para la reserva de ${r.nombreHuesped || "Cliente"}:\nOpciones: CONFIRMADA, COMPLETADA, PENDIENTE, CANCELADA`,
    r.estado || "CONFIRMADA"
  );

  if (nuevoEstado && nuevoEstado.trim()) {
    r.estado = nuevoEstado.trim().toUpperCase();
    cargarReservasEnTabla();
    renderizarTablaReservasTodas();
    actualizarEstadisticas();
  }
}

// ===== PAGINACIÓN RESERVAS (Panel principal) =====
function paginaAnterior() {
  if (paginaActualReservas > 1) {
    paginaActualReservas--;
    cargarReservasEnTabla();
  }
}

function paginaSiguiente() {
  let totalPags = Math.ceil(datosReservas.length / ITEMS_POR_PAGINA);
  if (paginaActualReservas < totalPags) {
    paginaActualReservas++;
    cargarReservasEnTabla();
  }
}

// ===================================================================
// SECCIÓN: MESAS
// ===================================================================

function cargarMesasEnTabla() {
  let container = document.getElementById("mesasListContainer");
  if (!container) return;

  container.innerHTML = "";

  let inicio = (paginaActualMesas - 1) * ITEMS_POR_PAGINA;
  let fin = inicio + ITEMS_POR_PAGINA;
  let visibles = todasLasMesas.slice(inicio, fin);

  if (todasLasMesas.length === 0) {
    container.innerHTML =
      '<p style="color:#888;text-align:center;padding:30px;font-style:italic;">No hay mesas configuradas en el piso.</p>';
    return;
  }

  visibles.forEach(function (m) {
    let tieneReservaFutura = datosReservas.some(function (r) {
      if (r.estado !== "CONFIRMADA") return false;
      let mesaNum = "Mesa " + m.numero;
      return r.numeroMesa && r.numeroMesa.startsWith(mesaNum);
    });

    let estaDisponible = (m.disponible !== undefined ? m.disponible : m.activa) && !tieneReservaFutura;
    let badgeHtml = estaDisponible
      ? '<span class="status-badge status-confirmed">DISPONIBLE</span>'
      : '<span class="status-badge status-cancelada">OCUPADA</span>';

    let div = document.createElement("div");
    div.className = "mesa-item";
    div.innerHTML = `
            <div class="mesa-info">
                <div class="mesa-number">Mesa ${m.numero || m.numeroMesa || m.id}</div>
                <div class="mesa-details">${m.sector || m.nombreUbicacion || "Comedor Principal"} · ${m.capacidad} personas</div>
            </div>
            <div class="mesa-status">
                ${badgeHtml}
                <button class="action-btn mesa-edit-btn" title="Editar" onclick="editarMesa('${m.id}')">
                    <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
                </button>
                <button class="action-btn mesa-delete-btn" title="Eliminar" onclick="eliminarMesa('${m.id}')">
                    <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                </button>
            </div>`;
    container.appendChild(div);
  });
}

function actualizarBadgesMesas() {
  let activas = todasLasMesas.filter(function (m) {
    return m.disponible !== undefined
      ? m.disponible
      : m.activa !== undefined
        ? m.activa
        : true;
  }).length;
  setEl("mesasActivas", activas);
  setEl("mesasTotales", todasLasMesas.length);
}

// ===== PAGINACIÓN MESAS =====
function mesaAnterior() {
  if (paginaActualMesas > 1) {
    paginaActualMesas--;
    cargarMesasEnTabla();
  }
}

function mesaSiguiente() {
  let totalPags = Math.ceil(todasLasMesas.length / ITEMS_POR_PAGINA);
  if (paginaActualMesas < totalPags) {
    paginaActualMesas++;
    cargarMesasEnTabla();
  }
}

// ===== FORMULARIO MESAS =====
function configurarFormularioMesas() {
  let form = document.getElementById("formMesa");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    let numero = parseInt(document.getElementById("numeroMesa").value) || 0;
    let capacidad = parseInt(document.getElementById("capacidad").value) || 0;
    let sectorRadio = document.querySelector('input[name="sector"]:checked');
    let ubicacion = sectorRadio ? sectorRadio.value : "Mesa-Estandar";
    let activa = document.getElementById("activa").checked;

    if (!numero || !capacidad) {
      alert("Por favor completa número y capacidad de la mesa.");
      return;
    }
    if (capacidad > 12) {
      alert("⚠️ La capacidad máxima por mesa es de 12 personas.");
      document.getElementById("capacidad").value = 12;
      return;
    }

    let numeroDuplicado = todasLasMesas.find(function (m) {
      return String(m.numero) === String(numero) &&
        String(m.id) !== String(mesaIdParaEditar);
    });
    if (numeroDuplicado) {
      alert(`⚠️ Ya existe una Mesa con el número ${numero}. Usa un número diferente.`);
      return;
    }

    let payload = {
      numero: numero,
      capacidad: capacidad,
      sector: ubicacion,
      disponible: activa,
    };

    if (conectadoAlBackend && TOKEN) {
      try {
        let url = mesaIdParaEditar
          ? `${API_BASE}/mesas/${mesaIdParaEditar}`
          : `${API_BASE}/mesas`;
        let method = mesaIdParaEditar ? "PUT" : "POST";

        let res = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          alert(
            mesaIdParaEditar
              ? "✅ Mesa actualizada correctamente."
              : "✅ Mesa creada correctamente."
          );
        } else {
          let msg = await res.text();
          alert("Error del servidor: " + msg);
          return;
        }
      } catch (err) {
        alert("Error de conexión al guardar la mesa.");
        return;
      }
    }

    await cargarDatosDelBackend();
    limpiarFormulario();
    cargarMesasEnTabla();
    actualizarBadgesMesas();
    actualizarEstadisticas();
  });
}

function editarMesa(mesaId) {
  let mesa = todasLasMesas.find(function (m) { return String(m.id) === String(mesaId); });
  if (!mesa) {
    alert("Mesa no encontrada.");
    return;
  }

  document.getElementById("numeroMesa").value = mesa.numero || "";
  document.getElementById("capacidad").value = mesa.capacidad || "";
  let sectorValor = mesa.sector || mesa.nombreUbicacion || "Mesa-Estandar";
  let radioASeleccionar = document.querySelector(
    `input[name="sector"][value="${sectorValor}"]`
  );
  if (radioASeleccionar) radioASeleccionar.checked = true;
  document.getElementById("activa").checked =
    mesa.disponible !== undefined
      ? mesa.disponible
      : mesa.activa !== undefined
        ? mesa.activa
        : true;

  mesaIdParaEditar = mesaId;
  let btn = document.querySelector(".btn-save");
  if (btn) btn.textContent = "ACTUALIZAR MESA";

  document.getElementById("formMesa").scrollIntoView({ behavior: "smooth" });
}

async function eliminarMesa(mesaId) {
  if (!confirm("¿Eliminar esta mesa de la base de datos?")) return;

  if (conectadoAlBackend && TOKEN) {
    try {
      let res = await fetch(`${API_BASE}/mesas/${mesaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (res.ok) {
        alert("Mesa eliminada correctamente.");
      } else {
        alert("No se pudo eliminar la mesa.");
        return;
      }
    } catch (err) {
      alert("Error de conexión.");
      return;
    }
  }

  await cargarDatosDelBackend();

  let totalPags = Math.ceil(todasLasMesas.length / ITEMS_POR_PAGINA);
  if (paginaActualMesas > totalPags) paginaActualMesas = Math.max(1, totalPags);

  cargarMesasEnTabla();
  actualizarBadgesMesas();
  actualizarEstadisticas();
}

function limpiarFormulario() {
  let form = document.getElementById("formMesa");
  if (form) form.reset();
  mesaIdParaEditar = null;
  let btn = document.querySelector(".btn-save");
  if (btn) btn.textContent = "GUARDAR MESA";
}

// ===================================================================
// SECCIÓN: TODAS LAS RESERVAS
// ===================================================================

async function cargarReservasGlobales() {
  datosReservasTodas = [...datosReservas];
  renderizarTablaReservasTodas();
}

function renderizarTablaReservasTodas(lista) {
  let tbody = document.getElementById("reservasAllTableBody");
  if (!tbody) return;

  let datos = lista || datosReservasTodas;
  let inicio = (paginaActualReservasTodas - 1) * ITEMS_POR_PAGINA;
  let visibles = datos.slice(inicio, inicio + ITEMS_POR_PAGINA);

  tbody.innerHTML = "";
  let totalPags = Math.max(1, Math.ceil(datos.length / ITEMS_POR_PAGINA));
  setEl("paginaActualTodas", paginaActualReservasTodas);
  setEl("totalPaginasTodas", totalPags);

  if (datos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:#888;padding:40px;font-style:italic;">No se encontraron reservas en el manuscrito.</td></tr>';
    return;
  }

  visibles.forEach(function (r) {
    let statusMap = {
      CONFIRMADA: "status-confirmed",
      PENDIENTE: "status-pending",
      LLEGADA: "status-arrived",
      CANCELADA: "status-cancelada",
      COMPLETADA: "status-completada",
    };
    let estadoKey = String(r.estado || "CONFIRMADA").trim().toUpperCase();
    let cls = statusMap[estadoKey] || "status-pending";
    let iniciales =
      r.iniciales || (r.nombreHuesped || "U").substring(0, 2).toUpperCase();
    let personas = r.cantidadPersonas || r.numeroPersonas || 0;
    let mesa = r.numeroMesa || r.mesaId || "S/A";
    let fechaHora = r.fechaHora || ((r.fecha || "") + " " + (r.hora || "")).trim() || "N/A";

    let tr = document.createElement("tr");
    tr.innerHTML = `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar">${iniciales}</div>
                <div class="guest-info">
                    <h4>${r.nombreHuesped || "Cliente"}</h4>
                </div>
            </div>
        </td>
        <td>${fechaHora}</td>
        <td>${personas} personas</td>
        <td><strong class="gold-text">${mesa}</strong></td>
        <td><span class="status-badge ${cls}">${estadoKey}</span></td>
        <td>${r.tipoEvento || "Experiencia Estándar"}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn" title="Eliminar" onclick="eliminarReservaAdmin('${r.id}')">
                    <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                </button>
            </div>
        </td>`;
    tbody.appendChild(tr);
  });
}

function filtrarReservasGlobales() {
  let termino = (
    document.getElementById("buscarReserva")?.value || ""
  ).toLowerCase();
  let estado = document.getElementById("filtroEstado")?.value || "";

  let filtradas = datosReservas.filter(function (r) {
    let matchTexto =
      !termino ||
      (r.nombreHuesped || "").toLowerCase().includes(termino) ||
      (r.fechaHora || "").includes(termino);
    let matchEstado = !estado || r.estado === estado;
    return matchTexto && matchEstado;
  });

  datosReservasTodas = filtradas;
  paginaActualReservasTodas = 1;
  renderizarTablaReservasTodas(filtradas);
}

async function eliminarReservaAdmin(id) {
  if (!confirm("¿Eliminar esta reserva permanentemente?")) return;

  if (conectadoAlBackend && TOKEN) {
    try {
      let res = await fetch(`/reservas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (res.ok) {
        alert("✅ Reserva eliminada correctamente.");
      } else {
        alert("Error al eliminar la reserva: " + (await res.text()));
        return;
      }
    } catch (err) {
      alert("Error de conexión al eliminar.");
      return;
    }
  }

  await cargarDatosDelBackend();
  cargarReservasEnTabla();
  renderizarTablaReservasTodas();
  actualizarEstadisticas();
}

// ===================================================================
// SECCIÓN: USUARIOS
// ===================================================================

async function cargarUsuariosSistema() {
  let tbody = document.getElementById("usuariosTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="6" style="text-align:center;color:#888;padding:30px;font-style:italic;">Consultando usuarios en el manuscrito...</td></tr>';

  if (!TOKEN) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:30px;">Sin autenticación. Inicia sesión.</td></tr>';
    return;
  }

  try {
    let res = await fetch(`${API_BASE}/usuarios`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    let usuarios = await res.json();
    tbody.innerHTML = "";

    if (usuarios.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#888;padding:30px;font-style:italic;">No hay usuarios registrados.</td></tr>';
      return;
    }

    usuarios.forEach(function (u) {
      let rolBadgeCls =
        u.rol === "ADMIN"
          ? "status-badge status-confirmed"
          : u.rol === "MESERO"
            ? "status-badge status-arrived"
            : "status-badge status-completada";

      let tr = document.createElement("tr");
      tr.innerHTML = `
                <td><strong>${u.nombre || ""} ${u.apellido || ""}</strong></td>
                <td>${u.correo || ""}</td>
                <td><span class="${rolBadgeCls}">${u.rol || ""}</span></td>
                <td>${u.telefono || "N/A"}</td>
                <td>${u.direccion || "N/A"}</td>
                <td>
                    <button class="action-btn" title="Eliminar" onclick="eliminarUsuario('${u.id}')">
                        <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                    </button>
                </td>`;
      tbody.appendChild(tr);
    });

    configurarBusquedaUsuarios(usuarios);
  } catch (err) {
    console.error("Error al cargar usuarios:", err);
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:30px;">Error al conectar con el servidor.</td></tr>';
  }
}

function configurarBusquedaUsuarios(usuarios) {
  let inputBuscar = document.getElementById("buscarUsuario");
  let filtroRol = document.getElementById("filtroRol");

  function filtrar() {
    let termino = (inputBuscar?.value || "").toLowerCase();
    let rol = filtroRol?.value || "";
    let tbody = document.getElementById("usuariosTableBody");
    if (!tbody) return;

    let filtrados = usuarios.filter(function (u) {
      let nombre = `${u.nombre || ""} ${u.apellido || ""}`.toLowerCase();
      let correo = (u.correo || "").toLowerCase();
      return (
        (!termino || nombre.includes(termino) || correo.includes(termino)) &&
        (!rol || u.rol === rol)
      );
    });

    tbody.innerHTML = "";
    if (filtrados.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#888;padding:30px;font-style:italic;">Sin resultados en el manuscrito.</td></tr>';
      return;
    }
    filtrados.forEach(function (u) {
      let rolBadgeCls =
        u.rol === "ADMIN"
          ? "status-badge status-confirmed"
          : u.rol === "MESERO"
            ? "status-badge status-arrived"
            : "status-badge status-completada";

      let tr = document.createElement("tr");
      tr.innerHTML = `
                <tr>
                    <td><strong>${u.nombre || ""} ${u.apellido || ""}</strong></td>
                    <td>${u.correo || ""}</td>
                    <td><span class="${rolBadgeCls}">${u.rol || ""}</span></td>
                    <td>${u.telefono || "N/A"}</td>
                    <td>${u.direccion || "N/A"}</td>
                    <td>
                        <button class="action-btn" title="Eliminar" onclick="eliminarUsuario('${u.id}')">
                            <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                        </button>
                    </td>
                </tr>`;
      tbody.appendChild(tr);
    });
  }

  if (inputBuscar) inputBuscar.addEventListener("input", filtrar);
  if (filtroRol) filtroRol.addEventListener("change", filtrar);
}

async function eliminarUsuario(id) {
  if (!confirm("¿Desea desactivar este usuario? Se conservar�n todas sus reservas en la base de datos pero se impedir� su acceso.")) return;

  if (conectadoAlBackend && TOKEN) {
    try {
      let res = await fetch(`${API_BASE}/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (res.ok) {
        alert("Cuenta desactivada correctamente. Las reservas se mantienen intactas.");
        cargarUsuariosSistema();
      } else {
        alert("No se pudo eliminar el usuario.");
      }
    } catch (e) {
      alert("Error de conexión.");
    }
  }
}

// ===================================================================
// NAVEGACIÓN SIDEBAR
// ===================================================================

function configurarNavegacion() {
  let navItems = document.querySelectorAll(".nav-item");
  let sidebar = document.querySelector(".sidebar");
  let mobileToggleBtn = document.getElementById("adminSidebarToggle");
  let backdrop = document.getElementById("adminSidebarBackdrop");

  function cerrarDrawerMobile() {
    if (sidebar) sidebar.classList.remove("mobile-open");
    if (backdrop) backdrop.classList.remove("active");
  }

  function toggleDrawerMobile() {
    if (sidebar) sidebar.classList.toggle("mobile-open");
    if (backdrop) backdrop.classList.toggle("active");
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleDrawerMobile();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      cerrarDrawerMobile();
    });
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 992) {
      cerrarDrawerMobile();
    }
  });

  navItems.forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      navItems.forEach(function (n) { n.classList.remove("active"); });
      this.classList.add("active");

      let seccion = this.getAttribute("data-section");
      document
        .querySelectorAll(".content-section")
        .forEach(function (s) { s.classList.remove("active"); });
      let target = document.getElementById(seccion);
      if (target) target.classList.add("active");

      // Cerrar drawer en móvil al seleccionar sección
      if (window.innerWidth <= 992) {
        cerrarDrawerMobile();
      }

      // Acciones al cambiar pestaña
      if (seccion === "reservas") cargarReservasGlobales();
      if (seccion === "usuarios") cargarUsuariosSistema();
      if (seccion === "mesas") {
        cargarMesasEnTabla();
        actualizarBadgesMesas();
      }
    });
  });
}

// BÚSQUEDAS GENERALES

function configurarBusquedas() {
  let buscarHuesped = document.getElementById("buscarHuesped");
  if (buscarHuesped) {
    buscarHuesped.addEventListener("input", function () {
      let termino = this.value.toLowerCase();
      document.querySelectorAll("#reservasTableBody tr").forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().includes(termino)
          ? ""
          : "none";
      });
    });
  }

  let buscarReserva = document.getElementById("buscarReserva");
  let filtroEstado = document.getElementById("filtroEstado");
  if (buscarReserva)
    buscarReserva.addEventListener("input", filtrarReservasGlobales);
  if (filtroEstado)
    filtroEstado.addEventListener("change", filtrarReservasGlobales);
}

// UTILIDADES DE PAGINACIÓN
function paginaAnteriorTodas() {
  if (paginaActualReservasTodas > 1) {
    paginaActualReservasTodas--;
    renderizarTablaReservasTodas();
  }
}

function paginaSiguienteTodas() {
  let totalPags = Math.ceil(datosReservasTodas.length / ITEMS_POR_PAGINA);
  if (paginaActualReservasTodas < totalPags) {
    paginaActualReservasTodas++;
    renderizarTablaReservasTodas();
  }
}

function logout() {
  if (confirm("¿Cerrar sesión de administración?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("gestrest_last_activity");
    localStorage.removeItem("gestrest_login_time");
    window.location.href = "/login";
  }
}

function toggleFiltroPanel() {
  let panel = document.getElementById("filtroPanel");
  if (panel) {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
}

function filtrarReservasRecientes() {
  let estado = document.getElementById("filtroEstadoRecientes").value;
  let filtradas = estado
    ? datosReservas.filter(function (r) { return r.estado === estado; })
    : datosReservas;

  let tbody = document.getElementById("reservasTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  filtradas.forEach(function (r) {
    tbody.appendChild(crearFilaReserva(r));
  });
}

function filtrarMesas() {
  let termino = document
    .getElementById("buscarMesa")
    .value.toLowerCase()
    .trim();

  let filtradas = termino
    ? todasLasMesas.filter(function (m) {
        return (
          String(m.numero).includes(termino) ||
          (m.numeroMesa || "").toLowerCase().includes(termino)
        );
      })
    : todasLasMesas;

  let container = document.getElementById("mesasListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (filtradas.length === 0) {
    container.innerHTML =
      '<p style="color:#888;text-align:center;padding:30px;font-style:italic;">No se encontró ninguna mesa con ese criterio.</p>';
    return;
  }

  filtradas.forEach(function (m) {
    let activa =
      m.disponible !== undefined
        ? m.disponible
        : m.activa !== undefined
          ? m.activa
          : true;
    let badgeHtml = activa
      ? '<span class="status-badge status-confirmed">DISPONIBLE</span>'
      : '<span class="status-badge status-cancelada">OCUPADA</span>';

    let div = document.createElement("div");
    div.className = "mesa-item";
    div.innerHTML = `
            <div class="mesa-info">
                <div class="mesa-number">Mesa ${m.numero || m.numeroMesa || m.id}</div>
                <div class="mesa-details">${m.sector || m.nombreUbicacion || "Comedor Principal"} · ${m.capacidad} personas</div>
            </div>
            <div class="mesa-status">
                ${badgeHtml}
                <button class="action-btn mesa-edit-btn" title="Editar" onclick="editarMesa('${m.id}')">
                    <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
                </button>
                <button class="action-btn mesa-delete-btn" title="Eliminar" onclick="eliminarMesa('${m.id}')">
                    <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                </button>
            </div>`;
    container.appendChild(div);
  });
}

