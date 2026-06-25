#!/bin/bash
# Valida deploy: smoke estático, PM2 online, sem OOM novo desde início do script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MARKER="/tmp/precivox-deploy-verify-$$"
OOM_BEFORE="$(dmesg -T 2>/dev/null | grep -ci 'out of memory' || echo 0)"

# shellcheck disable=SC1091
source "$PROJECT_ROOT/scripts/lib/deploy-env.sh"

echo ">>> Verificação pós-deploy PRECIVOX"
echo ">>> OOM no kernel (antes): $OOM_BEFORE"
echo ""

FAIL=0

if ! deploy_verify_pm2_alignment; then
  FAIL=1
fi

if ! deploy_smoke_static_assets "http://127.0.0.1:3000"; then
  FAIL=1
fi

echo ""
echo ">>> PM2 status"
pm2 list 2>/dev/null | grep -E 'precivox-|online|errored' || FAIL=1

echo ""
echo ">>> Últimas linhas PM2 frontend (reload/restart)"
tail -5 /var/log/precivox-frontend-out.log 2>/dev/null || true

OOM_AFTER="$(dmesg -T 2>/dev/null | grep -ci 'out of memory' || echo 0)"
echo ""
echo ">>> OOM no kernel (depois): $OOM_AFTER"
if [[ "$OOM_AFTER" -gt "$OOM_BEFORE" ]]; then
  echo "⚠️  Novos eventos OOM desde o início desta verificação:"
  dmesg -T 2>/dev/null | grep -i 'out of memory' | tail -3
  FAIL=1
else
  echo "✅ Nenhum OOM novo nesta janela"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ Verificação pós-deploy OK"
  exit 0
fi
echo "❌ Verificação pós-deploy com falhas"
exit 1
