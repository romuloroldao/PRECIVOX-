#!/bin/bash
# Deploy rápido: build em DEPLOY_SRC → rsync → PM2 restart
# Uso: bash scripts/deploy-prod-rsync.sh
#
# Para deploy completo (git pull, migrations, npm ci): ./deploy-prod.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/deploy-env.sh"

SRC="$(deploy_resolve_path "$DEPLOY_SRC")"
DEST="$(deploy_resolve_path "$DEPLOY_DEST")"

echo ">>> Deploy rápido PRECIVOX"
echo ">>> Origem:  $SRC"
echo ">>> Destino: $DEST"
echo ""

cd "$SRC"
deploy_load_env_production "$SRC"

echo ">>> Build frontend em $SRC..."
rm -rf .next/cache
# Shell AI-Native on em produção (força no processo para não herdar .env.local=false).
NEXT_PUBLIC_AI_NATIVE_SHELL=true npm run build
deploy_require_next_static "$SRC"

deploy_sync_to_dest

cd "$DEST"
deploy_load_env_production "$DEST"

echo ">>> Prisma generate no destino..."
npx prisma generate

deploy_verify_pm2_alignment

deploy_pm2_reload_apps

sleep 2
deploy_smoke_apps || exit 1

echo ">>> Deploy rápido concluído."
