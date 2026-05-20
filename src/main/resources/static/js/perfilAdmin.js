// ===================================================================
// PERFIL ADMIN - FUNCIONAL CON BACKEND + JWT
// ===================================================================

// ======================================================
// VALIDAR SESIÓN Y ROL
// ======================================================

(function () {

    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || String(rol).trim().toUpperCase() !== "ADMIN") {

        window.location.href = "/login";

    }

})();

// ======================================================
// CLASE PERFIL ADMIN
// ======================================================

class PerfilAdmin {

    constructor() {

        this.perfilCargado = false;

        this.formPerfil = null;
        this.formPassword = null;

        this.inputNuevaPassword = null;

        this.barraMensajeError = null;
        this.textoFortaleza = null;

    }

    // ======================================================
    // INICIALIZAR
    // ======================================================

    inicializar() {

        if (this.perfilCargado) return;

        this.formPerfil = document.getElementById("formPerfil");
        this.formPassword = document.getElementById("formPassword");

        this.inputNuevaPassword = document.getElementById("passwordNueva");

        this.barraMensajeError = document.getElementById("mensajeError");
        this.textoFortaleza = document.getElementById("textoFortaleza");

        this.configurarEventos();

        this.cargarDelBackend();

        this.perfilCargado = true;

        console.log("✓ Perfil Admin Inicializado");

    }

    // ======================================================
    // CONFIGURAR EVENTOS
    // ======================================================

    configurarEventos() {

        // ACTUALIZAR PERFIL
        if (this.formPerfil) {

            this.formPerfil.addEventListener("submit", (e) => {

                this.handleSubmitPerfil(e);

            });

        }

        // CAMBIAR PASSWORD
        if (this.formPassword) {

            this.formPassword.addEventListener("submit", (e) => {

                this.handleSubmitPassword(e);

            });

        }

        // FORTALEZA PASSWORD
        if (this.inputNuevaPassword) {

            this.inputNuevaPassword.addEventListener("input", () => {

                this.validarFortaleza();

            });

        }

    }

    // ======================================================
    // CARGAR PERFIL DESDE BACKEND
    // ======================================================

