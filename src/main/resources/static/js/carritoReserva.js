/* ================================================================
   LÓGICA DEL CARRITO DE RESERVA LOCAL - GESTREST
   Almacena borradores de reserva en localStorage y verifica
   disponibilidad en tiempo real antes de confirmar.
   ================================================================ */

const CARRITO_STORAGE_KEY = "reservaCarrito";

// 1. Obtener y guardar en LocalStorage
function obtenerReservaCarrito() {
    try {
        const data = localStorage.getItem(CARRITO_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Error al leer el carrito:", e);
        return null;
    }
}

function guardarReservaCarrito(reserva) {
    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(reserva));
    actualizarBadgeCarrito();
}

function eliminarReservaCarrito() {
    localStorage.removeItem(CARRITO_STORAGE_KEY);
    actualizarBadgeCarrito();
    renderizarContenidoCarrito();
}

// 2. Actualizar el badge visual en el navbar
function actualizarBadgeCarrito() {
    const badge = document.getElementById("navCarritoBadge");
    if (!badge) return;

    const reserva = obtenerReservaCarrito();
    if (reserva) {
        badge.style.display = "flex";
        badge.textContent = "1";
    } else {
        badge.style.display = "none";
    }
}

// 3. Control del Drawer del Carrito
function abrirCarrito() {
    const backdrop = document.getElementById("carritoBackdrop");
    const drawer = document.getElementById("carritoDrawer");
    if (!backdrop || !drawer) return;

    renderizarContenidoCarrito();
    backdrop.classList.add("active");
    drawer.classList.add("active");
    document.body.style.overflow = "hidden";
}

function cerrarCarrito() {
    const backdrop = document.getElementById("carritoBackdrop");
    const drawer = document.getElementById("carritoDrawer");
    if (!backdrop || !drawer) return;

    backdrop.classList.remove("active");
    drawer.classList.remove("active");
    document.body.style.overflow = "";
}

// 4. Renderizar el contenido dentro del Drawer
function renderizarContenidoCarrito() {
    const body = document.getElementById("carritoBody");
    const footer = document.getElementById("carritoFooter");
    if (!body || !footer) return;

    const reserva = obtenerReservaCarrito();

    if (!reserva) {
        body.innerHTML = `
            <div class="carrito-vacio">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <h4>Tu carrito está vacío</h4>
                <p>Configura tu mesa desde el inicio para apartar tu velada.</p>
                <button type="button" class="btn-guardar-carrito" onclick="cerrarCarrito(); abrirModalReservaIndex();">
                    Crear una Reserva
                </button>
            </div>
        `;
        footer.style.display = "none";
        return;
    }

    footer.style.display = "block";

    const nombresSector = {
        "Mesa-Estandar": "Salón Principal (Estándar)",
        "Mesa-Ventana": "Vista a la Ciudad (Ventana)",
        "Mesa-Alcoba": "Zona Privada (Alcoba)"
    };
    const nombreExperiencia = nombresSector[reserva.experiencia] || reserva.experiencia || "Salón Principal";

    body.innerHTML = `
        <div id="carritoAlertaError" class="carrito-alerta alerta-error" style="display: none;">
            <span style="font-size: 16px;">⚠️</span>
            <div id="carritoAlertaErrorTexto"></div>
        </div>

        <div class="carrito-item-card">
            <div class="carrito-item-tag">
                <span class="dot"></span>
                <span>BORRADOR EN ESTE DISPOSITIVO</span>
            </div>

            <h4 class="carrito-item-title">${nombreExperiencia}</h4>

            <div class="carrito-item-details">
                <div class="carrito-detail">
                    <span class="carrito-detail-label">Fecha</span>
                    <span class="carrito-detail-value">${reserva.fecha}</span>
                </div>
                <div class="carrito-detail">
                    <span class="carrito-detail-label">Hora</span>
                    <span class="carrito-detail-value">${reserva.hora}</span>
                </div>
                <div class="carrito-detail">
                    <span class="carrito-detail-label">Invitados</span>
                    <span class="carrito-detail-value">${reserva.personas} persona${reserva.personas > 1 ? 's' : ''}</span>
                </div>
                <div class="carrito-detail">
                    <span class="carrito-detail-label">Estado</span>
                    <span class="carrito-detail-value" style="color: #e0aa3e;">Pendiente de Confirmar</span>
                </div>
            </div>

            <div class="carrito-item-actions">
                <button type="button" class="btn-eliminar-carrito" onclick="eliminarReservaCarrito()" title="Eliminar reserva del carrito">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Quitar del Carrito
                </button>
            </div>
        </div>

        <div id="carritoAuthPrompt" class="modal-auth-prompt" style="display: none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h4>Identifícate para confirmar</h4>
            <p>Inicia sesión o crea tu cuenta para guardar tu reserva de forma definitiva. Tu borrador se mantendrá guardado.</p>
            <div class="modal-auth-buttons">
                <a href="/login" class="btn-auth-login">Iniciar Sesión</a>
                <a href="/register" class="btn-auth-register">Crear Cuenta</a>
            </div>
        </div>
    `;
}

