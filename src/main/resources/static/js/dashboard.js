// ===== DATOS DE PRUEBA =====
const datosReservas = [
    {
        id: 1,
        nombreHuesped: "Julianne Weaver",
        iniciales: "JW",
        fechaHora: "2024-10-24 19:30",
        cantidadPersonas: 4,
        numeroMesa: "T-14",
        estado: "CONFIRMADA",
        tipoEvento: "VIP, WINE PAIRING PREFERRED"
    },
    {
        id: 2,
        nombreHuesped: "Arthur Sterling",
        iniciales: "AS",
        fechaHora: "2024-10-24 20:30",
        cantidadPersonas: 2,
        numeroMesa: "T-08",
        estado: "PENDIENTE",
        tipoEvento: "MOSCOW SEATING"
    },
    {
        id: 3,
        nombreHuesped: "Marcus Chen",
        iniciales: "MC",
        fechaHora: "2024-10-24 18:00",
        cantidadPersonas: 6,
        numeroMesa: "L-02",
        estado: "LLEGADA",
        tipoEvento: "BIRTHDAY CELEBRATION"
    },
    {
        id: 4,
        nombreHuesped: "Sarah Johnson",
        iniciales: "SJ",
        fechaHora: "2024-10-25 19:00",
        cantidadPersonas: 3,
        numeroMesa: "T-12",
        estado: "CONFIRMADA",
        tipoEvento: "REGULAR"
    },
    {
        id: 5,
        nombreHuesped: "David Miller",
        iniciales: "DM",
        fechaHora: "2024-10-25 20:00",
        cantidadPersonas: 5,
        numeroMesa: "T-16",
        estado: "PENDIENTE",
        tipoEvento: "CORPORATE"
    },
];

const datosMesas = [
    {
        id: 1,
        numeroMesa: "T-14",
        capacidad: 2,
        nombreUbicacion: "Window Side A",
        activa: true,
        estado: "DISPONIBLE"
    },
    {
        id: 2,
        numeroMesa: "T-08",
        capacidad: 6,
        nombreUbicacion: "Imperial Booth",
        activa: true,
        estado: "DISPONIBLE"
    },
    {
        id: 3,
        numeroMesa: "L-02",
        capacidad: 4,
        nombreUbicacion: "Center Floor",
        activa: true,
        estado: "DISPONIBLE"
    },
    {
        id: 4,
        numeroMesa: "T-12",
        capacidad: 4,
        nombreUbicacion: "Terrace View",
        activa: true,
        estado: "DISPONIBLE"
    },
    {
        id: 5,
        numeroMesa: "T-16",
        capacidad: 8,
        nombreUbicacion: "Private Room",
        activa: false,
        estado: "MANTENIMIENTO"
    },
];

// Variables globales
let paginaActualReservas = 1;
let paginaActualMesas = 1;
const ITEMS_POR_PAGINA = 3;
let todasLasMesas = [...datosMesas];
let mesasParaEditar = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard iniciado');
    
    // Cargar datos iniciales
    actualizarEstadisticas();
    cargarReservasEnTabla();
    cargarMesasEnTabla();
    
    // Configurar navegación del sidebar
    configurarNavegacion();
    
    // Configurar formulario de mesas
    configurarFormularioMesas();
    
    // Configurar búsqueda de huéspedes
    document.getElementById('buscarHuesped').addEventListener('input', filtrarReservas);
    
    // Configurar búsqueda de reservas globales
    if (document.getElementById('buscarReserva')) {
        document.getElementById('buscarReserva').addEventListener('input', filtrarReservasGlobales);
        document.getElementById('filtroEstado').addEventListener('change', filtrarReservasGlobales);
    }
    
    console.log('Dashboard completamente cargado');
});

// ===== ACTUALIZAR ESTADÍSTICAS =====
function actualizarEstadisticas() {
    const mesasActivas = datosMesas.filter(m => m.activa).length;
    const totalMesas = datosMesas.length;
    const reservasConfirmadas = datosReservas.filter(r => r.estado === "CONFIRMADA").length;
    const reservasPendientes = datosReservas.filter(r => r.estado === "PENDIENTE").length;
    
    const ocupancia = Math.round((reservasConfirmadas / totalMesas) * 100);
    const totalHuespedes = datosReservas
        .filter(r => r.estado === "CONFIRMADA")
        .reduce((sum, r) => sum + r.cantidadPersonas, 0);
    
    document.getElementById('ocupancia').textContent = ocupancia + '%';
    document.getElementById('totalHuespedes').textContent = totalHuespedes;
    document.getElementById('listaEspera').textContent = String(reservasPendientes).padStart(2, '0');
    document.getElementById('mesasActivas').textContent = mesasActivas;
    document.getElementById('mesasTotales').textContent = totalMesas;
}

