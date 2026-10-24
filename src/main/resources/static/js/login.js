function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    btn.title = isPassword ? "Ocultar contraseña" : "Mostrar contraseña";
    btn.setAttribute("aria-label", btn.title);

    // Cambiar icono SVG (Ojo abierto / Ojo tachado)
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

async function login(event) {
    event.preventDefault();

    const correo = (document.getElementById("correo").value || "").trim();
    const contrasena = document.getElementById("contrasena").value;

    if (contrasena.length < 8) {
        alert("La contraseña debe tener un mínimo de 8 caracteres.");
        return;
    }

    const btn = document.getElementById("btnLogin") || document.querySelector(".login-button");
    const textoOriginal = btn ? btn.innerHTML : "INGRESAR";

    // Activar indicador de carga
    if (btn) {
        btn.disabled = true;
        btn.classList.add("is-loading");
        btn.innerHTML = `<span class="btn-spinner"></span><span>Iniciando sesión...</span>`;
    }

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        if (!response.ok) {
            alert("Credenciales incorrectas");
            if (btn) {
                btn.disabled = false;
                btn.classList.remove("is-loading");
                btn.innerHTML = textoOriginal;
            }
            return;
        }

        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuarioId", data.usuarioId);
        localStorage.setItem("nombreUsuario", data.nombre);
        localStorage.setItem("rol", data.rol);

        // Verificación de rol para redirección
        const rolUpper = String(data.rol || "").trim().toUpperCase();
        if (rolUpper === "CLIENTE" || rolUpper === "ROLE_CLIENTE") {
            window.location.href = "/cliente/dashboard";
        } else if (rolUpper === "ADMIN" || rolUpper === "ROLE_ADMIN") {
            window.location.href = "/dashboardAdmin";
        } else {
            window.location.href = "/index";
        }

    } catch (error) {
        console.error("Error en el login:", error);
        alert("Ocurrió un error al intentar iniciar sesión");
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("is-loading");
            btn.innerHTML = textoOriginal;
        }
    }
}