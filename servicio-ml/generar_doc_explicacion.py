import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Establece color de fondo de una celda."""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Establece padding interno de una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, text, title="NOTA EXPLICATIVA"):
    """Caja destacada con borde azul corporativo."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.6)
    set_cell_background(cell, "F0F4F8")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    borders_xml = f'''
    <w:tcBorders {nsdecls("w")}>
        <w:top w:val="none"/>
        <w:left w:val="single" w:sz="36" w:space="0" w:color="1B365D"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
    </w:tcBorders>
    '''
    cell._tc.get_or_add_tcPr().append(parse_xml(borders_xml))
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}: ")
    run_t.bold = True
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(11)
    run_t.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
    
    run_b = p.add_run(text)
    run_b.font.name = "Calibri"
    run_b.font.size = Pt(10)
    run_b.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(4)

def add_code_block(doc, code_lines):
    """Bloque de código estilizado."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.6)
    set_cell_background(cell, "F8F9FA")
    set_cell_margins(cell, top=110, bottom=110, left=160, right=160)
    
    borders_xml = f'''
    <w:tcBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:left w:val="single" w:sz="20" w:space="0" w:color="3182CE"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
    </w:tcBorders>
    '''
    cell._tc.get_or_add_tcPr().append(parse_xml(borders_xml))
    
    for i, line in enumerate(code_lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = Pt(13)
        run = p.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("#"):
            run.font.color.rgb = RGBColor(0x38, 0xA1, 0x69)
        elif any(k in line for k in ["class ", "def ", "public ", "return ", "import ", "from "]):
            run.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)
        else:
            run.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
            
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(4)

def format_heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    run = h.runs[0]
    run.font.name = "Segoe UI"
    if level == 1:
        run.font.size = Pt(17)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
    elif level == 2:
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x2E, 0x6B, 0x9E)
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
    elif level == 3:
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x2C, 0x52, 0x82)
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(2)
    return h

def add_p(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(11)
        r_pre.font.color.rgb = RGBColor(0x1A, 0x20, 0x2C)
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    return p

def add_bullet(doc, title, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if title:
        r_t = p.add_run(title + ": ")
        r_t.bold = True
        r_t.font.name = "Calibri"
        r_t.font.size = Pt(10.5)
        r_t.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    return p

def create_styled_table(doc, headers, rows_data, col_widths=None):
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    # Encabezados
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1B365D")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.name = "Calibri"
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            
    # Datos
    for r_idx, row_values in enumerate(rows_data):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_col = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
        for c_idx, val in enumerate(row_values):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[c_idx].paragraphs[0]
            for r in p.runs:
                r.font.name = "Calibri"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
                
    if col_widths:
        for row in tbl.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)
                
    for row in tbl.rows:
        for cell in row.cells:
            borders_xml = f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E0"/>
                <w:left w:val="none"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E0"/>
                <w:right w:val="none"/>
            </w:tcBorders>
            '''
            cell._tc.get_or_add_tcPr().append(parse_xml(borders_xml))
            
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(6)

def main():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    print("Construyendo documento explicativo: ¿Cómo predice, Qué predice y Cómo se estructura?...")
    
    # -------------------------------------------------------------
    # PORTADA
    # -------------------------------------------------------------
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(35)
    p_inst.paragraph_format.space_after = Pt(8)
    r = p_inst.add_run("UNIVERSIDAD - FACULTAD DE INGENIERÍA\nINGENIERÍA DE SISTEMAS Y COMPUTACIÓN")
    r.bold = True
    r.font.name = "Segoe UI"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)
    
    p_proy = doc.add_paragraph()
    p_proy.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proy.paragraph_format.space_before = Pt(30)
    p_proy.paragraph_format.space_after = Pt(14)
    r_tit = p_proy.add_run("GUÍA CONCEPTUAL Y ESTRUCTURAL DEL MOTOR DE PREDICCIÓN:\n¿CÓMO PREDICE, QUÉ PREDICE Y CÓMO SE ESTRUCTURA?")
    r_tit.bold = True
    r_tit.font.name = "Segoe UI"
    r_tit.font.size = Pt(20)
    r_tit.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(45)
    r_sub = p_sub.add_run("Desglose del Modelo de Machine Learning, Pipeline de Inferencia, Fórmulas de Capacidad Operativa y Estructura de Datos (GestRest)\nIntegración: Java Spring Boot + Python FastAPI + Scikit-Learn + MongoDB")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(0x2E, 0x6B, 0x9E)
    
    tbl_portada = doc.add_table(rows=4, cols=2)
    tbl_portada.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_portada.autofit = False
    meta_data = [
        ("Materia / Proyecto:", "PROAULA - Sistemas de Información y Analítica de Datos"),
        ("Módulo Explicado:", "Motor Predictivo de Demanda Gastronómica (ML Engine)"),
        ("Preguntas Resueltas:", "¿Cómo predice? | ¿Qué predice? | ¿Cómo se estructura?"),
        ("Fecha de Publicación:", "Noviembre de 2026")
    ]
    for idx, (label, val) in enumerate(meta_data):
        row = tbl_portada.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.4)
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(label)
        r0.bold = True
        r0.font.name = "Calibri"
        r0.font.size = Pt(10.5)
        r0.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(val)
        r1.font.name = "Calibri"
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
        
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # INTRODUCCIÓN
    # -------------------------------------------------------------
    format_heading(doc, "Introducción al Documento", level=1)
    add_p(doc, 
        "El presente documento tiene como objetivo explicar de manera clara, rigurosa y pedagógica el funcionamiento interno "
        "del motor predictivo de demanda del sistema GestRest. Da respuesta directa a los tres interrogantes esenciales que "
        "todo evaluador, jurado académico o desarrollador formula ante una solución de Inteligencia Artificial aplicada:")
    add_bullet(doc, "1. ¿Cómo predice?", "El proceso matemático, las variables de entrada analizadas, la transformación de datos (Feature Engineering) y el algoritmo de Machine Learning que genera el pronóstico.")
    add_bullet(doc, "2. ¿Qué predice?", "El significado de las variables resultantes: los comensales proyectados, las mesas físicas a montar en el salón, los porcentajes de saturación y el semáforo gerencial de alerta.")
    add_bullet(doc, "3. ¿Cómo se estructura?", "La arquitectura distribuida de microservicios, el flujo de datos entre capas, los esquemas de entrada/salida (DTOs y modelos Pydantic) y la organización del código fuente.")

    # -------------------------------------------------------------
    # PARTE 1: ¿CÓMO PREDICE?
    # -------------------------------------------------------------
    format_heading(doc, "1. ¿CÓMO PREDICE? (Mecanismo y Pipeline de Inferencia)", level=1)
    
    format_heading(doc, "1.1. Ingeniería de Características (Feature Engineering Temporal)", level=2)
    add_p(doc, 
        "El modelo no recibe fechas abstractas como texto (ej. '2026-11-20'), sino que descompone el tiempo en cuatro "
        "variables numéricas ortogonales que capturan con exactitud los hábitos de consumo gastronómico:")
        
    headers_feat = ["Variable de Entrada", "Tipo de Dato", "Rango de Valores", "Justificación e Impacto en la Predicción"]
    data_feat = [
        ["franja_horaria", "Entero (int)", "11 a 22 (Horas)", "Representa la hora del día. Modela los picos de afluencia: el almuerzo (13:00 - 14:00) y la cena (20:00 - 21:00), distinguiéndolos de las horas valle."],
        ["dia_semana", "Entero (int)", "0 (Lunes) a 6 (Domingo)", "Captura la variación inter-semanal. Los lunes y martes registran tráfico menor, mientras que jueves y viernes experimentan incrementos progresivos."],
        ["mes", "Entero (int)", "1 (Enero) a 12 (Diciembre)", "Modela la estacionalidad anual del restaurante. Identifica picos en diciembre (cenas de fin de año, fiestas corporativas) y temporadas vacacionales."],
        ["es_fin_de_semana", "Binario (0 o 1)", "0 (Lun-Jue) o 1 (Vie-Dom)", "Actúa como un multiplicador o amplificador de demanda. En restauración, el viernes por la noche, sábado y domingo exhiben dinámicas de consumo masivo."]
    ]
    create_styled_table(doc, headers_feat, data_feat, [1.4, 1.0, 1.4, 2.8])
    
    add_callout(doc, 
        "Ejemplo Práctico de Transformación:\n"
        "Si un administrador consulta la fecha '2026-11-20' a las '20:00' (Cena del viernes):\n"
        "• franja_horaria = 20\n"
        "• dia_semana = 4 (Viernes, donde 0=Lunes, 1=Mar, 2=Mié, 3=Jue, 4=Vie)\n"
        "• mes = 11 (Noviembre)\n"
        "• es_fin_de_semana = 1 (Viernes califica como inicio de fin de semana)\n\n"
        "El vector numérico resultante para el modelo es: [20, 4, 11, 1]",
        title="VECTORIZACIÓN DE CARACTERÍSTICAS")

    format_heading(doc, "1.2. El Algoritmo de Regresión en Scikit-Learn", level=2)
    add_p(doc, 
        "El núcleo predictivo utiliza un algoritmo de regresión supervisada entrenado con datos históricos del restaurante y "
        "serializado en el artefacto 'modelo_franjas.joblib'. En términos matemáticos, el modelo aplica una combinación ponderada "
        "optimizada sobre las características:")
        
    add_callout(doc, 
        "Función General de Inferencia:\n\n"
        "Comensales_Brutos = w0 + (w1 × franja_horaria) + (w2 × dia_semana) + (w3 × mes) + (w4 × es_fin_de_semana)\n\n"
        "Donde:\n"
        "• w0 es el sesgo base (intercepto).\n"
        "• w1, w2, w3, w4 son los pesos o coeficientes aprendidos por el modelo durante la etapa de entrenamiento.\n"
        "• Si la franja es nocturna y fin de semana, la combinación lineal impulsa la proyección hacia los valores máximos históricos.",
        title="FUNCIÓN MATEMÁTICA DEL MODELO")

    format_heading(doc, "1.3. Inferencia Vectorial por Lotes (Batch Inference)", level=2)
    add_p(doc, 
        "En lugar de evaluar cada hora de manera iterativa y secuencial (lo cual saturaría el intérprete de Python con llamadas repetidas), "
        "FastAPI procesa la petición de un turno completo o rango de fechas en bloque:")
    add_bullet(doc, "1. Construcción de la Matriz", "Se genera una lista de diccionarios con todas las horas del turno solicitado (ej. [19, 20, 21, 22] para CENA).")
    add_bullet(doc, "2. Creación del DataFrame de Pandas", "Se estructura una tabla en memoria optimizada en C mediante Pandas.")
    add_bullet(doc, "3. Predicción Vectorizada NumPy", "Se invoca 'modelo.predict(df_batch)'. Scikit-Learn ejecuta el producto punto matricial en microsegundos, retornando un arreglo NumPy con todas las predicciones simultáneamente.")
    add_bullet(doc, "4. Normalización y Acotación No Negativa", "Dado que una regresión lineal podría en casos extremos arrojar decimales o valores negativos, se aplica una función de saneamiento:")
    
    add_callout(doc, 
        "Saneamiento del Resultado Numérico:\n\n"
        "comensales_estimados = max( 0.0, round( float(prediccion_raw), 2 ) )\n\n"
        "Garantiza que el valor entregado sea estrictamente mayor o igual a cero y redondeado a dos cifras decimales.",
        title="CONTROL DE FRONTERA")

    doc.add_page_break()

    # -------------------------------------------------------------
    # PARTE 2: ¿QUÉ PREDICE?
    # -------------------------------------------------------------
    format_heading(doc, "2. ¿QUÉ PREDICE? (Variables de Salida e Indicadores Operativos)", level=1)
    
    add_p(doc, 
        "El motor no se limita a entregar un número aislado de comensales. Transforma ese resultado estadístico en "
        "decisiones operativas tangibles para el jefe de sala, el chef ejecutivo y la gerencia general:")
        
    format_heading(doc, "2.1. Variable Predictiva Primaria: Comensales Estimados", level=2)
    add_p(doc, 
        "Representa la afluencia total de clientes esperada en el establecimiento durante una franja horaria de 60 minutos. "
        "Por ejemplo, una predicción de 42.0 comensales a las 20:00 indica que durante esa franja se espera la ocupación de 42 asientos.")

    format_heading(doc, "2.2. Variable Operativa Derivada: Mesas Sugeridas a Preparar", level=2)
    add_p(doc, 
        "El personal del salón no acomoda personas en el aire, acomoda mesas. Para traducir comensales a mesas físicas "
        "a montar antes del turno, se ejecuta la fórmula operativa:")
        
    add_callout(doc, 
        "Mesas_Sugeridas = CEIL( ( Comensales_Estimados × 1.10 ) / 3.5 )\n\n"
        "Desglose de los Factores:\n"
        "1. Factor de Holgura (+10%): Multiplicar por 1.10 añade una reserva técnica del 10% para absorber clientes que se presentan espontáneamente sin reserva (Walk-ins).\n"
        "2. Capacidad Media Ponderada (3.5): Las mesas del salón son de 2 y 4 puestos. El tamaño promedio ponderado de grupo comensal es de 3.5 personas.\n"
        "3. Función Techo (CEIL): Si el cálculo matemático resulta en 4.2 mesas, la función techo redondea a 5 mesas. En gastronomía nunca se monta una fracción de mesa; redondear hacia abajo provocaría que un cliente quede de pie sin asiento.",
        title="FÓRMULA DE ASIGNACIÓN FÍSICA")

    format_heading(doc, "2.3. Cruce Analítico en Tiempo Real: Proyecciones IA vs Reservas MongoDB", level=2)
    add_p(doc, 
        "Spring Boot recupera de MongoDB Atlas el inventario total de mesas y las reservas ya registradas por los clientes. "
        "Al cruzar ambas fuentes de datos se producen los siguientes indicadores:")
        
    headers_ind = ["Indicador Calculado", "Fórmula Matemática", "Utilidad en la Operación Diaria"]
    data_ind = [
        ["Comensales Reales", "SUM(personas) en MongoDB", "Muestra cuántas personas tienen reserva formal confirmada para esa hora."],
        ["Ocupación Proyectada (%)", "(Comensales Estimados / Aforo Total) × 100", "Indica qué porcentaje del salón se proyecta ocupar según la IA."],
        ["Ocupación Real (%)", "(Comensales Reales / Aforo Total) × 100", "Indica qué porcentaje del salón ya está comprometido por reservas confirmadas."],
        ["Mesas Sugeridas Pico", "MAX(Mesas Sugeridas en el Turno)", "Indica el momento de máxima tensión del turno para asegurar que exista suficiente mobiliario."],
        ["Semáforo de Capacidad", "Evaluación de Reglas de Negocio", "Emite una alerta clara: ÓPTIMA (Verde), ALTA OCUPACIÓN (Amarillo) o SOBREDEMANDA (Rojo)."]
    ]
    create_styled_table(doc, headers_ind, data_ind, [1.6, 2.2, 2.8])

    doc.add_page_break()

    # -------------------------------------------------------------
    # PARTE 3: ¿CÓMO SE ESTRUCTURA?
    # -------------------------------------------------------------
    format_heading(doc, "3. ¿CÓMO SE ESTRUCTURA? (Arquitectura, Capas y Esquemas de Datos)", level=1)
    
    format_heading(doc, "3.1. Estructura Arquitectónica por Capas y Componentes", level=2)
    add_p(doc, "El sistema se organiza en cuatro capas claramente desacopladas:")
    
    add_bullet(doc, "Capa 1: Presentación (Frontend Web)", "Dashboard administrativo desarrollado con JavaScript que consume las APIs de Spring Boot y renderiza gráficos de barras interactivos, tarjetas de ocupación y semáforos.")
    add_bullet(doc, "Capa 2: Control y Seguridad (Spring Boot - PrediccionAdminController)", "Asegura los endpoints con Spring Security mediante JWT y control de acceso basado en roles (@PreAuthorize(\"hasRole('ADMIN')\")).")
    add_bullet(doc, "Capa 3: Orquestación y Resiliencia (Spring Boot - PrediccionMLServiceImpl)", "Consulta las colecciones de mesas y reservas en MongoDB Atlas, consume el microservicio de Python vía RestTemplate y activa el fallback de contingencia si Python falla.")
    add_bullet(doc, "Capa 4: Motor de Inferencia Analítica (Python FastAPI - main.py)", "Carga el archivo 'modelo_franjas.joblib', valida datos con Pydantic y ejecuta inferencias vectoriales en milisegundos.")

    format_heading(doc, "3.2. Estructura de Datos de Entrada (Request Schemas)", level=2)
    add_p(doc, "Tanto en Spring Boot (Java) como en FastAPI (Python), la solicitud sigue este contrato estricto:")
    
    add_code_block(doc, [
        "// Estructura JSON de Petición (POST /api/admin/prediccion y POST /predecir-rango)",
        "{",
        "    \"fechaInicio\": \"2026-11-20\",  // Fecha de inicio (YYYY-MM-DD)",
        "    \"fechaFin\": \"2026-11-20\",     // Fecha final del rango (opcional)",
        "    \"turno\": \"CENA\"              // Turno solicitado: ALMUERZO, CENA o COMPLETO",
        "}"
    ])

    format_heading(doc, "3.3. Estructura de Datos de Salida (Response DTOs)", level=2)
    add_p(doc, "La respuesta entregada al panel administrativo consolida tanto las métricas globales del turno como el detalle franja por franja:")
    
    add_code_block(doc, [
        "// Estructura JSON de Respuesta (PrediccionDemandaResponse)",
        "{",
        "    \"fechaInicio\": \"2026-11-20\",",
        "    \"fechaFin\": \"2026-11-20\",",
        "    \"turno\": \"CENA\",",
        "    \"totalComensalesEstimados\": 165.5,    // Suma de comensales estimados en el turno",
        "    \"totalComensalesReales\": 110,         // Suma de reservas reales confirmadas en MongoDB",
        "    \"totalMesasFisicas\": 20,              // Total de mesas inventariadas en el salón",
        "    \"capacidadTotalAsientos\": 80,         // Aforo máximo simultáneo del local",
        "    \"mesasSugeridasPico\": 14,             // Máximo de mesas requeridas en la franja pico",
        "    \"ocupacionProyectadaGlobal\": 78.4,    // Porcentaje de ocupación proyectada promedio",
        "    \"ocupacionRealGlobal\": 55.0,          // Porcentaje de ocupación real actual",
        "    \"alertaCapacidad\": \"ALTA OCUPACIÓN (Reforzar personal y pre-elaboración)\",",
        "    \"slots\": [",
        "        {",
        "            \"horaSlot\": \"19:00\",",
        "            \"comensalesEstimados\": 32,",
        "            \"mesasSugeridas\": 10,",
        "            \"comensalesReales\": 20,",
        "            \"ocupacionProyectadaPorcentaje\": 40.0,",
        "            \"ocupacionRealPorcentaje\": 25.0",
        "        },",
        "        {",
        "            \"horaSlot\": \"20:00\",",
        "            \"comensalesEstimados\": 48,",
        "            \"mesasSugeridas\": 15,",
        "            \"comensalesReales\": 35,",
        "            \"ocupacionProyectadaPorcentaje\": 60.0,",
        "            \"ocupacionRealPorcentaje\": 43.75",
        "        }",
        "    ]",
        "}"
    ])

    format_heading(doc, "3.4. Estructura de Resiliencia y Flujo de Fallback", level=2)
    add_p(doc, 
        "La estructura del sistema contempla la posibilidad de fallos en el microservicio de IA. Si la conexión con Python "
        "se interrumpe o excede el timeout de 3 segundos, se activa el canal de contingencia:")
        
    add_callout(doc, 
        "Flujo del Fallback Heurístico (PrediccionMLServiceImpl.java):\n\n"
        "1. Intento Primario: Invoca a FastAPI mediante RestTemplate.\n"
        "2. Intercepción: Si se lanza RestClientException (puerto cerrado, timeout, caída del contenedor):\n"
        "3. Conmutación Heurística: Invoca generarFallbackSlots().\n"
        "   - Extrae las reservas reales existentes en MongoDB Atlas para esa fecha y hora.\n"
        "   - Asume: comensalesEstimados = comensalesReales (o promedio histórico si no hay reservas).\n"
        "   - Aplica la fórmula matemática: mesasSugeridas = CEIL((comensalesEstimados * 1.10) / 3.5).\n"
        "   - Calcula los porcentajes de ocupación basados en el aforo físico instalado.\n"
        "4. Resultado: La vista de la administración se renderiza normalmente y el log emite un aviso controlado.",
        title="MECANISMO DE ALTA DISPONIBILIDAD")

    # -------------------------------------------------------------
    # RESUMEN Y CONCLUSIONES
    # -------------------------------------------------------------
    format_heading(doc, "4. Resumen Sintético para la Sustentación", level=1)
    
    add_bullet(doc, "¿CÓMO PREDICE?", "Vectoriza la fecha y franja horaria en 4 variables numéricas [franja_horaria, dia_semana, mes, es_fin_de_semana] y ejecuta inferencia tabular de alta velocidad en Scikit-Learn mediante un modelo serializado con Joblib.")
    add_bullet(doc, "¿QUÉ PREDICE?", "Predice el número exacto de comensales por franja horaria y deriva automáticamente las mesas físicas a montar (mesas = ceil((comensales*1.1)/3.5)), los porcentajes de saturación del aforo y las alertas de sobrecupo (semáforo verde, amarillo y rojo).")
    add_bullet(doc, "¿CÓMO SE ESTRUCTURA?", "Se estructura en una arquitectura desacoplada de microservicios: Java Spring Boot 3 gestiona la seguridad JWT, persistencia transaccional en MongoDB Atlas y fallback heurístico; mientras Python FastAPI opera como motor analítico de inferencia asíncrona.")

    # Guardar en raíz y en artefactos
    out_docx = r"c:\Users\danil\OneDrive\Desktop\6to\PROAULA_5to_sem\EXPLICACION_PREDICCION_Y_ESTRUCTURA_ML.docx"
    doc.save(out_docx)
    print(f"Documento Word guardado exitosamente en: {out_docx}")

    art_docx = r"C:\Users\danil\.gemini\antigravity\brain\da4b3393-70b8-4243-8d8b-a5853754d9f7\EXPLICACION_PREDICCION_Y_ESTRUCTURA_ML.docx"
    doc.save(art_docx)
    print(f"Copia en artefactos guardada en: {art_docx}")

if __name__ == "__main__":
    main()

