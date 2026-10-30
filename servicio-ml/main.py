import os
import math
import warnings
from pathlib import Path
from typing import Optional
from datetime import datetime
from contextlib import asynccontextmanager

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sklearn.exceptions import InconsistentVersionWarning

# Suprimir advertencias menores de diferencia de versión de scikit-learn
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

# ── 1. Carga controlada del modelo ──
BASE_DIR = Path(__file__).resolve().parent
MODELO_PATH = BASE_DIR / "modelo_franjas.joblib"

modelo = None

def cargar_modelo():
    global modelo
    if MODELO_PATH.exists():
        try:
            print(f"[INFO] Cargando '{MODELO_PATH.name}' (esto puede tomar unos segundos)...")
            modelo = joblib.load(MODELO_PATH)
            print(f"[INFO] ¡Modelo '{MODELO_PATH.name}' cargado exitosamente!")
        except Exception as e:
            print(f"[ERROR] Error al deserializar '{MODELO_PATH.name}': {e}")
            modelo = None
    else:
        print(f"[WARN] El archivo '{MODELO_PATH.name}' no se encuentra en {BASE_DIR}. El servicio iniciará en modo espera.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    cargar_modelo()
    yield

# ── 2. Inicialización de FastAPI y CORS ──
app = FastAPI(
    title="Servicio ML - Predicción de Demanda Restaurante",
    description="Microservicio REST para estimación de comensales y cálculo de mesas sugeridas.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 3. Esquemas de Pydantic ──
class PrediccionRequest(BaseModel):
    fecha: str = Field(..., description="Fecha en formato YYYY-MM-DD", example="2026-11-20")
    hora: int = Field(..., ge=0, le=23, description="Franja horaria (0 a 23)", example=19)

    @field_validator("fecha")
    @classmethod
    def validar_formato_fecha(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError("El formato de fecha debe ser YYYY-MM-DD")

class PrediccionResponse(BaseModel):
    fecha: str
    franja_horaria: int
    comensales_estimados: float
    mesas_sugeridas_preparar: int
    es_fin_de_semana: int

class PrediccionRangoRequest(BaseModel):
    fecha_inicio: str = Field(..., description="Fecha de inicio YYYY-MM-DD", example="2026-11-20")
    fecha_fin: Optional[str] = Field(None, description="Fecha fin YYYY-MM-DD (opcional)", example="2026-11-20")
    turno: Optional[str] = Field("COMPLETO", description="ALMUERZO, CENA o COMPLETO", example="COMPLETO")

class PrediccionRangoResponse(BaseModel):
    fecha_inicio: str
    fecha_fin: str
    turno: str
    total_comensales_estimados: float
    mesas_sugeridas_pico: int
    detalles: list[PrediccionResponse]

# ── 4. Endpoints ──
@app.get("/", summary="Health Check")
def health_check():
    return {
        "status": "ok",
        "servicio": "Servicio ML - Predicción de Demanda",
        "modelo_cargado": modelo is not None
    }

@app.post(
    "/predecir-demanda",
    response_model=PrediccionResponse,
    summary="Predecir demanda de comensales y estimar mesas necesarias"
)
def predecir_demanda(request: PrediccionRequest):
    global modelo
    # Recargar si fue colocado dinámicamente y aún no estaba en memoria
    if modelo is None:
        cargar_modelo()

    if modelo is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "El archivo 'modelo_franjas.joblib' no está disponible en el servidor. "
                "Por favor, asegúrate de colocar el archivo en la carpeta 'servicio-ml/'."
            )
        )

    try:
        # Conversión de fecha y extracción de características temporales
        dt = datetime.strptime(request.fecha, "%Y-%m-%d")
        dia_semana = dt.weekday()  # 0: Lunes ... 6: Domingo
        mes = dt.month
        es_fin_de_semana = 1 if dia_semana >= 4 else 0  # Viernes (4), Sábado (5), Domingo (6)
        franja_horaria = request.hora

        # Construcción del DataFrame para el modelo Scikit-learn
        df_input = pd.DataFrame([{
            "franja_horaria": franja_horaria,
            "dia_semana": dia_semana,
            "mes": mes,
            "es_fin_de_semana": es_fin_de_semana
        }])

        # Inferencia
        prediccion_raw = modelo.predict(df_input)
        comensales = float(prediccion_raw[0])
        comensales_estimados = max(0.0, round(comensales, 2))

        # Cálculo de mesas: Factor de holgura (+10%) / 3.5 comensales por mesa
        # Redondeo hacia arriba (math.ceil) para no quedar cortos de capacidad
        mesas_sugeridas = math.ceil((comensales_estimados * 1.10) / 3.5)

        return PrediccionResponse(
            fecha=request.fecha,
            franja_horaria=franja_horaria,
            comensales_estimados=comensales_estimados,
            mesas_sugeridas_preparar=mesas_sugeridas,
            es_fin_de_semana=es_fin_de_semana
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la inferencia del modelo: {str(e)}"
        )

@app.post(
    "/predecir-rango",
    response_model=PrediccionRangoResponse,
    summary="Predicción para un rango de fechas y franjas horarias"
)
def predecir_rango(request: PrediccionRangoRequest):
    global modelo
    if modelo is None:
        cargar_modelo()

    if modelo is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo ML no disponible."
        )

    try:
        from datetime import timedelta
        f_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d").date()
        f_fin = datetime.strptime(request.fecha_fin, "%Y-%m-%d").date() if request.fecha_fin else f_inicio

        if f_fin < f_inicio:
            f_fin = f_inicio

        # Definir franjas según el turno
        turno = (request.turno or "COMPLETO").upper()
        if turno == "ALMUERZO":
            franjas = [12, 13, 14, 15]
        elif turno == "CENA":
            franjas = [18, 19, 20, 21, 22]
        else: # COMPLETO
            franjas = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

        detalles = []
        total_comensales = 0.0
        max_mesas = 0

        # Iterar días y horas
        delta = (f_fin - f_inicio).days
        for day_offset in range(delta + 1):
            curr_date = f_inicio + timedelta(days=day_offset)
            date_str = curr_date.strftime("%Y-%m-%d")
            dia_semana = curr_date.weekday()
            mes = curr_date.month
            es_finde = 1 if dia_semana >= 4 else 0

            rows = [{"franja_horaria": h, "dia_semana": dia_semana, "mes": mes, "es_fin_de_semana": es_finde} for h in franjas]
            df_batch = pd.DataFrame(rows)
            preds = modelo.predict(df_batch)

            for h, p in zip(franjas, preds):
                comensales = max(0.0, round(float(p), 2))
                mesas = math.ceil((comensales * 1.10) / 3.5)
                detalles.append(PrediccionResponse(
                    fecha=date_str,
                    franja_horaria=h,
                    comensales_estimados=comensales,
                    mesas_sugeridas_preparar=mesas,
                    es_fin_de_semana=es_finde
                ))
                total_comensales += comensales
                if mesas > max_mesas:
                    max_mesas = mesas

        return PrediccionRangoResponse(
            fecha_inicio=request.fecha_inicio,
            fecha_fin=request.fecha_fin or request.fecha_inicio,
            turno=turno,
            total_comensales_estimados=round(total_comensales, 2),
            mesas_sugeridas_pico=max_mesas,
            detalles=detalles
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en inferencia por rango: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


