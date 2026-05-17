/* ================================================================
   LÓGICA DE MIS RESERVAS - THE CULINARY MANUSCRIPT
   ================================================================ */
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    // Si no hay token o el rol no es CLIENTE, redirigir al login inmediatamente
    if (!token || rol !== "CLIENTE") {
        console.warn("Acceso no autorizado detectado. Redirigiendo...");
        window.location.href = "/login";
    }
})();
document.addEventListener("DOMContentLoaded", () => {
    // Al cargar la página, recuperamos el historial del usuario
    cargarMisReservas();
});

/**
 * Obtiene las reservas del usuario desde el servidor y llena la tabla
 */
async function cargarMisReservas() {
    const token = localStorage.getItem("token");
    const idUsuario = localStorage.getItem("usuarioId");
    const tbody = document.getElementById("listaReservasBody");

    // Seguridad: Si no hay token o ID, rebote al login
    if (!token || !idUsuario) {
        window.location.href = "/login";
        return;
    }

    try {
        const response = await fetch(`/reservas/usuario/${idUsuario}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const reservas = await response.json();
            tbody.innerHTML = ""; // Limpiar el mensaje de carga

            if (reservas.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding: 80px; color: #666;">
                            <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 10px;">history_edu</span>
                            Aún no has escrito capítulos en tu historia culinaria.
                        </td>
                    </tr>`;
                return;
            }

            // Mapear y dibujar las reservas
            reservas.forEach(res => {
                // Limpiamos el texto de la experiencia (quita el "Mesa-")
                const nombreExperiencia = res.experiencia ? res.experiencia.replace('Mesa-', '') : 'Estándar';

                tbody.innerHTML += `
                    <tr>
                        <td class="serif-gold">${res.fecha}</td>
                        <td>${res.hora}</td>
                        <td>${res.numeroPersonas} personas</td>
                        <td><span class="gold-text">${nombreExperiencia}</span></td>
                        <td><span class="status-pill pill-confirmed">Confirmada</span></td>
                        <td>
                            <button class="btn-icon-table" onclick="verDetalle('${res.id}')" title="Ver Detalle">
                                <span class="material-symbols-outlined">visibility</span>
                            </button>
                            <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="Cancelar Reserva">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else if (response.status === 403 || response.status === 401) {
            // Si el token es inválido o expiró
            localStorage.clear();
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error al cargar:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ff4444; padding: 20px;">Error de conexión con el servidor.</td></tr>`;
    }
}

/**
 * Elimina una reserva y libera la mesa asociada
 * @param {string} id - ID de la reserva a eliminar
 */
async function cancelarReserva(id) {
    const token = localStorage.getItem("token");

    if (!confirm("¿Deseas cancelar esta reserva? Esta acción liberará tu mesa en el manuscrito y no se puede deshacer.")) {
        return;
    }

    try {
        const response = await fetch(`/reservas/eliminar/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Reserva cancelada con éxito. La mesa ha sido liberada.");
            // Recargamos la lista para reflejar los cambios
            cargarMisReservas();
        } else {
            const msg = await response.text();
            alert("No se pudo cancelar: " + msg);
        }
    } catch (error) {
        alert("Error al conectar con el servidor.");
    }
}

/**
 * Función extra para ver detalles (opcional)
 */
function verDetalle(id) {
    console.log("Consultando detalle de la reserva:", id);
    // Aquí podrías abrir un modal con más info
} 