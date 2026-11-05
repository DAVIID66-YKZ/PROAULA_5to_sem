/* ================================================================
   SISTEMA INTEGRAL DE IDIOMAS (i18n) - GESTREST
   Traductor Unificado para Consola Admin y Portal Cliente
   Archivo único: translate.js
   Soporte: Español (ES) / English (EN)
   ================================================================ */

(function () {
    "use strict";

    if (window._gestrestTranslateScriptLoaded) {
        if (typeof window.inicializarSelector === "function") {
            try { window.inicializarSelector(); } catch(e) {}
        }
        return;
    }
    window._gestrestTranslateScriptLoaded = true;

    // ===== 1. DICCIONARIO CLAVE-VALOR (Para data-i18n y scripts) =====
    const I18N_KEYS = {
        es: {
            // Admin Navbar & Sidebar
            "nav.brandTitle": "Panel Administrador",
            "nav.brandSubtitle": "CONSOLA DE ADMINISTRACIÓN",
            "nav.panel": "PANEL",
            "nav.mesas": "GESTIONAR MESAS",
            "nav.reservas": "RESERVAS",
            "nav.usuarios": "GESTIONAR USUARIOS",
            "nav.perfil": "MI PERFIL",
            "nav.menu": "GESTIONAR MENÚ",
            "nav.prediccion": "PREDICCIÓN ML",
            "nav.verSitio": "Ver Sitio",
            "nav.cerrarSesion": "Cerrar Sesión",
            "header.miPerfil": "Mi Perfil",
            "header.abrirMenu": "Abrir Menú",

            // Cliente Sidebar
            "clientNav.brandTitle": "Panel Cliente",
            "clientNav.brandSubtitle": "GESTIÓN DE RESERVAS",
            "clientNav.panel": "PANEL",
            "clientNav.misReservas": "MIS RESERVAS",
            "clientNav.calendario": "CALENDARIO",
            "clientNav.reservarMesa": "RESERVAR MESA",
            "clientNav.miPerfil": "MI PERFIL",
            "clientNav.verMenu": "VER MENÚ",
            "clientNav.nuevaReserva": "+ NUEVA RESERVA",
            "clientNav.soporte": "SOPORTE",

            // Comunes
            "common.anterior": "Anterior",
            "common.siguiente": "Siguiente",
            "common.mostrando": "Mostrando",
            "common.de": "de",
            "common.paginas": "páginas",
            "common.usuarios": "usuarios",
            "common.cancelar": "Cancelar",
            "common.guardar": "Guardar",
            "common.acciones": "ACCIONES",
            "common.estado": "ESTADO",
            "common.activo": "ACTIVO",
            "common.inactivo": "INACTIVO",
            "common.editar": "Editar",
            "common.eliminar": "Eliminar",
            "common.desactivar": "Desactivar",
            "common.reactivar": "Reactivar",
            "common.confirmada": "CONFIRMADA",
            "common.pendiente": "PENDIENTE",
            "common.llegada": "LLEGADA",
            "common.completada": "COMPLETADA",
            "common.cancelada": "CANCELADA",
            "common.disponible": "DISPONIBLE",
            "common.ocupada": "OCUPADA",

            // Admin Dashboard
            "dash.titulo": "Registro de Reservas",
            "dash.subtitulo": "Supervisa las reservas actuales y la logística de huéspedes en tiempo real.",
            "dash.ocupacion": "OCUPACIÓN",
            "dash.totalHuespedes": "TOTAL DE HUÉSPEDES",
            "dash.registrados": "REGISTRADOS EN SISTEMA",
            "dash.espera": "LISTA DE ESPERA / PENDIENTES",
            "dash.enCola": "EN COLA DE CONFIRMACIÓN",
            "dash.recientes": "Reservas Recientes",
            "dash.buscarHuesped": "BUSCAR UN HUÉSPED...",
            "dash.todosEstados": "Todos los Estados",
            "dash.thHuesped": "NOMBRE DEL HUÉSPED",
            "dash.thFechaHora": "FECHA Y HORA",
            "dash.thPersonas": "NÚMERO DE PERSONAS",
            "dash.thMesa": "MESA",
            "dash.thEstado": "ESTADO",
            "dash.thAcciones": "ACCIONES",

            // Admin Mesas
            "mesas.titulo": "Configuración de Mesas",
            "mesas.subtitulo": "Organiza el diseño de tu piso de comedor. Ajusta la capacidad y disponibilidad para orquestar el flujo de la noche.",
            "mesas.gestionar": "Gestionar Mesa",
            "mesas.numero": "NÚMERO DE MESA",
            "mesas.capacidad": "CAPACIDAD (PERSONAS)",
            "mesas.sector": "SECTOR / UBICACIÓN",
            "mesas.estandar": "Estándar",
            "mesas.ventana": "Ventana",
            "mesas.alcoba": "Alcoba",
            "mesas.disponibilidad": "Estado de Disponibilidad",
            "mesas.habilitar": "Habilitar para reservas en vivo",
            "mesas.guardar": "GUARDAR MESA",
            "mesas.limpiar": "LIMPIAR FORMULARIO",
            "mesas.registro": "Registro del Piso",
            "mesas.activas": "ACTIVAS:",
            "mesas.total": "TOTAL:",
            "mesas.buscar": "Buscar por número o sector...",

            // Admin Menú
            "menu.titulo": "Gestión del Menú",
            "menu.subtitulo": "Administra los platos y bebidas de tu menú.",
            "menu.anadir": "Añadir plato",
            "menu.nombre": "NOMBRE DEL PLATO",
            "menu.descripcion": "DESCRIPCIÓN",
            "menu.categoria": "CATEGORÍA",
            "menu.precio": "PRECIO (COP)",
            "menu.disponible": "DISPONIBLE",
            "menu.destacado": "DESTACAR EN INICIO ⭐",
            "menu.quitarDestacado": "Quitar de la portada principal",
            "menu.hacerDestacado": "Destacar en la portada principal",
            "menu.guardar": "AÑADIR PLATO",
            "menu.platos": "Platos del menú",
            "menu.placeholderNombre": "Ej. Pasta artesanal",
            "menu.placeholderDescripcion": "Describe los ingredientes y preparación...",
            "menu.seleccionarCategoria": "Selecciona una categoría",
            "menu.catEntradas": "Entradas",
            "menu.catPlatosFuertes": "Platos Fuertes",
            "menu.catBebidas": "Bebidas",
            "menu.catPostres": "Postres",
            "menu.seleccionaArchivo": "Selecciona un archivo:",
            "menu.guardarCambios": "GUARDAR CAMBIOS",
            "menu.limpiar": "LIMPIAR FORMULARIO",
            "menu.disponiblesBadge": "DISPONIBLES:",
            "menu.totalBadge": "TOTAL:",
            "menu.buscarPlaceholder": "Buscar por nombre, descripción o precio...",
            "menu.todasCategorias": "Todas las categorías",
            "menu.cargando": "Cargando platos del menú...",
            "menu.errorCargar": "No se pudieron cargar los platos del menú.",
            "menu.errorConexion": "Error al conectar con el servicio de platos.",
            "menu.vacioFiltros": "No hay platos para mostrar con los filtros actuales.",
            "menu.sinDescripcion": "Sin descripción",
            "menu.sinCategoria": "Sin categoría",
            "menu.noEspecificado": "No especificado",
            "menu.platoSinNombre": "Plato sin nombre",
            "menu.disponibleBadge": "DISPONIBLE",
            "menu.noDisponibleBadge": "NO DISPONIBLE",
            "menu.editarPlato": "Editar plato",
            "menu.eliminarPlato": "Eliminar plato",
            "menu.confirmarEliminar": "¿Está seguro de eliminar este plato permanentemente del menú?",
            "menu.exitoAnadir": "Plato añadido correctamente.",
            "menu.exitoActualizar": "Plato actualizado correctamente.",
            "menu.errorEliminarServidor": "No se pudo eliminar el plato en el servidor.",
            "menu.errorEliminarRed": "Error de red al eliminar el plato.",
            "menu.errorGuardarServidor": "No se pudo guardar el plato. Revisa la consola.",
            "menu.errorGuardarRed": "Error de red al guardar el plato.",
            "menu.errorDatosInvalidos": "Completa los datos del plato con valores válidos.",
            "menu.errorSeleccionarImagen": "Selecciona una imagen para el plato.",
            "menu.errorTipoImagen": "Selecciona una imagen JPG, PNG o WebP.",
            "menu.errorTamanoImagen": "La imagen no debe superar los 5 MB.",
            "menu.errorNoEncontrado": "No se encontró el plato que deseas editar.",
            "menu.paginacionInfo": "Mostrando {actual} de {total} páginas",

            // Admin Usuarios
            "user.titulo": "Gestión de Usuarios",
            "user.subtitulo": "Administra cuentas, asigna roles de acceso y activa o desactiva usuarios protegiendo el historial del restaurante.",
            "user.btnNuevo": "Nuevo Usuario",
            "user.kpiTotal": "TOTAL USUARIOS",
            "user.kpiActivos": "CUENTAS ACTIVAS",
            "user.kpiInactivos": "CUENTAS INACTIVAS",
            "user.kpiAdmins": "ADMINISTRADORES",
            "user.kpiTotalDesc": "REGISTRADOS EN SISTEMA",
            "user.kpiActivosDesc": "ACCESO AL SISTEMA HABILITADO",
            "user.kpiInactivosDesc": "DESACTIVADAS (HISTORIAL PRESERVADO)",
            "user.kpiAdminsDesc": "PERMISOS DE GESTIÓN TOTAL",
            "user.buscarPlaceholder": "Buscar por nombre, apellido, correo o teléfono...",
            "user.todosRoles": "Todos los roles",
            "user.rolClientes": "Clientes",
            "user.rolAdmins": "Administradores",
                        "user.rolMeseros": "Meseros",
            "user.rolCliente": "CLIENTE",
            "user.rolAdmin": "ADMINISTRADOR",
            "user.rolMesero": "MESERO",
            "user.todosEstados": "Todos los estados",
            "user.soloActivos": "Solo Activos",
            "user.soloInactivos": "Solo Desactivados",
            "user.limpiarFiltros": "Limpiar filtros",
            "user.thUsuario": "USUARIO",
            "user.thCorreo": "CORREO ELECTRÓNICO",
            "user.thRol": "ROL",
            "user.thTelefono": "TELÉFONO",
            "user.thEstado": "ESTADO",
            "user.thAcciones": "ACCIONES",
            "user.modalCrearTitulo": "Registrar Nuevo Usuario",
            "user.modalCrearDesc": "Crea una cuenta en el sistema con rol y credenciales asignadas.",
            "user.modalEditarTitulo": "Editar Usuario",
            "user.modalEditarDesc": "Modifica la información, rol o estado de la cuenta.",
            "user.bannerProteccion": "Protección de Historial: Desactivar una cuenta restringe su inicio de sesión, pero preserva de forma segura todas sus reservas históricas en la base de datos.",
            "user.nombre": "Nombre *",
            "user.apellido": "Apellido *",
            "user.correo": "Correo Electrónico *",
            "user.password": "Contraseña Inicial *",
            "user.telefono": "Teléfono",
            "user.rol": "Rol en el Sistema *",
            "user.direccion": "Dirección",
            "user.estadoInicial": "Estado Inicial",
            "user.btnGuardar": "Guardar Cambios",
            "user.btnCrear": "Crear Usuario",
            "user.desactivarTitulo": "¿Desactivar Cuenta?",
            "user.reactivarTitulo": "¿Reactivar Cuenta?",

            // Admin Predicción (ML & MongoDB)
            "prediction.titulo": "Predicción de Reservas y Demanda",
            "prediction.subtitulo": "Inferencia predictiva en tiempo real impulsada por Machine Learning y datos de MongoDB Atlas.",
            "prediction.fechaInicio": "FECHA INICIO",
            "prediction.fechaFin": "FECHA FIN",
            "prediction.turno": "TURNO / FRANJA",
            "prediction.turnoCompleto": "Día Completo (11:00 - 22:00)",
            "prediction.turnoAlmuerzo": "Almuerzo (12:00 - 15:00)",
            "prediction.turnoCena": "Cena (18:00 - 22:00)",
            "prediction.estadoEnVivo": "EN VIVO / CONECTADO",
            "prediction.estadoReconectando": "RECONECTANDO...",
            "prediction.tooltipLive": "Monitoreo y streaming activo con MongoDB y FastAPI",
            "prediction.btnActualizar": "Actualizar Predicción",
            "prediction.btnActualizando": "Actualizando...",
            "prediction.alertaSincronizando": "Sincronizando estado y demanda con el modelo predictivo...",
            "prediction.alertaOptima": "CAPACIDAD ÓPTIMA: El restaurante cuenta con holgura suficiente para el turno.",
            "prediction.alertaAdvertencia": "ALTA DEMANDA: Ocupación proyectada superior al 75%. Preparar mesas adicionales.",
            "prediction.alertaPeligro": "ALERTA DE CAPACIDAD: Aforo proyectado supera el límite operativo. Se sugiere habilitar lista de espera.",
            "prediction.kpiMesasPico": "MESAS A PREPARAR (PICO)",
            "prediction.kpiHolgura": "Holgura de seguridad +10% aplicada",
            "prediction.kpiComensalesEst": "COMENSALES ESTIMADOS",
            "prediction.kpiRealesEnBd": "Reales en BD: {count}",
            "prediction.kpiOcupacionProy": "OCUPACIÓN PROYECTADA",
            "prediction.kpiOcupacionRealActual": "Ocupación real actual: {percent}%",
            "prediction.kpiTotalReservas": "RESERVAS EN MONGODB",
            "prediction.kpiCapacidadMesas": "Capacidad: {mesas} mesas ({plazas} plazas)",
            "prediction.chartDemandaTitulo": "Demanda Estimada vs. Reservas Reales",
            "prediction.chartDemandaSubtitulo": "Comparación por franja horaria en base al modelo ML y MongoDB Atlas",
            "prediction.chartSerieEstimados": "Comensales Estimados (ML)",
            "prediction.chartSerieReales": "Comensales Reales (MongoDB)",
            "prediction.chartSerieMesas": "Mesas Sugeridas",
            "prediction.chartEjeComensales": "Comensales",
            "prediction.chartEjeMesas": "Mesas",
            "prediction.chartCapacidadTitulo": "Capacidad del Restaurante",
            "prediction.chartCapacidadSubtitulo": "Proyección de aforo vs. Capacidad máxima",
            "prediction.chartDoughnutProyectada": "Ocupación Proyectada",
            "prediction.chartDoughnutDisponible": "Capacidad Disponible",
            "prediction.tablaTitulo": "Desglose por Franja Horaria",
            "prediction.thFecha": "FECHA",
            "prediction.thHora": "HORA / FRANJA",
            "prediction.thComensalesEst": "COMENSALES ESTIMADOS (ML)",
            "prediction.thComensalesReales": "COMENSALES REALES (BD)",
            "prediction.thReservasActivas": "RESERVAS ACTIVAS",
            "prediction.thMesasSugeridas": "MESAS SUGERIDAS",
            "prediction.thOcupacion": "% OCUPACIÓN",
            "prediction.thEstadoCarga": "ESTADO CARGA",
            "prediction.badgeOptimo": "Óptimo",
            "prediction.badgeAltaDemanda": "Alta Demanda",
            "prediction.badgeModerada": "Moderada",
            "prediction.tablaVacia": "No hay franjas para los filtros seleccionados.",
            "prediction.unidadComensales": "comensales",
            "prediction.unidadMesas": "mesas",
            "prediction.toastExito": "Predicción actualizada con éxito. Datos sincronizados con la base de datos.",
            "prediction.toastError": "No se pudo actualizar la predicción. Intenta nuevamente.",
            "prediction.toastConexion": "No se pudo conectar con la base de datos. Verifica tu conexión e intenta nuevamente.",

            // Cliente - Dashboard
            "clientDash.bienvenido": "Bienvenido de nuevo,",
            "clientDash.subtitulo": "Tu mesa te espera. Revisa tus próximas veladas o reserva un nuevo momento especial con nosotros.",
            "clientDash.consultando": "Consultando reservas...",
            "clientDash.proximasReservas": "PRÓXIMAS RESERVAS",
            "clientDash.verListaCompleta": "VER LISTA COMPLETA",

            // Cliente - Mis Reservas
            "clientBookings.historialBadge": "Historial Personal",
            "clientBookings.titulo": "Mis Reservas",
            "clientBookings.thFecha": "FECHA",
            "clientBookings.thHora": "HORA",
            "clientBookings.thInvitados": "INVITADOS",
            "clientBookings.thExperiencia": "EXPERIENCIA",
            "clientBookings.thPlatos": "PLATOS PREORDENADOS",
            "clientBookings.thEstado": "ESTADO",
            "clientBookings.thAcciones": "ACCIONES",
            "clientBookings.consultando": "Consultando los archivos del manuscrito...",
            "clientBookings.modalMenuBadge": "Menú Seleccionado",
            "clientBookings.modalPlatosTitulo": "Platos de tu Reserva",
            "clientBookings.totalProductos": "Total en productos:",
            "clientBookings.anticipoReserva": "Anticipo de reserva (5%, mín $10k):",
            "clientBookings.modalComentarioTitulo": "Escribir Capítulo",
            "clientBookings.modalComentarioDesc": "Cuéntanos tu experiencia culinaria en este evento.",
            "clientBookings.modalComentarioPlaceholder": "Escribe tu reseña aquí...",
            "clientBookings.guardarComentario": "Guardar en Manuscrito",

            // Cliente - Calendario
            "clientCalendar.badge": "Agenda de Experiencias",
            "clientCalendar.titulo": "Mi Calendario",

            // Cliente - Perfil
            "clientProfile.badge": "Configuración de Cuenta",
            "clientProfile.titulo": "Mi Perfil",
            "clientProfile.datosPersonales": "Datos Personales",
            "clientProfile.nombre": "Nombre",
            "clientProfile.tuNombre": "Tu nombre",
            "clientProfile.apellido": "Apellido",
            "clientProfile.tuApellido": "Tu apellido",
            "clientProfile.correo": "Correo Electrónico",
            "clientProfile.correoHint": "El correo no puede modificarse por seguridad.",
            "clientProfile.telefono": "Teléfono",
            "clientProfile.direccion": "Dirección de Residencia",
            "clientProfile.tuDireccion": "Tu dirección completa",
            "clientProfile.btnActualizar": "Actualizar Datos",
            "clientProfile.cambiarPassword": "Cambiar Contraseña",
            "clientProfile.passwordActual": "Contraseña Actual",
            "clientProfile.passwordNueva": "Nueva Contraseña (mínimo 8 caracteres)",
            "clientProfile.passwordConfirmar": "Confirmar Nueva Contraseña",
            "clientProfile.muyDebil": "Muy débil",
            "clientProfile.btnCambiarPassword": "Cambiar Contraseña",

            // Cliente - Carrito
            "clientCart.tuCarrito": "Tu Carrito",
            "clientCart.subtitulo": "Reserva local en este dispositivo",
            "clientCart.confirmar": "Confirmar Reserva",
            "clientCart.vaciar": "Vaciar Carrito",
            "clientCart.vacioTitulo": "Tu carrito está vacío",
            "clientCart.vacioDesc": "Configura tu mesa desde el inicio para apartar tu velada.",
            "clientCart.crearReserva": "Crear una Reserva",
            "clientCart.modalTitulo": "Agrega platos a tu reserva",
            "clientCart.modalSubtitulo": "Elige de nuestra carta para tenerlos listos a tu llegada.",
            "clientCart.cargandoPlatos": "Cargando platos disponibles...",
            "clientCart.confirmarPlatos": "Confirmar Platos",

            // Cliente - Reserva
            "booking.heroTitulo1": "Reserva tu mesa",
            "booking.heroTitulo2": "en la historia",
            "booking.heroDesc": "Disfruta de una sinfonía de sabores creada por nuestros chefs expertos. Cada reserva es la promesa de una velada inolvidable.",
            "booking.solicitudBadge": "Solicitud de reserva",
            "booking.titulo": "Reservar",
            "booking.fechaLlegada": "Fecha de llegada",
            "booking.horaPreferida": "Hora preferida",
            "booking.invitados": "Invitados",
            "booking.seleccionaExp": "Selecciona tu Experiencia",
            "booking.salonPrincipal": "Salón Principal",
            "booking.vistaCiudad": "Vista a la Ciudad",
            "booking.privado": "Privado",
            "booking.elegirPlatos": "Elegir platos del menú",
            "booking.ningunPlato": "Ningún plato seleccionado",
            "booking.totalProductos": "Total en productos:",
            "booking.anticipoMesa": "Anticipo para apartar mesa:",
            "booking.anticipoNota": "* Se anticipa el 5% del valor de los platos seleccionados (tarifa mínima de $10.000 COP para reservar).",
            "booking.btnConfirmar": "CONFIRMAR RESERVA",
            "booking.vestimentaNota": "Se recomienda vestimenta formal. Tu reserva iniciará en estado Pendiente para su confirmación.",
            "booking.modalTitulo": "Agrega platos a tu reserva",
            "booking.guardarSeleccion": "Guardar selección",
            "menu.masInfo": "Más información",
            "common.noDisponible": "No disponible"
        },
        en: {
            // Admin Navbar & Sidebar
            "nav.brandTitle": "Admin Panel",
            "nav.brandSubtitle": "ADMINISTRATION CONSOLE",
            "nav.panel": "DASHBOARD",
            "nav.mesas": "MANAGE TABLES",
            "nav.reservas": "RESERVATIONS",
            "nav.usuarios": "MANAGE USERS",
            "nav.perfil": "MY PROFILE",
            "nav.menu": "MANAGE MENU",
            "nav.prediccion": "ML PREDICTION",
            "nav.verSitio": "View Site",
            "nav.cerrarSesion": "Log Out",
            "header.miPerfil": "My Profile",
            "header.abrirMenu": "Open Menu",

            // Cliente Sidebar
            "clientNav.brandTitle": "Client Panel",
            "clientNav.brandSubtitle": "RESERVATION MANAGEMENT",
            "clientNav.panel": "DASHBOARD",
            "clientNav.misReservas": "MY RESERVATIONS",
            "clientNav.calendario": "CALENDAR",
            "clientNav.reservarMesa": "BOOK A TABLE",
            "clientNav.miPerfil": "MY PROFILE",
            "clientNav.verMenu": "VIEW MENU",
            "clientNav.nuevaReserva": "+ NEW RESERVATION",
            "clientNav.soporte": "SUPPORT",

            // Common
            "common.anterior": "Previous",
            "common.siguiente": "Next",
            "common.mostrando": "Showing",
            "common.de": "of",
            "common.paginas": "pages",
            "common.usuarios": "users",
            "common.cancelar": "Cancel",
            "common.guardar": "Save",
            "common.acciones": "ACTIONS",
            "common.estado": "STATUS",
            "common.activo": "ACTIVE",
            "common.inactivo": "INACTIVE",
            "common.editar": "Edit",
            "common.eliminar": "Delete",
            "common.desactivar": "Deactivate",
            "common.reactivar": "Reactivate",
            "common.confirmada": "CONFIRMED",
            "common.pendiente": "PENDING",
            "common.llegada": "ARRIVED",
            "common.completada": "COMPLETED",
            "common.cancelada": "CANCELLED",
            "common.disponible": "AVAILABLE",
            "common.ocupada": "OCCUPIED",

            // Admin Dashboard
            "dash.titulo": "Reservation Log",
            "dash.subtitulo": "Monitor current reservations and guest logistics in real time.",
            "dash.ocupacion": "OCCUPANCY",
            "dash.totalHuespedes": "TOTAL GUESTS",
            "dash.registrados": "REGISTERED IN SYSTEM",
            "dash.espera": "WAITLIST / PENDING",
            "dash.enCola": "IN CONFIRMATION QUEUE",
            "dash.recientes": "Recent Reservations",
            "dash.buscarHuesped": "SEARCH A GUEST...",
            "dash.todosEstados": "All Statuses",
            "dash.thHuesped": "GUEST NAME",
            "dash.thFechaHora": "DATE & TIME",
            "dash.thPersonas": "NUMBER OF GUESTS",
            "dash.thMesa": "TABLE",
            "dash.thEstado": "STATUS",
            "dash.thAcciones": "ACTIONS",

            // Admin Tables
            "mesas.titulo": "Table Management",
            "mesas.subtitulo": "Organize your dining room floor plan. Adjust capacity and availability to orchestrate the evening flow.",
            "mesas.gestionar": "Manage Table",
            "mesas.numero": "TABLE NUMBER",
            "mesas.capacidad": "CAPACITY (GUESTS)",
            "mesas.sector": "SECTOR / LOCATION",
            "mesas.estandar": "Standard",
            "mesas.ventana": "Window",
            "mesas.alcoba": "Alcove",
            "mesas.disponibilidad": "Availability Status",
            "mesas.habilitar": "Enable for live reservations",
            "mesas.guardar": "SAVE TABLE",
            "mesas.limpiar": "CLEAR FORM",
            "mesas.registro": "Floor Registry",
            "mesas.activas": "ACTIVE:",
            "mesas.total": "TOTAL:",
            "mesas.buscar": "Search by number or sector...",

            // Admin Menu
            "menu.titulo": "Menu Management",
            "menu.subtitulo": "Manage your menu dishes and beverages.",
            "menu.anadir": "Add Dish",
            "menu.nombre": "DISH NAME",
            "menu.descripcion": "DESCRIPTION",
            "menu.categoria": "CATEGORY",
            "menu.precio": "PRICE (COP)",
            "menu.disponible": "AVAILABLE",
            "menu.destacado": "FEATURE ON HOME ⭐",
            "menu.quitarDestacado": "Remove from home featured",
            "menu.hacerDestacado": "Feature on home page",
            "menu.guardar": "ADD DISH",
            "menu.platos": "Menu Dishes",
            "menu.placeholderNombre": "e.g. Handmade pasta",
            "menu.placeholderDescripcion": "Describe ingredients and preparation...",
            "menu.seleccionarCategoria": "Select a category",
            "menu.catEntradas": "Appetizers",
            "menu.catPlatosFuertes": "Main Courses",
            "menu.catBebidas": "Beverages",
            "menu.catPostres": "Desserts",
            "menu.seleccionaArchivo": "Select a file:",
            "menu.guardarCambios": "SAVE CHANGES",
            "menu.limpiar": "CLEAR FORM",
            "menu.disponiblesBadge": "AVAILABLE:",
            "menu.totalBadge": "TOTAL:",
            "menu.buscarPlaceholder": "Search by name, description or price...",
            "menu.todasCategorias": "All Categories",
            "menu.cargando": "Loading menu dishes...",
            "menu.errorCargar": "Could not load menu dishes.",
            "menu.errorConexion": "Error connecting to menu service.",
            "menu.vacioFiltros": "No dishes to display with current filters.",
            "menu.sinDescripcion": "No description",
            "menu.sinCategoria": "No category",
            "menu.noEspecificado": "Not specified",
            "menu.platoSinNombre": "Unnamed dish",
            "menu.disponibleBadge": "AVAILABLE",
            "menu.noDisponibleBadge": "UNAVAILABLE",
            "menu.editarPlato": "Edit dish",
            "menu.eliminarPlato": "Delete dish",
            "menu.confirmarEliminar": "Are you sure you want to permanently delete this dish from the menu?",
            "menu.exitoAnadir": "Dish added successfully.",
            "menu.exitoActualizar": "Dish updated successfully.",
            "menu.errorEliminarServidor": "Could not delete dish on server.",
            "menu.errorEliminarRed": "Network error while deleting dish.",
            "menu.errorGuardarServidor": "Could not save dish. Check console.",
            "menu.errorGuardarRed": "Network error while saving dish.",
            "menu.errorDatosInvalidos": "Please complete dish data with valid values.",
            "menu.errorSeleccionarImagen": "Please select an image for the dish.",
            "menu.errorTipoImagen": "Please select a JPG, PNG or WebP image.",
            "menu.errorTamanoImagen": "Image must not exceed 5 MB.",
            "menu.errorNoEncontrado": "The dish you want to edit was not found.",
            "menu.paginacionInfo": "Showing {actual} of {total} pages",

            // Admin Users
            "user.titulo": "User Management",
            "user.subtitulo": "Manage accounts, assign roles, and activate or deactivate users while protecting restaurant history.",
            "user.btnNuevo": "New User",
            "user.kpiTotal": "TOTAL USERS",
            "user.kpiActivos": "ACTIVE ACCOUNTS",
            "user.kpiInactivos": "INACTIVE ACCOUNTS",
            "user.kpiAdmins": "ADMINISTRATORS",
            "user.kpiTotalDesc": "REGISTERED IN SYSTEM",
            "user.kpiActivosDesc": "SYSTEM ACCESS ENABLED",
            "user.kpiInactivosDesc": "DEACTIVATED (HISTORY PRESERVED)",
            "user.kpiAdminsDesc": "FULL MANAGEMENT PERMISSIONS",
            "user.buscarPlaceholder": "Search by name, last name, email or phone...",
            "user.todosRoles": "All roles",
            "user.rolClientes": "Clients",
            "user.rolAdmins": "Administrators",
                        "user.rolMeseros": "Waiters",
            "user.rolCliente": "CLIENT",
            "user.rolAdmin": "ADMINISTRATOR",
            "user.rolMesero": "WAITER",
            "user.todosEstados": "All statuses",
            "user.soloActivos": "Active only",
            "user.soloInactivos": "Deactivated only",
            "user.limpiarFiltros": "Clear filters",
            "user.thUsuario": "USER",
            "user.thCorreo": "EMAIL",
            "user.thRol": "ROLE",
            "user.thTelefono": "PHONE",
            "user.thEstado": "STATUS",
            "user.thAcciones": "ACTIONS",
            "user.modalCrearTitulo": "Register New User",
            "user.modalCrearDesc": "Create an account in the system with assigned role and credentials.",
            "user.modalEditarTitulo": "Edit User",
            "user.modalEditarDesc": "Modify account information, role or status.",
            "user.bannerProteccion": "History Protection: Deactivating an account restricts login access, but securely preserves all historic reservations in the database.",
            "user.nombre": "First Name *",
            "user.apellido": "Last Name *",
            "user.correo": "Email Address *",
            "user.password": "Initial Password *",
            "user.telefono": "Phone",
            "user.rol": "System Role *",
            "user.direccion": "Address",
            "user.estadoInicial": "Initial Status",
            "user.btnGuardar": "Save Changes",
            "user.btnCrear": "Create User",
            "user.desactivarTitulo": "Deactivate Account?",
            "user.reactivarTitulo": "Reactivate Account?",

            // Admin Prediction (ML & MongoDB)
            "prediction.titulo": "Reservations & Demand Prediction",
            "prediction.subtitulo": "Real-time predictive inference powered by Machine Learning and MongoDB Atlas data.",
            "prediction.fechaInicio": "START DATE",
            "prediction.fechaFin": "END DATE",
            "prediction.turno": "SHIFT / TIME SLOT",
            "prediction.turnoCompleto": "Full Day (11:00 - 22:00)",
            "prediction.turnoAlmuerzo": "Lunch (12:00 - 15:00)",
            "prediction.turnoCena": "Dinner (18:00 - 22:00)",
            "prediction.estadoEnVivo": "LIVE / CONNECTED",
            "prediction.estadoReconectando": "RECONNECTING...",
            "prediction.tooltipLive": "Active monitoring and streaming with MongoDB and FastAPI",
            "prediction.btnActualizar": "Update Prediction",
            "prediction.btnActualizando": "Updating...",
            "prediction.alertaSincronizando": "Synchronizing status and demand with predictive model...",
            "prediction.alertaOptima": "OPTIMAL CAPACITY: The restaurant has sufficient buffer for this shift.",
            "prediction.alertaAdvertencia": "HIGH DEMAND: Projected occupancy exceeds 75%. Prepare additional tables.",
            "prediction.alertaPeligro": "CAPACITY ALERT: Projected attendance exceeds operational limit. Enabling waitlist is suggested.",
            "prediction.kpiMesasPico": "TABLES TO PREPARE (PEAK)",
            "prediction.kpiHolgura": "+10% safety buffer applied",
            "prediction.kpiComensalesEst": "ESTIMATED DINERS",
            "prediction.kpiRealesEnBd": "Actual in DB: {count}",
            "prediction.kpiOcupacionProy": "PROJECTED OCCUPANCY",
            "prediction.kpiOcupacionRealActual": "Current actual occupancy: {percent}%",
            "prediction.kpiTotalReservas": "RESERVATIONS IN MONGODB",
            "prediction.kpiCapacidadMesas": "Capacity: {mesas} tables ({plazas} seats)",
            "prediction.chartDemandaTitulo": "Estimated Demand vs. Actual Reservations",
            "prediction.chartDemandaSubtitulo": "Time slot comparison based on ML model and MongoDB Atlas",
            "prediction.chartSerieEstimados": "Estimated Diners (ML)",
            "prediction.chartSerieReales": "Actual Diners (MongoDB)",
            "prediction.chartSerieMesas": "Suggested Tables",
            "prediction.chartEjeComensales": "Diners",
            "prediction.chartEjeMesas": "Tables",
            "prediction.chartCapacidadTitulo": "Restaurant Capacity",
            "prediction.chartCapacidadSubtitulo": "Projected seating vs. Maximum capacity",
            "prediction.chartDoughnutProyectada": "Projected Occupancy",
            "prediction.chartDoughnutDisponible": "Available Capacity",
            "prediction.tablaTitulo": "Breakdown by Time Slot",
            "prediction.thFecha": "DATE",
            "prediction.thHora": "TIME / SLOT",
            "prediction.thComensalesEst": "ESTIMATED DINERS (ML)",
            "prediction.thComensalesReales": "ACTUAL DINERS (DB)",
            "prediction.thReservasActivas": "ACTIVE RESERVATIONS",
            "prediction.thMesasSugeridas": "SUGGESTED TABLES",
            "prediction.thOcupacion": "% OCCUPANCY",
            "prediction.thEstadoCarga": "LOAD STATUS",
            "prediction.badgeOptimo": "Optimal",
            "prediction.badgeAltaDemanda": "High Demand",
            "prediction.badgeModerada": "Moderate",
            "prediction.tablaVacia": "No time slots found for selected filters.",
            "prediction.unidadComensales": "diners",
            "prediction.unidadMesas": "tables",
            "prediction.toastExito": "Prediction updated successfully. Data synchronized with database.",
            "prediction.toastError": "Could not update prediction. Please try again.",
            "prediction.toastConexion": "Could not connect to database. Check your connection and try again.",

            // Client - Dashboard
            "clientDash.bienvenido": "Welcome back,",
            "clientDash.subtitulo": "Your table awaits. Review your upcoming evenings or book a new special moment with us.",
            "clientDash.consultando": "Checking reservations...",
            "clientDash.proximasReservas": "UPCOMING RESERVATIONS",
            "clientDash.verListaCompleta": "VIEW FULL LIST",

            // Client - My Reservations
            "clientBookings.historialBadge": "Personal History",
            "clientBookings.titulo": "My Reservations",
            "clientBookings.thFecha": "DATE",
            "clientBookings.thHora": "TIME",
            "clientBookings.thInvitados": "GUESTS",
            "clientBookings.thExperiencia": "EXPERIENCE",
            "clientBookings.thPlatos": "PRE-ORDERED DISHES",
            "clientBookings.thEstado": "STATUS",
            "clientBookings.thAcciones": "ACTIONS",
            "clientBookings.consultando": "Consulting manuscript archives...",
            "clientBookings.modalMenuBadge": "Selected Menu",
            "clientBookings.modalPlatosTitulo": "Dishes in your Reservation",
            "clientBookings.totalProductos": "Total in products:",
            "clientBookings.anticipoReserva": "Reservation deposit (5%, min $10k):",
            "clientBookings.modalComentarioTitulo": "Write Chapter",
            "clientBookings.modalComentarioDesc": "Tell us about your culinary experience at this event.",
            "clientBookings.modalComentarioPlaceholder": "Write your review here...",
            "clientBookings.guardarComentario": "Save in Manuscript",

            // Client - Calendar
            "clientCalendar.badge": "Experience Schedule",
            "clientCalendar.titulo": "My Calendar",

            // Client - Profile
            "clientProfile.badge": "Account Settings",
            "clientProfile.titulo": "My Profile",
            "clientProfile.datosPersonales": "Personal Information",
            "clientProfile.nombre": "First Name",
            "clientProfile.tuNombre": "Your first name",
            "clientProfile.apellido": "Last Name",
            "clientProfile.tuApellido": "Your last name",
            "clientProfile.correo": "Email Address",
            "clientProfile.correoHint": "Email cannot be modified for security reasons.",
            "clientProfile.telefono": "Phone",
            "clientProfile.direccion": "Residential Address",
            "clientProfile.tuDireccion": "Your full address",
            "clientProfile.btnActualizar": "Update Information",
            "clientProfile.cambiarPassword": "Change Password",
            "clientProfile.passwordActual": "Current Password",
            "clientProfile.passwordNueva": "New Password (minimum 8 characters)",
            "clientProfile.passwordConfirmar": "Confirm New Password",
            "clientProfile.muyDebil": "Very weak",
            "clientProfile.btnCambiarPassword": "Change Password",

            // Client - Cart
            "clientCart.tuCarrito": "Your Cart",
            "clientCart.subtitulo": "Local reservation on this device",
            "clientCart.confirmar": "Confirm Reservation",
            "clientCart.vaciar": "Empty Cart",
            "clientCart.vacioTitulo": "Your cart is empty",
            "clientCart.vacioDesc": "Set up your table from the beginning to reserve your evening.",
            "clientCart.crearReserva": "Create a Reservation",
            "clientCart.modalTitulo": "Add dishes to your reservation",
            "clientCart.modalSubtitulo": "Choose from our menu to have them ready upon arrival.",
            "clientCart.cargandoPlatos": "Loading available dishes...",
            "clientCart.confirmarPlatos": "Confirm Dishes",

            // Client - Reservation
            "booking.heroTitulo1": "Reserve your table",
            "booking.heroTitulo2": "in history",
            "booking.heroDesc": "Enjoy a symphony of flavors crafted by our master chefs. Every reservation promises an unforgettable evening.",
            "booking.solicitudBadge": "Reservation Request",
            "booking.titulo": "Book a Table",
            "booking.fechaLlegada": "Arrival Date",
            "booking.horaPreferida": "Preferred Time",
            "booking.invitados": "Guests",
            "booking.seleccionaExp": "Select your Experience",
            "booking.salonPrincipal": "Main Dining Room",
            "booking.vistaCiudad": "City View",
            "booking.privado": "Private",
            "booking.elegirPlatos": "Choose dishes from menu",
            "booking.ningunPlato": "No dishes selected",
            "booking.totalProductos": "Total in products:",
            "booking.anticipoMesa": "Deposit to hold table:",
            "booking.anticipoNota": "* A 5% deposit of selected dishes is required (minimum rate of $10,000 COP to reserve).",
            "booking.btnConfirmar": "CONFIRM RESERVATION",
            "booking.vestimentaNota": "Formal attire recommended. Your reservation will start in Pending status for confirmation.",
            "booking.modalTitulo": "Add dishes to your reservation",
            "booking.guardarSeleccion": "Save selection",
            "menu.masInfo": "More info",
            "common.noDisponible": "Unavailable"
        }
    };

    // ===== 2. DICCIONARIO BIDIRECCIONAL COMPLETO PARA TEXTO EN PANTALLA =====
    const PHRASES_ES_TO_EN = {
        // --- Admin Sidebar & Headers ---
        "Panel Administrador": "Admin Panel",
        "CONSOLA DE ADMINISTRACIÓN": "ADMINISTRATION CONSOLE",
        "PANEL": "DASHBOARD",
        "GESTIONAR MESAS": "MANAGE TABLES",
        "RESERVAS": "RESERVATIONS",
        "GESTIONAR USUARIOS": "MANAGE USERS",
        "MI PERFIL": "MY PROFILE",
        "Mi Perfil": "My Profile",
        "GESTIONAR MENÚ": "MANAGE MENU",
        "Ver Sitio": "View Site",
        "VER SITIO": "VIEW SITE",
        "Cerrar Sesión": "Log Out",
        "CERRAR SESIÓN": "LOG OUT",

        // --- Predicción ML ---
        "Predicción de Reservas y Demanda": "Reservations & Demand Prediction",
        "Inferencia predictiva en tiempo real impulsada por Machine Learning y datos de MongoDB Atlas.": "Real-time predictive inference powered by Machine Learning and MongoDB Atlas data.",
        "FECHA INICIO": "START DATE",
        "FECHA FIN": "END DATE",
        "TURNO / FRANJA": "SHIFT / TIME SLOT",
        "Día Completo (11:00 - 22:00)": "Full Day (11:00 - 22:00)",
        "Almuerzo (12:00 - 15:00)": "Lunch (12:00 - 15:00)",
        "Cena (18:00 - 22:00)": "Dinner (18:00 - 22:00)",
        "EN VIVO / CONECTADO": "LIVE / CONNECTED",
        "Actualizar Predicción": "Update Prediction",
        "MESAS A PREPARAR (PICO)": "TABLES TO PREPARE (PEAK)",
        "Holgura de seguridad +10% aplicada": "+10% safety buffer applied",
        "COMENSALES ESTIMADOS": "ESTIMATED DINERS",
        "OCUPACIÓN PROYECTADA": "PROJECTED OCCUPANCY",
        "RESERVAS EN MONGODB": "RESERVATIONS IN MONGODB",
        "Demanda Estimada vs. Reservas Reales": "Estimated Demand vs. Actual Reservations",
        "Comparación por franja horaria en base al modelo ML y MongoDB Atlas": "Time slot comparison based on ML model and MongoDB Atlas",
        "Capacidad del Restaurante": "Restaurant Capacity",
        "Proyección de aforo vs. Capacidad máxima": "Projected seating vs. Maximum capacity",
        "Desglose por Franja Horaria": "Breakdown by Time Slot",
        "HORA / FRANJA": "TIME / SLOT",
        "COMENSALES ESTIMADOS (ML)": "ESTIMATED DINERS (ML)",
        "COMENSALES REALES (BD)": "ACTUAL DINERS (DB)",
        "RESERVAS ACTIVAS": "ACTIVE RESERVATIONS",
        "MESAS SUGERIDAS": "SUGGESTED TABLES",
        "% OCUPACIÓN": "% OCCUPANCY",
        "ESTADO CARGA": "LOAD STATUS",
        "Alta Demanda": "High Demand",
        "Colapsar / Expandir menú": "Collapse / Expand menu",

        // --- Client Portal Phrases ---
        "TU PRÓXIMA VELADA": "YOUR UPCOMING EVENING",
        "Tu mesa está apartada en el Manuscrito Culinario. Prepárate para disfrutar de una velada gastronómica memorable.": "Your table is reserved at Manuscrito Culinario. Get ready to enjoy a memorable dining experience.",
        "No tienes más reservas programadas próximamente. Puedes ver tu historial de visitas pasadas en": "You have no more upcoming reservations scheduled. You can view your past visit history in",
        "No tienes más reservas programadas próximamente. Puedes ver tu historial de visitas pasadas en Mis Reservas.": "You have no more upcoming reservations scheduled. You can view your past visit history in My Reservations.",
        "No hay más reservas futuras. Consulta tu historial de visitas pasadas en Mis Reservas.": "No more upcoming reservations. Check your past visit history in My Reservations.",
        "No tienes reservas programadas próximamente": "You have no upcoming reservations scheduled",
        "Tu mesa te espera. Puedes reservar tu próxima velada gastronómica o consultar tus visitas anteriores en tu historial.": "Your table awaits. You can book your next culinary evening or check past visits in your history.",
        "Reservar Ahora": "Book Now",
        "Mesa reservada •": "Reserved table •",
        "Salón Principal (Estándar)": "Main Dining Room (Standard)",
        "Vista a la Ciudad (Ventana)": "City View (Window)",
        "Zona Privada (Alcoba)": "Private Area (Alcove)",
        "Mesa Estándar": "Standard Table",
        "Mesa Ventana": "Window Table",
        "Mesa Alcoba": "Alcove Table",
        "Mesa-Estandar": "Standard Table",
        "Mesa-Ventana": "Window Table",
        "Mesa-Alcoba": "Alcove Table",
        "Excelente": "Excellent",
        "Regular": "Regular",
        "Buena": "Good",
        "Estandar": "Standard",
        "Sin platos (Mesa base $10k)": "No dishes (Base table $10k)",
        "Sin platos (Mesa base 10k)": "No dishes (Base table 10k)",
        "Total en productos:": "Total in products:",
        "Anticipo de reserva (5%, mín $10k):": "Reservation deposit (5%, min $10k):",
        "Anticipo para apartar mesa:": "Deposit to hold table:",
        "Escribir Capítulo": "Write Chapter",
        "Cuéntanos tu experiencia culinaria en este evento.": "Tell us about your culinary experience at this event.",
        "Escribe tu reseña aquí...": "Write your review here...",
        "Guardar en Manuscrito": "Save in Manuscript",
        "Aún no has escrito capítulos en tu historia culinaria.": "You haven't written chapters in your culinary story yet.",
        "Ver platos seleccionados": "View selected dishes",
        "Dejar Comentario": "Leave Comment",
        "Confirmar esta reserva": "Confirm this reservation",
        "Cancelar Reserva": "Cancel Reservation",
        "Confirmar": "Confirm",
        "Tu Carrito": "Your Cart",
        "Reserva local en este dispositivo": "Local reservation on this device",
        "Confirmar Reserva": "Confirm Reservation",
        "CONFIRMAR RESERVA": "CONFIRM RESERVATION",
        "Vaciar Carrito": "Empty Cart",
        "Tu carrito está vacío": "Your cart is empty",
        "Configura tu mesa desde el inicio para apartar tu velada.": "Set up your table from the beginning to reserve your evening.",
        "Crear una Reserva": "Create a Reservation",
        "Mesa Base (Sin platos preordenados)": "Base Table (No pre-ordered dishes)",
        "Elegir platos del menú": "Choose dishes from menu",
        "Ningún plato seleccionado": "No dishes selected",
        "* Se anticipa el 5% del valor de los platos seleccionados (tarifa mínima de $10.000 COP para reservar).": "* A 5% deposit of selected dishes is required (minimum rate of $10,000 COP to reserve).",
        "Se recomienda vestimenta formal. Tu reserva iniciará en estado Pendiente para su confirmación.": "Formal attire recommended. Your reservation will start in Pending status for confirmation.",
        "Agrega platos a tu reserva": "Add dishes to your reservation",
        "Elige de nuestra carta para tenerlos listos a tu llegada.": "Choose from our menu to have them ready upon arrival.",
        "Cargando platos disponibles...": "Loading available dishes...",
        "Confirmar Platos": "Confirm Dishes",
        "Guardar selección": "Save selection",
        "Reserva tu mesa en la historia": "Reserve your table in history",
        "Disfruta de una sinfonía de sabores creada por nuestros chefs expertos. Cada reserva es la promesa de una velada inolvidable.": "Enjoy a symphony of flavors crafted by our master chefs. Every reservation promises an unforgettable evening.",
        "Solicitud de reserva": "Reservation Request",
        "Fecha de llegada": "Arrival Date",
        "Hora preferida": "Preferred Time",
        "Invitados": "Guests",
        "Selecciona tu Experiencia": "Select your Experience",
        "Salón Principal": "Main Dining Room",
        "Vista a la Ciudad": "City View",
        "Seguridad: Débil (mínimo 8 caracteres, números y letras)": "Security: Weak (minimum 8 characters, letters and numbers)",
        "Seguridad: Aceptable (puedes agregar símbolos para mayor protección)": "Security: Fair (you can add symbols for stronger protection)",
        "Seguridad: Fuerte y Segura ✨": "Security: Strong and Secure ✨",

        // --- Client Sidebar & Headers ---
        "Panel Cliente": "Client Panel",
        "GESTIÓN DE RESERVAS": "RESERVATION MANAGEMENT",
        "MIS RESERVAS": "MY RESERVATIONS",
        "CALENDARIO": "CALENDAR",
        "RESERVAR MESA": "BOOK A TABLE",
        "VER MENÚ": "VIEW MENU",
        "+ NUEVA RESERVA": "+ NEW RESERVATION",
        "NUEVA RESERVA": "NEW RESERVATION",
        "SOPORTE": "SUPPORT",

        // --- Admin: Mesas ---
        "Configuración de Mesas": "Table Management",
        "Organiza el diseño de tu piso de comedor. Ajusta la capacidad y disponibilidad para orquestar el flujo de la noche.":
            "Organize your dining room floor plan. Adjust capacity and availability to orchestrate the evening flow.",
        "Gestionar Mesa": "Manage Table",
        "NÚMERO DE MESA": "TABLE NUMBER",
        "CAPACIDAD (PERSONAS)": "CAPACITY (GUESTS)",
        "SECTOR / UBICACIÓN": "SECTOR / LOCATION",
        "Estándar": "Standard",
        "Ventana": "Window",
        "Alcoba": "Alcove",
        "Main Hall": "Main Hall",
        "City Views": "City Views",
        "Privado": "Private",
        "Comedor Principal": "Main Dining Room",
        "Estado de Disponibilidad": "Availability Status",
        "Habilitar para reservas en vivo": "Enable for live reservations",
        "GUARDAR MESA": "SAVE TABLE",
        "LIMPIAR FORMULARIO": "CLEAR FORM",
        "El Piso del Manuscrito": "The Manuscript Floor",
        "Colocación estratégica de huéspedes": "Strategic guest placement",
        "Registro del Piso": "Floor Registry",
        "Buscar por número o sector...": "Search by number or sector...",
        "Cargando mesas del restaurante en vivo...": "Loading restaurant tables live...",
        "No hay mesas registradas en la base de datos.": "No tables registered in the database.",
        "No hay mesas para mostrar.": "No tables to display.",
        "Editar Mesa": "Edit Table",
        "Eliminar Mesa": "Delete Table",

        // --- Admin: Menú ---
        "Gestión del Menú": "Menu Management",
        "Administra los platos y bebidas de tu menú.": "Manage your menu dishes and beverages.",
        "Añadir plato": "Add Dish",
        "NOMBRE DEL PLATO": "DISH NAME",
        "DESCRIPCIÓN": "DESCRIPTION",
        "CATEGORÍA": "CATEGORY",
        "Selecciona una categoría": "Select a category",
        "Entradas": "Appetizers",
        "Platos Fuertes": "Main Dishes",
        "Bebidas": "Beverages",
        "Postres": "Desserts",
        "PRECIO (COP)": "PRICE (COP)",
        "Selecciona un archivo:": "Select a file:",
        "DISPONIBLE": "AVAILABLE",
        "NO DISPONIBLE": "UNAVAILABLE",
        "AÑADIR PLATO": "ADD DISH",
        "Platos del menú": "Menu Dishes",
        "Buscar por nombre, descripción o categoría...": "Search by name, description or category...",
        "Todos": "All",
        "Editar plato": "Edit dish",
        "Eliminar plato": "Delete dish",
        "Ej. Pasta artesanal": "e.g. Handmade pasta",
        "Describe los ingredientes y preparación...": "Describe ingredients and preparation...",
        "Buscar por nombre, descripción o precio...": "Search by name, description or price...",
        "BUSCAR POR NOMBRE, DESCRIPCIÓN O PRECIO...": "SEARCH BY NAME, DESCRIPTION OR PRICE...",
        "Todas las categorías": "All Categories",
        "DISPONIBLES:": "AVAILABLE:",
        "DISPONIBLES": "AVAILABLE",
        "ACTIVAS:": "ACTIVE:",
        "ACTIVAS": "ACTIVE",
        "TOTAL:": "TOTAL:",
        "ENTRADAS": "APPETIZERS",
        "PLATOS FUERTES": "MAIN COURSES",
        "BEBIDAS": "BEVERAGES",
        "POSTRES": "DESSERTS",
        "GUARDAR CAMBIOS": "SAVE CHANGES",
        "LIMPIAR FORMULARIO": "CLEAR FORM",

        // --- Admin: Reservas ---
        "Histórico de Reservas": "Reservation History",
        "Todas las Reservas": "All Reservations",
        "Vista completa de todas las reservas y citas del restaurante.": "Complete view of all restaurant reservations and appointments.",
        "Buscar por huésped, mesa o fecha...": "Search by guest, table or date...",
        "Todos los Estados": "All Statuses",
        "Confirmada": "Confirmed",
        "Pendiente": "Pending",
        "Llegada": "Arrived",
        "Completada": "Completed",
        "Cancelada": "Cancelled",
        "CONFIRMADA": "CONFIRMED",
        "PENDIENTE": "PENDING",
        "LLEGADA": "ARRIVED",
        "COMPLETADA": "COMPLETED",
        "CANCELADA": "CANCELLED",
        "HUÉSPED": "GUEST",
        "FECHA Y HORA": "DATE & TIME",
        "PERSONAS": "GUESTS",
        "MESA": "TABLE",
        "ESTADO": "STATUS",
        "EXPERIENCIA": "EXPERIENCE",
        "ACCIONES": "ACTIONS",
        "Anterior": "Previous",
        "Siguiente": "Next",
        "Mostrando": "Showing",
        "de": "of",
        "páginas": "pages",

        // --- Admin: Dashboard ---
        "Registro de Reservas": "Reservation Log",
        "Supervisa las reservas actuales y la logística de huéspedes en tiempo real.": "Monitor current reservations and guest logistics in real time.",
        "OCUPACIÓN": "OCCUPANCY",
        "TOTAL DE HUÉSPEDES": "TOTAL GUESTS",
        "REGISTRADOS EN SISTEMA": "REGISTERED IN SYSTEM",
        "LISTA DE ESPERA / PENDIENTES": "WAITLIST / PENDING",
        "EN COLA DE CONFIRMACIÓN": "IN CONFIRMATION QUEUE",
        "Reservas Recientes": "Recent Reservations",
        "BUSCAR UN HUÉSPED...": "SEARCH A GUEST...",
        "NOMBRE DEL HUÉSPED": "GUEST NAME",
        "NÚMERO DE PERSONAS": "NUMBER OF GUESTS",
        "Actualizar": "Update",

        // --- Admin: Usuarios ---
        "Gestión de Usuarios": "User Management",
        "Administra cuentas, asigna roles de acceso y activa o desactiva usuarios protegiendo el historial del restaurante.":
            "Manage accounts, assign roles, and activate or deactivate users while protecting restaurant history.",
        "Nuevo Usuario": "New User",
        "TOTAL USUARIOS": "TOTAL USERS",
        "CUENTAS ACTIVAS": "ACTIVE ACCOUNTS",
        "CUENTAS INACTIVAS": "INACTIVE ACCOUNTS",
        "ADMINISTRADORES": "ADMINISTRATORS",
        "ACCESO AL SISTEMA HABILITADO": "SYSTEM ACCESS ENABLED",
        "DESACTIVADAS (HISTORIAL PRESERVADO)": "DEACTIVATED (HISTORY PRESERVED)",
        "PERMISOS DE GESTIÓN TOTAL": "FULL MANAGEMENT PERMISSIONS",
        "Buscar por nombre, apellido, correo o teléfono...": "Search by name, last name, email or phone...",
        "Todos los roles": "All roles",
        "Clientes": "Clients",
        "Administradores": "Administrators",
        "Meseros": "Waiters",
        "Todos los estados": "All statuses",
        "Solo Activos": "Active only",
        "Solo Desactivados": "Deactivated only",
        "Limpiar filtros": "Clear filters",
        "USUARIO": "USER",
        "CORREO ELECTRÓNICO": "EMAIL",
        "ROL": "ROLE",
        "TELÉFONO": "PHONE",
        "ACTIVO": "ACTIVE",
        "INACTIVO": "INACTIVE",
        "Activo": "Active",
        "Inactivo": "Inactive",
        "Activa": "Active",
        "Desactivada": "Deactivated",
        "Editar": "Edit",
        "Desactivar": "Deactivate",
        "Reactivar": "Reactivate",
        "Registrar Nuevo Usuario": "Register New User",
        "Crea una cuenta en el sistema con rol y credenciales asignadas.": "Create an account in the system with assigned role and credentials.",
        "Editar Usuario": "Edit User",
        "Modifica la información, rol o estado de la cuenta.": "Modify account information, role or status.",
        "Nombre": "First Name",
        "Apellido": "Last Name",
        "Correo Electrónico": "Email Address",
        "Contraseña Inicial": "Initial Password",
        "Teléfono": "Phone",
        "Rol en el Sistema": "System Role",
        "Rol de Usuario": "User Role",
        "Dirección": "Address",
        "Dirección de Residencia": "Residential Address",
        "Estado Inicial": "Initial Status",
        "Estado de la Cuenta": "Account Status",
        "Guardar Cambios": "Save Changes",
        "Crear Usuario": "Create User",
        "Cancelar": "Cancel",
        "¿Desactivar Cuenta?": "Deactivate Account?",
        "¿Reactivar Cuenta?": "Reactivate Account?",

        // --- Admin: Perfil ---
        "Gestiona tu información personal y seguridad de cuenta.": "Manage your personal information and account security.",
        "Datos Personales": "Personal Information",
        "El correo no puede modificarse por seguridad": "Email cannot be modified for security reasons",
        "El correo no puede modificarse por seguridad.": "Email cannot be modified for security reasons.",
        "Tu dirección completa": "Your full address",
        "Seguridad de la Cuenta": "Account Security",
        "Cambiar Contraseña": "Change Password",
        "Contraseña Actual": "Current Password",
        "Nueva Contraseña": "New Password",
        "Confirmar Nueva Contraseña": "Confirm New Password",
        "Guardar Información": "Save Information",
        "Actualizar Contraseña": "Update Password",

        // --- Cliente: Dashboard & Pages ---
        "Bienvenido de nuevo,": "Welcome back,",
        "Bienvenido de nuevo": "Welcome back",
        "Tu mesa te espera. Revisa tus próximas veladas o reserva un nuevo momento especial con nosotros.":
            "Your table awaits. Review your upcoming evenings or book a new special moment with us.",
        "Nueva Reserva": "New Reservation",
        "+ Nueva Reserva": "+ New Reservation",
        "Consultando reservas...": "Checking reservations...",
        "PRÓXIMAS RESERVAS": "UPCOMING RESERVATIONS",
        "VER LISTA COMPLETA": "VIEW FULL LIST",
        "Gastronomía Premium": "Premium Gastronomy",
        "Menú del Manuscrito": "The Manuscript Menu",
        "El Menú del Manuscrito": "The Manuscript Menu",
        "Más información": "More info",
        "Solicitud de reserva": "Reservation Request",
        "Reservar": "Book Now",
        "Reserva tu mesa en la historia": "Reserve your table in history",
        "Fecha de llegada": "Arrival Date",
        "Hora preferida": "Preferred Time",
        "Invitados": "Guests",
        "INVITADOS": "GUESTS",
        "FECHA": "DATE",
        "HORA": "TIME",
        "PLATOS PREORDENADOS": "PRE-ORDERED DISHES",
        "Selecciona tu Experiencia": "Select your Experience",
        "Salón Principal": "Main Hall",
        "Historial Personal": "Personal History",
        "Mis Reservas": "My Reservations",
        "Agenda de Experiencias": "Experience Schedule",
        "Mi Calendario": "My Calendar",
        "Configuración de Cuenta": "Account Settings",
        "Platos de tu Reserva": "Dishes in your Reservation",
        "Menú Seleccionado": "Selected Menu",
        "Consultando los archivos del manuscrito...": "Consulting manuscript archives...",

        // --- Botones Generales y Alertas ---
        "OCUPADA": "OCCUPIED",
        "personas": "guests",
        "Cargando...": "Loading...",
        "Guardar": "Save",
        "Cerrar": "Close",

        // --- Admin: Reservas & Mesas extra ---
        "Todas las Reservas": "All Reservations",
        "Vista completa de todas las reservas y citas del restaurante.": "Complete view of all restaurant reservations and appointments.",
        "Buscar por huésped, mesa o fecha...": "Search by guest, table or date...",
        "Editar Estado de la Reserva": "Edit Reservation Status",
        "Estado de la Reserva": "Reservation Status",
        "Cena Carta": "A la Carte Dinner",
        "Mesa asignada": "Assigned Table",
        "Sin asignar": "Unassigned",
        "Eliminar Reserva": "Delete Reservation",
        "Editar Estado": "Edit Status",
        "Cargando histórico de reservas desde el manuscrito en vivo...": "Loading live reservation history...",
        "No hay reservas registradas en el sistema.": "No reservations registered in the system.",
        "No se encontraron reservas con ese criterio.": "No reservations found matching that criteria.",

        // --- Admin: Usuarios extra ---
        "CLIENTE": "CLIENT",
        "MESERO": "WAITER",
        "Sin correo registrado": "No email registered",
        "No registrado": "Not registered",
        "No se encontraron usuarios coincidentes con los criterios de búsqueda.": "No matching users found.",
        "No se encontraron usuarios en la base de datos.": "No users found in database.",

        // --- Admin: Menú extra ---
        "Cargando platos del menú...": "Loading menu dishes...",
        "No hay platos para mostrar con los filtros actuales.": "No dishes to display with current filters.",
        "No hay platos registrados en el menú.": "No dishes registered in the menu.",
        "Sin descripción": "No description",
        "Sin categoría": "No category",
        "No especificado": "Not specified",
        "Plato sin nombre": "Unnamed dish",

        // --- Admin: Perfil extra ---
        "MI PERFIL": "MY PROFILE",
        "Datos Personales": "Personal Information",
        "Cambiar Contraseña": "Change Password",
        "Actualizar Datos": "Update Information",
        "Dirección de Residencia": "Residential Address",
        "Tu nombre": "Your first name",
        "Tu apellido": "Your last name",
        "Tu dirección completa": "Your full address"
    };

    // Crear el diccionario inverso (EN -> ES) automáticamente
    const PHRASES_EN_TO_ES = {};
    for (let es in PHRASES_ES_TO_EN) {
        let en = PHRASES_ES_TO_EN[es];
        PHRASES_EN_TO_ES[en] = es;
    }

    // Patrones dinámicos regex
    const PATTERNS_ES_TO_EN = [
        { regex: /^Mesa\s+(\S+)$/i, repl: "Table $1" },
        { regex: /^🍽️\s*(\d+)\s+platos?$/i, repl: function (m, p1) { return "🍽️ " + p1 + (parseInt(p1, 10) === 1 ? " dish" : " dishes"); } },
        { regex: /^🍽️\s*(\d+)\s+platos?\s*\((.+)\)$/i, repl: function (m, p1, p2) { return "🍽️ " + p1 + (parseInt(p1, 10) === 1 ? " dish" : " dishes") + " (" + p2 + ")"; } },
        { regex: /^Sin platos\s*\((.+)\)$/i, repl: function (m, p1) { return "No dishes (" + p1 + ")"; } },
        { regex: /^Pendiente\s*\((.+)\)$/i, repl: function (m, p1) { return "Pending (" + p1 + ")"; } },
        { regex: /^Anticipo requerido:\s*(.+)$/i, repl: function (m, p1) { return "Required deposit: " + p1; } },
        { regex: /^Mesa reservada\s*•\s*(.+)$/i, repl: function (m, p1) { return "Reserved table • " + p1; } },
        { regex: /^(\d+)\s+personas?$/i, repl: "$1 guests" },
        { regex: /^ACTIVAS:\s*(\d+)$/i, repl: "ACTIVE: $1" },
        { regex: /^TOTAL:\s*(\d+)$/i, repl: "TOTAL: $1" },
        { regex: /^DISPONIBLES:\s*(\d+)$/i, repl: "AVAILABLE: $1" },
        { regex: /^Mostrando\s+(\d+)\s+de\s+(\d+)\s+páginas$/i, repl: "Showing $1 of $2 pages" },
        { regex: /^Mostrando\s+(\d+)\s+a\s+(\d+)\s+de\s+(\d+)\s+usuarios$/i, repl: "Showing $1 to $2 of $3 users" },
        { regex: /^(\w+)\s*·\s*(\d+)\s*personas?$/i, repl: function (m, p1, p2) {
            let sector = PHRASES_ES_TO_EN[p1] || p1;
            return sector + " · " + p2 + " guests";
        }}
    ];

    const PATTERNS_EN_TO_ES = [
        { regex: /^Table\s+(\S+)$/i, repl: "Mesa $1" },
        { regex: /^🍽️\s*(\d+)\s+dish(?:es)?$/i, repl: function (m, p1) { return "🍽️ " + p1 + (parseInt(p1, 10) === 1 ? " plato" : " platos"); } },
        { regex: /^🍽️\s*(\d+)\s+dish(?:es)?\s*\((.+)\)$/i, repl: function (m, p1, p2) { return "🍽️ " + p1 + (parseInt(p1, 10) === 1 ? " plato" : " platos") + " (" + p2 + ")"; } },
        { regex: /^No dishes\s*\((.+)\)$/i, repl: function (m, p1) { return "Sin platos (" + p1 + ")"; } },
        { regex: /^Pending\s*\((.+)\)$/i, repl: function (m, p1) { return "Pendiente (" + p1 + ")"; } },
        { regex: /^Required deposit:\s*(.+)$/i, repl: function (m, p1) { return "Anticipo requerido: " + p1; } },
        { regex: /^Reserved table\s*•\s*(.+)$/i, repl: function (m, p1) { return "Mesa reservada • " + p1; } },
        { regex: /^(\d+)\s+guests?$/i, repl: "$1 personas" },
        { regex: /^ACTIVE:\s*(\d+)$/i, repl: "ACTIVAS: $1" },
        { regex: /^TOTAL:\s*(\d+)$/i, repl: "TOTAL: $1" },
        { regex: /^AVAILABLE:\s*(\d+)$/i, repl: "DISPONIBLES: $1" },
        { regex: /^Showing\s+(\d+)\s+of\s+(\d+)\s+pages$/i, repl: "Mostrando $1 de $2 páginas" },
        { regex: /^Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+users$/i, repl: "Mostrando $1 a $2 de $3 usuarios" },
        { regex: /^(\w+)\s*·\s*(\d+)\s*guests?$/i, repl: function (m, p1, p2) {
            let sector = PHRASES_EN_TO_ES[p1] || p1;
            return sector + " · " + p2 + " personas";
        }}
    ];

    // ===== 3. OBTENER / CAMBIAR IDIOMA =====
    function obtenerIdioma() {
        return localStorage.getItem("adminIdioma") || localStorage.getItem("appIdioma") || "es";
    }

    function cambiarIdioma(nuevoIdioma) {
        if (nuevoIdioma !== "es" && nuevoIdioma !== "en") {
            nuevoIdioma = "es";
        }

        localStorage.setItem("adminIdioma", nuevoIdioma);
        localStorage.setItem("appIdioma", nuevoIdioma);

        actualizarSelectorUI(nuevoIdioma);
        aplicarTraducciones(nuevoIdioma);

        // Notificar a componentes dinámicos
        try {
            window.dispatchEvent(new CustomEvent("idiomaCambiado", { detail: nuevoIdioma }));
        } catch (e) {}

        // Sincronizar scripts si están presentes
        if (typeof window.renderizarTablaUsuarios === "function") {
            window.renderizarTablaUsuarios();
        }
        if (typeof window.cargarReservasRecientes === "function") {
            window.cargarReservasRecientes();
        }
        if (typeof window.cargarMesas === "function" && window.todasLasMesas) {
            window.renderizarListaMesas && window.renderizarListaMesas(window.todasLasMesas);
        }
        if (typeof window.renderizarTablaReservasTodas === "function") {
            window.renderizarTablaReservasTodas();
        }
        if (typeof window.renderizarPlatos === "function") {
            window.renderizarPlatos();
        }
        if (typeof window.reaplicarIdiomaPrediccion === "function") {
            window.reaplicarIdiomaPrediccion();
        }
    }

    // ===== 4. TRADUCCIÓN PROFUNDA DEL DOM =====
    function traducirTexto(texto, idioma) {
        if (!texto) return texto;
        let limpio = texto.trim();
        if (!limpio) return texto;

        if (idioma === "en") {
            // Diccionario exacto
            if (PHRASES_ES_TO_EN[limpio]) {
                return texto.replace(limpio, PHRASES_ES_TO_EN[limpio]);
            }
            // Patrones dinámicos
            for (let i = 0; i < PATTERNS_ES_TO_EN.length; i++) {
                let p = PATTERNS_ES_TO_EN[i];
                if (p.regex.test(limpio)) {
                    let trans = typeof p.repl === "function" ? limpio.replace(p.regex, p.repl) : limpio.replace(p.regex, p.repl);
                    return texto.replace(limpio, trans);
                }
            }
        } else {
            // Regresar a español
            if (PHRASES_EN_TO_ES[limpio]) {
                return texto.replace(limpio, PHRASES_EN_TO_ES[limpio]);
            }
            for (let i = 0; i < PATTERNS_EN_TO_ES.length; i++) {
                let p = PATTERNS_EN_TO_ES[i];
                if (p.regex.test(limpio)) {
                    let trans = typeof p.repl === "function" ? limpio.replace(p.regex, p.repl) : limpio.replace(p.regex, p.repl);
                    return texto.replace(limpio, trans);
                }
            }
        }

        return texto;
    }

    function procesarNodo(node, idioma) {
        if (!node) return;

        // Omitir etiquetas técnicas
        if (node.nodeType === Node.ELEMENT_NODE) {
            let tag = node.tagName.toUpperCase();
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "CODE" || tag === "PRE") {
                return;
            }
            if (node.classList && (node.classList.contains("notranslate") || node.classList.contains("lang-menu") || node.classList.contains("lang-selector-dropdown") || node.classList.contains("lang-btn") || node.classList.contains("material-symbols-outlined") || node.classList.contains("action-icon") || node.id === "adminLangSelector" || node.id === "clienteLangSelector")) {
                return;
            }

            // Traducir data-i18n
            let key = node.getAttribute("data-i18n");
            if (key) {
                let dict = I18N_KEYS[idioma] || I18N_KEYS.es;
                if (dict[key]) {
                    node.textContent = dict[key];
                    return;
                }
            }

            // Traducir atributos
            let placeholderKey = node.getAttribute("data-i18n-placeholder");
            if (placeholderKey) {
                let dict = I18N_KEYS[idioma] || I18N_KEYS.es;
                if (dict[placeholderKey]) {
                    node.setAttribute("placeholder", dict[placeholderKey]);
                }
            } else {
                let placeholder = node.getAttribute("placeholder");
                if (placeholder) {
                    if (idioma === "en") {
                        if (!node._origPlaceholder) node._origPlaceholder = placeholder;
                        node.setAttribute("placeholder", traducirTexto(placeholder, "en"));
                    } else if (node._origPlaceholder) {
                        node.setAttribute("placeholder", node._origPlaceholder);
                    }
                }
            }

            let title = node.getAttribute("title");
            if (title) {
                if (idioma === "en") {
                    if (!node._origTitle) node._origTitle = title;
                    node.setAttribute("title", traducirTexto(title, "en"));
                } else if (node._origTitle) {
                    node.setAttribute("title", node._origTitle);
                }
            }

            // Traducir select options
            if (tag === "OPTION") {
                if (idioma === "en") {
                    if (!node._origText) node._origText = node.text;
                    node.text = traducirTexto(node.text, "en");
                } else if (node._origText) {
                    node.text = node._origText;
                }
            }
        }

        // Traducir nodos de texto
        if (node.nodeType === Node.TEXT_NODE) {
            let valor = node.nodeValue;
            if (valor && valor.trim().length > 0) {
                if (idioma === "en") {
                    if (node._origText === undefined) {
                        node._origText = valor;
                    }
                    let nuevo = traducirTexto(node._origText, "en");
                    if (nuevo !== valor) {
                        node.nodeValue = nuevo;
                    }
                } else {
                    if (node._origText !== undefined) {
                        node.nodeValue = node._origText;
                    } else {
                        let nuevo = traducirTexto(valor, "es");
                        if (nuevo !== valor) node.nodeValue = nuevo;
                    }
                }
            }
            return;
        }

        // Recorrer hijos
        let children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
            procesarNodo(children[i], idioma);
        }
    }

    let isObserving = false;
    let observer = null;
    let haSidoTraducido = false;

    function aplicarTraducciones(idioma) {
        if (!document.body) return;

        // Si el idioma es español y la página nunca fue traducida a inglés,
        // el HTML ya viene en su español nativo del backend.
        // Evitamos recorrer o mutar el DOM en la carga inicial para prevenir parpadeos o distorsiones.
        if (idioma === "es" && !haSidoTraducido) {
            return;
        }
        if (idioma === "en") {
            haSidoTraducido = true;
        }

        // Desactivar temporalmente el observer para evitar loops
        if (observer) {
            observer.disconnect();
            isObserving = false;
        }

        procesarNodo(document.body, idioma);

        // Reactivar observer para contenido inyectado por fetch solo en inglés
        if (idioma === "en") {
            iniciarObservador();
        }
    }

    function iniciarObservador() {
        if (isObserving || !window.MutationObserver || !document.body) return;

        observer = new MutationObserver(function (mutations) {
            let lang = obtenerIdioma();
            if (lang !== "en") return;

            // Desconectar para no auto-disparar
            observer.disconnect();

            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (n) {
                    procesarNodo(n, "en");
                });
            });

            // Reconectar
            observer.observe(document.body, { childList: true, subtree: true });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        isObserving = true;
    }

    // ===== 5. UI DEL SELECTOR Y AUTO-INYECCIÓN DE ESTILOS =====
    function inyectarEstilosSelector() {
        if (document.getElementById("gestrest-translate-styles")) return;

        let style = document.createElement("style");
        style.id = "gestrest-translate-styles";
        style.textContent = `
            .lang-selector-dropdown { position: relative; user-select: none; display: inline-block; }
            .lang-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(212, 175, 55, 0.35);
                color: #d4af37;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.5px;
                display: inline-flex;
                align-items: center;
                gap: 7px;
                cursor: pointer;
                transition: all 0.25s ease;
                font-family: inherit;
            }
            .lang-btn:hover, .lang-selector-dropdown.open .lang-btn {
                background: rgba(212, 175, 55, 0.15);
                border-color: #d4af37;
                color: #ffffff;
                box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
            }
            .lang-arrow { transition: transform 0.2s ease; display: inline-block; }
            .lang-selector-dropdown.open .lang-arrow { transform: rotate(180deg); }
            .lang-menu {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                background: #181818;
                border: 1px solid rgba(212, 175, 55, 0.4);
                border-radius: 10px;
                padding: 6px;
                min-width: 145px;
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.85);
                display: none;
                flex-direction: column;
                gap: 4px;
                z-index: 99999;
                backdrop-filter: blur(8px);
            }
            .lang-selector-dropdown.open .lang-menu { display: flex !important; animation: fadeInLang 0.2s ease; }
            @keyframes fadeInLang {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .lang-option {
                background: transparent;
                border: none;
                color: #cfcfcf;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                width: 100%;
                text-align: left;
                transition: all 0.2s ease;
                font-family: inherit;
            }
            .lang-option:hover { background: rgba(212, 175, 55, 0.15); color: #ffffff; }
            .lang-option.selected { color: #d4af37; font-weight: 700; background: rgba(212, 175, 55, 0.08); }
            .lang-flag { font-size: 16px; line-height: 1; }
            .lang-check { margin-left: auto; font-size: 16px; color: #d4af37; }
        `;
        document.head.appendChild(style);
    }

    function actualizarSelectorUI(idioma) {
        let esEs = (idioma === "es");

        document.querySelectorAll(".lang-selector-dropdown").forEach(function (dropdown) {
            let label = dropdown.querySelector("[id*='Label'], [id*='label'], .lang-btn span:not(.material-symbols-outlined)");
            if (label) {
                label.textContent = idioma.toUpperCase();
            }

            let checkEs = dropdown.querySelector("#check-es, #cliente-check-es, [id$='-es'], [id$='es']");
            let checkEn = dropdown.querySelector("#check-en, #cliente-check-en, [id$='-en'], [id$='en']");

            if (checkEs) checkEs.style.display = esEs ? "inline-block" : "none";
            if (checkEn) checkEn.style.display = !esEs ? "inline-block" : "none";

            dropdown.querySelectorAll(".lang-option").forEach(function (btn) {
                if (btn.getAttribute("data-lang") === idioma) {
                    btn.classList.add("selected");
                } else {
                    btn.classList.remove("selected");
                }
            });

            dropdown.classList.remove("open");
        });
    }

    function inicializarSelector() {
        inyectarEstilosSelector();

        let lang = obtenerIdioma();
        actualizarSelectorUI(lang);
        aplicarTraducciones(lang);

        // Soporte universal para selectores en Admin y Cliente
        document.querySelectorAll(".lang-selector-dropdown").forEach(function (dropdown) {
            let btnToggle = dropdown.querySelector(".lang-btn");
            if (btnToggle) {
                btnToggle.onclick = function (e) {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    let wasOpen = dropdown.classList.contains("open");
                    document.querySelectorAll(".lang-selector-dropdown.open").forEach(function (d) {
                        d.classList.remove("open");
                    });
                    if (!wasOpen) {
                        dropdown.classList.add("open");
                    }
                };
            }

            dropdown.querySelectorAll(".lang-option").forEach(function (opt) {
                opt.onclick = function (e) {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    dropdown.classList.remove("open");
                    let nuevo = opt.getAttribute("data-lang");
                    if (nuevo) {
                        cambiarIdioma(nuevo);
                    }
                };
            });
        });

        if (!document._hasTranslateOutsideBound) {
            document._hasTranslateOutsideBound = true;
            document.addEventListener("click", function (e) {
                if (!e.target.closest(".lang-selector-dropdown")) {
                    document.querySelectorAll(".lang-selector-dropdown.open").forEach(function (dropdown) {
                        dropdown.classList.remove("open");
                    });
                }
            });
        }
    }

    // ===== 6. EXPOSICIÓN GLOBAL COMPATIBLE =====
    window.inicializarSelector = inicializarSelector;
    window.traduccionesAdmin = I18N_KEYS;
    window.obtenerIdiomaAdmin = obtenerIdioma;
    window.obtenerIdioma = obtenerIdioma;
    window.cambiarIdiomaAdmin = cambiarIdioma;
    window.cambiarIdioma = cambiarIdioma;
    window.aplicarTraduccionesAdmin = aplicarTraducciones;
    window.t = function (key, defaultValOrParams, defaultVal) {
        let l = obtenerIdioma();
        let val = (I18N_KEYS[l] && I18N_KEYS[l][key] !== undefined)
            ? I18N_KEYS[l][key]
            : (I18N_KEYS.es && I18N_KEYS.es[key] !== undefined)
                ? I18N_KEYS.es[key]
                : (typeof defaultValOrParams === "string" ? defaultValOrParams : (defaultVal !== undefined ? defaultVal : key));

        if (defaultValOrParams && typeof defaultValOrParams === "object") {
            Object.keys(defaultValOrParams).forEach(function (param) {
                val = String(val).replace(new RegExp("\\{" + param + "\\}", "g"), defaultValOrParams[param]);
            });
        }
        return val;
    };
    window.tOriginal = function (key, defaultVal) {
        let l = obtenerIdioma();
        if (I18N_KEYS[l] && I18N_KEYS[l][key] !== undefined) return I18N_KEYS[l][key];
        if (I18N_KEYS.es && I18N_KEYS.es[key] !== undefined) return I18N_KEYS.es[key];
        return defaultVal !== undefined ? defaultVal : key;
    };

    // ===== 7. TRADUCCIÓN DINÁMICA ASÍNCRONA (CONTENIDO DE BD / PLATOS) =====
    const CACHE_DINAMICO = new Map();

    function obtenerTraduccionCacheada(texto, origen = "es", destino = "en") {
        if (!texto || origen === destino) return texto;
        let limpio = texto.trim();
        let key = `gestrest_tr_${origen}_${destino}_${limpio}`;
        if (CACHE_DINAMICO.has(key)) return CACHE_DINAMICO.get(key);
        try {
            let guardado = sessionStorage.getItem(key);
            if (guardado) {
                CACHE_DINAMICO.set(key, guardado);
                return guardado;
            }
        } catch (e) {}
        return null;
    }

    function traducirDinamico(texto, origen = "es", destino = "en") {
        if (!texto || typeof texto !== "string" || !texto.trim() || origen === destino) {
            return Promise.resolve(texto);
        }
        let limpio = texto.trim();
        let cacheado = obtenerTraduccionCacheada(limpio, origen, destino);
        if (cacheado) {
            return Promise.resolve(cacheado);
        }

        let key = `gestrest_tr_${origen}_${destino}_${limpio}`;
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${origen}&tl=${destino}&dt=t&q=${encodeURIComponent(limpio)}`;
        return fetch(url)
            .then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && Array.isArray(data[0])) {
                    const traducido = data[0].map(item => item[0]).join("");
                    if (traducido && traducido.trim()) {
                        let resultado = traducido.trim();
                        CACHE_DINAMICO.set(key, resultado);
                        try {
                            sessionStorage.setItem(key, resultado);
                        } catch (e) {}
                        return resultado;
                    }
                }
                return limpio;
            })
            .catch(err => {
                console.warn("Fallo en traducción automática dinámica:", err);
                return limpio;
            });
    }

    window.traducirDinamico = traducirDinamico;
    window.obtenerTraduccionCacheada = obtenerTraduccionCacheada;

    // Auto-arranque
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarSelector);
    } else {
        inicializarSelector();
    }
})();
