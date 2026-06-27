@echo off
echo Encerrando o servidor de pesagem...
REM Encerra apenas o processo que esta rodando o servidor.py (nao mexe em outros pythons).
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='pythonw.exe' OR Name='python.exe'\" | Where-Object { $_.CommandLine -like '*servidor.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo Servidor encerrado. Pode fechar esta janela.
timeout /t 2 /nobreak >nul
