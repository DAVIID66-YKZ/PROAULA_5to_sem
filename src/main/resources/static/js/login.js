async function login(event) {
    event.preventDefault();

    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        if (!response.ok) {
            alert("Credenciales incorrectas");
            return;
        }

        // En tu función de login.js
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuarioId", data.usuarioId);
        localStorage.setItem("nombreUsuario", data.nombre);
        localStorage.setItem("rol", data.rol); // 🔥 REGLA DE ORO: Debe ser 'rol'

        // 2. VERIFICACIÓN DE ROL PARA REDIRECCIÓN
        const rolUpper = String(data.rol || "").trim().toUpperCase();
        if (rolUpper === "CLIENTE" || rolUpper === "ROLE_CLIENTE") {
            window.location.href = "/cliente/dashboard";
        } else if (rolUpper === "ADMIN" || rolUpper === "ROLE_ADMIN") {
            window.location.href = "/dashboardAdmin";
        } else {
            // Caso por defecto si hay otros roles
            window.location.href = "/index";
        }

    } catch (error) {
        console.error("Error en el login:", error);
        alert("Ocurrió un error al intentar iniciar sesión");
    }
}