    async cargarDelBackend() {

        const usuarioId = localStorage.getItem("usuarioId");
        const token = localStorage.getItem("token");

        if (!usuarioId || !token) {

            console.error("No existe usuarioId o token");
            return;

        }

        try {

            const response = await fetch(`/usuarios/${usuarioId}`, {

                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }

            });

            if (!response.ok) {

                throw new Error("No se pudo cargar el perfil");

            }

            const usuario = await response.json();

            this.setValorInput("nombrePerfil", usuario.nombre);
            this.setValorInput("apellidoPerfil", usuario.apellido);
            this.setValorInput("correoPerfil", usuario.correo);
            this.setValorInput("telefonoPerfil", usuario.telefono);
            this.setValorInput("direccionPerfil", usuario.direccion);
            this.setValorInput("rolPerfil", usuario.rol);

            console.log("✓ Perfil cargado correctamente");

        } catch (error) {

            console.error("❌ Error cargando perfil:", error);

        }

    }

    // ======================================================
    // ACTUALIZAR PERFIL
    // ======================================================

    async handleSubmitPerfil(e) {

        e.preventDefault();

        const nombre = this.getValorInput("nombrePerfil");
        const apellido = this.getValorInput("apellidoPerfil");
        const telefono = this.getValorInput("telefonoPerfil");
        const direccion = this.getValorInput("direccionPerfil");

        if (!nombre || !apellido) {

            alert("Completa nombre y apellido");
            return;

        }

        const payload = {

            nombre,
            apellido,
            telefono,
            direccion

        };

        await this.guardarEnBackend(payload);

    }

    // ======================================================
    // GUARDAR BACKEND
    // ======================================================

    async guardarEnBackend(payload) {

        const usuarioId = localStorage.getItem("usuarioId");
        const token = localStorage.getItem("token");

        try {

            const response = await fetch(`/usuarios/actualizar/${usuarioId}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(payload)

            });

            if (response.ok) {

                alert("✅ Perfil actualizado correctamente");
                if (response.ok) {
    alert("✅ Perfil actualizado correctamente");
    localStorage.setItem("nombreUsuario", payload.nombre);
    this.actualizarNombreGlobal(payload.nombre);
    // Redirigir al panel después de 1 segundo
    setTimeout(() => {
        window.location.href = "/dashboardAdmin";
    }, 1000);
}

                localStorage.setItem("nombreUsuario", payload.nombre);

                this.actualizarNombreGlobal(payload.nombre);

            } else {

                alert("❌ Error al actualizar perfil");

            }

        } catch (error) {

            console.error(error);

            alert("❌ Error del servidor");

        }

    }

    // ======================================================
    // CAMBIAR PASSWORD
    // ======================================================
async handleSubmitPassword(e) {
    e.preventDefault();

    const actual = this.getValorInput("passwordActual");
    const nueva = this.getValorInput("passwordNueva");
    const confirmar = this.getValorInput("passwordConfirmar");

    if (!actual || !nueva || !confirmar) {
        this.mostrarError("Completa todos los campos");
        return;
    }
    if (nueva.length < 8) {
        this.mostrarError("La contraseña debe tener mínimo 8 caracteres");
        return;
    }
    if (nueva !== confirmar) {
        this.mostrarError("Las contraseñas no coinciden");
        return;
    }

    const usuarioId = localStorage.getItem("usuarioId");
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/usuarios/cambiar-password/${usuarioId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva })
        });

        if (response.ok) {
            alert("✅ Contraseña actualizada correctamente.");
            this.limpiarFormularioPassword();
        } else {
            const msg = await response.text();
            this.mostrarError(msg || "Error al cambiar la contraseña.");
        }
    } catch (error) {
        this.mostrarError("Error de conexión con el servidor.");
    }
}

    // ======================================================
    // VALIDAR FORTALEZA
    // ======================================================

    validarFortaleza() {

        const password = this.getValorInput("passwordNueva");

        const barra = document.querySelector(".perfil-strength-bar");

        if (!barra) return;

        let nivel = 0;

        if (password.length >= 8) nivel++;
        if (/[A-Z]/.test(password)) nivel++;
        if (/[a-z]/.test(password)) nivel++;
        if (/\d/.test(password)) nivel++;
        if (/[!@#$%^&*]/.test(password)) nivel++;

        const porcentaje = (nivel / 5) * 100;

        barra.style.width = porcentaje + "%";

        let texto = "Muy débil";

        if (nivel >= 4) {

            texto = "Contraseña fuerte";

        } else if (nivel >= 3) {

            texto = "Contraseña media";

        }

        if (this.textoFortaleza) {

            this.textoFortaleza.textContent = texto;

        }

    }

    // ======================================================
    // MOSTRAR ERROR
    // ======================================================

    mostrarError(mensaje) {

        const textoError = document.getElementById("textoError");

        if (this.barraMensajeError && textoError) {

            textoError.textContent = mensaje;

            this.barraMensajeError.classList.add("show");

            setTimeout(() => {

                this.barraMensajeError.classList.remove("show");

            }, 4000);

        } else {

            alert(mensaje);

        }

    }

    // ======================================================
    // LIMPIAR PASSWORD
    // ======================================================

    limpiarFormularioPassword() {

        if (this.formPassword) {

            this.formPassword.reset();

        }

        const barra = document.querySelector(".perfil-strength-bar");

        if (barra) {

            barra.style.width = "0%";

        }

    }

    // ======================================================
    // ACTUALIZAR NOMBRE GLOBAL
    // ======================================================

    actualizarNombreGlobal(nombre) {

        const perfiles = document.querySelectorAll(".profile-name");

        perfiles.forEach(el => {

            el.textContent = nombre.toUpperCase();

        });

    }

    // ======================================================
    // HELPERS
    // ======================================================

    setValorInput(id, valor) {

        const input = document.getElementById(id);

        if (input) {

            input.value = valor || "";

        }

    }

    getValorInput(id) {

        const input = document.getElementById(id);

        return input ? input.value.trim() : "";

    }

}

// ======================================================
// INSTANCIA GLOBAL
// ======================================================

let perfilAdminInstance = null;

// ======================================================
// CARGAR PERFIL
// ======================================================

function cargarPerfilCompleto() {

    if (!perfilAdminInstance) {

        perfilAdminInstance = new PerfilAdmin();

    }

    perfilAdminInstance.inicializar();

}

// ======================================================
// MOSTRAR / OCULTAR PASSWORD
// ======================================================

function mostrarPassword() {

    const container = document.getElementById("passwordContainer");

    if (container.style.display === "none") {

        container.style.display = "block";

    } else {

        container.style.display = "none";

    }

}


// ======================================================
// AUTO INICIAR
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    cargarPerfilCompleto();

});