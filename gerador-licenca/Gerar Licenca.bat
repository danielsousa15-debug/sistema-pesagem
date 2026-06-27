@echo off
cd /d "%~dp0"
title Dex Balance -- Gerador de Licenca
echo ============================================================
echo  Dex Balance -- Gerador de Licenca (uso do administrador)
echo ============================================================
echo.
python gerar-licenca.py
echo.
pause
