@echo off
setlocal enabledelayedexpansion
title Dex Balance -- Instalador

:: ============================================================
:: Solicita elevacao de administrador (necessario para firewall
:: e pasta Startup do Windows).
:: ============================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permissao de administrador...
    echo Clique em "Sim" na janela que vai aparecer.
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs -WorkingDirectory '%~dp0'"
    exit /b
)

cd /d "%~dp0"
cls
echo.
echo  ================================================
echo    DEX BALANCE -- Instalador automatico v2.0
echo    Sistema de controle de ingredientes
echo  ================================================
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: ============================================================
:: 1. PYTHON
:: ============================================================
echo [1/6] Verificando Python...
python --version >nul 2>&1
if %errorlevel% equ 0 goto :python_ok

:: Python nao encontrado - baixar e instalar automaticamente
echo        Python nao encontrado. Baixando automaticamente...
echo        (pode levar 2-3 minutos dependendo da internet)
echo.
set "PY_URL=https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe"
set "PY_INST=%TEMP%\python-setup.exe"

powershell -NoProfile -Command "Invoke-WebRequest -Uri '%PY_URL%' -OutFile '%PY_INST%' -UseBasicParsing" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: nao foi possivel baixar o Python automaticamente.
    echo  Verifique a conexao com a internet e tente novamente,
    echo  ou instale manualmente em https://python.org/downloads
    echo  marcando "Add Python to PATH" na instalacao.
    echo.
    pause & exit /b 1
)

echo        Instalando Python silenciosamente...
"%PY_INST%" /quiet InstallAllUsers=0 PrependPath=1 Include_test=0 Include_doc=0
del "%PY_INST%" >nul 2>&1

:: Adiciona o Python recem-instalado ao PATH desta sessao.
:: (processos ja abertos nao enxergam o PATH novo do registro, por isso
::  forcamos o caminho padrao da instalacao por usuario aqui)
set "PATH=%LOCALAPPDATA%\Programs\Python\Python312\;%LOCALAPPDATA%\Programs\Python\Python312\Scripts\;%PATH%"

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Python foi instalado. Feche esta janela e execute o
    echo  instalar.bat novamente para concluir a instalacao.
    echo.
    pause ^& exit /b 1
)
echo        Python instalado OK
goto :python_ok

:python_ok
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo        Python %PYVER% OK

:: ============================================================
:: 2. DEPENDENCIAS
:: ============================================================
echo [2/6] Instalando dependencias Python...
python -m pip install --quiet --upgrade pip >nul 2>&1
python -m pip install --quiet --upgrade -r requirements.txt
if %errorlevel% neq 0 (
    echo  ERRO ao instalar dependencias. Verifique a conexao com a internet.
    pause & exit /b 1
)
echo        websockets + pyserial instalados OK

:: ============================================================
:: 3. SELECAO DA LOJA
:: ============================================================
echo.
echo [3/6] Identificacao da loja
echo.
echo   Num   ID       Nome
echo   ----  -------  ----------------------------------
echo    1    SP-001   Vila Clementino - Sao Paulo/SP
echo    2    SP-002   Jabaquara - Sao Paulo/SP
echo    3    SP-003   Campo Belo - Sao Paulo/SP
echo    4    SP-004   Gopouva - Guarulhos/SP
echo    5    SP-005   Mandaqui - Sao Paulo/SP
echo    6    SP-006   Pinheiros - Sao Paulo/SP
echo    7    SP-007   Aclimacao - Sao Paulo/SP
echo    8    SP-008   GRU - Guarulhos/SP
echo    9    ES-001   Praia do Canto - Vitoria/ES
echo   10    ES-002   Jardim Camburi - Vitoria/ES
echo   11    ES-003   Serra - Serra/ES
echo.
set /p OPCAO=" Digite o numero da loja: "

set "LOJA_ID="
set "LOJA_NOME="
if "%OPCAO%"=="1"  ( set "LOJA_ID=SP-001" & set "LOJA_NOME=Domino's Vila Clementino" )
if "%OPCAO%"=="2"  ( set "LOJA_ID=SP-002" & set "LOJA_NOME=Domino's Jabaquara" )
if "%OPCAO%"=="3"  ( set "LOJA_ID=SP-003" & set "LOJA_NOME=Domino's Campo Belo" )
if "%OPCAO%"=="4"  ( set "LOJA_ID=SP-004" & set "LOJA_NOME=Domino's Gopouva" )
if "%OPCAO%"=="5"  ( set "LOJA_ID=SP-005" & set "LOJA_NOME=Domino's Mandaqui" )
if "%OPCAO%"=="6"  ( set "LOJA_ID=SP-006" & set "LOJA_NOME=Domino's Pinheiros" )
if "%OPCAO%"=="7"  ( set "LOJA_ID=SP-007" & set "LOJA_NOME=Domino's Aclimacao" )
if "%OPCAO%"=="8"  ( set "LOJA_ID=SP-008" & set "LOJA_NOME=Domino's GRU" )
if "%OPCAO%"=="9"  ( set "LOJA_ID=ES-001" & set "LOJA_NOME=Domino's Praia do Canto" )
if "%OPCAO%"=="10" ( set "LOJA_ID=ES-002" & set "LOJA_NOME=Domino's Jardim Camburi" )
if "%OPCAO%"=="11" ( set "LOJA_ID=ES-003" & set "LOJA_NOME=Domino's Serra" )

