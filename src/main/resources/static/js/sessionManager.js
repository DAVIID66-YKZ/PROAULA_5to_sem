/* ================================================================
   GESTOR DE SESIÓN E INACTIVIDAD - GESTREST
   Monitorea la actividad del usuario y el tiempo de vida de la sesión.
   Cierra la sesión automáticamente si el usuario permanece inactivo
   (30 minutos) o si el token JWT ha expirado tras días de ausencia.
   ================================================================ */

(function () {
    // 30 minutos de inactividad máxima en milisegundos
    const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000;
    const LAST_ACTIVITY_KEY = "gestrest_last_activity";
    const LOGIN_TIME_KEY = "gestrest_login_time";

    function decodificarJwtPayload(token) {
        try {
            if (!token || typeof token !== "string") return null;
            const partes = token.split(".");
            if (partes.length !== 3) return null;
            const base64Url = partes[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function esJwtExpirado(token) {
        const payload = decodificarJwtPayload(token);
        if (!payload || !payload.exp) return false;
        // payload.exp está en segundos, Date.now() en milisegundos
        return Date.now() >= payload.exp * 1000;
    }

    function cerrarSesionPorInactividad(motivo) {
        motivo = motivo || "inactividad";
        const habiaSesion = !!(localStorage.getItem("token") || localStorage.getItem("jwtToken"));
        if (!habiaSesion) return;

        console.warn(`[GestRest] Sesión cerrada automáticamente por: ${motivo}`);

        // Limpiar únicamente las credenciales de sesión (manteniendo reservaCarrito intacto)
        localStorage.removeItem("token");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("usuarioId");
        localStorage.removeItem("nombreUsuario");
        localStorage.removeItem("rol");
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(LOGIN_TIME_KEY);

        // Si la página tiene el navbar estándar, actualizar visualmente
        const btnSesion = document.getElementById("navBtnSesion");
        const btnPerfil = document.getElementById("navBtnPerfil");
        if (btnSesion) btnSesion.style.display = "inline-flex";
        if (btnPerfil) btnPerfil.style.display = "none";

        // Determinar si la ruta actual es protegida (área privada de cliente o admin)
        const path = window.location.pathname.toLowerCase();
        const esRutaProtegida = path.includes("/cliente/") ||
                                path.includes("/admin/") ||
                                path.includes("/dashboard") ||
                                path.includes("/dashboardadmin") ||
                                path.includes("/mis-reservas") ||
                                path.includes("/calendario") ||
                                path.includes("/perfil") ||
                                path === "/reserva";

        if (esRutaProtegida) {
            window.location.replace("/login?sesionExpirada=true&motivo=" + encodeURIComponent(motivo));
        }
    }

    function comprobarEstadoSesion() {
        const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
        if (!token) return;

        const ahora = Date.now();
        const ultimaActividadStr = localStorage.getItem(LAST_ACTIVITY_KEY);

        // 1. Si el token JWT ya caducó (por ejemplo, pasaron días)
        if (esJwtExpirado(token)) {
            cerrarSesionPorInactividad("jwt_expirado");
            return;
        }

        // 2. Si hay registro de actividad y superó el tiempo máximo de inactividad
        if (ultimaActividadStr) {
            const ultimaActividad = parseInt(ultimaActividadStr, 10);
            if (!isNaN(ultimaActividad) && (ahora - ultimaActividad > TIEMPO_INACTIVIDAD_MS)) {
                cerrarSesionPorInactividad("inactividad");
                return;
            }
        } else {
            // Si tiene token pero no tenía timestamp de actividad, inicializarlo ahora
            localStorage.setItem(LAST_ACTIVITY_KEY, ahora.toString());
        }
    }

    function renovarActividad() {
        const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
        if (!token) return;

        const ahora = Date.now();
        const ultimaActividad = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);

        // Actualizar como máximo una vez cada 15 segundos para no sobrecargar el almacenamiento
        if (ahora - ultimaActividad > 15000) {
            localStorage.setItem(LAST_ACTIVITY_KEY, ahora.toString());
        }
    }

    // Ejecución inmediata de validación al cargar el script
    comprobarEstadoSesion();

    // Eventos de interacción del usuario para mantener la sesión viva mientras navega
    const eventosInteraccion = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    eventosInteraccion.forEach(evento => {
        window.addEventListener(evento, renovarActividad, { passive: true });
    });

    // Validar cuando la pestaña vuelve a ser visible o toma el foco (ej. tras suspender o volver días después)
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            comprobarEstadoSesion();
        }
    });

    window.addEventListener("focus", comprobarEstadoSesion);

    // Verificación periódica en segundo plano cada 20 segundos
    setInterval(comprobarEstadoSesion, 20000);

    function cerrarSesionApp(event) {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        if (confirm("¿Deseas cerrar tu sesión en GestRest?")) {
            localStorage.removeItem("token");
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("usuarioId");
            localStorage.removeItem("nombreUsuario");
            localStorage.removeItem("rol");
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            localStorage.removeItem(LOGIN_TIME_KEY);
            window.location.href = "/login";
        }
    }
    window.cerrarSesionApp = cerrarSesionApp;

    // Efecto de Navbar dinámico: 100% transparente arriba y negro al hacer scroll
    function inicializarEfectoScrollNavbar() {
        const headers = document.querySelectorAll(".header");
        if (!headers.length) return;

        function actualizarScrollNavbar() {
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            const esScrolled = scrollY > 30;
            headers.forEach(header => {
                if (esScrolled) {
                    header.classList.add("header-scrolled");
                    header.classList.add("scrolled");
                } else {
                    header.classList.remove("header-scrolled");
                    header.classList.remove("scrolled");
                }
            });
        }

        window.addEventListener("scroll", actualizarScrollNavbar, { passive: true });
        window.addEventListener("scroll", actualizarScrollNavbar, { passive: true, capture: true });
        actualizarScrollNavbar();
    }

    window.inicializarEfectoScrollNavbar = inicializarEfectoScrollNavbar;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarEfectoScrollNavbar);
    } else {
        inicializarEfectoScrollNavbar();
    }

    // Exportar helpers en window
    window.GestRestSession = {
        renovarActividad,
        comprobarEstadoSesion,
        cerrarSesionPorInactividad,
        cerrarSesionApp,
        inicializarEfectoScrollNavbar,
        TIEMPO_INACTIVIDAD_MS
    };
})();
