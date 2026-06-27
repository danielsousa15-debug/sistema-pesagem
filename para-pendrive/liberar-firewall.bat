@echo off
REM ------------------------------------------------------------------
REM Libera as portas 8080 e 8765 no Firewall do Windows.
REM Pede permissao de administrador sozinho (janela do UAC "Sim/Nao").
REM ------------------------------------------------------------------

REM 1) Verifica se ja esta rodando como administrador.
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permissao de administrador...
    echo Clique em "Sim" na janela que vai aparecer.
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

REM 2) Aqui ja esta como administrador: cria as regras.
echo ============================================================
echo  Liberando o Firewall para o sistema de pesagem...
echo ============================================================
echo.

REM Remove regras antigas com o mesmo nome (evita duplicar) e cria de novo.
netsh advfirewall firewall delete rule name="Pesagem HTTP 8080" >nul 2>&1
netsh advfirewall firewall delete rule name="Pesagem WS 8765" >nul 2>&1
netsh advfirewall firewall add rule name="Pesagem HTTP 8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="Pesagem WS 8765" dir=in action=allow protocol=TCP localport=8765

echo.
echo ============================================================
echo  Pronto! Portas 8080 e 8765 liberadas no Firewall.
echo  Agora o tablet consegue acessar o notebook.
echo ============================================================
pause
