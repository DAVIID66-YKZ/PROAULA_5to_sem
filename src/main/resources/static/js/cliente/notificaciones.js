/* ================================================================
   SISTEMA DE TOASTS Y MODALES DE CONFIRMACIÓN - GESTREST
   Diseño Manuscrito Dorado - Elegante y Fluido
   ================================================================ */

(function () {
    // 1. Inyectar estilos para los toasts y modal de confirmación si no existen
    if (!document.getElementById("gestrest-notificaciones-css")) {
        const style = document.createElement("style");
        style.id = "gestrest-notificaciones-css";
        style.textContent = `
            /* Contenedor de Toasts */
            .gestrest-toast-container {
                position: fixed;
                top: 25px;
                right: 25px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 420px;
                width: calc(100% - 50px);
            }

            .gestrest-toast {
                pointer-events: auto;
                background: rgba(18, 18, 18, 0.96);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(212, 175, 55, 0.35);
                border-radius: 12px;
                padding: 16px 20px;
                color: #ffffff;
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: flex-start;
                gap: 14px;
                position: relative;
                overflow: hidden;
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
                font-family: 'Manrope', sans-serif;
            }

            .gestrest-toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .gestrest-toast-icon {
                font-size: 24px;
                line-height: 1;
                flex-shrink: 0;
                margin-top: 2px;
            }

            .gestrest-toast.exito {
                border-color: rgba(46, 204, 113, 0.45);
            }
            .gestrest-toast.exito .gestrest-toast-icon {
                color: #2ecc71;
            }

            .gestrest-toast.error {
                border-color: rgba(231, 76, 60, 0.45);
            }
            .gestrest-toast.error .gestrest-toast-icon {
                color: #e74c3c;
            }

            .gestrest-toast.info {
                border-color: rgba(212, 175, 55, 0.45);
            }
            .gestrest-toast.info .gestrest-toast-icon {
                color: #d4af37;
            }

            .gestrest-toast.advertencia {
                border-color: rgba(243, 156, 18, 0.45);
            }
            .gestrest-toast.advertencia .gestrest-toast-icon {
                color: #f39c12;
            }

            .gestrest-toast-content {
                flex: 1;
            }

            .gestrest-toast-title {
                font-family: 'Noto Serif', serif;
                font-size: 0.95rem;
                font-weight: 600;
                color: #d4af37;
                margin-bottom: 4px;
            }

            .gestrest-toast.exito .gestrest-toast-title {
                color: #2ecc71;
            }
            .gestrest-toast.error .gestrest-toast-title {
                color: #ff6b6b;
            }

            .gestrest-toast-message {
                font-size: 0.88rem;
                line-height: 1.45;
                color: rgba(255, 255, 255, 0.9);
                white-space: pre-line;
            }

            .gestrest-toast-close {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                padding: 0;
                font-size: 18px;
                line-height: 1;
                margin-left: 6px;
                transition: color 0.2s;
            }
            .gestrest-toast-close:hover {
                color: #fff;
            }

            .gestrest-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #d4af37;
                width: 100%;
                opacity: 0.6;
                transition: width linear;
            }
            .gestrest-toast.exito .gestrest-toast-progress { background: #2ecc71; }
            .gestrest-toast.error .gestrest-toast-progress { background: #e74c3c; }

            /* Modal de Confirmación GestRest */
            .gestrest-confirm-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.82);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                font-family: 'Manrope', sans-serif;
            }

            .gestrest-confirm-backdrop.active {
                opacity: 1;
                visibility: visible;
            }

            .gestrest-confirm-card {
                background: #111111;
                border: 1px solid rgba(212, 175, 55, 0.35);
                border-radius: 16px;
                width: 90%;
                max-width: 480px;
                padding: 28px 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                transform: scale(0.92);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                color: #fff;
                text-align: center;
            }

            .gestrest-confirm-backdrop.active .gestrest-confirm-card {
                transform: scale(1);
            }

            .gestrest-confirm-icon-wrap {
                width: 56px;
                height: 56px;
                margin: 0 auto 16px;
                border-radius: 50%;
                background: rgba(212, 175, 55, 0.12);
                border: 1px solid rgba(212, 175, 55, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #d4af37;
            }

            .gestrest-confirm-icon-wrap.peligro {
                background: rgba(231, 76, 60, 0.12);
                border-color: rgba(231, 76, 60, 0.3);
                color: #e74c3c;
            }

            .gestrest-confirm-titulo {
                font-family: 'Noto Serif', serif;
                font-size: 1.4rem;
                color: #ffffff;
                margin-bottom: 10px;
            }

            .gestrest-confirm-mensaje {
                font-size: 0.95rem;
                color: rgba(255, 255, 255, 0.85);
                line-height: 1.55;
                margin-bottom: 24px;
                white-space: pre-line;
            }

            .gestrest-confirm-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .gestrest-btn-cancel {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 12px 22px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.92rem;
                cursor: pointer;
                transition: background 0.2s;
                flex: 1;
            }
            .gestrest-btn-cancel:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .gestrest-btn-ok {
                background: #d4af37;
                border: none;
                color: #000;
                padding: 12px 22px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 0.92rem;
                cursor: pointer;
                transition: background 0.2s;
                flex: 1;
            }
            .gestrest-btn-ok:hover {
                background: #f0c64d;
            }

            .gestrest-btn-ok.peligro {
                background: #e74c3c;
                color: #fff;
            }
            .gestrest-btn-ok.peligro:hover {
                background: #c0392b;
            }
        `;
        document.head.appendChild(style);
    }
})();

