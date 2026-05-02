#!/usr/bin/env bash
# eurlex-family — lanceur double-clic (macOS / Linux)
#
# Double-cliquez sur ce fichier (sur Mac : ouvrez avec Terminal la
# première fois si nécessaire). Le script :
#   1. vérifie que Node.js est installé,
#   2. installe les dépendances si c'est la première fois,
#   3. compile l'application,
#   4. démarre le serveur local et ouvre votre navigateur sur
#      http://localhost:4050.
#
# Pour arrêter : revenez à cette fenêtre Terminal et appuyez sur
# Ctrl+C, ou fermez la fenêtre.

set -e

# Se placer dans le répertoire du script.
cd "$(dirname "$0")"

# Couleurs pour la lisibilité.
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

bold "─── eurlex-family — démarrage ───"
echo

# 1. Vérifier Node.js.
if ! command -v node >/dev/null 2>&1; then
  red "Node.js n'est pas installé."
  echo
  echo "Téléchargez et installez Node.js (version 20 ou plus récente)"
  echo "depuis : https://nodejs.org/fr/"
  echo
  echo "Puis relancez ce script."
  echo
  read -r -p "Appuyez sur Entrée pour fermer cette fenêtre…" _
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  red "Node.js trop ancien (version $NODE_MAJOR détectée — version 20+ requise)."
  echo "Mettez Node.js à jour : https://nodejs.org/fr/"
  read -r -p "Appuyez sur Entrée pour fermer cette fenêtre…" _
  exit 1
fi

green "✓ Node.js $(node --version)"
echo

# 2. Première installation : npm install + build.
if [ ! -d node_modules ] || [ ! -d dist/server ]; then
  yellow "Première installation — cela peut prendre 30-60 secondes…"
  npm install --omit=dev --no-audit --no-fund 2>&1 | tail -5
  green "✓ Dépendances installées"
  echo
  yellow "Compilation…"
  # Toolchain de build : tsc + tsx ne sont pas dans omit=dev. On les
  # ajoute si manquants.
  if [ ! -d node_modules/typescript ]; then
    npm install --no-audit --no-fund 2>&1 | tail -5
  fi
  npm run build 2>&1 | tail -3
  green "✓ Application compilée"
  echo
fi

# 3. Démarrer + ouvrir le navigateur.
PORT="${PORT:-4050}"
URL="http://localhost:$PORT"

green "▶ Démarrage du serveur sur $URL"
echo
echo "  → Pour arrêter : Ctrl+C dans cette fenêtre."
echo "  → Vos cas sont sauvegardés dans : ./data/"
echo

# Ouvrir le navigateur en arrière-plan, après une seconde de délai.
(
  sleep 1
  if command -v open >/dev/null 2>&1; then
    open "$URL" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" 2>/dev/null || true
  fi
) &

# Démarrer le serveur au premier plan.
exec node dist/server/cli.js
