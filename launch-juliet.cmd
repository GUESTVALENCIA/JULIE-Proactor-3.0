@echo off
setlocal
set "ROOT=%~dp0"
set "LAUNCHER_PS=%ROOT%scripts\launch-juliet.ps1"

if not exist "%LAUNCHER_PS%" (
  echo No se encontro el launcher estable de Juliet Proactor 3.0.
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER_PS%"
exit /b %ERRORLEVEL%
