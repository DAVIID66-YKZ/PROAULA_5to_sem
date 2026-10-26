document.addEventListener("DOMContentLoaded", function () {
    const dialog = document.getElementById("menuDialog");
    const closeButton = document.getElementById("menuDialogClose");
    const image = document.getElementById("menuDialogImage");
    const title = document.getElementById("menuDialogTitle");
    const description = document.getElementById("menuDialogDescription");
    const category = document.getElementById("menuDialogCategory");
    const price = document.getElementById("menuDialogPrice");
    const status = document.getElementById("menuDialogStatus");

    // Formato de precio en pesos colombianos
    const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    document.querySelectorAll(".menu-info-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const isAvailable = button.dataset.available === "true";
            const numPrecio = parseFloat(button.dataset.price || 0);

            if (title) title.textContent = button.dataset.name || "";
            if (description) description.textContent = button.dataset.description || "Plato de autor preparado con ingredientes frescos de la más alta calidad.";
            if (category) category.textContent = String(button.dataset.category || "").replace("_", " ");
            if (price) {
                price.textContent = !isNaN(numPrecio) && numPrecio > 0 ? formatoCOP.format(numPrecio) : "$" + (button.dataset.price || "0");
            }
            if (status) {
                status.textContent = isAvailable ? "Disponible" : "No disponible";
                status.classList.toggle("is-unavailable", !isAvailable);
            }
            if (image) {
                image.src = button.dataset.image || "";
                image.alt = button.dataset.name || "";
            }

            if (dialog && typeof dialog.showModal === "function") {
                dialog.showModal();
            }
        });
    });

    if (closeButton && dialog) {
        closeButton.addEventListener("click", function () {
            dialog.close();
        });
    }

    if (dialog) {
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) {
                dialog.close();
            }
        });
    }

    // ===== CONTROL EXCLUSIVO DE LA PÁGINA MENÚ =====
    const isMenuPage = document.body.classList.contains("menu-page") || !!document.getElementById("menuNavStickyBar");
    if (isMenuPage) {
        const header = document.querySelector(".header");
        const navLinks = document.querySelectorAll(".menu-nav a");
        const sections = document.querySelectorAll(".menu-title[id]");
        let isClickScrolling = false;
        let clickTimeout = null;

        // 1. Ocultar navbar principal al hacer scroll hacia abajo y restaurarlo al volver arriba
        function sincronizarNavbarPrincipal() {
            if (!header) return;
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            if (scrollY > 40) {
                header.classList.add("header-hidden-menu");
            } else {
                header.classList.remove("header-hidden-menu");
            }
        }

        window.addEventListener("scroll", sincronizarNavbarPrincipal, { passive: true });
        sincronizarNavbarPrincipal();

        // 2. Seguimiento de categoría activa (ScrollSpy y clics con resaltado único)
        if (navLinks.length > 0 && sections.length > 0) {
            function actualizarCategoriaActiva() {
                if (isClickScrolling) return;
                const scrollPos = window.scrollY + 100;
                let currentId = "";

                sections.forEach(sec => {
                    const top = sec.offsetTop;
                    if (scrollPos >= top) {
                        currentId = sec.getAttribute("id");
                    }
                });

                if (!currentId && sections[0]) {
                    currentId = sections[0].getAttribute("id");
                }

                navLinks.forEach(link => {
                    const href = link.getAttribute("href") || "";
                    if (href === "#" + currentId) {
                        link.classList.add("active");
                    } else {
                        link.classList.remove("active");
                    }
                });
            }

            window.addEventListener("scroll", actualizarCategoriaActiva, { passive: true });
            actualizarCategoriaActiva();

            navLinks.forEach(link => {
                link.addEventListener("click", function () {
                    isClickScrolling = true;
                    if (clickTimeout) clearTimeout(clickTimeout);

                    navLinks.forEach(l => l.classList.remove("active"));
                    this.classList.add("active");

                    clickTimeout = setTimeout(function () {
                        isClickScrolling = false;
                        actualizarCategoriaActiva();
                    }, 650);
                });
            });
        }
    }
});