// Helper para obtener fecha y hora local del dispositivo
function obtenerFechaYHoraLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    return {
        fechaHoy: `${anio}-${mes}-${dia}`,
        horaActual: `${horas}:${minutos}`
    };
}

// 5. Control del Modal de Reserva en el Index
function abrirModalReservaIndex() {
    const backdrop = document.getElementById("modalReservaIndexBackdrop");
    if (!backdrop) return;

    // Configurar fecha mínima (Hoy)
    const fechaInput = document.getElementById("modalIndexFecha");
    if (fechaInput) {
        const { fechaHoy } = obtenerFechaYHoraLocal();
        fechaInput.min = fechaHoy;
        if (!fechaInput.value || fechaInput.value < fechaHoy) {
            fechaInput.value = fechaHoy;
        }
    }

    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
    comprobarHorariosIndex();
}

function cerrarModalReservaIndex() {
    const backdrop = document.getElementById("modalReservaIndexBackdrop");
    if (!backdrop) return;

    backdrop.classList.remove("active");
    document.body.style.overflow = "";
}

// 6. Consultar horas ocupadas en vivo para el modal del index
async function comprobarHorariosIndex() {
    const fechaInput = document.getElementById("modalIndexFecha");
    const expRadio = document.querySelector('input[name="modalIndexExp"]:checked');
    const personasInput = document.getElementById("modalIndexPersonas");
    const horaSelect = document.getElementById("modalIndexHora");

    if (!fechaInput || !expRadio || !horaSelect) return;

    const fecha = fechaInput.value;
    const mesaId = expRadio.value;
    const personas = parseInt(personasInput.value) || 2;

    if (!fecha) return;

    const { fechaHoy, horaActual } = obtenerFechaYHoraLocal();
    const esMismoDia = (fecha === fechaHoy);
    const esPasado = (fecha < fechaHoy);

    try {
        const res = await fetch(`/reservas/ocupadas?fecha=${fecha}&mesaId=${mesaId}&invitados=${personas}`);
        if (res.ok) {
            const ocupadas = await res.json();

            Array.from(horaSelect.options).forEach(opt => {
                const estaOcupada = ocupadas.includes(opt.value);
                const esHoraPasada = esMismoDia && (opt.value <= horaActual);
                const noDisponible = estaOcupada || esHoraPasada || esPasado;

                opt.disabled = noDisponible;

                let etiqueta = opt.value;
                if (esPasado) {
                    etiqueta += " (Fecha pasada)";
                } else if (esHoraPasada) {
                    etiqueta += " (Hora pasada)";
                } else if (estaOcupada) {
                    etiqueta += " (Ocupado)";
                }

                opt.text = etiqueta;
                opt.style.color = noDisponible ? "#555" : "#fff";
            });

            // Si la opción seleccionada quedó deshabilitada, seleccionar la primera libre
            if (horaSelect.selectedOptions[0] && horaSelect.selectedOptions[0].disabled) {
                const primeraLibre = Array.from(horaSelect.options).find(o => !o.disabled);
                if (primeraLibre) horaSelect.value = primeraLibre.value;
            }
        }
    } catch (e) {
        console.error("Error al comprobar horarios en index:", e);
    }
}

