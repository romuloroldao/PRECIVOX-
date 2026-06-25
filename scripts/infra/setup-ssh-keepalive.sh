#!/bin/bash
# Keepalive SSH — evita queda de sessão Cursor/VSCode Remote durante picos de CPU.
# Usa drop-in (não edita sshd_config principal).
set -euo pipefail

DROPIN="/etc/ssh/sshd_config.d/99-precivox-keepalive.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$DROPIN" ]]; then
  bash "$SCRIPT_DIR/backup-file.sh" "$DROPIN"
fi

mkdir -p /etc/ssh/sshd_config.d

cat > "$DROPIN" <<'EOF'
# PRECIVOX — estabilidade Remote SSH / Cursor
# Cliente envia keepalive a cada 60s; servidor tolera 10 intervalos sem resposta (~10 min)
ClientAliveInterval 60
ClientAliveCountMax 10
TCPKeepAlive yes
# Evita travar em resolução DNS reversa
UseDNS no
EOF

if sshd -t 2>/dev/null; then
  systemctl reload sshd 2>/dev/null || systemctl reload ssh 2>/dev/null || service ssh reload
  echo "✅ SSH recarregado ($DROPIN)"
else
  echo "❌ sshd -t falhou — drop-in NÃO aplicado. Restaure backup se necessário."
  exit 1
fi

echo ">>> Recomendação no seu ~/.ssh/config (máquina local):"
echo "Host precivox*"
echo "  ServerAliveInterval 60"
echo "  ServerAliveCountMax 10"
echo "  TCPKeepAlive yes"
