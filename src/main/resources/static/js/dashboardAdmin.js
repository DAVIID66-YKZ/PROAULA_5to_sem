// ===== CONFIGURACIÓN DE API =====
const API_BASE = 'http://localhost:8080/api/admin/dashboardAdmin';
const TOKEN = localStorage.getItem('token') || localStorage.getItem('jwtToken');

// ===== DATOS DE PRUEBA (Fallback si falla el backend) =====
const datosReservasLocal = [
    { id: 1, nombreHuesped: "Julianne Weaver", iniciales: "JW", fechaHora: "2024-10-24 19:30", cantidadPersonas: 4, numeroMesa: "T-14", estado: "CONFIRMADA", tipoEvento: "VIP" },
    { id: 2, nombreHuesped: "Arthur Sterling", iniciales: "AS", fechaHora: "2024-10-24 20:30", cantidadPersonas: 2, numeroMesa: "T-08", estado: "PENDIENTE", tipoEvento: "MOSCOW" },
    { id: 3, nombreHuesped: "Marcus Chen", iniciales: "MC", fechaHora: "2024-10-24 18:00", cantidadPersonas: 6, numeroMesa: "L-02", estado: "LLEGADA", tipoEvento: "BIRTHDAY" },
    { id: 4, nombreHuesped: "Sofia Reyes", iniciales: "SR", fechaHora: "2024-10-25 20:00", cantidadPersonas: 3, numeroMesa: "T-05", estado: "CONFIRMADA", tipoEvento: "Regular" },
    { id: 5, nombreHuesped: "Carlos Mendez", iniciales: "CM", fechaHora: "2024-10-25 21:00", cantidadPersonas: 5, numeroMesa: "L-01", estado: "PENDIENTE", tipoEvento: "BIRTHDAY" }
];

const datosMesasLocal = [
    { id: "1", numero: 14, numeroMesa: "T-14", capacidad: 2, nombreUbicacion: "Window Side A", activa: true, disponible: true },
    { id: "2", numero: 8,  numeroMesa: "T-08", capacidad: 6, nombreUbicacion: "Imperial Booth", activa: true, disponible: true },
    { id: "3", numero: 2,  numeroMesa: "L-02", capacidad: 4, nombreUbicacion: "Comedor Principal", activa: false, disponible: false }
];

// ===== VARIABLES GLOBALES =====
let datosReservas       = [];
let datosReservasTodas  = [];
let datosMesas          = [];
let todasLasMesas       = [];

let paginaActualReservas     = 1;
let paginaActualMesas        = 1;
let paginaActualReservasTodas = 1;

const ITEMS_POR_PAGINA = 3;
let mesaIdParaEditar   = null;
let conectadoAlBackend = false;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Dashboard Admin iniciado');

    // Mostrar nombre real del admin en el perfil
    cargarPerfilAdmin();

    // Cargar datos del backend
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

    console.log('Dashboard completamente cargado');
});

// ===== PERFIL ADMIN =====
function cargarPerfilAdmin() {
    const nombre = localStorage.getItem('nombreUsuario') || localStorage.getItem('nombre') || 'Admin';
    const iniciales = nombre.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

    // Actualizar TODOS los elementos de perfil en la página
    document.querySelectorAll('.profile-name').forEach(el => {
        el.textContent = nombre.toUpperCase();
    });
    document.querySelectorAll('.profile-avatar').forEach(el => {
        el.textContent = iniciales;
        el.style.color = '#1a1a1a';
        el.style.fontWeight = '700';
        el.style.fontSize = '14px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
    });
}

