Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Iniciando Sistema de Reservas + Servicio ML" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Levantando Microservicio FastAPI (Puerto 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\servicio-ml'; & '.\.venv\Scripts\python.exe' -m uvicorn main:app --reload --port 8000"

Write-Host "[2/2] Levantando Spring Boot (Puerto 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; .\mvnw.cmd spring-boot:run"

Write-Host "`nAmbos servicios iniciados en consolas independientes:" -ForegroundColor Green
Write-Host "  -> Spring Boot: http://localhost:8080" -ForegroundColor White
Write-Host "  -> FastAPI ML:  http://localhost:8000 (Docs: http://localhost:8000/docs)" -ForegroundColor White

