/* ================================================================
   LÓGICA DE MIS RESERVAS - THE CULINARY MANUSCRIPT
   ================================================================ */
(function() {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || rol !== "CLIENTE") {
        console.warn("Acceso no autorizado detectado. Redirigiendo...");
        window.location.href = "/login";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    cargarMisReservas();
});

/**
 * Obtiene las reservas del usuario desde el servidor y llena la tabla
 */
async function cargarMisReservas() {
    const token = localStorage.getItem("token");
    const idUsuario = localStorage.getItem("usuarioId");
    const tbody = document.getElementById("listaReservasBody");

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
            tbody.innerHTML = ""; 

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

            const ahora = new Date();

            reservas.forEach(res => {
                const nombreExperiencia = res.experiencia ? res.experiencia.replace('Mesa-', '') : 'Estándar';
                
                // Comparación cronológica estricta con la hora del sistema
                const fechaReserva = new Date(`${res.fecha}T${res.hora}`);
                const yaPaso = fechaReserva < ahora;

                let estadoBadge = `<span class="status-pill">Confirmada</span>`;
                let botonAccion = `
                    <button class="btn-icon-table btn-cancel" onclick="cancelarReserva('${res.id}')" title="Cancelar Reserva">
                        <span class="material-symbols-outlined">delete</span>
                    </button>`;

                // Si la reserva ya pasó en el tiempo
                if (yaPaso) {
                    estadoBadge = `<span class="status-pill pill-past">Completada</span>`;
                    
                    const tieneComentario = res.comentario && res.comentario !== "null" && res.comentario.trim() !== "";
                    const icono = tieneComentario ? "rate_review" : "chat_bubble";
                    const estiloDorado = tieneComentario ? "style='color: #d4af37;'" : "";
                    
                    // Escapamos el texto del comentario para pasarlo de forma segura al modal sin romper el HTML
                    const comentarioSanitizado = tieneComentario ? encodeURIComponent(res.comentario) : "";

                    botonAccion = `
                        <button class="btn-icon-table" onclick="abrirModalComentario('${res.id}', '${comentarioSanitizado}')" title="Dejar Comentario">
                            <span class="material-symbols-outlined" ${estiloDorado}>${icono}</span>
                        </button>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="serif-gold">${res.fecha}</td>
                        <td>${res.hora}</td>
                        <td>${res.numeroPersonas} personas</td>
                        <td><span class="gold-text">${nombreExperiencia}</span></td>
                        <td>${estadoBadge}</td>
                        <td>${botonAccion}</td>
                    </tr>
                `;
            });
        } else if (response.status === 403 || response.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error al cargar:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ff4444; padding: 20px;">Error de conexión con el servidor.</td></tr>`;
    }
}

/**
 * Elimina una reserva futura del sistema
 */
async function cancelarReserva(id) {
    const token = localStorage.getItem("token");

    if (!confirm("¿Deseas cancelar esta reserva? Esta acción liberará tu mesa en el manuscrito y no se puede deshacer.")) {
        return;
    }

    try {
        const response = await fetch(`/reservas/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Reserva cancelada con éxito. La mesa ha sido liberada.");
            cargarMisReservas();
        } else {
            const msg = await response.text();
            alert("No se pudo cancelar: " + msg);
        }
    } catch (error) {
        alert("Error al conectar con el servidor.");
    }
}

// --- GESTIÓN INTERACTIVA DEL MODAL ---
function abrirModalComentario(id, comentarioCodificado) {
    document.getElementById("modalReservaId").value = id;
    
    // Decodificar el comentario si existía
    const comentarioReal = comentarioCodificado ? decodeURIComponent(comentarioCodificado) : "";
    document.getElementById("txtComentario").value = comentarioReal;
    
    document.getElementById("modalComentario").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modalComentario").style.display = "none";
}

async function guardarComentarioServidor() {
    const id = document.getElementById("modalReservaId").value;
    const comentario = document.getElementById("txtComentario").value;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/reservas/${id}/comentario`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(comentario)
        });

        if (response.ok) {
            alert("Tu reseña ha sido guardada en las páginas de nuestro manuscrito.");
            cerrarModal();
            cargarMisReservas(); 
        } else {
            alert("Error al guardar el comentario.");
        }
    } catch (error) {
        console.error("Error en PATCH:", error);
        alert("Error de conexión.");
    }
}