// ===== CONECTAR CON BACKEND =====
async function cargarDatosDelBackend() {
    if (!TOKEN) {
        console.warn('No hay Token JWT. Usando datos locales.');
        usarDatosDePrueba();
        return;
    }

    try {
        // Cargar mesas
        const resMesas = await fetch(`${API_BASE}/mesas`, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        if (resMesas.ok) {
            datosMesas    = await resMesas.json();
            todasLasMesas = [...datosMesas];
            conectadoAlBackend = true;
            console.log('Mesas cargadas:', datosMesas.length);
        } else {
            throw new Error('Error al cargar mesas: ' + resMesas.status);
        }

        // Cargar reservas recientes
        const resReservas = await fetch(`${API_BASE}/reservas-recientes?pagina=0&tamanio=50`, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        if (resReservas.ok) {
            datosReservas      = await resReservas.json();
            datosReservasTodas = [...datosReservas];
            console.log(' Reservas cargadas:', datosReservas.length);
        }

    } catch (err) {
        console.warn('Backend no disponible, usando datos locales.', err);
        usarDatosDePrueba();
    }
}

function usarDatosDePrueba() {
    datosReservas       = [...datosReservasLocal];
    datosReservasTodas  = [...datosReservasLocal];
    datosMesas          = [...datosMesasLocal];
    todasLasMesas       = [...datosMesasLocal];
    conectadoAlBackend  = false;
}

// ===== ESTADÍSTICAS =====
async function actualizarEstadisticas() {
    try {
        if (conectadoAlBackend && TOKEN) {
            const res = await fetch(`${API_BASE}/estadisticas`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (res.ok) {
                const stats = await res.json();
                setEl('ocupancia',      stats.ocupanciaTotal + '%');
                setEl('totalHuespedes', stats.totalHuespedes);
                setEl('listaEspera',    String(stats.listaEsperaCount).padStart(2, '0'));
                setEl('mesasActivas',   stats.mesasActivas);
                setEl('mesasTotales',   stats.mesasTotales);
                return;
            }
        }
    } catch (e) { /* fallback */ }

    // Cálculo local
    const mesasDisponibles = datosMesas.filter(m => m.disponible !== undefined ? m.disponible : m.activa).length;
    const total            = datosMesas.length;
    const ocupadas         = total - mesasDisponibles;
    const ocupancia        = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
    const totalHuespedes   = datosReservas.reduce((s, r) => s + (r.cantidadPersonas || r.numeroPersonas || 0), 0);
    const pendientes       = datosReservas.filter(r => r.estado === 'PENDIENTE').length;

    setEl('ocupancia',      ocupancia + '%');
    setEl('totalHuespedes', totalHuespedes);
    setEl('listaEspera',    String(pendientes).padStart(2, '0'));
    setEl('mesasActivas',   mesasDisponibles);
    setEl('mesasTotales',   total);
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ===================================================================
// SECCIÓN: RESERVAS RECIENTES (Panel principal)
// ===================================================================

function cargarReservasEnTabla() {
    const tbody = document.getElementById('reservasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const inicio = (paginaActualReservas - 1) * ITEMS_POR_PAGINA;
    const fin    = inicio + ITEMS_POR_PAGINA;
    const visibles = datosReservas.slice(inicio, fin);
    const total    = datosReservas.length;

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:40px;">No hay reservas registradas.</td></tr>';
    } else {
        visibles.forEach(r => tbody.appendChild(crearFilaReserva(r)));
    }

    // Paginación
    const totalPags = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));
    setEl('paginaActual', paginaActualReservas);
    setEl('totalPaginas', totalPags);
}

function crearFilaReserva(r) {
    const statusMap = {
        'CONFIRMADA': 'status-confirmed',
        'PENDIENTE':  'status-pending',
        'LLEGADA':    'status-arrived',
        'CANCELADA':  'status-cancelada',
        'COMPLETADA': 'status-completada'
    };
    const cls      = statusMap[r.estado] || 'status-pending';
    const iniciales = r.iniciales || (r.nombreHuesped || 'U').substring(0, 2).toUpperCase();
    const personas  = r.cantidadPersonas || r.numeroPersonas || 0;
    const mesa      = r.numeroMesa || r.mesaId || 'S/A';
    const fechaHora = r.fechaHora || ((r.fecha || '') + ' ' + (r.hora || ''));

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar">${iniciales}</div>
                <div class="guest-info">
                    <h4>${r.nombreHuesped || 'Cliente'}</h4>
                    <p>${r.tipoEvento || 'Regular'}</p>
                </div>
            </div>
        </td>
        <td>${fechaHora}</td>
        <td>${personas}</td>
        <td><strong>${mesa}</strong></td>
        <td><span class="status-badge ${cls}">${r.estado || 'CONFIRMADA'}</span></td>
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

// ===== PAGINACIÓN RESERVAS (Panel principal) =====
function paginaAnterior() {
    if (paginaActualReservas > 1) {
        paginaActualReservas--;
        cargarReservasEnTabla();
    }
}

function paginaSiguiente() {
    const totalPags = Math.ceil(datosReservas.length / ITEMS_POR_PAGINA);
    if (paginaActualReservas < totalPags) {
        paginaActualReservas++;
        cargarReservasEnTabla();
    }
}

// ===================================================================
// SECCIÓN: MESAS
// ===================================================================

function cargarMesasEnTabla() {
    const container = document.getElementById('mesasListContainer');
    if (!container) return;

    container.innerHTML = '';

    const inicio   = (paginaActualMesas - 1) * ITEMS_POR_PAGINA;
    const fin      = inicio + ITEMS_POR_PAGINA;
    const visibles = todasLasMesas.slice(inicio, fin);

    if (todasLasMesas.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">No hay mesas configuradas.</p>';
        return;
    }

    visibles.forEach(m => {
       // DESPUÉS — verificar contra reservas reales
const hoy = new Date().toISOString().split('T')[0]; // fecha actual
const tieneReservaFutura = datosReservas.some(r => {
    if (r.estado !== 'CONFIRMADA') return false;
    const mesaNum = 'Mesa ' + m.numero;
    return (r.numeroMesa && r.numeroMesa.startsWith(mesaNum));
});

const estaDisponible = m.disponible && !tieneReservaFutura;
const badgeHtml = estaDisponible
    ? '<span class="badge active-badge">DISPONIBLE</span>'
    : '<span class="badge" style="background:rgba(244,67,54,.2);color:#f44336;">OCUPADA</span>';
        const div = document.createElement('div');
        div.className = 'mesa-item';
        div.innerHTML = `
            <div class="mesa-info">
                <div class="mesa-number">Mesa ${m.numero || m.numeroMesa || m.id}</div>
                <div class="mesa-details">${m.sector || m.nombreUbicacion || 'Comedor Principal'} · ${m.capacidad} personas</div>
            </div>
            <div class="mesa-status">
                ${badgeHtml}
                <button class="mesa-edit-btn" title="Editar" onclick="editarMesa('${m.id}')">
                    <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
                </button>
                <button class="mesa-delete-btn" title="Eliminar" onclick="eliminarMesa('${m.id}')">
                    <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                </button>
            </div>`;
        container.appendChild(div);
    });
}

function actualizarBadgesMesas() {
    const activas = todasLasMesas.filter(m => m.disponible !== undefined ? m.disponible : (m.activa !== undefined ? m.activa : true)).length;
    setEl('mesasActivas',  activas);
    setEl('mesasTotales',  todasLasMesas.length);
}

// ===== PAGINACIÓN MESAS =====
function mesaAnterior() {
    if (paginaActualMesas > 1) {
        paginaActualMesas--;
        cargarMesasEnTabla();
    }
}

function mesaSiguiente() {
    const totalPags = Math.ceil(todasLasMesas.length / ITEMS_POR_PAGINA);
    if (paginaActualMesas < totalPags) {
        paginaActualMesas++;
        cargarMesasEnTabla();
    }
}

// ===== FORMULARIO MESAS =====
function configurarFormularioMesas() {
    const form = document.getElementById('formMesa');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const numero    = parseInt(document.getElementById('numeroMesa').value) || 0;
        const capacidad = parseInt(document.getElementById('capacidad').value)  || 0;
       const sectorRadio = document.querySelector('input[name="sector"]:checked');
       const ubicacion = sectorRadio ? sectorRadio.value : 'Mesa-Estandar';
        const activa    = document.getElementById('activa').checked;

        if (!numero || !capacidad) {
            alert('Por favor completa número y capacidad de la mesa.');
            return;
        }
        // --- VALIDACIÓN: Capacidad máxima 12 ---
    if (capacidad > 12) {
        alert('⚠️ La capacidad máxima por mesa es de 12 personas.');
        document.getElementById('capacidad').value = 12;
        return;
    }

   // --- VALIDACIÓN: Número de mesa duplicado ---
const numeroDuplicado = todasLasMesas.find(m =>
    String(m.numero) === String(numero) && String(m.id) !== String(mesaIdParaEditar)
);
if (numeroDuplicado) {
    alert(`⚠️ Ya existe una Mesa con el número ${numero}. Usa un número diferente.`);
    return;
}

// --- VALIDACIÓN: Nombre de mesa duplicado ---
const nombreInput = document.getElementById('numeroMesa').value.trim().toLowerCase();
const nombreDuplicado = todasLasMesas.find(m =>
    (m.numeroMesa || String(m.numero)).toLowerCase() === nombreInput &&
    String(m.id) !== String(mesaIdParaEditar)
);
if (nombreDuplicado) {
    alert(`⚠️ Ya existe una Mesa con el nombre "${document.getElementById('numeroMesa').value.trim()}". Usa un nombre diferente.`);
    return;
}



        const payload = {
            numero:     numero,
            capacidad:  capacidad,
            sector:     ubicacion,
            disponible: activa
        };

        if (conectadoAlBackend && TOKEN) {
            try {
                const url    = mesaIdParaEditar ? `${API_BASE}/mesas/${mesaIdParaEditar}` : `${API_BASE}/mesas`;
                const method = mesaIdParaEditar ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert(mesaIdParaEditar ? '✅ Mesa actualizada correctamente.' : '✅ Mesa creada correctamente.');
                } else {
                    const msg = await res.text();
                    alert('Error del servidor: ' + msg);
                    return;
                }
            } catch (err) {
                alert('Error de conexión al guardar la mesa.');
                return;
            }
        } else {
            // Modo local
            if (mesaIdParaEditar) {
                const idx = todasLasMesas.findIndex(m => m.id === mesaIdParaEditar);
                if (idx !== -1) {
                    todasLasMesas[idx] = { ...todasLasMesas[idx], numero, capacidad, sector: ubicacion, disponible: activa, activa };
                }
            } else {
                const newId = String(Date.now());
                todasLasMesas.push({ id: newId, numero, capacidad, sector: ubicacion, disponible: activa, activa });
            }
        }

        // Recargar datos desde backend y refrescar UI
        await cargarDatosDelBackend();
        limpiarFormulario();
        cargarMesasEnTabla();
        actualizarBadgesMesas();
        actualizarEstadisticas();
    });
}

