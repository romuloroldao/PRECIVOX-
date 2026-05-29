#!/bin/bash
# Deploy Produção PRECIVOX — idempotente e seguro
#
# Fluxo:
#   1. Build em DEPLOY_SRC (padrão: /root — onde o Cursor edita)
#   2. Rsync código + .next → DEPLOY_DEST (padrão: /home/deploy/apps/precivox — PM2)
#   3. Restart PM2 + smoke test de chunks estáticos
#
# Uso: ./deploy-prod.sh
# Deploy rápido (sem git pull / migrations): bash scripts/deploy-prod-rsync.sh
# Verificar alinhamento antes de restart manual: npm run deploy:verify

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$PROJECT_ROOT/scripts"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/deploy-env.sh"

# Se rodar de outro path, tratar como DEPLOY_SRC explícito
export DEPLOY_SRC="${DEPLOY_SRC:-$PROJECT_ROOT}"

cd "$DEPLOY_SRC"
deploy_load_env_production "$DEPLOY_SRC"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL não está definida. Configure no ambiente ou no .env.production."
  exit 1
fi

echo "🚀 === DEPLOY PRODUÇÃO PRECIVOX ==="
echo "📁 DEPLOY_SRC:  $(deploy_resolve_path "$DEPLOY_SRC")"
echo "📁 DEPLOY_DEST: $(deploy_resolve_path "$DEPLOY_DEST")"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo ""

echo "🔄 1. Atualizando código..."
git pull origin main

echo "📦 2. Instalando dependências..."
npm ci --include=dev

echo "🧠 3. Build das AI engines..."
npm run build:ai

echo "🗄 4. Aplicando migrations..."
npx prisma migrate deploy

echo "🌐 5. Build frontend..."
if [[ -d "apps/frontend" ]]; then
  cd apps/frontend
  rm -rf .next
  npm ci --include=dev
  npm run build
  cd "$DEPLOY_SRC"
else
  rm -rf .next
  npm run build
fi

deploy_require_next_static "$DEPLOY_SRC"

echo "📤 6. Sincronizando para runtime PM2..."
deploy_sync_to_dest

cd "$(deploy_resolve_path "$DEPLOY_DEST")"
deploy_load_env_production "$DEPLOY_DEST"
npx prisma generate

deploy_verify_pm2_alignment

echo "🖥 7. Reiniciando processos PM2..."
pm2 restart precivox-backend || true
pm2 restart precivox-frontend || true
pm2 restart precivox-ai-scheduler || true

echo "💾 8. Salvando estado do PM2..."
pm2 save

sleep 2
echo "🧪 9. Smoke test (chunks estáticos)..."
deploy_smoke_static_assets || exit 1

echo "✅ Deploy finalizado com sucesso!"
