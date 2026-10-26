/* ================================================================
   NAVEGACIÓN Y CONTROL ADMIN - GESTREST
   Manejo de rutas activas, guardián de rol ADMIN y drawer responsive
   ================================================================ */

// 1. Guardián de sesión y rol ADMIN
(function () {
    let token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    let rol = localStorage.getItem("rol");
    let rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
        console.warn("Acceso denegado: se requiere rol ADMIN.");
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", function () {
    marcarRutaAdminActiva();
    configurarDrawerMobileAdmin();
    configurarToggleDesktopAdmin();
    mostrarNombreAdmin();
});

function marcarRutaAdminActiva() {
    let currentPath = window.location.pathname.toLowerCase().trim();
    let cleanPath = currentPath.replace(/^\/admin\//, "").replace(/^\//, "");
    let links = document.querySelectorAll("#sidebarAdminNav .nav-item, #sidebarAdminNav a");

    links.forEach(function (link) {
        let target = (link.getAttribute("data-path") || link.getAttribute("href") || "").toLowerCase().trim();
        let cleanTarget = target.replace(/^\/admin\//, "").replace(/^\//, "");

        let esActivo = false;

        // Alias para Dashboard
        let esPathDashboard = (cleanPath === "dashboard" || cleanPath === "dashboardadmin" || cleanPath === "admin" || cleanPath === "");
        let esTargetDashboard = (cleanTarget === "dashboard" || cleanTarget === "dashboardadmin");

        // Alias para Perfil
        let esPathPerfil = (cleanPath === "perfil" || cleanPath === "perfiladmin");
        let esTargetPerfil = (cleanTarget === "perfil" || cleanTarget === "perfiladmin");

        if (esPathDashboard && esTargetDashboard) {
            esActivo = true;
        } else if (esPathPerfil && esTargetPerfil) {
            esActivo = true;
        } else if (cleanPath && cleanTarget && !esPathDashboard && !esPathPerfil && (cleanPath === cleanTarget || currentPath.includes(cleanTarget))) {
            esActivo = true;
        }

        link.classList.toggle("active", esActivo);
    });
}

function configurarToggleDesktopAdmin() {
    let sidebar = document.getElementById("sidebarAdmin") || document.querySelector(".sidebar");
    let toggleBtn = document.getElementById("toggleAdminSidebar");
    let mainContent = document.querySelector(".main-content");

    // Sincronizar estado inicial guardado en localStorage
    try {
        if (window.innerWidth > 992 && localStorage.getItem("adminSidebarClosed") === "true") {
            if (sidebar) sidebar.classList.add("closed");
            document.documentElement.classList.add("sidebar-collapsed");
            if (mainContent) mainContent.classList.add("expanded");
        }
    } catch (e) {}

    if (toggleBtn && sidebar && !toggleBtn._hasAdminToggleBound) {
        toggleBtn._hasAdminToggleBound = true;
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.innerWidth <= 992) {
                // Modo móvil: cerrar drawer
                sidebar.classList.remove("mobile-open");
                let backdrop = document.getElementById("adminSidebarBackdrop");
                if (backdrop) backdrop.classList.remove("active");
            } else {
                // Modo escritorio: alternar colapso
                let estaCerrado = sidebar.classList.toggle("closed");
                document.documentElement.classList.toggle("sidebar-collapsed", estaCerrado);
                if (mainContent) {
                    mainContent.classList.toggle("expanded", estaCerrado);
                }
                try {
                    localStorage.setItem("adminSidebarClosed", estaCerrado ? "true" : "false");
                } catch (err) {}
            }
        });
    }
}

function configurarDrawerMobileAdmin() {
    let sidebar = document.getElementById("sidebarAdmin") || document.querySelector(".sidebar");
    let toggleBtn = document.getElementById("adminSidebarToggle");
    let backdrop = document.getElementById("adminSidebarBackdrop");

    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "adminSidebarBackdrop";
        backdrop.className = "admin-sidebar-backdrop";
        document.body.appendChild(backdrop);
    }

    function cerrarDrawer() {
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (backdrop) backdrop.classList.remove("active");
    }

    function abrirDrawer() {
        if (sidebar) sidebar.classList.add("mobile-open");
        if (backdrop) backdrop.classList.add("active");
    }

    if (toggleBtn && sidebar && !toggleBtn._hasMobileToggleBound) {
        toggleBtn._hasMobileToggleBound = true;
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains("mobile-open")) {
                cerrarDrawer();
            } else {
                abrirDrawer();
            }
        });
    }

    if (backdrop && !backdrop._hasClickBound) {
        backdrop._hasClickBound = true;
        backdrop.addEventListener("click", cerrarDrawer);
    }

    if (!window._hasAdminResizeBound) {
        window._hasAdminResizeBound = true;
        window.addEventListener("resize", function () {
            if (window.innerWidth > 992) {
                cerrarDrawer();
            }
        });
    }
}

function mostrarNombreAdmin() {
    let nombre = localStorage.getItem("nombreUsuario") || localStorage.getItem("nombre") || "Admin";
    document.querySelectorAll(".profile-name").forEach(function (el) {
        el.textContent = nombre;
    });

    let iniciales = nombre
        .split(" ")
        .map(function (p) { return p[0]; })
        .join("")
        .substring(0, 2)
        .toUpperCase();

    document.querySelectorAll(".profile-avatar").forEach(function (el) {
        el.textContent = iniciales || "AD";
    });
}

function cerrarSesionAdmin(event) {
    if (event) event.preventDefault();
    if (confirm("¿Cerrar sesión de administración en GestRest?")) {
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
