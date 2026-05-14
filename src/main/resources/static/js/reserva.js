async function guardarReserva(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    const idUsuarioActual = localStorage.getItem("usuarioId");

    const reservaData = {
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        numeroPersonas: parseInt(document.getElementById("personas").value),
        // Aquí enviamos el sector (ej: "Mesa-Ventana")
        mesaId: document.querySelector('input[name="experiencia"]:checked').value,
        usuarioId: idUsuarioActual
    };

    try {
        // ... dentro de guardarReserva ...
        const response = await fetch("/reservas/guardar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(reservaData)
        });

        if (response.ok) {
            alert("¡Reserva exitosa! Mesa asignada automáticamente.");
            window.location.href = "/usuarios/bienvenida";
        } else {
            // Aquí capturamos el mensaje de "Lo sentimos, no hay mesas disponibles..."
            const errorMsg = await response.text();
            alert(errorMsg);
        }
    } catch (error) {
        alert("Error de conexión");
    }
}