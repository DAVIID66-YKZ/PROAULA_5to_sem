let todosLosPlatos = [];
let paginaActualPlatos = 1;
const itemsPorPaginaPlatos = 8;
const formatoPrecioPlato = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

function fnT(k, fb) {
    return typeof window.t === "function" ? window.t(k, fb) : fb;
}

function obtenerCategoriaPlatoTraducida(cat) {
    let limpia = String(cat || "").trim().toUpperCase().replaceAll(" ", "_");
    let isEn = (typeof window.obtenerIdioma === "function" ? window.obtenerIdioma() : (localStorage.getItem("adminIdioma") || "es")) === "en";
    const categorias = {
        "ENTRADAS": isEn ? "APPETIZERS" : "ENTRADAS",
        "PLATOS_FUERTES": isEn ? "MAIN COURSES" : "PLATOS FUERTES",
        "BEBIDAS": isEn ? "BEVERAGES" : "BEBIDAS",
        "POSTRES": isEn ? "DESSERTS" : "POSTRES"
    };
    return categorias[limpia] || String(cat || (isEn ? "No category" : "Sin categoría")).replaceAll("_", " ");
}

function preTraducirPlatos(platos) {
    if (!Array.isArray(platos) || typeof window.traducirDinamico !== "function") return;
    let isEn = (typeof window.obtenerIdioma === "function" ? window.obtenerIdioma() : (localStorage.getItem("adminIdioma") || "es")) === "en";
    if (!isEn) return;
    platos.forEach(function (p) {
        if (p.nombre) window.traducirDinamico(p.nombre, "es", "en");
        if (p.descripcion) window.traducirDinamico(p.descripcion, "es", "en");
    });
}

