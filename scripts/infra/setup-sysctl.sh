#!/bin/bash
# Ajustes de memória para VPS pequena (evita OOM agressivo sem swap).
set -euo pipefail

CONF="/etc/sysctl.d/99-precivox-memory.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$CONF" ]]; then
  bash "$SCRIPT_DIR/backup-file.sh" "$CONF"
fi

cat > "$CONF" <<'EOF'
# PRECIVOX — VPS 4GB: priorizar RAM para apps, usar swap sob pressão
vm.swappiness=10
vm.vfs_cache_pressure=50
# Evita travamento longo em OOM (log + kill mais rápido)
vm.panic_on_oom=0
EOF

sysctl --system >/dev/null 2>&1 || sysctl -p "$CONF"
echo "✅ Sysctl aplicado ($CONF):"
grep -v '^#' "$CONF" | grep .
