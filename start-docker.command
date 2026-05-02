#!/usr/bin/env bash
# eurlex-family — lanceur Docker (double-clic Mac / Linux)
#
# Pré-requis : Docker Desktop installé (https://www.docker.com/products/docker-desktop/).
# Cette image est signée par Docker Inc — pas d'alerte Apple.
#
# Ce script :
#   1. vérifie que Docker tourne,
#   2. construit l'image (la première fois — environ 1-2 minutes),
#   3. démarre l'application en arrière-plan,
#   4. ouvre votre navigateur sur http://localhost:4050.
#
# Pour ARRÊTER : double-cliquez sur stop-docker.command (à venir)
# ou tapez : docker compose down depuis ce dossier.

set -e
cd "$(dirname "$0")"

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

bold "─── eurlex-family — démarrage Docker ───"
echo

if ! command -v docker >/dev/null 2>&1; then
  red "Docker n'est pas installé."
  echo
  echo "Téléchargez Docker Desktop (gratuit, signé par Docker Inc — pas"
  echo "d'alerte macOS) :"
  echo "    https://www.docker.com/products/docker-desktop/"
  echo
  echo "Installez, lancez Docker Desktop une fois, puis relancez ce script."
  echo
  read -r -p "Appuyez sur Entrée pour fermer cette fenêtre…" _
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  red "Docker est installé mais ne tourne pas."
  echo
  echo "Démarrez Docker Desktop (icône baleine dans la barre des"
  echo "menus), attendez qu'elle indique « Docker Desktop is running »,"
  echo "puis relancez ce script."
  echo
  read -r -p "Appuyez sur Entrée pour fermer cette fenêtre…" _
  exit 1
fi

green "✓ Docker prêt"
echo

URL="http://localhost:4050"

# Détection compose (plugin v2 vs binaire séparé).
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  red "docker compose introuvable. Mettez Docker Desktop à jour."
  read -r -p "Appuyez sur Entrée pour fermer…" _
  exit 1
fi

yellow "Construction de l'image (~1-2 minutes la première fois)…"
echo
$COMPOSE build --quiet

yellow "Démarrage du conteneur…"
$COMPOSE up -d

# Attendre /health.
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -s -o /dev/null -m 2 "$URL/health" 2>/dev/null; then
    green "✓ Application prête"
    break
  fi
  sleep 1
done
echo

green "▶ Application sur $URL"
echo
echo "  → Vos cas sont sauvegardés dans : ./data/"
echo "  → Pour ARRÊTER : double-cliquez sur stop-docker.command"
echo "                   ou tapez 'docker compose down' dans ce dossier."
echo

# Ouvrir le navigateur.
if command -v open >/dev/null 2>&1; then
  open "$URL" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" 2>/dev/null || true
fi

echo "Cette fenêtre peut être fermée. L'application continue de tourner."
read -r -p "Appuyez sur Entrée pour fermer…" _
