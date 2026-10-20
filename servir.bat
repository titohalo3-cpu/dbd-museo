@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo No se ha encontrado Python. Abre index.html directamente y usa el boton "Cargar carpeta".
  pause
  exit /b
)
echo Museo disponible en http://localhost:8080
start "" http://localhost:8080
python -m http.server 8080
