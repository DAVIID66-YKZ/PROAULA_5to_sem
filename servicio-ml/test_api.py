import requests
import json

URL = "http://127.0.0.1:8000/predecir-demanda"

payload = {
    "fecha": "2026-11-20",  # Viernes
    "hora": 19              # Franja nocturna (7:00 PM)
}

def probar_api():
    print(f"[TEST] Enviando solicitud a: {URL}")
    print(f"[TEST] Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(URL, json=payload, timeout=5)
        print(f"\n[STATUS CODE]: {response.status_code}")

        if response.status_code == 200:
            print("[RESULTADO EXITOSO]:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print("[ERROR / DETALLE]:")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("\n[ERROR DE CONEXIÓN]: No se pudo conectar al microservicio.")
        print("Asegúrate de que uvicorn esté corriendo con:")
        print("  uvicorn main:app --reload --port 8000")

if __name__ == "__main__":
    probar_api()

