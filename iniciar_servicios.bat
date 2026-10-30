@echo off
title Sistema Reservas - Lanzador de Servicios
echo ===================================================
echo     Iniciando Sistema de Reservas + Microservicio ML
echo ===================================================

echo [1/2] Levantando Microservicio FastAPI (Python) en Puerto 8000...
start "FastAPI ML - Puerto 8000" cmd /k "cd /d %~dp0servicio-ml && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo [2/2] Levantando Backend Spring Boot (Java) en Puerto 8080...
start "Spring Boot Backend - Puerto 8080" cmd /k "cd /d %~dp0 && mvnw.cmd spring-boot:run"

echo.
echo ===================================================
echo Ambos servicios se estan ejecutando en consolas separadas:
echo - Spring Boot:   http://localhost:8080
echo - FastAPI (ML):  http://localhost:8000 (Docs: /docs)
echo ===================================================

