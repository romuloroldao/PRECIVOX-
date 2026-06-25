#!/bin/bash
# Sincroniza .next já buildado (CI ou build local) → DEPLOY_DEST + pm2 reload.
# Não roda npm run build (evita OOM na VPS).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/deploy-env.sh"

SRC="$(deploy_resolve_path "$DEPLOY_SRC")"
echo ">>> Deploy sync-only (sem build)"
echo ">>> Origem: $SRC"

deploy_require_next_static "$SRC"
deploy_sync_to_dest

cd "$(deploy_resolve_path "$DEPLOY_DEST")"
deploy_load_env_production "$DEPLOY_DEST"
nice -n 5 npx prisma generate
deploy_verify_pm2_alignment
deploy_pm2_reload_apps
sleep 2
bash "$SCRIPT_DIR/infra/verify-post-deploy.sh"
