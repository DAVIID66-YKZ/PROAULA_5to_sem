function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    btn.title = isPassword ? "Ocultar contraseña" : "Mostrar contraseña";
    btn.setAttribute("aria-label", btn.title);

    btn.innerHTML = isPassword
        ? `<svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`
        : `<svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
           </svg>`;
}

function getResponseMessage(data, fallback) {
    if (data && typeof data === "object" && data.message) {
        return data.message;
    }
    return typeof data === "string" && data.trim() ? data : fallback;
}

async function readResponseMessage(response, fallback) {
    const body = await response.text();
    if (!body) return fallback;

    try {
        return getResponseMessage(JSON.parse(body), fallback);
    } catch {
        return body;
    }
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
    button.textContent = isLoading ? loadingText : defaultText;
}

let verificationEmail = "";
let resendTimer;

function openVerificationModal(email) {
    const modal = document.getElementById("verificationModal");
    verificationEmail = email;
    document.getElementById("verificationEmail").textContent = email;
    document.getElementById("verificationCode").value = "";
    document.getElementById("verificationMessage").textContent = "";
    modal.hidden = false;
    startResendCountdown(60);
    document.getElementById("verificationCode").focus();
}

function startResendCountdown(seconds) {
    const button = document.getElementById("btnResendCode");
    let remaining = seconds;

    clearInterval(resendTimer);
    button.disabled = true;
    button.innerHTML = `Reenviar código en <span id="resendCountdown">${remaining}</span> s`;

    resendTimer = setInterval(() => {
        remaining -= 1;
        const countdownElement = document.getElementById("resendCountdown");
        if (countdownElement) countdownElement.textContent = remaining;

        if (remaining <= 0) {
            clearInterval(resendTimer);
            button.disabled = false;
            button.textContent = "REENVIAR CÓDIGO";
        }
    }, 1000);
}

async function register(event) {
    event.preventDefault();

    const nombre = (document.getElementById("nombre").value || "").trim();
    const apellido = (document.getElementById("apellido").value || "").trim();
    const correo = (document.getElementById("correo").value || "").trim();
    const contrasena = document.getElementById("contrasena").value;
    const direccion = (document.getElementById("direccion").value || "").trim();
    const telefono = (document.getElementById("telefono").value || "").trim();

    if (contrasena.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    const btn = document.getElementById("btnRegister") || document.querySelector(".login-button");
    setButtonLoading(btn, true, "Creando cuenta...", "REGISTRARME");

    try {
        const response = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                apellido,
                correo,
                contrasena,
                direccion,
                telefono
            })
        });

        if (response.ok) {
            const data = await response.json();
            setButtonLoading(btn, false, "Creando cuenta...", "REGISTRARME");
            openVerificationModal(data.correo || correo);
        } else {
            const errorMsg = await readResponseMessage(response, "No se pudo completar el registro.");
            alert("Error al registrar: " + errorMsg);
            setButtonLoading(btn, false, "Creando cuenta...", "REGISTRARME");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo conectar con el servidor.");
        setButtonLoading(btn, false, "Creando cuenta...", "REGISTRARME");
    }
}

async function verifyEmail(event) {
    event.preventDefault();

    const code = document.getElementById("verificationCode").value.trim();
    const message = document.getElementById("verificationMessage");
    const button = document.getElementById("btnVerify");

    if (!/^\d{6}$/.test(code)) {
        message.textContent = "Ingresa el código de 6 dígitos.";
        message.className = "verification-message is-error";
        return;
    }

    setButtonLoading(button, true, "Verificando...", "VERIFICAR CORREO");
    message.textContent = "";
    message.className = "verification-message";

    try {
        const response = await fetch("/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: verificationEmail, codigo: code })
        });

        if (!response.ok) {
            message.textContent = await readResponseMessage(response, "No se pudo verificar el correo.");
            message.className = "verification-message is-error";
            return;
        }

        message.textContent = "Correo verificado. Redirigiendo al inicio de sesión...";
        message.className = "verification-message is-success";
        clearInterval(resendTimer);
        window.setTimeout(() => {
            window.location.href = "/login";
        }, 1200);
    } catch (error) {
        console.error("Error al verificar el correo:", error);
        message.textContent = "No se pudo conectar con el servidor. Inténtalo nuevamente.";
        message.className = "verification-message is-error";
    } finally {
        setButtonLoading(button, false, "Verificando...", "VERIFICAR CORREO");
    }
}

async function resendVerificationCode() {
    const button = document.getElementById("btnResendCode");
    const message = document.getElementById("verificationMessage");

    button.disabled = true;
    button.textContent = "Enviando código...";
    message.textContent = "";
    message.className = "verification-message";

    try {
        const response = await fetch("/auth/resend-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: verificationEmail })
        });

        if (!response.ok) {
            message.textContent = await readResponseMessage(response, "No se pudo reenviar el código.");
            message.className = "verification-message is-error";
            button.disabled = false;
            button.textContent = "REENVIAR CÓDIGO";
            return;
        }

        message.textContent = "Enviamos un nuevo código a tu correo.";
        message.className = "verification-message is-success";
        startResendCountdown(60);
    } catch (error) {
        console.error("Error al reenviar el código:", error);
        message.textContent = "No se pudo conectar con el servidor. Inténtalo nuevamente.";
        message.className = "verification-message is-error";
        button.disabled = false;
        button.textContent = "REENVIAR CÓDIGO";
    }
}

// Mostrar aviso en la pantalla de registro si el usuario viene con una reserva en el carrito
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("verificationForm").addEventListener("submit", verifyEmail);
    document.getElementById("btnResendCode").addEventListener("click", resendVerificationCode);

    const tieneCarrito = localStorage.getItem("reservaCarrito");
    if (tieneCarrito) {
        const form = document.querySelector(".register-form");
        const subtitle = document.querySelector(".register-subtitle");
        if (form && subtitle) {
            const aviso = document.createElement("div");
            aviso.className = "aviso-reserva-pendiente";
            aviso.style.cssText = "background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); color: #f5d77f; padding: 10px 14px; border-radius: 8px; font-size: 0.88rem; margin-bottom: 18px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;";
            aviso.innerHTML = `<span>🛒</span><span>Tienes una reserva en tu carrito. Completa tu registro para confirmarla.</span>`;
            subtitle.insertAdjacentElement("afterend", aviso);
        }
    }
});