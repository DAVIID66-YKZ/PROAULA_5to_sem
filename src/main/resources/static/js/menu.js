function obtenerIdiomaMenu() {
    return (typeof window.obtenerIdioma === "function" ? window.obtenerIdioma() : (localStorage.getItem("adminIdioma") || localStorage.getItem("appIdioma") || "es")) === "en" ? "en" : "es";
}

function traducirCategoriaMenu(cat, lang) {
    const limpia = String(cat || "").trim().toUpperCase().replaceAll(" ", "_");
    const categorias = {
        "ENTRADAS": lang === "en" ? "Appetizers" : "Entradas",
        "PLATOS_FUERTES": lang === "en" ? "Main Courses" : "Platos Fuertes",
        "BEBIDAS": lang === "en" ? "Beverages" : "Bebidas",
        "POSTRES": lang === "en" ? "Desserts" : "Postres"
    };
    return categorias[limpia] || String(cat || (lang === "en" ? "No category" : "Sin categoría")).replaceAll("_", " ");
}

function traducirTarjetasMenu(lang) {
    const isEn = lang === "en";
    const cards = document.querySelectorAll(".menu-cards");
    cards.forEach(card => {
        const titleEl = card.querySelector(".menu-card-title, .menu-top h2");
        if (titleEl) {
            if (!titleEl._origText) {
                titleEl._origText = titleEl.getAttribute("data-original-nombre") || titleEl.textContent.trim();
            }
            if (isEn && typeof window.traducirDinamico === "function") {
                const cached = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(titleEl._origText, "es", "en") : null;
                if (cached) {
                    titleEl.textContent = cached;
                } else {
                    window.traducirDinamico(titleEl._origText, "es", "en").then(res => {
                        if (titleEl.isConnected && obtenerIdiomaMenu() === "en") {
                            titleEl.textContent = res;
                        }
                    });
                }
            } else {
                titleEl.textContent = titleEl._origText;
            }
        }
    });

    // Traducir títulos de sección de categorías y barras de navegación
    const titulosCat = [
        { id: "entradas", es: "Entradas", en: "Appetizers" },
        { id: "platos-fuertes", es: "Platos Fuertes", en: "Main Courses" },
        { id: "bebidas", es: "Bebidas", en: "Beverages" },
        { id: "postres", es: "Postres", en: "Desserts" }
    ];
    titulosCat.forEach(item => {
        const sec = document.getElementById(item.id);
        if (sec) {
            const h2 = sec.querySelector("h2");
            if (h2) h2.textContent = isEn ? item.en : item.es;
        }
        const navLinks = document.querySelectorAll(`.menu-nav a[href="#${item.id}"], .menu-nav-inline a[href="#${item.id}"]`);
        navLinks.forEach(link => {
            link.textContent = isEn ? item.en : item.es;
        });
    });
}

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

    // Ejecutar traducción inicial de tarjetas
    traducirTarjetasMenu(obtenerIdiomaMenu());

    // Escuchar cambio de idioma en vivo
    window.addEventListener("idiomaCambiado", function (e) {
        const nuevoLang = (e && e.detail) ? (e.detail === "en" ? "en" : "es") : obtenerIdiomaMenu();
        traducirTarjetasMenu(nuevoLang);
    });

    document.querySelectorAll(".menu-info-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const isEn = obtenerIdiomaMenu() === "en";
            const isAvailable = button.dataset.available === "true";
            const numPrecio = parseFloat(button.dataset.price || 0);

            const originalNombre = button.dataset.name || "";
            const originalDesc = button.dataset.description || "Plato de autor preparado con ingredientes frescos de la más alta calidad.";

            if (title) {
                if (isEn && typeof window.traducirDinamico === "function") {
                    const cached = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(originalNombre, "es", "en") : null;
                    title.textContent = cached || originalNombre;
                    if (!cached && originalNombre) {
                        window.traducirDinamico(originalNombre, "es", "en").then(res => {
                            if (title.isConnected && obtenerIdiomaMenu() === "en") title.textContent = res;
                        });
                    }
                } else {
                    title.textContent = originalNombre;
                }
            }

            if (description) {
                if (isEn && typeof window.traducirDinamico === "function") {
                    const cachedDesc = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(originalDesc, "es", "en") : null;
                    description.textContent = cachedDesc || originalDesc;
                    if (!cachedDesc && originalDesc) {
                        window.traducirDinamico(originalDesc, "es", "en").then(res => {
                            if (description.isConnected && obtenerIdiomaMenu() === "en") description.textContent = res;
                        });
                    }
                } else {
                    description.textContent = originalDesc;
                }
            }

            if (category) {
                category.textContent = traducirCategoriaMenu(button.dataset.category, isEn ? "en" : "es").toUpperCase();
            }

            if (price) {
                price.textContent = !isNaN(numPrecio) && numPrecio > 0 ? formatoCOP.format(numPrecio) : "$" + (button.dataset.price || "0");
            }

            if (status) {
                status.textContent = isEn ? (isAvailable ? "AVAILABLE" : "UNAVAILABLE") : (isAvailable ? "DISPONIBLE" : "NO DISPONIBLE");
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