document.addEventListener("DOMContentLoaded", function () {
    cargarPlatos();
    configurarFiltrosPlatos();
    configurarFormularioPlato();

    let lista = document.getElementById("platosListContainer");
    if (lista) {
        lista.addEventListener("click", function (event) {
            let button = event.target.closest("[data-accion]");
            if (!button) return;

            if (button.dataset.accion === "editar-plato") {
                editarPlato(button.dataset.id);
            } else if (button.dataset.accion === "eliminar-plato") {
                eliminarPlato(button.dataset.id);
            }
        });
    }
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

async function cargarPlatos() {
    let container = document.getElementById("platosListContainer");
    if (!container) return;

    mostrarMensajePlatos(fnT("menu.cargando", "Cargando platos del menú..."), "#888");

    let token = obtenerTokenAdmin();
    try {
        let resp = await fetch("/api/admin/menu", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!resp.ok) {
            console.error(`Error al cargar platos: ${resp.status} ${resp.statusText}`);
            todosLosPlatos = [];
            mostrarMensajePlatos(fnT("menu.errorCargar", "No se pudieron cargar los platos del menú."), "#f44336");
            actualizarPaginacionPlatos(1, 1);
            actualizarContadoresPlatos();
            return;
        }

        let platos = await resp.json();
        if (!Array.isArray(platos)) {
            throw new TypeError("La respuesta del servicio de platos no es una lista.");
        }

        todosLosPlatos = platos;
        paginaActualPlatos = 1;
        preTraducirPlatos(platos);
        renderizarListaPlatos();
    } catch (error) {
        console.error("Error al cargar platos:", error);
        todosLosPlatos = [];
        mostrarMensajePlatos(fnT("menu.errorConexion", "Error al conectar con el servicio de platos."), "#f44336");
        actualizarPaginacionPlatos(1, 1);
        actualizarContadoresPlatos();
    }
}

function obtenerListaFiltradaPlatos() {
    let termino = (document.getElementById("buscarPlato")?.value || "").toLowerCase().trim();
    let categoria = (document.getElementById("filtroCategoria")?.value || "").toUpperCase().trim();

    return todosLosPlatos.filter(function (plato) {
        let disponibilidad = plato.disponible ? "disponible" : "no disponible";
        let cachedNombre = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(plato.nombre, "es", "en") : "";
        let cachedDesc = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(plato.descripcion, "es", "en") : "";
        let texto = [
            plato.nombre,
            cachedNombre,
            plato.descripcion,
            cachedDesc,
            plato.precio,
            plato.categoria,
            obtenerCategoriaPlatoTraducida(plato.categoria),
            disponibilidad,
            plato.disponible ? "available" : "unavailable"
        ].map(valor => String(valor ?? "")).join(" ").toLowerCase();
        let coincideTexto = !termino || texto.includes(termino);
        let coincideCategoria = !categoria
            || String(plato.categoria || "").toUpperCase() === categoria;
        return coincideTexto && coincideCategoria;
    });
}

function renderizarListaPlatos(listaFiltrada) {
    let container = document.getElementById("platosListContainer");
    if (!container) return;

    container.replaceChildren();
    let lista = listaFiltrada !== undefined ? listaFiltrada : obtenerListaFiltradaPlatos();
    if (lista.length === 0) {
        mostrarMensajePlatos(fnT("menu.vacioFiltros", "No hay platos para mostrar con los filtros actuales."), "#888");
        actualizarPaginacionPlatos(1, 1);
        actualizarContadoresPlatos();
        return;
    }

    let totalPaginas = Math.max(1, Math.ceil(lista.length / itemsPorPaginaPlatos));
    paginaActualPlatos = Math.min(paginaActualPlatos, totalPaginas);
    let inicio = (paginaActualPlatos - 1) * itemsPorPaginaPlatos;
    let visibles = lista.slice(inicio, inicio + itemsPorPaginaPlatos);

    let isEn = (typeof window.obtenerIdioma === "function" ? window.obtenerIdioma() : (localStorage.getItem("adminIdioma") || "es")) === "en";

    visibles.forEach(function (plato) {
        let item = document.createElement("article");
        item.className = "plato-item";

        let imgUrl = String(plato.imgUrl || "").trim();
        let imagen;
        if (imgUrl) {
            imagen = document.createElement("img");
            imagen.className = "plato-imagen";
            imagen.src = imgUrl;
            imagen.alt = plato.nombre || "Imagen del plato";
            imagen.loading = "lazy";
            imagen.addEventListener("error", function () {
                imagen.replaceWith(crearPlaceholderImagen());
            }, { once: true });
        } else {
            imagen = crearPlaceholderImagen();
        }

        let contenido = document.createElement("div");
        contenido.className = "plato-info";
        let nombrePlato = document.createElement("span");
        nombrePlato.className = "plato-nombre";

        let descripcion = document.createElement("span");
        descripcion.className = "plato-descripcion";

        let nombreOriginal = plato.nombre || fnT("menu.platoSinNombre", "Plato sin nombre");
        let descOriginal = plato.descripcion || fnT("menu.sinDescripcion", "Sin descripción");

        // Traducción dinámica de nombre y descripción
        if (isEn && typeof window.traducirDinamico === "function") {
            let cacheNombre = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(plato.nombre, "es", "en") : null;
            nombrePlato.textContent = cacheNombre || nombreOriginal;
            if (!cacheNombre && plato.nombre) {
                window.traducirDinamico(plato.nombre, "es", "en").then(res => {
                    if (nombrePlato.isConnected) nombrePlato.textContent = res;
                });
            }

            let cacheDesc = typeof window.obtenerTraduccionCacheada === "function" ? window.obtenerTraduccionCacheada(plato.descripcion, "es", "en") : null;
            descripcion.textContent = cacheDesc || descOriginal;
            if (!cacheDesc && plato.descripcion) {
                window.traducirDinamico(plato.descripcion, "es", "en").then(res => {
                    if (descripcion.isConnected) descripcion.textContent = res;
                });
            }
        } else {
            nombrePlato.textContent = nombreOriginal;
            descripcion.textContent = descOriginal;
        }

        let categoria = document.createElement("span");
        categoria.className = "plato-categoria";
        categoria.textContent = obtenerCategoriaPlatoTraducida(plato.categoria);

        let precio = Number(plato.precio);
        let precioPlato = document.createElement("span");
        precioPlato.className = "plato-precio";
        precioPlato.textContent = Number.isFinite(precio)
            ? formatoPrecioPlato.format(precio)
            : fnT("menu.noEspecificado", "No especificado");

        let disponible = Boolean(plato.disponible);
        let badge = document.createElement("span");
        badge.className = `status-badge ${disponible ? "status-confirmed" : "status-cancelada"}`;
        badge.textContent = disponible ? (isEn ? "AVAILABLE" : "DISPONIBLE") : (isEn ? "UNAVAILABLE" : "NO DISPONIBLE");

        let metadatos = document.createElement("div");
        metadatos.className = "plato-metadatos";
        metadatos.append(categoria, precioPlato, badge);
        contenido.append(nombrePlato, descripcion, metadatos);

        let editarButton = document.createElement("button");
        editarButton.type = "button";
        editarButton.className = "action-btn mesa-edit-btn";
        editarButton.title = fnT("menu.editarPlato", "Editar plato");
        editarButton.dataset.accion = "editar-plato";
        editarButton.dataset.id = String(plato.id || plato._id || "");
        editarButton.disabled = !editarButton.dataset.id;
        let iconoEditar = document.createElement("span");
        iconoEditar.className = "material-symbols-outlined action-icon";
        iconoEditar.textContent = "edit";
        editarButton.appendChild(iconoEditar);

        let eliminarButton = document.createElement("button");
        eliminarButton.type = "button";
        eliminarButton.className = "action-btn mesa-delete-btn";
        eliminarButton.title = fnT("menu.eliminarPlato", "Eliminar plato");
        eliminarButton.dataset.accion = "eliminar-plato";
        eliminarButton.dataset.id = String(plato.id || plato._id || "");
        eliminarButton.disabled = !eliminarButton.dataset.id;
        let icono = document.createElement("span");
        icono.className = "material-symbols-outlined action-icon";
        icono.textContent = "delete";
        eliminarButton.appendChild(icono);

        let acciones = document.createElement("div");
        acciones.className = "plato-acciones";
        acciones.append(editarButton, eliminarButton);
        item.append(imagen, contenido, acciones);
        container.appendChild(item);
    });

    actualizarPaginacionPlatos(paginaActualPlatos, totalPaginas);
    actualizarContadoresPlatos();
}

function crearPlaceholderImagen() {
    let placeholder = document.createElement("div");
    placeholder.className = "plato-imagen-placeholder";
    let icono = document.createElement("span");
    icono.className = "material-symbols-outlined";
    icono.textContent = "restaurant";
    placeholder.appendChild(icono);
    return placeholder;
}

function mostrarMensajePlatos(mensaje, color) {
    let container = document.getElementById("platosListContainer");
    if (!container) return;

    let texto = document.createElement("p");
    texto.className = "platos-list-message";
    texto.textContent = mensaje;
    texto.style.color = color;
    container.replaceChildren(texto);
}

function actualizarContadoresPlatos() {
    let disponibles = document.getElementById("platosDisponibles");
    let total = document.getElementById("platosTotales");
    if (disponibles) {
        disponibles.textContent = todosLosPlatos.filter(plato => Boolean(plato.disponible)).length;
    }
    if (total) total.textContent = todosLosPlatos.length;
}

function actualizarPaginacionPlatos(actual, total) {
    let elActual = document.getElementById("paginaActualPlatos");
    let elTotal = document.getElementById("totalPaginasPlatos");
    if (elActual) elActual.textContent = actual;
    if (elTotal) elTotal.textContent = total;

    let info = document.querySelector(".page-info");
    if (info) {
        const tpl = fnT("menu.paginacionInfo", "Mostrando {actual} de {total} páginas");
        info.innerHTML = tpl
            .replace("{actual}", `<span id="paginaActualPlatos">${actual}</span>`)
            .replace("{total}", `<span id="totalPaginasPlatos">${total}</span>`);
    }

    let btnAnterior = document.getElementById("btnPagAnteriorPlatos");
    let btnSiguiente = document.getElementById("btnPagSiguientePlatos");
    if (btnAnterior) {
        btnAnterior.disabled = actual <= 1;
        btnAnterior.style.opacity = actual <= 1 ? "0.45" : "1";
        btnAnterior.style.cursor = actual <= 1 ? "not-allowed" : "pointer";
    }
    if (btnSiguiente) {
        btnSiguiente.disabled = actual >= total;
        btnSiguiente.style.opacity = actual >= total ? "0.45" : "1";
        btnSiguiente.style.cursor = actual >= total ? "not-allowed" : "pointer";
    }
}

function paginaAnteriorPlatos() {
    if (paginaActualPlatos > 1) {
        paginaActualPlatos--;
        renderizarListaPlatos();
    }
}

function paginaSiguientePlatos() {
    let totalPaginas = Math.ceil(obtenerListaFiltradaPlatos().length / itemsPorPaginaPlatos);
    if (paginaActualPlatos < totalPaginas) {
        paginaActualPlatos++;
        renderizarListaPlatos();
    }
}

function configurarFiltrosPlatos() {
    let inputBuscar = document.getElementById("buscarPlato");
    let selectCategoria = document.getElementById("filtroCategoria");

    if (inputBuscar) {
        inputBuscar.addEventListener("input", function () {
            paginaActualPlatos = 1;
            renderizarListaPlatos();
        });
    }
    if (selectCategoria) {
        selectCategoria.addEventListener("change", function () {
            paginaActualPlatos = 1;
            renderizarListaPlatos();
        });
    }
}
let platoEnEdicion = null;

function configurarFormularioPlato() {
    let form = document.getElementById("formPlato");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        let nombre = document.getElementById("nombrePlato").value.trim();
        let descripcion = document.getElementById("descripcionPlato").value.trim();
        let categoria = document.getElementById("categoriaPlato").value;
        let precio = Number(document.getElementById("precioPlato").value);
        let archivo = document.getElementById("imagenPlato").files[0];
        let disponible = document.getElementById("disponiblePlato").checked;

        if (
            !nombre ||
            !descripcion ||
            !categoria ||
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            alert(fnT("menu.errorDatosInvalidos", "Completa los datos del plato con valores válidos."));
            return;
        }

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!platoEnEdicion && !archivo) {
            alert(fnT("menu.errorSeleccionarImagen", "Selecciona una imagen para el plato."));
            return;
        }

        if (archivo && !tiposPermitidos.includes(archivo.type)) {
            alert(fnT("menu.errorTipoImagen", "Selecciona una imagen JPG, PNG o WebP."));
            return;
        }

        if (archivo && archivo.size > 5 * 1024 * 1024) {
            alert(fnT("menu.errorTamanoImagen", "La imagen no debe superar los 5 MB."));
            return;
        }

        try {
            const datos = new FormData();
            datos.append("nombre", nombre);
            datos.append("descripcion", descripcion);
            datos.append("categoria", categoria);
            datos.append("precio", String(precio));
            datos.append("disponible", String(disponible));

            if (archivo) {
                datos.append("imagenPlato", archivo);
            }

            const editando = platoEnEdicion !== null;
            const url = editando
                ? `/api/admin/menu/${encodeURIComponent(platoEnEdicion)}`
                : "/api/admin/menu";

            const resp = await fetch(url, {
                method: editando ? "PUT" : "POST",
                headers: {
                    "Authorization": `Bearer ${obtenerTokenAdmin()}`
                },
                body: datos
            });

            if (!resp.ok) {
                const detalle = await resp.text();
                console.error(
                    `Error al guardar plato: ${resp.status}`,
                    detalle
                );
                alert(fnT("menu.errorGuardarServidor", "No se pudo guardar el plato. Revisa la consola."));
                return;
            }

            form.reset();
            platoEnEdicion = null;

            const botonGuardar = form.querySelector('[type="submit"]');
            if (botonGuardar) botonGuardar.textContent = fnT("menu.guardar", "AÑADIR PLATO");

            await cargarPlatos();
            alert(editando
                ? fnT("menu.exitoActualizar", "Plato actualizado correctamente.")
                : fnT("menu.exitoAnadir", "Plato añadido correctamente."));

        } catch (error) {
            console.error("Error al guardar plato:", error);
            alert(fnT("menu.errorGuardarRed", "Error de red al guardar el plato."));
        }
    });

    const botonLimpiar = form.querySelector('[type="reset"]');

    if (botonLimpiar) {
        botonLimpiar.addEventListener("click", function () {
            platoEnEdicion = null;

            const botonGuardar = form.querySelector('[type="submit"]');
            if (botonGuardar) botonGuardar.textContent = fnT("menu.guardar", "AÑADIR PLATO");
        });
    }
}

