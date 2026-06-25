#!/bin/bash
# Copia arquivo para backup com timestamp antes de alterar.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: backup-file.sh <arquivo>"
  exit 1
fi

TARGET="$1"
if [[ ! -e "$TARGET" ]]; then
  echo "ℹ️  Arquivo inexistente (sem backup): $TARGET"
  exit 0
fi

BACKUP_DIR="${BACKUP_DIR:-/root/backups/infra}"
TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
SAFE_NAME="$(echo "$TARGET" | tr '/' '_')"
cp -a "$TARGET" "$BACKUP_DIR/${SAFE_NAME}.${TS}.bak"
echo "✅ Backup: $BACKUP_DIR/${SAFE_NAME}.${TS}.bak"
