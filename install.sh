#!/usr/bin/env bash
# eurlex-family — installeur en une commande pour macOS / Linux.
#
# Usage (à coller dans Terminal) :
#   curl -fsSL https://raw.githubusercontent.com/soup5615/eurlex-family-mcp/claude/succession-law-software-0YUMr/install.sh | bash
#
# Ce script :
#   1. télécharge l'application,
#   2. la dépose dans ~/Desktop/eurlex-family (ou ~/Bureau si Linux fr),
#   3. lève la quarantaine macOS sur les scripts (pas d'alerte Apple),
#   4. lance automatiquement l'application si Docker ou Node.js sont
#      détectés.

set -e

REPO="soup5615/eurlex-family-mcp"
BRANCH="claude/succession-law-software-0YUMr"
ARCHIVE_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH//\//%2F}.tar.gz"

# ─── Couleurs ───
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

bold "─── eurlex-family — installation sur le Bureau ───"
echo

# ─── Choix du dossier de destination ───
case "$(uname -s)" in
  Darwin) DESKTOP="$HOME/Desktop" ;;
  Linux)
    if [ -d "$HOME/Bureau" ]; then
      DESKTOP="$HOME/Bureau"
    elif [ -d "$HOME/Desktop" ]; then
      DESKTOP="$HOME/Desktop"
    else
      DESKTOP="$HOME"
    fi
    ;;
  *) DESKTOP="$HOME" ;;
esac
DEST="${INSTALL_DIR:-$DESKTOP/eurlex-family}"

# ─── Si le dossier existe déjà ───
if [ -d "$DEST" ]; then
  yellow "Le dossier existe déjà : $DEST"
  if [ -t 0 ]; then
    read -r -p "Le supprimer et réinstaller ? [o/N] " r </dev/tty
  else
    r="N"
  fi
  case "$r" in
    o|O|y|Y) rm -rf "$DEST" ;;
    *) echo "Installation annulée."; exit 0 ;;
  esac
fi

# ─── Téléchargement ───
mkdir -p "$DEST"
echo "Téléchargement de l'application (~5 Mo)…"
if ! curl -fsSL "$ARCHIVE_URL" | tar xz --strip-components=1 -C "$DEST"; then
  red "Erreur de téléchargement."
  echo "Vérifiez votre connexion internet et la disponibilité de :"
  echo "    $ARCHIVE_URL"
  exit 1
fi

# ─── Préparation des scripts ───
chmod +x "$DEST"/*.command 2>/dev/null || true
chmod +x "$DEST"/*.sh 2>/dev/null || true

# Sur macOS, retirer l'attribut de quarantaine pour éviter Gatekeeper.
if command -v xattr >/dev/null 2>&1; then
  xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true
fi

green "✓ Application installée dans : $DEST"
echo

# ─── Lancement automatique si possible ───
launched=0

# 1. Docker (préféré : pas d'alerte)
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  green "Docker détecté → lancement automatique."
  echo
  cd "$DEST"
  bash ./start-docker.command
  launched=1
fi

# 2. Node.js (si Docker absent)
if [ "$launched" -eq 0 ] && command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    green "Node.js $NODE_MAJOR détecté → lancement automatique."
    echo
    cd "$DEST"
    bash ./start.command
    launched=1
  fi
fi

# 3. Aucun runtime — afficher la marche à suivre
if [ "$launched" -eq 0 ]; then
  echo
  bold "Pour utiliser l'application, installez UNE des deux options :"
  echo
  echo "  🐳 Docker Desktop (recommandé — aucune alerte Apple) :"
  echo "       https://www.docker.com/products/docker-desktop/"
  echo
  echo "  🟢 Node.js 20+ (alternative légère) :"
  echo "       https://nodejs.org/fr/"
  echo
  echo "Puis ouvrez le dossier '$DEST' et double-cliquez sur :"
  echo "  - start-docker.command (si vous avez choisi Docker)"
  echo "  - start.command         (si vous avez choisi Node.js)"
  echo
  echo "Voir aussi le guide complet : $DEST/INSTALLATION.md"
fi
