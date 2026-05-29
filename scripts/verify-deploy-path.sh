#!/bin/bash
# Verifica se o build em DEPLOY_SRC está sincronizado com o runtime PM2 (DEPLOY_DEST).
# Uso: bash scripts/verify-deploy-path.sh
# Exit 0 = ok | Exit 1 = dessincronizado (não reinicie PM2 sem sync)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/deploy-env.sh"

echo ">>> Verificação de paths de deploy"
echo ">>> DEPLOY_SRC:  $DEPLOY_SRC"
echo ">>> DEPLOY_DEST: $DEPLOY_DEST"
echo ""

deploy_verify_pm2_alignment
