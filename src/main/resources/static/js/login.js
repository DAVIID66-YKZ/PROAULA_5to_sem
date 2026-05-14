async function login(event) {
    event.preventDefault();

    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ correo, contrasena })
        });

        if (!response.ok) {
            alert("Credenciales incorrectas");
            return;
        }

        const data = await response.json();

        // Guardar token para autorizar peticiones futuras
        localStorage.setItem("token", data.token);

        // 🔥 CRUCIAL: Guardar el usuarioId para enviarlo en las reservas
        localStorage.setItem("usuarioId", data.usuarioId);

        // Redirigir al usuario
        window.location.href = "/usuarios/bienvenida";

    } catch (error) {
        console.error("Error en el login:", error);
        alert("Ocurrió un error al intentar iniciar sesión");
    }
}