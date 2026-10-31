/* ================================================================
   PREDICCIÓN DE RESERVAS Y DEMANDA (ML) - GESTREST ADMIN
   Integración reactiva con Spring Boot, MongoDB Atlas y FastAPI
   ================================================================ */

let chartComparativoInstance = null;
let chartOcupacionInstance = null;
let liveInterval = null;
let sseEventSource = null;

document.addEventListener("DOMContentLoaded", function () {
    inicializarFiltrosFechas();
    inicializarGraficos();
    cargarPrediccion(false);

    // Conectar flujo reactivo (polling + SSE)
    iniciarMonitoreoEnVivo();

    // Listeners para actualización inmediata al cambiar filtros
    document.getElementById("inputFechaInicio")?.addEventListener("change", () => cargarPrediccion(true));
    document.getElementById("inputFechaFin")?.addEventListener("change", () => cargarPrediccion(true));
    document.getElementById("selectTurno")?.addEventListener("change", () => cargarPrediccion(true));

    // Limpieza de polling en desmontaje o cambio de vista para prevenir memory leaks
    window.addEventListener("beforeunload", detenerMonitoreoEnVivo);
    window.addEventListener("pagehide", detenerMonitoreoEnVivo);
});

function obtenerTokenAdmin() {
    return localStorage.getItem("token") || localStorage.getItem("jwtToken") || "";
}

function inicializarFiltrosFechas() {
    const inputInicio = document.getElementById("inputFechaInicio");
    const inputFin = document.getElementById("inputFechaFin");
    const hoy = new Date().toISOString().split("T")[0];

    if (inputInicio && !inputInicio.value) {
        inputInicio.value = hoy;
    }
    if (inputFin && !inputFin.value) {
        inputFin.value = hoy;
    }

    // Inicializar selectores de fecha con navegación táctil e iconos SVG
    if (window.DateStepper) {
        window.DateStepper.init("inputFechaInicio", () => cargarPrediccion(true));
        window.DateStepper.init("inputFechaFin", () => cargarPrediccion(true));
    }
}

