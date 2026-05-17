document.addEventListener("DOMContentLoaded", () => {
    controlarSidebar();
});

function controlarSidebar() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll("#sidebarNav a");

    // 1. Lógica para marcar el ítem activo
    navLinks.forEach(link => {
        // Si la URL actual coincide con el href del link, activarlo
        if (currentPath.includes(link.getAttribute("href"))) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // 2. Lógica de Logout específica para el Sidebar
    const logoutBtn = document.getElementById("logoutBtnSidebar");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("¿Deseas cerrar tu sesión en The Culinary Manuscript?")) {
                // Borramos todo rastro de sesión
                localStorage.removeItem("token");
                localStorage.removeItem("usuarioId");
                localStorage.removeItem("nombreUsuario");
                
                // Redirección al login
                window.location.href = "/login";
            }
        });
    }
}
document.addEventListener("DOMContentLoaded", () => {
    controlarSidebar();
    
    // Nueva lógica para abrir/cerrar
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleSidebar");
    const mainContent = document.querySelector(".dashboard-main");

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
        if(mainContent) mainContent.classList.toggle("expanded");
    });
});

// ... tu función controlarSidebar() se queda igual ...