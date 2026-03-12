#!/bin/bash
# Sequência determinística após build (Next + backend deps já instalados).
# Executar da raiz: /home/deploy/apps/precivox

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo ">>> Raiz do projeto: $ROOT"
echo ">>> Garanta que NEXTAUTH_SECRET, DATABASE_URL, INTERNAL_API_SECRET estão exportados."
echo ">>> Continuando em 3s (Ctrl+C para cancelar e exportar env)..."
sleep 3

echo ">>> Parando e removendo processos PM2 antigos..."
pm2 delete all 2>/dev/null || true

echo ">>> Iniciando com ecosystem.config.js..."
pm2 start ecosystem.config.js

echo ">>> Salvando lista PM2..."
pm2 save

echo ">>> Status:"
pm2 list

echo ""
echo ">>> Testes rápidos:"
curl -sI -o /dev/null -w "  Next (3000): %{http_code}\n" http://localhost:3000/ || echo "  Next (3000): falha"
curl -sI -o /dev/null -w "  Backend (3001): %{http_code}\n" http://localhost:3001/health 2>/dev/null || curl -sI -o /dev/null -w "  Backend (3001): %{http_code}\n" http://localhost:3001/ || echo "  Backend (3001): falha"
echo ""
echo ">>> Se algum processo estiver errored: pm2 logs <nome> --lines 50"