// ===== INICIALIZACIÓN DE GRÁFICOS (CHART.JS) =====
function inicializarGraficos() {
    // 1. Gráfico Comparativo: Demanda Real vs. Estimada
    const ctxComp = document.getElementById("chartComparativo");
    if (ctxComp) {
        chartComparativoInstance = new Chart(ctxComp, {
            type: "bar",
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Comensales Estimados (ML)",
                        data: [],
                        backgroundColor: "rgba(212, 175, 55, 0.75)",
                        borderColor: "#D4AF37",
                        borderWidth: 1.5,
                        borderRadius: 4
                    },
                    {
                        label: "Comensales Reales (MongoDB)",
                        data: [],
                        backgroundColor: "rgba(96, 165, 250, 0.75)",
                        borderColor: "#3B82F6",
                        borderWidth: 1.5,
                        borderRadius: 4
                    },
                    {
                        label: "Mesas Sugeridas",
                        type: "line",
                        data: [],
                        borderColor: "#34D399",
                        backgroundColor: "rgba(52, 211, 153, 0.2)",
                        borderWidth: 2,
                        tension: 0.3,
                        pointBackgroundColor: "#34D399",
                        yAxisID: "yMesas"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 600
                },
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "#E0E0E0",
                            font: { family: "Manrope", size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: "#1E1E1E",
                        titleColor: "#D4AF37",
                        bodyColor: "#FFFFFF",
                        borderColor: "#333",
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: "#A0A0A0" },
                        grid: { color: "rgba(255, 255, 255, 0.05)" }
                    },
                    y: {
                        title: { display: true, text: "Comensales", color: "#A0A0A0" },
                        ticks: { color: "#A0A0A0" },
                        grid: { color: "rgba(255, 255, 255, 0.05)" }
                    },
                    yMesas: {
                        position: "right",
                        title: { display: true, text: "Mesas", color: "#34D399" },
                        ticks: { color: "#34D399", stepSize: 1 },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    // 2. Gráfico de Dona: Capacidad y Ocupación
    const ctxOcup = document.getElementById("chartOcupacion");
    if (ctxOcup) {
        chartOcupacionInstance = new Chart(ctxOcup, {
            type: "doughnut",
            data: {
                labels: ["Ocupación Proyectada", "Capacidad Disponible"],
                datasets: [
                    {
                        data: [0, 100],
                        backgroundColor: ["#D4AF37", "rgba(255, 255, 255, 0.08)"],
                        borderColor: ["#AA820A", "#333333"],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
                animation: { duration: 600 },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#E0E0E0", font: { family: "Manrope", size: 12 } }
                    }
                }
            }
        });
    }
}

// ===== CONSULTA PRINCIPAL AL BACKEND DE SPRING BOOT =====
async function cargarPrediccion(animarBoton = false) {
    const btn = document.getElementById("btnActualizarPrediccion");
    let iconoOriginal = null;

    if (animarBoton && btn) {
        btn.disabled = true;
        btn.classList.add("loading");
        iconoOriginal = btn.querySelector(".material-symbols-outlined");
        if (iconoOriginal) {
            iconoOriginal.style.display = "none";
        }

        let spinner = btn.querySelector(".btn-spinner-icon");
        if (!spinner) {
            spinner = document.createElement("span");
            spinner.className = "btn-spinner-icon";
            btn.insertBefore(spinner, btn.firstChild);
        }
    }

    const fInicio = document.getElementById("inputFechaInicio")?.value || "";
    const fFin = document.getElementById("inputFechaFin")?.value || "";
    const turno = document.getElementById("selectTurno")?.value || "COMPLETO";

    const token = obtenerTokenAdmin();

    const tbody = document.getElementById("tablaPrediccionBody");
    if (animarBoton && tbody && window.SkeletonTable) {
        window.SkeletonTable.attach("tablaPrediccionBody", { columns: 8, rows: 6, type: "prediccion" });
    }

    try {
        const queryParams = new URLSearchParams({
            fechaInicio: fInicio,
            fechaFin: fFin,
            turno: turno
        });

        const resp = await fetch(`/api/admin/prediccion?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (resp.ok) {
            const data = await resp.json();
            renderizarDatosPrediccion(data);
            actualizarIndicadorLive(true);
            if (animarBoton) {
                mostrarToastPrediccion("Predicción actualizada con éxito. Datos sincronizados con la base de datos.", "success");
            }
        } else if (resp.status === 403 || resp.status === 401) {
            console.warn("Sesión expirada o permisos de admin requeridos.");
        } else {
            console.error("Error al obtener predicción:", resp.status);
            actualizarIndicadorLive(false);
            if (animarBoton) {
                mostrarToastPrediccion("No se pudo actualizar la predicción. Intenta nuevamente.", "error");
            }
        }
    } catch (e) {
        console.error("Fallo de conexión:", e);
        actualizarIndicadorLive(false);
        if (animarBoton) {
            mostrarToastPrediccion("No se pudo conectar con la base de datos. Verifica tu conexión e intenta nuevamente.", "error");
        }
    } finally {
        if (btn) {
            btn.classList.remove("loading");
            btn.disabled = false;
            const spinner = btn.querySelector(".btn-spinner-icon");
            if (spinner) spinner.remove();
            const icono = btn.querySelector(".material-symbols-outlined");
            if (icono) icono.style.display = "";
        }
    }
}

function actualizarPrediccionManual() {
    cargarPrediccion(true);
}

// ===== RENDERIZAR EN DOM Y ACTUALIZAR GRÁFICOS =====
function renderizarDatosPrediccion(data) {
    if (!data) return;

    // 1. KPIs
    const elMesas = document.getElementById("kpiMesasPico");
    const elComEst = document.getElementById("kpiComensalesEst");
    const elComReales = document.getElementById("kpiComensalesReales");
    const elOcProy = document.getElementById("kpiOcupacionProy");
    const elOcReal = document.getElementById("kpiOcupacionReal");
    const elTotRes = document.getElementById("kpiTotalReservas");
    const elTotMesas = document.getElementById("kpiTotalMesasLocal");

    if (elMesas) elMesas.textContent = data.mesasSugeridasPico || 0;
    if (elComEst) elComEst.textContent = data.totalComensalesEstimados || 0;
    if (elComReales) elComReales.textContent = `Reales en BD: ${data.totalComensalesReales || 0}`;
    if (elOcProy) elOcProy.textContent = `${data.ocupacionProyectadaGlobal || 0}%`;
    if (elOcReal) elOcReal.textContent = `Ocupación real actual: ${data.ocupacionRealGlobal || 0}%`;
    if (elTotRes) elTotRes.textContent = data.totalReservasReales || 0;
    if (elTotMesas) elTotMesas.textContent = `Capacidad: ${data.totalMesasRestaurante || 0} mesas (${data.capacidadMaximaLocal || 0} plazas)`;

    // 2. Banner de Alerta Dinámica
    const banner = document.getElementById("bannerAlerta");
    const bannerTexto = document.getElementById("bannerAlertaTexto");
    const bannerIcon = document.getElementById("bannerAlertaIcon");

    if (banner && bannerTexto) {
        bannerTexto.textContent = data.alertaCapacidad || "Capacidad Operativa Óptima";
        banner.className = "alerta-banner";

        if ((data.alertaCapacidad || "").includes("ALERTA") || data.ocupacionProyectadaGlobal > 90) {
            banner.classList.add("peligro");
            if (bannerIcon) bannerIcon.textContent = "warning";
        } else if (data.ocupacionProyectadaGlobal >= 75) {
            banner.classList.add("advertencia");
            if (bannerIcon) bannerIcon.textContent = "error";
        } else {
            banner.classList.add("optima");
            if (bannerIcon) bannerIcon.textContent = "verified";
        }
    }

    // 3. Actualizar Gráfico Comparativo
    if (chartComparativoInstance && Array.isArray(data.series)) {
        const labels = data.series.map(s => (data.fechaInicio !== data.fechaFin ? `${s.fecha} ${s.hora}` : s.hora));
        const estimaciones = data.series.map(s => s.comensalesEstimados);
        const reales = data.series.map(s => s.comensalesReales);
        const mesas = data.series.map(s => s.mesasSugeridas);

        chartComparativoInstance.data.labels = labels;
        chartComparativoInstance.data.datasets[0].data = estimaciones;
        chartComparativoInstance.data.datasets[1].data = reales;
        chartComparativoInstance.data.datasets[2].data = mesas;
        chartComparativoInstance.update();
    }

    // 4. Actualizar Gráfico de Dona
    if (chartOcupacionInstance) {
        const proy = data.ocupacionProyectadaGlobal || 0;
        const disponible = Math.max(0, 100 - proy);
        chartOcupacionInstance.data.datasets[0].data = [proy, disponible];
        chartOcupacionInstance.update();
    }

    // 5. Llenar Tabla de Desglose
    const tbody = document.getElementById("tablaPrediccionBody");
    if (tbody && Array.isArray(data.series)) {
        if (data.series.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:25px;">No hay franjas para los filtros seleccionados.</td></tr>';
            return;
        }

        if (window.SkeletonTable) {
            tbody.classList.remove("skeleton-fade-in");
            void tbody.offsetWidth;
            tbody.classList.add("skeleton-fade-in");
        }

        tbody.innerHTML = data.series.map(s => {
            let badgeClass = "optimo";
            let badgeText = "Óptimo";
            if (s.ocupacionProyectadaPorcentaje >= 85) {
                badgeClass = "alto";
                badgeText = "Alta Demanda";
            } else if (s.ocupacionProyectadaPorcentaje >= 60) {
                badgeClass = "moderado";
                badgeText = "Moderada";
            }

            return `
                <tr>
                    <td style="font-weight:600;color:#DDD;">${s.fecha}</td>
                    <td style="font-weight:700;color:var(--color-primary, #D4AF37);">${s.hora}</td>
                    <td><strong>${s.comensalesEstimados}</strong></td>
                    <td style="color:#60A5FA;">${s.comensalesReales} comensales</td>
                    <td>${s.reservasRealesCount}</td>
                    <td style="font-weight:700;color:#34D399;">${s.mesasSugeridas} mesas</td>
                    <td>${Math.round((s.ocupacionProyectadaPorcentaje || 0) * 10) / 10}%</td>
                    <td><span class="badge-estado ${badgeClass}">${badgeText}</span></td>
                </tr>
            `;
        }).join("");
    }
}

// ===== MONITOREO REACTIVO EN TIEMPO REAL (POLLING CADA 3 MINUTOS) =====
function iniciarMonitoreoEnVivo() {
    if (liveInterval) clearInterval(liveInterval);
    // Actualización periódica en vivo cada 3 minutos (180,000 ms)
    liveInterval = setInterval(() => {
        if (!document.hidden) {
            // Actualización silenciosa en segundo plano sin CLS ni reset abrupto
            cargarPrediccion(false);
        }
    }, 180000);
}

function detenerMonitoreoEnVivo() {
    if (liveInterval) {
        clearInterval(liveInterval);
        liveInterval = null;
    }
    if (sseEventSource) {
        sseEventSource.close();
        sseEventSource = null;
    }
}

function actualizarIndicadorLive(conectado) {
    const badge = document.querySelector(".live-badge");
    const txt = document.getElementById("txtEstadoLive");
    if (!badge || !txt) return;

    if (conectado) {
        badge.style.borderColor = "rgba(34, 197, 94, 0.35)";
        badge.style.color = "#4ADE80";
        txt.textContent = "EN VIVO / CONECTADO";
    } else {
        badge.style.borderColor = "rgba(239, 68, 68, 0.35)";
        badge.style.color = "#F87171";
        txt.textContent = "RECONECTANDO...";
    }
}


// ===== SISTEMA DE NOTIFICACIONES TOAST =====
function mostrarToastPrediccion(mensaje, tipo = "info") {
    let container = document.getElementById("prediccionToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "prediccionToastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `gestrest-toast ${tipo}`;

    let iconName = "info";
    if (tipo === "success") iconName = "check_circle";
    else if (tipo === "error") iconName = "error";

    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">${iconName}</span>
        <span class="toast-msg">${mensaje}</span>
        <button type="button" class="toast-close" aria-label="Cerrar">
            <span class="material-symbols-outlined" style="font-size:16px;">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const closeBtn = toast.querySelector(".toast-close");
    let autoCloseTimer = null;

    const removerToast = () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 350);
    };

    closeBtn.addEventListener("click", removerToast);
    autoCloseTimer = setTimeout(removerToast, 4000);
}