// 7. Guardar borrador en el carrito desde el modal del index
function agregarReservaAlCarrito(event) {
    if (event) event.preventDefault();

    const fecha = document.getElementById("modalIndexFecha").value;
    const horaSelect = document.getElementById("modalIndexHora");
    const hora = horaSelect ? horaSelect.value : "";
    const personas = parseInt(document.getElementById("modalIndexPersonas").value) || 2;
    const expRadio = document.querySelector('input[name="modalIndexExp"]:checked');

    if (!fecha || !hora || !expRadio) {
        alert("Por favor completa todos los campos para agregar al carrito.");
        return;
    }

    const { fechaHoy, horaActual } = obtenerFechaYHoraLocal();

    // Validación 1: Fecha no inferior a hoy
    if (fecha < fechaHoy) {
        alert("No se pueden realizar reservas para fechas pasadas.");
        return;
    }

    // Validación 2: Si es el mismo día, hora no inferior a la actual
    if (fecha === fechaHoy && hora <= horaActual) {
        alert("La hora seleccionada para el día de hoy ya ha pasado. Por favor selecciona una hora posterior.");
        return;
    }

    if (horaSelect.selectedOptions[0] && horaSelect.selectedOptions[0].disabled) {
        alert("Ese horario no se encuentra disponible. Por favor selecciona otro turno.");
        return;
    }

    const reserva = {
        fecha,
        hora,
        personas,
        experiencia: expRadio.value,
        timestamp: new Date().toISOString()
    };

    guardarReservaCarrito(reserva);
    cerrarModalReservaIndex();
    abrirCarrito();
}

// 8. Confirmar Reserva desde el Carrito (Verificando disponibilidad antes)
async function confirmarReservaCarrito() {
    const reserva = obtenerReservaCarrito();
    if (!reserva) {
        alert("No tienes ninguna reserva en tu carrito.");
        return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const usuarioId = localStorage.getItem("usuarioId");

    // PASO 1: Si no tiene sesión iniciada, solicitar login o registro
    if (!token || !usuarioId) {
        const promptEl = document.getElementById("carritoAuthPrompt");
        if (promptEl) {
            promptEl.style.display = "block";
            promptEl.scrollIntoView({ behavior: "smooth" });
        } else {
            if (confirm("Para confirmar tu reserva debes iniciar sesión o crear una cuenta. ¿Deseas ir al login ahora?")) {
                window.location.href = "/login";
            }
        }
        return;
    }

    const btnConfirmar = document.getElementById("btnConfirmarCarrito");
    const textoOriginal = btnConfirmar ? btnConfirmar.innerHTML : "CONFIRMAR RESERVA";
    const alertaError = document.getElementById("carritoAlertaError");
    const alertaErrorTexto = document.getElementById("carritoAlertaErrorTexto");

    if (alertaError) alertaError.style.display = "none";

    const { fechaHoy, horaActual } = obtenerFechaYHoraLocal();

    // Validación de fecha no inferior a hoy
    if (reserva.fecha < fechaHoy) {
        if (alertaError && alertaErrorTexto) {
            alertaErrorTexto.innerHTML = `<strong>¡Fecha no válida!</strong> La fecha de esta reserva (${reserva.fecha}) ya ha pasado. Por favor crea una nueva reserva.`;
            alertaError.style.display = "flex";
        } else {
            alert("La fecha de esta reserva ya ha pasado.");
        }
        return;
    }

    // Validación de hora no inferior a la actual cuando sea el mismo día
    if (reserva.fecha === fechaHoy && reserva.hora <= horaActual) {
        if (alertaError && alertaErrorTexto) {
            alertaErrorTexto.innerHTML = `<strong>¡Horario no disponible!</strong> La hora de tu reserva (${reserva.hora}) para el día de hoy ya ha transcurrido. Por favor selecciona un turno más tarde o para otra fecha.`;
            alertaError.style.display = "flex";
        } else {
            alert("La hora seleccionada para el día de hoy ya ha pasado.");
        }
        return;
    }

    if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = `<span class="btn-spinner" style="width:16px;height:16px;border-width:2px;border-color:rgba(0,0,0,0.3);border-top-color:#000;"></span><span>Verificando disponibilidad...</span>`;
    }

    try {
        // PASO 2: Verificar en tiempo real si aún no la han tomado
        const resCheck = await fetch(`/reservas/ocupadas?fecha=${reserva.fecha}&mesaId=${reserva.experiencia}&invitados=${reserva.personas}`);
        if (resCheck.ok) {
            const ocupadas = await resCheck.json();
            if (ocupadas.includes(reserva.hora)) {
                // ¡LA MESA YA HA SIDO TOMADA!
                if (alertaError && alertaErrorTexto) {
                    alertaErrorTexto.innerHTML = `<strong>¡Horario no disponible!</strong> Lo sentimos, la mesa para las <strong>${reserva.hora}</strong> el <strong>${reserva.fecha}</strong> acaba de ser ocupada por otro comensal. Por favor edita o crea una nueva reserva con otra hora disponible.`;
                    alertaError.style.display = "flex";
                } else {
                    alert(`Lo sentimos, el turno de las ${reserva.hora} ya fue tomado. Por favor elige otro horario disponible.`);
                }

                if (btnConfirmar) {
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = textoOriginal;
                }
                return;
            }
        }

        // PASO 3: Sigue disponible -> Enviar reserva definitiva a Spring Boot
        if (btnConfirmar) {
            btnConfirmar.innerHTML = `<span class="btn-spinner" style="width:16px;height:16px;border-width:2px;border-color:rgba(0,0,0,0.3);border-top-color:#000;"></span><span>Confirmando reserva...</span>`;
        }

        const payload = {
            fecha: reserva.fecha,
            hora: reserva.hora,
            numeroPersonas: reserva.personas,
            usuarioId: usuarioId,
            mesaId: reserva.experiencia,
            experiencia: reserva.experiencia,
            platos: [],
            estado: "PENDIENTE"
        };

        const resGuardar = await fetch("/reservas/guardar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (resGuardar.ok) {
            // Reserva guardada con éxito
            eliminarReservaCarrito();
            cerrarCarrito();
            alert(
                "✨ ¡SOLICITUD DE RESERVA REGISTRADA! ✨\n\n" +
                "• Estado: PENDIENTE\n" +
                "• Anticipo para apartar mesa: $ 10.000 COP (tarifa base mínima para reserva)\n\n" +
                "Tu reserva ha quedado guardada en estado PENDIENTE. En 'Mis Reservas' podrás consultar tus detalles y confirmarla."
            );
            window.location.href = "/cliente/mis-reservas";
        } else {
            const errorMsg = await resGuardar.text();
            alert("No se pudo confirmar la reserva: " + errorMsg);
            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = textoOriginal;
            }
        }

    } catch (error) {
        console.error("Error al confirmar reserva desde carrito:", error);
        alert("Ocurrió un error de conexión al confirmar tu reserva.");
        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = textoOriginal;
        }
    }
}

