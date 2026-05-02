@echo off
REM eurlex-family — lanceur double-clic (Windows)
REM
REM Double-cliquez sur ce fichier dans l'Explorateur. Le script
REM verifie Node.js, installe les dependances si necessaire, compile
REM l'application, demarre le serveur et ouvre votre navigateur sur
REM http://localhost:4050.
REM
REM Pour arreter : fermez la fenetre noire qui s'est ouverte.

setlocal
cd /d "%~dp0"

echo.
echo --- eurlex-family — demarrage ---
echo.

REM 1. Verifier Node.js.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe.
  echo.
  echo Telechargez et installez Node.js (version 20 ou plus recente)
  echo depuis : https://nodejs.org/fr/
  echo.
  echo Puis relancez ce script.
  echo.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%i in ('node -p "process.versions.node"') do set NODE_MAJOR=%%i
if %NODE_MAJOR% LSS 20 (
  echo Node.js trop ancien — version 20 ou plus recente requise.
  echo Mettez Node.js a jour : https://nodejs.org/fr/
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%
echo.

REM 2. Premiere installation : npm install + build.
if not exist node_modules (
  echo Premiere installation — cela peut prendre 30-60 secondes...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :error
  echo [OK] Dependances installees
  echo.
)

if not exist dist\server (
  echo Compilation...
  call npm run build
  if errorlevel 1 goto :error
  echo [OK] Application compilee
  echo.
)

REM 3. Demarrer + ouvrir le navigateur.
if "%PORT%"=="" set PORT=4050
set URL=http://localhost:%PORT%

echo Demarrage du serveur sur %URL%
echo.
echo   - Pour arreter : fermez cette fenetre.
echo   - Vos cas sont sauvegardes dans : .\data\
echo.

REM Ouvrir le navigateur apres une courte attente.
start "" /b cmd /c "timeout /t 1 /nobreak >nul && start %URL%"

REM Demarrer le serveur au premier plan.
node dist\server\cli.js
goto :end

:error
echo.
echo Erreur pendant l'installation.
pause
exit /b 1

:end
endlocal
