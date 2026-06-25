#!/bin/bash
# Aplica pacote de estabilidade PRECIVOX (progressivo, com backup).
# Uso: sudo bash scripts/infra/apply-infra-stability.sh
# Flags: SKIP_SWAP=1 | SKIP_SSH=1 | DRY_RUN=1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN="${DRY_RUN:-0}"

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY_RUN] $*"
  else
    "$@"
  fi
}

echo "══════════════════════════════════════════"
echo "  PRECIVOX — Aplicar estabilidade infra"
echo "  $(date -Iseconds)"
echo "══════════════════════════════════════════"

chmod +x "$SCRIPT_DIR"/*.sh

if [[ "${SKIP_SWAP:-0}" != "1" ]]; then
  echo ""
  echo ">>> [1/5] Swap"
  run bash "$SCRIPT_DIR/setup-swap.sh"
else
  echo ">>> [1/5] Swap ignorado (SKIP_SWAP=1)"
fi

echo ""
echo ">>> [2/5] Sysctl memória"
run bash "$SCRIPT_DIR/setup-sysctl.sh"

if [[ "${SKIP_SSH:-0}" != "1" ]]; then
  echo ""
  echo ">>> [3/5] SSH keepalive"
  run bash "$SCRIPT_DIR/setup-ssh-keepalive.sh"
else
  echo ">>> [3/5] SSH ignorado"
fi

echo ""
echo ">>> [4/5] TMUX"
run bash "$SCRIPT_DIR/setup-tmux.sh"

echo ""
echo ">>> [5/5] Logrotate PM2 (se ausente)"
LOGROTATE="/etc/logrotate.d/precivox-pm2"
if [[ ! -f "$LOGROTATE" ]]; then
  run bash -c "cat > $LOGROTATE <<'EOF'
/var/log/precivox-*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF"
  echo "✅ Logrotate PM2 criado"
else
  echo "ℹ️  Logrotate já existe"
fi

echo ""
bash "$SCRIPT_DIR/precivox-health.sh"
echo ""
echo "✅ Pacote aplicado. Próximo deploy recomendado:"
echo "   bash scripts/infra/deploy-in-tmux.sh"
echo "   ou: tdeploy  →  npm run deploy:sync"
