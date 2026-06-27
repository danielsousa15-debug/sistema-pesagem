@echo off
cd /d "%~dp0"
echo ============================================================
echo  Iniciando servidor de pesagem...
echo ============================================================

REM Inicia o servidor sem janela preta (pythonw). Os logs ficam em servidor.log.
where pythonw >nul 2>nul
if %errorlevel%==0 (
    start "Servidor Pesagem" pythonw servidor.py
) else (
    start "Servidor Pesagem" /min python servidor.py
)

REM Aguarda 2 segundos o servidor subir.
timeout /t 2 /nobreak >nul

REM Localiza o Chrome; se nao achar, usa o Edge.
set "BROWSER="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "BROWSER=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

if defined BROWSER start "" "%BROWSER%" --kiosk --start-fullscreen --disable-pinch "http://localhost:8080"
if not defined BROWSER start "" msedge --kiosk "http://localhost:8080" --edge-kiosk-type=fullscreen

REM Le o IP do config.json para mostrar o endereco correto ao operador
for /f "delims=" %%i in ('python -c "import json; c=json.load(open('config.json')); print(c.get('ip_servidor','???'))"') do set "IP_CFG=%%i"

echo.
echo ============================================================
echo  Sistema iniciado!
echo  No tablet, abra o Chrome e acesse:
echo.
echo       http://%IP_CFG%:8080
echo.
echo  Para encerrar: rode parar.bat
echo ============================================================
pause
