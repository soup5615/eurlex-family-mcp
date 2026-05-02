@echo off
REM eurlex-family — lanceur Docker (Windows)
REM
REM Pre-requis : Docker Desktop installe et en cours d'execution.
REM    https://www.docker.com/products/docker-desktop/
REM
REM Ce script construit l'image (la premiere fois ~ 1-2 minutes),
REM demarre le conteneur en arriere-plan, puis ouvre votre
REM navigateur sur http://localhost:4050.
REM
REM Pour ARRETER : double-cliquez sur stop-docker.bat ou tapez
REM    docker compose down
REM dans ce dossier.

setlocal
cd /d "%~dp0"

echo.
echo --- eurlex-family — demarrage Docker ---
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker n'est pas installe.
  echo.
  echo Telechargez Docker Desktop ^(gratuit^) :
  echo    https://www.docker.com/products/docker-desktop/
  echo.
  echo Installez, lancez Docker Desktop une fois, puis relancez ce script.
  echo.
  pause
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo Docker est installe mais ne tourne pas.
  echo.
  echo Demarrez Docker Desktop ^(icone baleine dans la barre des taches^),
  echo attendez qu'elle indique "Docker Desktop is running",
  echo puis relancez ce script.
  echo.
  pause
  exit /b 1
)

echo [OK] Docker pret
echo.

set URL=http://localhost:4050

echo Construction de l'image ^(~1-2 minutes la premiere fois^)...
docker compose build --quiet
if errorlevel 1 goto :error

echo Demarrage du conteneur...
docker compose up -d
if errorlevel 1 goto :error

REM Attendre /health.
set /a tries=0
:wait
set /a tries+=1
curl -s -o nul -m 2 %URL%/health >nul 2>nul
if not errorlevel 1 goto :ready
if %tries% geq 15 goto :ready
timeout /t 1 /nobreak >nul
goto :wait

:ready
echo [OK] Application prete
echo.
echo Application disponible sur %URL%
echo.
echo   - Vos cas sont sauvegardes dans : .\data\
echo   - Pour ARRETER : double-cliquez sur stop-docker.bat
echo.

start %URL%

echo Cette fenetre peut etre fermee. L'application continue de tourner.
pause
goto :end

:error
echo.
echo Erreur. Verifiez que Docker Desktop est bien lance.
pause
exit /b 1

:end
endlocal