function editarMesa(mesaId) {
    const mesa = todasLasMesas.find(m => String(m.id) === String(mesaId));
    if (!mesa) { alert('Mesa no encontrada.'); return; }

    document.getElementById('numeroMesa').value = mesa.numero || '';
    document.getElementById('capacidad').value  = mesa.capacidad || '';
    const sectorValor = mesa.sector || mesa.nombreUbicacion || 'Mesa-Estandar';
const radioASeleccionar = document.querySelector(`input[name="sector"][value="${sectorValor}"]`);
if (radioASeleccionar) radioASeleccionar.checked = true;
    document.getElementById('activa').checked   = mesa.disponible !== undefined ? mesa.disponible : (mesa.activa !== undefined ? mesa.activa : true);

    mesaIdParaEditar = mesaId;
    const btn = document.querySelector('.btn-save');
    if (btn) btn.textContent = 'ACTUALIZAR MESA';

    // Scroll al formulario
    document.getElementById('formMesa').scrollIntoView({ behavior: 'smooth' });
}

async function eliminarMesa(mesaId) {
    if (!confirm('¿Eliminar esta mesa de la base de datos?')) return;

    if (conectadoAlBackend && TOKEN) {
        try {
            const res = await fetch(`${API_BASE}/mesas/${mesaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (res.ok) {
                alert('Mesa eliminada correctamente.');
            } else {
                alert('No se pudo eliminar la mesa.');
                return;
            }
        } catch (err) {
            alert('Error de conexión.');
            return;
        }
    } else {
        todasLasMesas = todasLasMesas.filter(m => String(m.id) !== String(mesaId));
        datosMesas    = datosMesas.filter(m => String(m.id) !== String(mesaId));
    }

    await cargarDatosDelBackend();

    // Ajustar página si quedó vacía
    const totalPags = Math.ceil(todasLasMesas.length / ITEMS_POR_PAGINA);
    if (paginaActualMesas > totalPags) paginaActualMesas = Math.max(1, totalPags);

    cargarMesasEnTabla();
    actualizarBadgesMesas();
    actualizarEstadisticas();
}

function limpiarFormulario() {
    const form = document.getElementById('formMesa');
    if (form) form.reset();
    mesaIdParaEditar = null;
    const btn = document.querySelector('.btn-save');
    if (btn) btn.textContent = 'GUARDAR MESA';
}

// ===================================================================
// SECCIÓN: TODAS LAS RESERVAS
// ===================================================================

async function cargarReservasGlobales() {
    datosReservasTodas = [...datosReservas];
    renderizarTablaReservasTodas();
}

function renderizarTablaReservasTodas(lista) {
    const tbody = document.getElementById('reservasAllTableBody');
    if (!tbody) return;

    const datos   = lista || datosReservasTodas;
    const inicio  = (paginaActualReservasTodas - 1) * ITEMS_POR_PAGINA;
    const visibles = datos.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';
      const totalPags = Math.max(1, Math.ceil(datos.length / ITEMS_POR_PAGINA));
    setEl('paginaActualTodas', paginaActualReservasTodas);
    setEl('totalPaginasTodas', totalPags);

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:40px;">No se encontraron reservas.</td></tr>';
        return;
        
    }

    visibles.forEach(r => {
      const statusMap = { 
    'CONFIRMADA': 'status-confirmed', 
    'PENDIENTE': 'status-pending', 
    'LLEGADA': 'status-arrived', 
    'CANCELADA': 'status-cancelada',
    'COMPLETADA': 'status-completada'
};
        const cls       = statusMap[r.estado] || 'status-pending';
        const iniciales = r.iniciales || (r.nombreHuesped || 'U').substring(0, 2).toUpperCase();
        const personas  = r.cantidadPersonas || r.numeroPersonas || 0;
        const mesa      = r.numeroMesa || r.mesaId || 'S/A';
        const fechaHora = r.fechaHora || ((r.fecha || '') + ' ' + (r.hora || ''));

        tbody.innerHTML += `
        <tr>
            <td>
                <div class="guest-cell">
                    <div class="guest-avatar">${iniciales}</div>
                    <div class="guest-info">
                        <h4>${r.nombreHuesped || 'Cliente'}</h4>
                    </div>
                </div>
            </td>
            <td>${fechaHora}</td>
            <td>${personas}</td>
            <td><strong>${mesa}</strong></td>
            <td><span class="status-badge ${cls}">${r.estado || 'CONFIRMADA'}</span></td>
            <td>${r.tipoEvento || 'Regular'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" title="Eliminar" onclick="eliminarReservaAdmin('${r.id}')">
                        <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                    </button>
                </div>
            </td>
        </tr>`;
    });
}

function filtrarReservasGlobales() {
    const termino = (document.getElementById('buscarReserva')?.value || '').toLowerCase();
    const estado  = (document.getElementById('filtroEstado')?.value || '');

    const filtradas = datosReservas.filter(r => {
        const matchTexto  = !termino || (r.nombreHuesped || '').toLowerCase().includes(termino) || (r.fechaHora || '').includes(termino);
        const matchEstado = !estado  || r.estado === estado;
        return matchTexto && matchEstado;
    });

    datosReservasTodas = filtradas;
    paginaActualReservasTodas = 1;
    renderizarTablaReservasTodas(filtradas);
}

async function eliminarReservaAdmin(id) {
    if (!confirm('¿Eliminar esta reserva permanentemente?')) return;

    if (conectadoAlBackend && TOKEN) {
        try {
            const res = await fetch(`/reservas/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${TOKEN}` }
});
            if (res.ok) {
                alert('✅ Reserva eliminada correctamente.');
            } else {
                alert('Error al eliminar la reserva: ' + await res.text());
                return;
            }
        } catch (err) {
            alert('Error de conexión al eliminar.');
            return;
        }
    }

    // Actualizar listas locales
    datosReservas      = datosReservas.filter(r => String(r.id) !== String(id));
    datosReservasTodas = datosReservasTodas.filter(r => String(r.id) !== String(id));
    cargarReservasEnTabla();
    renderizarTablaReservasTodas();
    actualizarEstadisticas();
}
// ===================================================================
// SECCIÓN: USUARIOS
// ===================================================================

async function cargarUsuariosSistema() {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">Cargando usuarios desde MongoDB...</td></tr>';

    if (!TOKEN) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:30px;">Sin autenticación. Inicia sesión.</td></tr>';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/usuarios`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const usuarios = await res.json();
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">No hay usuarios registrados.</td></tr>';
            return;
        }

        usuarios.forEach(u => {
            const rolColor = u.rol === 'ADMIN' ? 'background:rgba(255,193,7,.2);color:#ffc107;'
                           : u.rol === 'MESERO' ? 'background:rgba(33,150,243,.2);color:#2196F3;'
                           : 'background:rgba(76,175,80,.2);color:#4CAF50;';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${u.nombre || ''} ${u.apellido || ''}</strong></td>
                <td>${u.correo || ''}</td>
                <td><span class="badge" style="${rolColor}padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;">${u.rol || ''}</span></td>
                <td>${u.telefono || 'N/A'}</td>
                <td>${u.direccion || 'N/A'}</td>
                <td>
                    <button class="action-btn" title="Eliminar" onclick="eliminarUsuario('${u.id}')">
                        <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });

        // Búsqueda en tiempo real
        configurarBusquedaUsuarios(usuarios);

    } catch (err) {
        console.error('Error al cargar usuarios:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336;padding:30px;">Error al conectar con el servidor.</td></tr>';
    }
}

function configurarBusquedaUsuarios(usuarios) {
    const inputBuscar = document.getElementById('buscarUsuario');
    const filtroRol   = document.getElementById('filtroRol');

    function filtrar() {
        const termino = (inputBuscar?.value || '').toLowerCase();
        const rol     = (filtroRol?.value || '');
        const tbody   = document.getElementById('usuariosTableBody');
        if (!tbody) return;

        const filtrados = usuarios.filter(u => {
            const nombre = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
            const correo = (u.correo || '').toLowerCase();
            return (!termino || nombre.includes(termino) || correo.includes(termino))
                && (!rol || u.rol === rol);
        });

        tbody.innerHTML = '';
        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">Sin resultados.</td></tr>';
            return;
        }
        filtrados.forEach(u => {
            const rolColor = u.rol === 'ADMIN' ? 'background:rgba(255,193,7,.2);color:#ffc107;'
                           : u.rol === 'MESERO' ? 'background:rgba(33,150,243,.2);color:#2196F3;'
                           : 'background:rgba(76,175,80,.2);color:#4CAF50;';
            tbody.innerHTML += `
                <tr>
                    <td><strong>${u.nombre || ''} ${u.apellido || ''}</strong></td>
                    <td>${u.correo || ''}</td>
                    <td><span class="badge" style="${rolColor}padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;">${u.rol || ''}</span></td>
                    <td>${u.telefono || 'N/A'}</td>
                    <td>${u.direccion || 'N/A'}</td>
                    <td>
                        <button class="action-btn" title="Eliminar" onclick="eliminarUsuario('${u.id}')">
                            <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                        </button>
                    </td>
                </tr>`;
        });
    }

    if (inputBuscar) inputBuscar.addEventListener('input', filtrar);
    if (filtroRol)   filtroRol.addEventListener('change', filtrar);
}

async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;

    if (conectadoAlBackend && TOKEN) {
        try {
            const res = await fetch(`${API_BASE}/usuarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (res.ok) {
                alert('Usuario eliminado correctamente.');
                cargarUsuariosSistema();
            } else {
                alert('No se pudo eliminar el usuario.');
            }
        } catch (e) {
            alert('Error de conexión.');
        }
    }
}

// ===================================================================
// NAVEGACIÓN SIDEBAR
// ===================================================================

function configurarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            const seccion = this.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(seccion);
            if (target) target.classList.add('active');

            // Acciones al cambiar pestaña
            if (seccion === 'reservas') cargarReservasGlobales();
            if (seccion === 'usuarios') cargarUsuariosSistema();
            if (seccion === 'mesas')    { cargarMesasEnTabla(); actualizarBadgesMesas(); }
        });
    });
}


// BÚSQUEDAS GENERALES


function configurarBusquedas() {
   
    const buscarHuesped = document.getElementById('buscarHuesped');
    if (buscarHuesped) {
        buscarHuesped.addEventListener('input', function () {
            const termino = this.value.toLowerCase();
            document.querySelectorAll('#reservasTableBody tr').forEach(tr => {
                tr.style.display = tr.textContent.toLowerCase().includes(termino) ? '' : 'none';
            });
        });
    }

  
    const buscarReserva = document.getElementById('buscarReserva');
    const filtroEstado  = document.getElementById('filtroEstado');
    if (buscarReserva) buscarReserva.addEventListener('input', filtrarReservasGlobales);
    if (filtroEstado)  filtroEstado.addEventListener('change', filtrarReservasGlobales);
}


// UTILIDADES
function paginaAnteriorTodas() {
    if (paginaActualReservasTodas > 1) {
        paginaActualReservasTodas--;
        renderizarTablaReservasTodas();
    }
}

function paginaSiguienteTodas() {
    const totalPags = Math.ceil(datosReservasTodas.length / ITEMS_POR_PAGINA);
    if (paginaActualReservasTodas < totalPags) {
        paginaActualReservasTodas++;
        renderizarTablaReservasTodas();
    }
}


function logout() {
    if (confirm('¿Cerrar sesión de administración?')) {
        localStorage.clear();
        window.location.href = '/login';
    }
}
function toggleFiltroPanel() {
    const panel = document.getElementById('filtroPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function filtrarReservasRecientes() {
    const estado = document.getElementById('filtroEstadoRecientes').value;
    const filtradas = estado
        ? datosReservas.filter(r => r.estado === estado)
        : datosReservas;

    const tbody = document.getElementById('reservasTableBody');
    tbody.innerHTML = '';
    filtradas.forEach(r => tbody.appendChild(crearFilaReserva(r)));
}
function filtrarMesas() {
    const termino = document.getElementById('buscarMesa').value.toLowerCase().trim();

    const filtradas = termino
        ? todasLasMesas.filter(m =>
            String(m.numero).includes(termino) ||
            (m.numeroMesa || '').toLowerCase().includes(termino))
        : todasLasMesas;

    const container = document.getElementById('mesasListContainer');
    container.innerHTML = '';

    if (filtradas.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">No se encontró ninguna mesa.</p>';
        return;
    }

    filtradas.forEach(m => {
        const activa = m.disponible !== undefined ? m.disponible : (m.activa !== undefined ? m.activa : true);
        const badgeHtml = activa
            ? '<span class="badge active-badge">DISPONIBLE</span>'
            : '<span class="badge" style="background:rgba(244,67,54,.2);color:#f44336;">OCUPADA</span>';

        const div = document.createElement('div');
        div.className = 'mesa-item';
        div.innerHTML = `
            <div class="mesa-info">
                <div class="mesa-number">Mesa ${m.numero || m.numeroMesa || m.id}</div>
                <div class="mesa-details">${m.sector || m.nombreUbicacion || 'Comedor Principal'} · ${m.capacidad} personas</div>
            </div>
            <div class="mesa-status">
                ${badgeHtml}
                <button class="mesa-edit-btn" title="Editar" onclick="editarMesa('${m.id}')">
                    <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
                </button>
                <button class="mesa-delete-btn" title="Eliminar" onclick="eliminarMesa('${m.id}')">
                    <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
                </button>
            </div>`;
        container.appendChild(div);
    });
}