async function eliminarPlato(id) {
    if (!id || !confirm(fnT("menu.confirmarEliminar", "¿Está seguro de eliminar este plato permanentemente del menú?"))) return;

    let token = obtenerTokenAdmin();
    try {
        let resp = await fetch(`/api/admin/menu/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!resp.ok) {
            console.error(`Error al eliminar el plato: ${resp.status} ${resp.statusText}`);
            alert(fnT("menu.errorEliminarServidor", "No se pudo eliminar el plato en el servidor."));
            return;
        }

        await cargarPlatos();
    } catch (error) {
        console.error("Error al eliminar plato:", error);
        alert(fnT("menu.errorEliminarRed", "Error de red al eliminar el plato."));
    }
}

async function editarPlato(id) {
    let plato = todosLosPlatos.find(
        item => String(item.id || item._id || "") === String(id)
    );

    if (!id || !plato) {
        alert(fnT("menu.errorNoEncontrado", "No se encontró el plato que deseas editar."));
        return;
    }

    const form = document.getElementById("formPlato");
    if (!form) return;

    document.getElementById("nombrePlato").value = plato.nombre || "";
    document.getElementById("descripcionPlato").value = plato.descripcion || "";
    document.getElementById("categoriaPlato").value = plato.categoria || "";
    document.getElementById("precioPlato").value = plato.precio ?? "";
    document.getElementById("disponiblePlato").checked = Boolean(plato.disponible);

    // Los navegadores no permiten rellenar un input file
    // con una imagen guardada anteriormente.
    document.getElementById("imagenPlato").value = "";

    platoEnEdicion = String(id);

    const botonGuardar = form.querySelector('[type="submit"]');
    if (botonGuardar) botonGuardar.textContent = fnT("menu.guardarCambios", "GUARDAR CAMBIOS");

    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ===== EXPOSICIÓN GLOBAL Y EVENTOS =====
window.renderizarPlatos = renderizarListaPlatos;
window.todosLosPlatos = todosLosPlatos;
window.addEventListener("idiomaCambiado", function () {
    preTraducirPlatos(todosLosPlatos);
    if (typeof renderizarListaPlatos === "function") {
        renderizarListaPlatos();
    }
    if (typeof actualizarContadoresPlatos === "function") {
        actualizarContadoresPlatos();
    }
    const form = document.getElementById("formPlato");
    if (form) {
        const botonGuardar = form.querySelector('[type="submit"]');
        if (botonGuardar) {
            botonGuardar.textContent = fnT(platoEnEdicion ? "menu.guardarCambios" : "menu.guardar", platoEnEdicion ? "GUARDAR CAMBIOS" : "AÑADIR PLATO");
        }
    }
});