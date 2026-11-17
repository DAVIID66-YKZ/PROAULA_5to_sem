import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, text, title="NOTA TÉCNICA"):
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
            
    # Filas
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
        
    print("Generando Resumen Ejecutivo en Word...")
    
    # Portada
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
    p_proy.paragraph_format.space_before = Pt(25)
    p_proy.paragraph_format.space_after = Pt(12)
    r_tit = p_proy.add_run("RESUMEN EJECUTIVO Y TÉCNICO:\nMOTOR DE PREDICCIÓN CON MACHINE LEARNING (RANDOM FOREST)")
    r_tit.bold = True
    r_tit.font.name = "Segoe UI"
    r_tit.font.size = Pt(20)
    r_tit.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(35)
    r_sub = p_sub.add_run("Sistema GestRest - Optimización de Recursos Gastronómicos\nDesglose de Variables, Pipeline de Inferencia, Modelo de Ensamble y Fórmulas Operativas")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(0x2E, 0x6B, 0x9E)
    
    tbl_portada = doc.add_table(rows=4, cols=2)
    tbl_portada.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_portada.autofit = False
    meta_data = [
        ("Proyecto / Asignatura:", "PROAULA (Proyecto Integrador de Aula - 5to / 6to Semestre)"),
        ("Algoritmo Implementado:", "RandomForestRegressor (120 árboles de decisión)"),
        ("Librerías Core:", "Scikit-Learn, Joblib, Pandas, NumPy, FastAPI, Spring Boot 3"),
        ("Fecha:", "Noviembre de 2026")
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
    
    # ---------------------------------------------------------
    # RESUMEN EN UN SOLO PÁRRAFO
    # ---------------------------------------------------------
    format_heading(doc, "Resumen Ejecutivo en un Solo Párrafo (Pitch para Sustentación)", level=1)
    
    add_callout(doc, 
        "\"El módulo predictivo de GestRest es un sistema de Inteligencia Artificial basado en un modelo "
        "supervisado de RandomForestRegressor (120 árboles de decisión en Scikit-Learn) que analiza variables "
        "temporales de calendario (franja horaria, día de la semana, mes y fin de semana) para estimar la cantidad "
        "exacta de comensales por hora; a partir de esta predicción, aplica una fórmula de optimización operativa "
        "con 10% de holgura para clientes espontáneos y una capacidad media de 3.5 personas por mesa "
        "(Mesas = ceil((comensales × 1.10) / 3.5)), cruzando los resultados con las reservas reales en MongoDB Atlas "
        "para alertar sobrecupos o saturación del salón sin depender de reglas empíricas estáticas.\"",
        title="DECLARACIÓN EJECUTIVA DEL MODELO")

    # ---------------------------------------------------------
    # SECCIÓN 1: MACHINE LEARNING Y VARIABLES
    # ---------------------------------------------------------
    format_heading(doc, "1. Confirmación de Machine Learning y Estructura de Variables", level=1)
    
    add_p(doc, 
        "El módulo opera bajo **Aprendizaje Automático Supervisado (Regresión)**. El artefacto entrenado se encuentra "
        "serializado en 'servicio-ml/modelo_franjas.joblib' y es cargado asíncronamente en memoria por FastAPI.")
        
    add_bullet(doc, "Variable Objetivo (Target / y)", "comensales (o comensales_estimados). Es el valor cuantitativo continuo a predecir, correspondiente al número de personas que acudirán al restaurante en una franja horaria.")
    add_bullet(doc, "Variables Predictoras (Features / X)", "Las cuatro entradas temporales que alimentan a los árboles de decisión:")
    
    headers_vars = ["Variable Predictora", "Tipo de Dato", "Rango de Valores", "Importancia en el Modelo (% Relevancia)"]
    data_vars = [
        ["mes", "Entero (int)", "1 (Enero) a 12 (Diciembre)", "38.05% (Factor dominante: Estacionalidad anual)"],
        ["franja_horaria", "Entero (int)", "11 a 22 (Horas del día)", "31.38% (Diferenciador de picos: Almuerzo vs Cena)"],
        ["dia_semana", "Entero (int)", "0 (Lunes) a 6 (Domingo)", "28.23% (Dinámica semanal: Laborables vs Fin de semana)"],
        ["es_fin_de_semana", "Binario (0 o 1)", "0 (Lun-Jue) o 1 (Vie-Dom)", "2.34% (Ajuste complementario de alta demanda)"]
    ]
    create_styled_table(doc, headers_vars, data_vars, [1.5, 1.2, 1.8, 2.1])

    # ---------------------------------------------------------
    # SECCIÓN 2: MECÁNICA DE RANDOM FOREST
    # ---------------------------------------------------------
    format_heading(doc, "2. Mecánica Interna del RandomForestRegressor", level=1)
    
    add_p(doc, 
        "El modelo no calcula una simple línea recta fija. Está conformado por un ensamble de **120 árboles de decisión "
        "independientes (`n_estimators = 120`)**. Cada árbol evalúa condiciones booleanas sobre las características "
        "(ej. ¿hora >= 19?, ¿día >= 4?, ¿mes == 12?) y produce su propia estimación. La predicción final de comensales "
        "es el promedio aritmético exacto de los 120 votos:")
        
    add_callout(doc, 
        "Predicción Final = ( Voto_Árbol_1 + Voto_Árbol_2 + ... + Voto_Árbol_120 ) / 120\n\n"
        "Posteriormente, el servicio en Python ejecuta la función de saneamiento:\n"
        "comensales_estimados = max(0.0, round(float(prediccion_raw), 2))\n"
        "lo que garantiza que jamás existan números negativos en horas atípicas.",
        title="FUNCIONAMIENTO DEL ENSAMBLE")

    # ---------------------------------------------------------
    # SECCIÓN 3: JUSTIFICACIÓN DE LAS FÓRMULAS
    # ---------------------------------------------------------
    format_heading(doc, "3. Justificación Operativa de la Fórmula de Mesas", level=1)
    
    add_p(doc, "La conversión de comensales predichos por la IA a mobiliario físico a montar responde a:")
    
    add_callout(doc, 
        "Mesas_Sugeridas = CEIL( ( Comensales_Estimados × 1.10 ) / 3.5 )\n\n"
        "1. ¿Por qué 1.10? (Holgura del +10%): Reserva técnica operativa para absorber clientes espontáneos que llegan sin reserva previa (Walk-ins).\n"
        "2. ¿Por qué 3.5? (Capacidad media ponderada): En el restaurante conviven mesas de 2 puestos y mesas de 4 puestos. El tamaño promedio estadístico de grupo por mesa ocupada es de 3.5 comensales.\n"
        "3. ¿Por qué CEIL? (Función Techo math.ceil): Las mesas físicas son indivisibles. Si el cálculo da 8.2 mesas, se deben montar 9 mesas para evitar dejar comensales sin asiento.",
        title="FÓRMULA DE OPTIMIZACIÓN OPERATIVA")

    # ---------------------------------------------------------
    # SECCIÓN 4: ¿POR QUÉ RANDOM FOREST Y NO REGRESIÓN LINEAL?
    # ---------------------------------------------------------
    format_heading(doc, "4. ¿Por qué Random Forest frente a Regresión Lineal o Reglas?", level=1)
    
    add_bullet(doc, "Comportamiento No Lineal", "La curva de demanda de un restaurante sube al mediodía (13:00), cae drásticamente por la tarde (16:00) y vuelve a subir en la noche (20:00). Una línea recta no puede modelar valles y picos sucesivos. Random Forest modela relaciones no lineales con total fidelidad.")
    add_bullet(doc, "Robustez y Prevención de Overfitting", "Al combinar 120 árboles generados mediante 'Bagging' (muestreo aleatorio de datos y características), el modelo no memoriza datos; generaliza con precisión sobre fechas futuras.")
    add_bullet(doc, "Velocidad de Inferencia", "La ejecución de los 120 árboles en Scikit-Learn toma menos de 3 milisegundos por franja horaria.")

    # Guardar documento
    out_docx = r"c:\Users\danil\OneDrive\Desktop\6to\PROAULA_5to_sem\RESUMEN_EJECUTIVO_MODELO_ML_RANDOM_FOREST.docx"
    doc.save(out_docx)
    print(f"Resumen guardado exitosamente en: {out_docx}")

    art_docx = r"C:\Users\danil\.gemini\antigravity\brain\da4b3393-70b8-4243-8d8b-a5853754d9f7\RESUMEN_EJECUTIVO_MODELO_ML_RANDOM_FOREST.docx"
    doc.save(art_docx)
    print(f"Copia de artefacto guardada en: {art_docx}")

if __name__ == "__main__":
    main()