// 9. Interceptar botón "Reserva Ahora" del index según sesión
function manejarClickBotonReserva(event) {
    if (event) event.preventDefault();

    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const rol = (localStorage.getItem("rol") || "").trim().toUpperCase();

    if (token && (rol === "ADMIN" || rol === "ROLE_ADMIN")) {
        window.location.href = "/admin/reservas";
        return;
    }

    // Si es cliente o no está registrado: abrir modal de reserva para agregar al carrito
    abrirModalReservaIndex();
}

// Exponer explícitamente en el objeto window para evitar problemas de ámbito
window.obtenerReservaCarrito = obtenerReservaCarrito;
window.guardarReservaCarrito = guardarReservaCarrito;
window.eliminarReservaCarrito = eliminarReservaCarrito;
window.actualizarBadgeCarrito = actualizarBadgeCarrito;
window.abrirCarrito = abrirCarrito;
window.cerrarCarrito = cerrarCarrito;
window.abrirModalReservaIndex = abrirModalReservaIndex;
window.cerrarModalReservaIndex = cerrarModalReservaIndex;
window.comprobarHorariosIndex = comprobarHorariosIndex;
window.agregarReservaAlCarrito = agregarReservaAlCarrito;
window.confirmarReservaCarrito = confirmarReservaCarrito;
window.manejarClickBotonReserva = manejarClickBotonReserva;

// Auto-inicialización en carga
document.addEventListener("DOMContentLoaded", () => {
    actualizarBadgeCarrito();

    // Si la URL contiene el parámetro abrirCarrito=true, abrirlo
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("abrirCarrito") === "true") {
        setTimeout(abrirCarrito, 300);
    }

    // Configurar listeners del modal del index
    const fechaInput = document.getElementById("modalIndexFecha");
    const personasInput = document.getElementById("modalIndexPersonas");
    const expRadios = document.querySelectorAll('input[name="modalIndexExp"]');

    if (fechaInput) fechaInput.addEventListener("change", comprobarHorariosIndex);
    if (personasInput) personasInput.addEventListener("change", comprobarHorariosIndex);
    expRadios.forEach(r => r.addEventListener("change", comprobarHorariosIndex));
});
