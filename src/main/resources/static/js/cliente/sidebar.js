/* ================================================================
   LÓGICA DEL SIDEBAR CLIENTE - GESTREST
   Soporte Completo Responsive y Móvil
   ================================================================ */

document.addEventListener("DOMContentLoaded", function () {
    inicializarSidebar();
});

function inicializarSidebar() {
    marcarRutaActiva();
    configurarToggleSidebar();
    configurarLogoutSidebar();
}

function marcarRutaActiva() {
    let currentPath = window.location.pathname.toLowerCase();
    let navLinks = document.querySelectorAll("#sidebarNav a");

    navLinks.forEach(function (link) {
        let href = (link.getAttribute("href") || "").toLowerCase();

        let segmentoHref = href.replace("/cliente/", "").replace("/", "");
        let segmentoPath = currentPath.replace("/cliente/", "").replace("/", "");

        let esActivo = false;

        if (segmentoPath === "" && (segmentoHref === "dashboard" || segmentoHref === "")) {
            esActivo = true;
        } else if (segmentoPath && (segmentoPath === segmentoHref || currentPath.includes(href))) {
            esActivo = true;
        }

        if (esActivo) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

function configurarToggleSidebar() {
    let sidebar = document.getElementById("sidebar");
    let toggleBtn = document.getElementById("toggleSidebar");
    let mobileToggleBtn = document.getElementById("mobileSidebarToggle");
    let mainContent = document.querySelector(".dashboard-main") || document.querySelector(".main-content");

    // Crear o recuperar el backdrop de móvil
    let backdrop = document.querySelector(".sidebar-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "sidebar-backdrop";
        document.body.appendChild(backdrop);
    }

    function cerrarMobile() {
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (backdrop) backdrop.classList.remove("active");
    }

    function abrirMobile() {
        if (sidebar) sidebar.classList.add("mobile-open");
        if (backdrop) backdrop.classList.add("active");
    }

    if (mobileToggleBtn && sidebar) {
        mobileToggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains("mobile-open")) {
                cerrarMobile();
            } else {
                abrirMobile();
            }
        });
    }

    if (backdrop) {
        backdrop.addEventListener("click", function () {
            cerrarMobile();
        });
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.innerWidth <= 992) {
                cerrarMobile();
            } else {
                sidebar.classList.toggle("closed");
                if (mainContent) {
                    mainContent.classList.toggle("expanded");
                }
            }
        });
    }

    window.addEventListener("resize", function () {
        if (window.innerWidth > 992) {
            cerrarMobile();
        }
    });
}

function configurarLogoutSidebar() {
    let logoutBtn = document.getElementById("logoutBtnSidebar");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (confirm("¿Deseas cerrar tu sesión en GestRest?")) {
                localStorage.clear();
                window.location.href = "/login";
            }
        });
    }
}