/**
 * Muestra un Toast flotante elegante en pantalla
 * @param {string} mensaje Texto o detalle del aviso
 * @param {'exito'|'error'|'info'|'advertencia'} tipo Tipo de alerta
 * @param {string|null} titulo Título opcional
 * @param {number} duracion Duración en ms (por defecto 4000)
 */
function mostrarToast(mensaje, tipo = "info", titulo = null, duracion = 4200) {
    let container = document.querySelector(".gestrest-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "gestrest-toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `gestrest-toast ${tipo}`;

    const iconosMap = {
        exito: "check_circle",
        error: "error",
        info: "info",
        advertencia: "warning"
    };
    const icono = iconosMap[tipo] || "info";

    const titulosDefault = {
        exito: "Operación Exitosa",
        error: "Atención del Manuscrito",
        info: "Información",
        advertencia: "Aviso Importante"
    };
    const tituloFinal = titulo || titulosDefault[tipo] || "Aviso";

    toast.innerHTML = `
        <span class="material-symbols-outlined gestrest-toast-icon notranslate">${icono}</span>
        <div class="gestrest-toast-content">
            <div class="gestrest-toast-title">${tituloFinal}</div>
            <div class="gestrest-toast-message">${mensaje}</div>
        </div>
        <button type="button" class="gestrest-toast-close" aria-label="Cerrar">&times;</button>
        <div class="gestrest-toast-progress"></div>
    `;

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const progressBar = toast.querySelector(".gestrest-toast-progress");
    if (progressBar) {
        progressBar.style.transitionDuration = `${duracion}ms`;
        requestAnimationFrame(() => {
            progressBar.style.width = "0%";
        });
    }

    let timer = setTimeout(cerrarToast, duracion);

    function cerrarToast() {
        clearTimeout(timer);
        toast.classList.remove("show");
        setTimeout(() => {
            if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 350);
    }

    toast.querySelector(".gestrest-toast-close").addEventListener("click", cerrarToast);
}

/**
 * Modal de Confirmación Temático con Promise
 * @param {Object} config
 * @returns {Promise<boolean>}
 */
function mostrarConfirmacion({
    titulo = "¿Estás seguro?",
    mensaje = "Esta acción no se puede deshacer.",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    peligroso = false,
    icono = null
}) {
    return new Promise((resolve) => {
        let backdrop = document.getElementById("gestrestConfirmBackdrop");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "gestrestConfirmBackdrop";
            backdrop.className = "gestrest-confirm-backdrop";
            document.body.appendChild(backdrop);
        }

        const iconName = icono || (peligroso ? "warning" : "help");
        const peligroClase = peligroso ? "peligro" : "";

        backdrop.innerHTML = `
            <div class="gestrest-confirm-card" role="dialog" aria-modal="true">
                <div class="gestrest-confirm-icon-wrap ${peligroClase}">
                    <span class="material-symbols-outlined notranslate" style="font-size: 32px;">${iconName}</span>
                </div>
                <h3 class="gestrest-confirm-titulo">${titulo}</h3>
                <p class="gestrest-confirm-mensaje">${mensaje}</p>
                <div class="gestrest-confirm-buttons">
                    <button type="button" class="gestrest-btn-cancel" id="gestrestBtnCancel">${textoCancelar}</button>
                    <button type="button" class="gestrest-btn-ok ${peligroClase}" id="gestrestBtnOk">${textoConfirmar}</button>
                </div>
            </div>
        `;

        backdrop.classList.add("active");
        document.body.style.overflow = "hidden";

        function finalizar(resultado) {
            backdrop.classList.remove("active");
            document.body.style.overflow = "";
            setTimeout(() => {
                resolve(resultado);
            }, 250);
        }

        backdrop.querySelector("#gestrestBtnCancel").onclick = () => finalizar(false);
        backdrop.querySelector("#gestrestBtnOk").onclick = () => finalizar(true);
    });
}
