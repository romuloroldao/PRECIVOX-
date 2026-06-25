#!/bin/bash
# Cria swap file se não existir (crítico para builds Next.js em VPS 4GB).
set -euo pipefail

SWAP_SIZE_GB="${SWAP_SIZE_GB:-4}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if swapon --show 2>/dev/null | grep -q .; then
  echo "✅ Swap já ativa:"
  swapon --show
  free -h | grep -i swap
  exit 0
fi

AVAIL_KB="$(df -k / | awk 'NR==2 {print $4}')"
NEED_KB=$((SWAP_SIZE_GB * 1024 * 1024))
if [[ "$AVAIL_KB" -lt "$NEED_KB" ]]; then
  echo "❌ Disco insuficiente para swap de ${SWAP_SIZE_GB}GB (livre: $((AVAIL_KB/1024/1024))GB)"
  exit 1
fi

echo ">>> Criando swap ${SWAP_SIZE_GB}GB em $SWAP_FILE ..."
fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" 2>/dev/null || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024)) status=progress
chmod 600 "$SWAP_FILE"
mkswap "$SWAP_FILE"
swapon "$SWAP_FILE"

if ! grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
  cp -a /etc/fstab "/etc/fstab.bak.$(date +%Y%m%d_%H%M%S)"
  echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  echo "✅ Entrada adicionada em /etc/fstab"
fi

echo "✅ Swap ativa:"
swapon --show
free -h
