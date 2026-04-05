@echo off
setlocal
set "ROOT=%~dp0"

echo ================================================
echo    Juliet Proactor 3.0 - Launcher con Diagnostico
echo ================================================
echo.

echo [1/3] Verificando servicios criticos...
echo.

curl -s http://localhost:8080/v1/models >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] G4F Server online en :8080
) else (
    echo [WARN] G4F Server no responde en :8080
)

curl -s http://localhost:8082/v1/models >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] G4F Proxy online en :8082
) else (
    echo [WARN] G4F Proxy no responde en :8082
)

echo.
echo [2/3] Verificando build del workspace...
dir /T:W "%ROOT%dist\assets\index-*.js" | findstr "index-"
echo.

echo [3/3] Iniciando Juliet Proactor 3.0 con launcher blindado...
echo.
call "%ROOT%launch-juliet.cmd"

echo.
echo Juliet Proactor 3.0 iniciada correctamente.
echo.
echo PRUEBA RAPIDA:
echo 1. Abre DevTools con Ctrl+Shift+I
echo 2. Confirma que el bundle cargado sea el mas reciente
echo 3. Prueba un turno con G4F o OpenRouter
echo.
pause
