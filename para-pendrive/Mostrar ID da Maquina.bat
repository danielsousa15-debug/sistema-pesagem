@echo off
cd /d "%~dp0"
title Dex Balance -- ID da Maquina
python mostrar-id.py
if %errorlevel% neq 0 (
    echo.
    echo  Nao foi possivel rodar. O Python esta instalado?
    echo  Rode o instalar.bat primeiro.
    echo.
    pause
)
