/**
 * ================================================================
 * SkeletonTable.js - Componente Reutilizable de Skeleton Loading
 * para Tablas y Controles de Fecha en GestRest (Admin UI/UX)
 * ================================================================
 */

const SkeletonTable = (function () {
    /**
     * Genera el HTML de las filas placeholder con animación shimmer / pulse.
     *
     * @param {Object} options
     * @param {number} [options.columns=6] - Cantidad de columnas de la tabla.
     * @param {number} [options.rows=6] - Cantidad de filas placeholder (default 5-8).
     * @param {Array<string|number>} [options.widths] - Anchos relativos de cada columna (ej. ['40%', '20%', '15%', ...]).
     * @param {string} [options.type='default'] - Preset ('default', 'reservas', 'usuarios', 'prediccion').
     * @returns {string} Fragmento HTML listo para inyectar en tbody.
     */
    function render(options = {}) {
        const rows = Math.max(1, options.rows || 6);
        const columns = Math.max(1, options.columns || 6);
        const widths = Array.isArray(options.widths) ? options.widths : [];
        const type = options.type || "default";

        let html = "";

        for (let r = 0; r < rows; r++) {
            html += `<tr class="skeleton-table-row" aria-hidden="true">`;

            for (let c = 0; c < columns; c++) {
                let cellContent = "";

                // Preset específico para Usuarios (avatar + 2 líneas)
                if (type === "usuarios" && c === 0) {
                    cellContent = `
                        <div class="skeleton-flex-user">
                            <span class="skeleton-bone circle"></span>
                            <div class="skeleton-user-lines">
                                <span class="skeleton-bone" style="width: 140px;"></span>
                                <span class="skeleton-bone" style="width: 80px; height: 10px;"></span>
                            </div>
                        </div>
                    `;
                }
                // Preset específico para Reservas (avatar de huésped + texto)
                else if (type === "reservas" && c === 0) {
                    cellContent = `
                        <div class="skeleton-flex-user">
                            <span class="skeleton-bone circle" style="width: 32px; height: 32px;"></span>
                            <div class="skeleton-user-lines">
                                <span class="skeleton-bone" style="width: 130px;"></span>
                                <span class="skeleton-bone" style="width: 90px; height: 10px;"></span>
                            </div>
                        </div>
                    `;
                }
                // Preset para columna de Estado (Pill redondeada)
                else if (
                    (type === "usuarios" && c === 4) ||
                    (type === "reservas" && (c === 4 || c === 5)) ||
                    (type === "prediccion" && c === 7)
                ) {
                    cellContent = `<span class="skeleton-bone pill"></span>`;
                }
                // Preset para columna de Acciones (Botones icon)
                else if (
                    (type === "usuarios" && c === 5) ||
                    (type === "reservas" && (c === 5 || c === 6))
                ) {
                    cellContent = `
                        <div style="display:flex; gap:6px; align-items:center;">
                            <span class="skeleton-bone btn-icon"></span>
                            <span class="skeleton-bone btn-icon"></span>
                        </div>
                    `;
                }
                // Celda estándar con variación natural de anchos
                else {
                    const fallbackWidth = widths[c] || getDefaultWidth(c, columns, r);
                    cellContent = `<span class="skeleton-bone" style="width: ${fallbackWidth};"></span>`;
                }

                html += `<td class="skeleton-cell">${cellContent}</td>`;
            }

            html += `</tr>`;
        }

        return html;
    }

    /**
     * Aplica el skeleton dentro de un elemento <tbody> mientras isLoading = true.
     *
     * @param {string|HTMLElement} target - ID del tbody o el elemento HTML directo.
     * @param {Object} options - Opciones de configuración.
     */
    function attach(target, options = {}) {
        const el = typeof target === "string" ? document.getElementById(target) : target;
        if (!el) return;
        el.innerHTML = render(options);
    }

    /**
     * Reemplaza el contenido del tbody con datos reales aplicando una suave animación de entrada.
     *
     * @param {string|HTMLElement} target
     * @param {string} contentHtml
     */
    function resolve(target, contentHtml) {
        const el = typeof target === "string" ? document.getElementById(target) : target;
        if (!el) return;
        el.innerHTML = contentHtml;
        el.classList.remove("skeleton-fade-in");
        // Forzar reflow para reiniciar animación
        void el.offsetWidth;
        el.classList.add("skeleton-fade-in");
    }

    function getDefaultWidth(colIndex, totalCols, rowIndex) {
        // Variación armónica para que el skeleton luzca orgánico y realista
        const variance = ((colIndex * 37 + rowIndex * 19) % 30) - 15;
        const base = colIndex === 0 ? 70 : colIndex === totalCols - 1 ? 50 : 60;
        return `${Math.max(35, Math.min(95, base + variance))}%`;
    }

    return {
        render: render,
        attach: attach,
        resolve: resolve
    };
})();

/**
 * ================================================================
 * Helper de Control de Fechas: Navegación por Día (Anterior / Siguiente)
 * ================================================================
 */
const DateStepper = (function () {
    const SVG_CHEVRON_LEFT = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    `;

    const SVG_CHEVRON_RIGHT = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `;

    /**
     * Envuelve un input de fecha existente con botones interactivos anterior / siguiente.
     *
     * @param {string|HTMLInputElement} inputElement
     * @param {Function} [onChangeCallback]
     */
    function init(inputElement, onChangeCallback) {
        const input = typeof inputElement === "string" ? document.getElementById(inputElement) : inputElement;
        if (!input || input.dataset.stepperInitialized === "true") return;

        input.dataset.stepperInitialized = "true";

        // Crear contenedor
        const wrapper = document.createElement("div");
        wrapper.className = "date-stepper-wrapper";

        // Botón Anterior
        const btnPrev = document.createElement("button");
        btnPrev.type = "button";
        btnPrev.className = "date-step-btn prev";
        btnPrev.title = "Día anterior";
        btnPrev.setAttribute("aria-label", "Día anterior");
        btnPrev.innerHTML = SVG_CHEVRON_LEFT;

        // Botón Siguiente
        const btnNext = document.createElement("button");
        btnNext.type = "button";
        btnNext.className = "date-step-btn next";
        btnNext.title = "Día siguiente";
        btnNext.setAttribute("aria-label", "Día siguiente");
        btnNext.innerHTML = SVG_CHEVRON_RIGHT;

        // Reemplazar en DOM
        input.parentNode.insertBefore(wrapper, input);
        input.classList.add("date-stepper-input");

        wrapper.appendChild(btnPrev);
        wrapper.appendChild(input);
        wrapper.appendChild(btnNext);

        btnPrev.addEventListener("click", () => {
            adjustDate(input, -1);
            if (typeof onChangeCallback === "function") onChangeCallback(input.value);
        });

        btnNext.addEventListener("click", () => {
            adjustDate(input, 1);
            if (typeof onChangeCallback === "function") onChangeCallback(input.value);
        });
    }

    function adjustDate(input, daysDelta) {
        let current = input.value ? new Date(input.value + "T00:00:00") : new Date();
        if (isNaN(current.getTime())) current = new Date();

        current.setDate(current.getDate() + daysDelta);

        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");

        input.value = `${yyyy}-${mm}-${dd}`;
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    return {
        init: init,
        adjustDate: adjustDate,
        icons: {
            left: SVG_CHEVRON_LEFT,
            right: SVG_CHEVRON_RIGHT
        }
    };
})();

// Exportar globalmente
window.SkeletonTable = SkeletonTable;
window.DateStepper = DateStepper;

