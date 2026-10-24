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
    const textoOriginal = btn ? btn.innerHTML : "REGISTRARME";

    if (btn) {
        btn.disabled = true;
        btn.classList.add("is-loading");
        btn.innerHTML = `<span class="btn-spinner"></span><span>Creando cuenta...</span>`;
    }

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
            localStorage.setItem("token", data.token);
            alert("¡Registro exitoso! Ya puedes iniciar sesión.");
            window.location.href = "/login";
        } else {
            const errorMsg = await response.text();
            alert("Error al registrar: " + errorMsg);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove("is-loading");
                btn.innerHTML = textoOriginal;
            }
        }

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo conectar con el servidor.");
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("is-loading");
            btn.innerHTML = textoOriginal;
        }
    }
}