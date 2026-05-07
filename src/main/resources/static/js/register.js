async function register(event) {
    event.preventDefault(); // Evita que la página se recargue

    
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;
    const direccion = document.getElementById("direccion").value;
    const telefono = document.getElementById("telefono").value;

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
            // Guardamos el token que devuelve el registro exitoso
            localStorage.setItem("token", data.token);
            alert("¡Registro exitoso!");
            window.location.href = "/login"; // O directamente al index
        } else {
            const errorMsg = await response.text();
            alert("Error al registrar: " + errorMsg);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo conectar con el servidor.");
    }
}