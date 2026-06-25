#!/usr/bin/env bash
# Configura SendGrid no .env.production e reinicia o frontend.
# Uso: SENDGRID_API_KEY=SG.xxxx bash scripts/setup-sendgrid-production.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROD_ENV="${DEPLOY_DEST:-/home/deploy/apps/precivox}/.env.production"
SRC_ENV="$ROOT/.env.production"

KEY="${SENDGRID_API_KEY:-}"
FROM="${SMTP_FROM:-noreply@precivox.com.br}"

if [[ -z "$KEY" ]]; then
  echo "❌ Defina SENDGRID_API_KEY (API Key do SendGrid, começa com SG.)"
  echo "   Exemplo: SENDGRID_API_KEY=SG.xxxx bash scripts/setup-sendgrid-production.sh"
  exit 1
fi

patch_env_file() {
  local file="$1"
  [[ -f "$file" ]] || touch "$file"

  grep -v '^SENDGRID_API_KEY=' "$file" 2>/dev/null | grep -v '^SMTP_FROM=' | grep -v '^# SendGrid' > "${file}.tmp" || true
  {
    cat "${file}.tmp"
    echo ""
    echo "# SendGrid — e-mail transacional (cadastro, confirmação, reset de senha)"
    echo "SENDGRID_API_KEY=$KEY"
    echo "SMTP_FROM=$FROM"
  } > "$file"
  rm -f "${file}.tmp"
  echo "✅ Atualizado: $file"
}

patch_env_file "$SRC_ENV"
if [[ "$PROD_ENV" != "$SRC_ENV" && -d "$(dirname "$PROD_ENV")" ]]; then
  patch_env_file "$PROD_ENV"
fi

echo ""
echo "🔄 Reiniciando precivox-frontend..."
pm2 restart precivox-frontend --update-env 2>/dev/null || pm2 restart precivox-frontend || true

echo ""
echo "📧 Teste de envio (opcional):"
echo "   cd $ROOT && npx tsx scripts/test-transactional-email.ts seu@email.com"
