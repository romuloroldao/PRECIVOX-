#!/bin/bash
# Diagnóstico rápido PRECIVOX (recursos + serviços).
set -euo pipefail

echo "══════════════════════════════════════════"
echo "  PRECIVOX — Health Check $(date -Iseconds)"
echo "══════════════════════════════════════════"
echo ""
echo "── Host ──"
hostname
uptime
echo ""
echo "── Memória ──"
free -h
swapon --show 2>/dev/null || echo "(sem swap)"
echo "swappiness=$(cat /proc/sys/vm/swappiness 2>/dev/null)"
echo ""
echo "── Disco ──"
df -h / /home/deploy/apps/precivox 2>/dev/null | head -5
echo ""
echo "── OOM recente (últimas 5) ──"
dmesg -T 2>/dev/null | grep -i 'out of memory\|oom-kill' | tail -5 || echo "(nenhum ou sem permissão)"
echo ""
echo "── PM2 ──"
pm2 list 2>/dev/null || echo "PM2 indisponível"
echo ""
echo "── Nginx ──"
systemctl is-active nginx 2>/dev/null && nginx -t 2>&1 | tail -2
echo ""
echo "── HTTP smoke ──"
for url in "http://127.0.0.1/health" "http://127.0.0.1:3000"; do
  code="$(curl -sL -o /dev/null -w '%{http_code}' --connect-timeout 3 "$url" 2>/dev/null || echo '---')"
  echo "  $url → $code"
done
if [[ -f /home/deploy/apps/precivox/.next/BUILD_ID ]]; then
  echo "  BUILD_ID: $(cat /home/deploy/apps/precivox/.next/BUILD_ID)"
fi
echo ""
echo "── Top CPU (5) ──"
ps aux --sort=-%cpu | head -6
echo ""
echo "── Top MEM (5) ──"
ps aux --sort=-%mem | head -6
echo ""
echo "── Docker ──"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null | head -5 || echo "(docker não em uso na stack principal)"
echo "══════════════════════════════════════════"
