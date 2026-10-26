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
            "menu.guardar": "AÑADIR PLATO",
            "menu.platos": "Platos del menú",

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
            "user.reactivarTitulo": "¿Reactivar Cuenta?"
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
            "menu.guardar": "ADD DISH",
            "menu.platos": "Menu Dishes",

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
            "user.reactivarTitulo": "Reactivate Account?"
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
        "Colapsar / Expandir menú": "Collapse / Expand menu",

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
    window.t = function (key, defaultVal) {
        let l = obtenerIdioma();
        if (I18N_KEYS[l] && I18N_KEYS[l][key] !== undefined) return I18N_KEYS[l][key];
        if (I18N_KEYS.es && I18N_KEYS.es[key] !== undefined) return I18N_KEYS.es[key];
        return defaultVal !== undefined ? defaultVal : key;
    };

    // Auto-arranque
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarSelector);
    } else {
        inicializarSelector();
    }
})();
