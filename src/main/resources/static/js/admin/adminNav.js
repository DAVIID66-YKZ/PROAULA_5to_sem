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
    mostrarNombreAdmin();
});

function marcarRutaAdminActiva() {
    let pathActual = window.location.pathname.toLowerCase();
    let links = document.querySelectorAll("#sidebarAdminNav .nav-item");

    links.forEach(function (link) {
        let targetPath = (link.getAttribute("data-path") || link.getAttribute("href") || "").toLowerCase();
        
        if (targetPath && (pathActual === targetPath || pathActual.startsWith(targetPath))) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
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

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains("mobile-open")) {
                cerrarDrawer();
            } else {
                abrirDrawer();
            }
        });
    }

    if (backdrop) {
        backdrop.addEventListener("click", cerrarDrawer);
    }

    window.addEventListener("resize", function () {
        if (window.innerWidth > 992) {
            cerrarDrawer();
        }
    });
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
