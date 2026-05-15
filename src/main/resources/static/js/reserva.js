async function guardarReserva(event) {
    event.preventDefault();

    // 1. COMPROBACIÓN DE SESIÓN
    const token = localStorage.getItem("token");
    const idUsuarioActual = localStorage.getItem("usuarioId");

    if (!token || !idUsuarioActual) {
        alert("Tu sesión ha expirado o no has iniciado sesión. Por favor, entra a tu cuenta.");
        window.location.href = "/login"; // Asegúrate de que esta sea la ruta de tu login
        return; // Detiene la ejecución de la función
    }

    // 2. RECOLECCIÓN DE DATOS
    // Validación básica antes de enviar
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const personas = document.getElementById("personas").value;
    const experiencia = document.querySelector('input[name="experiencia"]:checked');

    if (!fecha || !hora || !personas || !experiencia) {
        alert("Por favor, completa todos los campos del formulario.");
        return;
    }

    const reservaData = {
        fecha: fecha,
        hora: hora,
        numeroPersonas: parseInt(personas),
        // mesaId lleva el nombre del sector para que el backend busque la mesa real
        mesaId: experiencia.value, 
        usuarioId: idUsuarioActual
    };

    // 3. ENVÍO AL BACKEND
    try {
        const response = await fetch("/reservas/guardar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(reservaData)
        });

        if (response.ok) {
            alert("¡Reserva exitosa! Mesa asignada automáticamente.");
            window.location.href = "/reserva";
        } else {
            // Manejo de errores del backend (ej: No hay mesas, error de capacidad, etc.)
            const errorMsg = await response.text();
            alert("Atención: " + errorMsg);
            
            // Si el backend responde 403 o 401, es que el token no es válido
            if (response.status === 401 || response.status === 403) {
                localStorage.clear(); // Limpiamos sesión corrupta
                window.location.href = "/login";
            }
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor. Inténtalo más tarde.");
    }
}