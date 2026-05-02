#!/usr/bin/env bash
# eurlex-family — arrêt du conteneur Docker.
set -e
cd "$(dirname "$0")"

if docker compose version >/dev/null 2>&1; then
  docker compose down
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose down
fi

echo
echo "Application arrêtée. Vos cas restent dans ./data/."
echo
read -r -p "Appuyez sur Entrée pour fermer…" _