if "%LOJA_ID%"=="" (
    echo  ERRO: opcao invalida. Execute o instalador novamente.
    pause & exit /b 1
)
echo        Loja: %LOJA_ID% -- %LOJA_NOME%

:: ---- Detectar IP local automaticamente ----
echo.
set "IP_LOCAL="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127\." ^| findstr /v "169\."') do (
    if "!IP_LOCAL!"=="" set "IP_RAW=%%A"
)
set "IP_LOCAL=%IP_RAW: =%"
if "%IP_LOCAL%"=="" set "IP_LOCAL=192.168.1.100"

echo  IP detectado automaticamente: %IP_LOCAL%
set /p IP_CONFIRM=" Confirme ou corrija o IP (Enter = aceitar): "
if not "%IP_CONFIRM%"=="" set "IP_LOCAL=%IP_CONFIRM%"
echo        IP: %IP_LOCAL%

:: ---- Gravar config.json via Python ----
python setup_config.py "%LOJA_ID%" "%LOJA_NOME%" "%IP_LOCAL%"

if %errorlevel% neq 0 (
    echo  ERRO ao gravar config.json.
    pause & exit /b 1
)
echo        config.json gravado OK

:: ============================================================
:: 4. FIREWALL
:: ============================================================
echo.
echo [4/6] Liberando portas no Firewall (8080 e 8765)...
netsh advfirewall firewall delete rule name="Pesagem HTTP 8080" >nul 2>&1
netsh advfirewall firewall delete rule name="Pesagem WS 8765" >nul 2>&1
netsh advfirewall firewall delete rule name="DexBalance" >nul 2>&1
netsh advfirewall firewall add rule name="Pesagem HTTP 8080" dir=in action=allow protocol=TCP localport=8080 >nul
netsh advfirewall firewall add rule name="Pesagem WS 8765"  dir=in action=allow protocol=TCP localport=8765 >nul
echo        Portas 8080 e 8765 liberadas OK

:: ============================================================
:: 5. PASTA DE LOGS
:: ============================================================
echo [5/6] Criando pasta de logs...
if not exist "logs" mkdir logs
echo        OK

:: ============================================================
:: 6. INICIALIZACAO AUTOMATICA COM O WINDOWS
:: ============================================================
echo [6/6] Configurando inicializacao automatica...

set "DESTINO=%~dp0"

:: Cria atalho na pasta Startup apontando para iniciar.bat
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s = $ws.CreateShortcut('%STARTUP%\DexBalance.lnk');" ^
  "$s.TargetPath = '%DESTINO%iniciar.bat';" ^
  "$s.WorkingDirectory = '%DESTINO%';" ^
  "$s.WindowStyle = 7;" ^
  "$s.Description = 'Dex Balance Servidor';" ^
  "$s.Save()"

if %errorlevel% neq 0 (
    echo  AVISO: nao foi possivel criar o atalho de inicializacao.
    echo         Adicione manualmente iniciar.bat na pasta Startup.
) else (
    echo        Iniciara automaticamente com o Windows OK
)

:: ============================================================
:: CONCLUIDO
:: ============================================================
echo.
echo  ================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo  ================================================
echo.
echo    Loja   : %LOJA_ID% -- %LOJA_NOME%
echo    IP      : %IP_LOCAL%
echo.
echo    No tablet, abrir o Chrome em:
echo.
echo       http://%IP_LOCAL%:8080
echo.
echo    Para iniciar/parar o servidor:
echo       iniciar.bat  (ou reinicie o computador)
echo       parar.bat
echo  ================================================
echo.
set /p INICIAR=" Iniciar o servidor agora? (S/N): "
if /i "%INICIAR%"=="S" (
    call iniciar.bat
) else (
    echo.
    echo  Tudo pronto. Execute iniciar.bat quando quiser ligar o sistema.
    echo.
    pause
)