// ===== CARGAR RESERVAS EN TABLA =====
function cargarReservasEnTabla() {
    const tbody = document.getElementById('reservasTableBody');
    tbody.innerHTML = '';
    
    const inicio = (paginaActualReservas - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const reservasVisibles = datosReservas.slice(inicio, fin);
    
    if (datosReservas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No hay reservas</td></tr>';
        return;
    }
    
    reservasVisibles.forEach(reserva => {
        let statusClass = 'status-pending';
        if (reserva.estado === 'CONFIRMADA') statusClass = 'status-confirmed';
        else if (reserva.estado === 'LLEGADA') statusClass = 'status-arrived';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="guest-cell">
                    <div class="guest-avatar">${reserva.iniciales}</div>
                    <div class="guest-info">
                        <h4>${reserva.nombreHuesped}</h4>
                        <p>${reserva.tipoEvento}</p>
                    </div>
                </div>
            </td>
            <td>${reserva.fechaHora}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 5px;">
                     ${reserva.cantidadPersonas}
                </div>
            </td>
            <td><strong>${reserva.numeroMesa}</strong></td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${reserva.estado}
                </span>
            </td>
        <td>
    <div class="action-buttons">

        <button class="action-btn" title="Editar" onclick="editarReserva(${reserva.id})">
            <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
        </button>

        <button class="action-btn" title="Eliminar" onclick="eliminarReserva(${reserva.id})">
            <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
        </button>

    </div>
</td>
`;
        tbody.appendChild(row);
    });
    
    // Actualizar información de paginación
    const totalPaginas = Math.ceil(datosReservas.length / ITEMS_POR_PAGINA);
    document.getElementById('paginaActual').textContent = paginaActualReservas;
    document.getElementById('totalPaginas').textContent = totalPaginas;
}

// ===== CARGAR MESAS EN TABLA =====
function cargarMesasEnTabla() {
    const container = document.getElementById('mesasListContainer');
    container.innerHTML = '';
    
    const inicio = (paginaActualMesas - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const mesasVisibles = todasLasMesas.slice(inicio, fin);
    
    if (todasLasMesas.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No hay mesas configuradas</p>';
        return;
    }
    
    mesasVisibles.forEach(mesa => {
        let estadoBadge = '';
        if (mesa.activa) {
            estadoBadge = '<span class="badge active-badge">ACTIVE</span>';
        } else {
            estadoBadge = '<span class="badge" style="background-color: rgba(244, 67, 54, 0.2); color: #f44336;">INACTIVE</span>';
        }
        
        const mesaDiv = document.createElement('div');
        mesaDiv.className = 'mesa-item';
        mesaDiv.innerHTML = `
            <div class="mesa-info">
                <div class="mesa-number">${mesa.numeroMesa}</div>
                <div class="mesa-details">
                    ${mesa.nombreUbicacion} • ${mesa.capacidad} Guests
                </div>
            </div>
          <div class="mesa-status">
    ${estadoBadge}

    <button class="mesa-edit-btn" onclick="editarMesa(${mesa.id})" title="Editar">
        <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
    </button>

    <button class="mesa-delete-btn" onclick="eliminarMesa(${mesa.id})" title="Eliminar">
        <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
    </button>
</div>
        `;
        container.appendChild(mesaDiv);
    });
}

// ===== NAVEGACIÓN SIDEBAR =====
function configurarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const seccion = this.getAttribute('data-section');
            
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(seccion).classList.add('active');
            
            // Recargar datos al cambiar de sección
            if (seccion === 'reservas') {
                cargarReservasGlobales();
            }
        });
    });
}

// ===== FORMULARIO DE MESAS =====
function configurarFormularioMesas() {
    const formMesa = document.getElementById('formMesa');
    
    formMesa.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const numeroMesa = document.getElementById('numeroMesa').value;
        const capacidad = parseInt(document.getElementById('capacidad').value);
        const nombreUbicacion = document.getElementById('ubicacion').value;
        const activa = document.getElementById('activa').checked;
        
        if (mesasParaEditar) {
            // Actualizar mesa existente
            const index = todasLasMesas.findIndex(m => m.id === mesasParaEditar);
            if (index !== -1) {
                todasLasMesas[index] = {
                    ...todasLasMesas[index],
                    numeroMesa,
                    capacidad,
                    nombreUbicacion,
                    activa
                };
            }
            mesasParaEditar = null;
            document.querySelector('.btn-save').textContent = 'SAVE TABLE';
        } else {
            // Crear nueva mesa
            const nuevaMesa = {
                id: Math.max(...todasLasMesas.map(m => m.id), 0) + 1,
                numeroMesa,
                capacidad,
                nombreUbicacion,
                activa,
                estado: activa ? 'DISPONIBLE' : 'MANTENIMIENTO'
            };
            todasLasMesas.push(nuevaMesa);
        }
        
        formMesa.reset();
        cargarMesasEnTabla();
        actualizarEstadisticas();
        
        alert('Mesa guardada correctamente');
    });
}

function limpiarFormulario() {
    document.getElementById('formMesa').reset();
    mesasParaEditar = null;
    document.querySelector('.btn-save').textContent = 'SAVE TABLE';
}

function editarMesa(mesaId) {
    const mesa = todasLasMesas.find(m => m.id === mesaId);
    if (!mesa) return;
    
    document.getElementById('numeroMesa').value = mesa.numeroMesa;
    document.getElementById('capacidad').value = mesa.capacidad;
    document.getElementById('ubicacion').value = mesa.nombreUbicacion;
    document.getElementById('activa').checked = mesa.activa;
    
    mesasParaEditar = mesaId;
    document.querySelector('.btn-save').textContent = 'UPDATE TABLE';
    
    document.querySelector('.mesa-form-panel').scrollIntoView({ behavior: 'smooth' });
}

function eliminarMesa(mesaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta mesa?')) {
        todasLasMesas = todasLasMesas.filter(m => m.id !== mesaId);
        cargarMesasEnTabla();
        actualizarEstadisticas();
        alert('Mesa eliminada correctamente');
    }
}

// ===== PAGINACIÓN RESERVAS =====
function paginaAnterior() {
    if (paginaActualReservas > 1) {
        paginaActualReservas--;
        cargarReservasEnTabla();
    }
}

function paginaSiguiente() {
    const totalPaginas = Math.ceil(datosReservas.length / ITEMS_POR_PAGINA);
    if (paginaActualReservas < totalPaginas) {
        paginaActualReservas++;
        cargarReservasEnTabla();
    }
}

// ===== PAGINACIÓN MESAS =====
function mesaAnterior() {
    if (paginaActualMesas > 1) {
        paginaActualMesas--;
        cargarMesasEnTabla();
    }
}

function mesaSiguiente() {
    const totalPaginas = Math.ceil(todasLasMesas.length / ITEMS_POR_PAGINA);
    if (paginaActualMesas < totalPaginas) {
        paginaActualMesas++;
        cargarMesasEnTabla();
    }
}

// ===== FILTRAR RESERVAS =====
function filtrarReservas(e) {
    const termino = e.target.value.toLowerCase();
    const filas = document.querySelectorAll('#reservasTableBody tr');
    
    filas.forEach(fila => {
        const nombreHuesped = fila.textContent.toLowerCase();
        fila.style.display = nombreHuesped.includes(termino) ? '' : 'none';
    });
}

// ===== FUNCIONES DE ACCIÓN =====
function editarReserva(reservaId) {
    alert('Función editar reserva - ID: ' + reservaId);
}

function eliminarReserva(reservaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
        const index = datosReservas.findIndex(r => r.id === reservaId);
        if (index !== -1) {
            datosReservas.splice(index, 1);
            cargarReservasEnTabla();
            actualizarEstadisticas();
            alert('Reserva eliminada correctamente');
        }
    }
}

// ===== CARGAR TODAS LAS RESERVAS (SECCIÓN RESERVAS) =====
function cargarReservasGlobales() {
    const tbody = document.getElementById('reservasAllTableBody');
    tbody.innerHTML = '';
    
    datosReservas.forEach(reserva => {
        let statusClass = 'status-pending';
        if (reserva.estado === 'CONFIRMADA') statusClass = 'status-confirmed';
        else if (reserva.estado === 'LLEGADA') statusClass = 'status-arrived';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="guest-cell">
                    <div class="guest-avatar">${reserva.iniciales}</div>
                    <div class="guest-info">
                        <h4>${reserva.nombreHuesped}</h4>
                    </div>
                </div>
            </td>
            <td>${reserva.fechaHora}</td>
            <td>${reserva.cantidadPersonas}</td>
            <td><strong>${reserva.numeroMesa}</strong></td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${reserva.estado}
                </span>
            </td>
            <td>${reserva.tipoEvento}</td>
            <td>
               <div class="action-buttons">

    <button class="action-btn" title="Editar" onclick="editarReserva(${reserva.id})">
        <img src="/iconos/pencil.png" alt="Editar" class="action-icon">
    </button>

    <button class="action-btn" title="Eliminar" onclick="eliminarReserva(${reserva.id})">
        <img src="/iconos/delete.png" alt="Eliminar" class="action-icon">
    </button>

</div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filtrarReservasGlobales() {
    const termino = document.getElementById('buscarReserva')?.value.toLowerCase() || '';
    const estado = document.getElementById('filtroEstado')?.value || '';
    const filas = document.querySelectorAll('#reservasAllTableBody tr');
    
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        const estadoMatch = !estado || fila.textContent.includes(estado);
        const textoMatch = texto.includes(termino);
        
        fila.style.display = (estadoMatch && textoMatch) ? '' : 'none';
    });
}

// ===== LOGOUT =====
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        alert('Sesión cerrada. Redireccionar a login...');
        // window.location.href = '/login';
    }
}