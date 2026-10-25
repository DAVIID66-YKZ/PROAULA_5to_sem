// ================================================================
// LÓGICA DE MI PERFIL - CLIENTE - GESTREST
// ================================================================

// 1. Guardián de Validación Inmediata de Sesión y Rol
(function() {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const rol = localStorage.getItem("rol");
    const rolUpper = String(rol || "").trim().toUpperCase();

    if (!token || (rolUpper !== "CLIENTE" && rolUpper !== "ROLE_CLIENTE" && rolUpper !== "ADMIN" && rolUpper !== "ROLE_ADMIN")) {
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const idUsuario = localStorage.getItem("usuarioId");

    // Cargar la información actual del usuario al abrir la vista
    if (idUsuario && token) {
        obtenerDatosUsuario(token, idUsuario);
    }

    // Escuchador del formulario de datos personales
    const perfilForm = document.getElementById("perfilForm");
    if (perfilForm) {
        perfilForm.addEventListener("submit", (e) => {
            e.preventDefault();
            actualizarDatosUsuario(token, idUsuario);
        });
    }

    // Escuchador del formulario de cambio de contraseña
    const formPasswordCliente = document.getElementById("formPasswordCliente");
    if (formPasswordCliente) {
        formPasswordCliente.addEventListener("submit", (e) => {
            e.preventDefault();
            cambiarPasswordCliente(token, idUsuario);
        });
    }

    // Escuchador para evaluar la fortaleza de la nueva contraseña en tiempo real
    const inputPasswordNueva = document.getElementById("passwordNuevaCliente");
    if (inputPasswordNueva) {
        inputPasswordNueva.addEventListener("input", validarFortalezaCliente);
    }
});

// ================================================================
// 2. CONSULTAR DATOS DEL USUARIO
// ================================================================
async function obtenerDatosUsuario(token, idUsuario) {
    try {
        const response = await fetch(`/usuarios/${idUsuario}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const usuario = await response.json();

            // Poblar las cajas del formulario HTML
            const inputNombre = document.getElementById("perfilNombre");
            const inputApellido = document.getElementById("perfilApellido");
            const inputCorreo = document.getElementById("perfilCorreo");
            const inputTelefono = document.getElementById("perfilTelefono");
            const inputDireccion = document.getElementById("perfilDireccion");

            if (inputNombre) inputNombre.value = usuario.nombre || "";
            if (inputApellido) inputApellido.value = usuario.apellido || "";
            if (inputCorreo) inputCorreo.value = usuario.correo || "";
            if (inputTelefono) inputTelefono.value = usuario.telefono || "";
            if (inputDireccion) inputDireccion.value = usuario.direccion || "";
        } else {
            console.error("Error al obtener los datos del usuario:", response.status);
        }
    } catch (error) {
        console.error("Error de comunicación en perfil:", error);
    }
}

// ================================================================
// 3. ACTUALIZAR DATOS PERSONALES
// ================================================================
async function actualizarDatosUsuario(token, idUsuario) {
    const btn = document.getElementById("btnActualizarDatos");
    const textoOriginal = btn ? btn.innerHTML : "Actualizar Datos";

    const nombre = (document.getElementById("perfilNombre")?.value || "").trim();
    const apellido = (document.getElementById("perfilApellido")?.value || "").trim();
    const telefono = (document.getElementById("perfilTelefono")?.value || "").trim();
    const direccion = (document.getElementById("perfilDireccion")?.value || "").trim();

    if (!nombre || !apellido) {
        alert("El nombre y el apellido son obligatorios.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined">hourglass_empty</span> Guardando...`;
    }

    try {
        const response = await fetch(`/usuarios/actualizar/${idUsuario}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, apellido, telefono, direccion })
        });

        if (response.ok) {
            localStorage.setItem("nombreUsuario", nombre);
            const navUser = document.getElementById("userName");
            if (navUser) navUser.textContent = nombre;

            alert("✅ Información de perfil actualizada con éxito.");
        } else {
            const errorMsg = await response.text();
            alert("❌ No se pudo actualizar el perfil: " + errorMsg);
        }
    } catch (error) {
        console.error("Error al guardar datos:", error);
        alert("Ocurrió un error de conexión con el servidor.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    }
}

// ================================================================
// 4. CAMBIO DE CONTRASEÑA
// ================================================================
async function cambiarPasswordCliente(token, idUsuario) {
    const actual = (document.getElementById("passwordActualCliente")?.value || "").trim();
    const nueva = (document.getElementById("passwordNuevaCliente")?.value || "").trim();
    const confirmar = (document.getElementById("passwordConfirmarCliente")?.value || "").trim();
    const btn = document.getElementById("btnCambiarPassword");
    const textoOriginal = btn ? btn.innerHTML : "Cambiar Contraseña";

    ocultarErrorPasswordCliente();

    // Validaciones en cliente
    if (!actual || !nueva || !confirmar) {
        mostrarErrorPasswordCliente("Por favor completa todos los campos de contraseña.");
        return;
    }

    if (nueva.length < 8) {
        mostrarErrorPasswordCliente("La nueva contraseña debe tener mínimo 8 caracteres.");
        return;
    }

    if (nueva !== confirmar) {
        mostrarErrorPasswordCliente("La nueva contraseña y su confirmación no coinciden.");
        return;
    }

    if (actual === nueva) {
        mostrarErrorPasswordCliente("La nueva contraseña debe ser diferente a la actual.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined">hourglass_empty</span> Cambiando...`;
    }

    try {
        const response = await fetch(`/usuarios/cambiar-password/${idUsuario}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                passwordActual: actual,
                passwordNueva: nueva
            })
        });

        if (response.ok) {
            alert("✨ ¡Contraseña actualizada exitosamente! Tu cuenta ahora cuenta con nuevas credenciales.");
            limpiarFormularioPasswordCliente();
        } else {
            const errorMsg = await response.text();
            mostrarErrorPasswordCliente(errorMsg || "La contraseña actual no es correcta.");
        }
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        mostrarErrorPasswordCliente("Error de conexión al intentar cambiar la contraseña.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    }
}

// ================================================================
// 5. MEDIDOR DE FORTALEZA Y HELPERS DE CONTRASEÑA
// ================================================================
function validarFortalezaCliente() {
    const password = document.getElementById("passwordNuevaCliente")?.value || "";
    const barra = document.getElementById("barraFortalezaCliente");
    const texto = document.getElementById("textoFortalezaCliente");

    if (!barra || !texto) return;

    if (!password) {
        barra.style.width = "0%";
        barra.style.backgroundColor = "#ff5555";
        texto.textContent = "Muy débil";
        texto.style.color = "#888888";
        return;
    }

    let nivel = 0;
    if (password.length >= 8) nivel++;
    if (/[A-Z]/.test(password)) nivel++;
    if (/[a-z]/.test(password)) nivel++;
    if (/\d/.test(password)) nivel++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) nivel++;

    const porcentaje = (nivel / 5) * 100;
    barra.style.width = porcentaje + "%";

    if (nivel <= 2) {
        barra.style.backgroundColor = "#ff5555";
        texto.textContent = "Seguridad: Débil (mínimo 8 caracteres, números y letras)";
        texto.style.color = "#ff7777";
    } else if (nivel === 3 || nivel === 4) {
        barra.style.backgroundColor = "#e0aa3e";
        texto.textContent = "Seguridad: Aceptable (puedes agregar símbolos para mayor protección)";
        texto.style.color = "#e0aa3e";
    } else {
        barra.style.backgroundColor = "#4caf50";
        texto.textContent = "Seguridad: Fuerte y Segura ✨";
        texto.style.color = "#4caf50";
    }
}

function mostrarErrorPasswordCliente(mensaje) {
    const contenedor = document.getElementById("mensajeErrorCliente");
    const texto = document.getElementById("textoErrorCliente");

    if (contenedor && texto) {
        texto.textContent = mensaje;
        contenedor.classList.add("show");
        contenedor.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
        alert(mensaje);
    }
}

function ocultarErrorPasswordCliente() {
    const contenedor = document.getElementById("mensajeErrorCliente");
    if (contenedor) {
        contenedor.classList.remove("show");
    }
}

function limpiarFormularioPasswordCliente() {
    const form = document.getElementById("formPasswordCliente");
    if (form) form.reset();

    const barra = document.getElementById("barraFortalezaCliente");
    const texto = document.getElementById("textoFortalezaCliente");
    if (barra) {
        barra.style.width = "0%";
        barra.style.backgroundColor = "#ff5555";
    }
    if (texto) {
        texto.textContent = "Muy débil";
        texto.style.color = "#888888";
    }

    ocultarErrorPasswordCliente();
}

function togglePasswordCliente(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    btn.title = isPassword ? "Ocultar contraseña" : "Mostrar contraseña";
    btn.setAttribute("aria-label", btn.title);

    btn.innerHTML = isPassword
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
           </svg>`;
}

// Exponer helpers en window
window.togglePasswordCliente = togglePasswordCliente;
window.validarFortalezaCliente = validarFortalezaCliente;