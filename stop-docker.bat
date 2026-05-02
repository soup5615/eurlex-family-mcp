@echo off
REM eurlex-family — arret du conteneur Docker.
setlocal
cd /d "%~dp0"

docker compose down

echo.
echo Application arretee. Vos cas restent dans .\data\.
echo.
pause
endlocal
