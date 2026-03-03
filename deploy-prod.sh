#!/bin/bash
# Deploy Produção PRECIVOX — idempotente e seguro
# Uso: ./deploy-prod.sh

set -e
set -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 === DEPLOY PRODUÇÃO PRECIVOX ==="
echo "📁 Raiz: $PROJECT_ROOT"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo ""

echo "🔄 1. Atualizando código..."
git pull origin main

echo "📦 2. Instalando dependências (root)..."
npm ci

echo "🧠 3. Build das AI engines..."
npm run build:ai

echo "🗄 4. Aplicando migrations..."
npx prisma migrate deploy

echo "🌐 5. Build frontend..."
if [ -d "apps/frontend" ]; then
  cd apps/frontend
  rm -rf .next
  npm ci
  npm run build
  cd "$PROJECT_ROOT"
else
  rm -rf .next
  npm run build
fi

echo "🖥 6. Reiniciando processos PM2..."
pm2 restart precivox-backend || true
pm2 restart precivox-frontend || true
pm2 restart precivox-ai-scheduler || true

echo "💾 7. Salvando estado do PM2..."
pm2 save

echo "✅ Deploy finalizado com sucesso!"
