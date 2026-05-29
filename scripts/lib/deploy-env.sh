#!/bin/bash
# Variáveis e funções compartilhadas de deploy PRECIVOX.
# Fonte canônica (edição/build): DEPLOY_SRC
# Runtime PM2 (produção):         DEPLOY_DEST

DEPLOY_SRC="${DEPLOY_SRC:-/root}"
DEPLOY_DEST="${DEPLOY_DEST:-/home/deploy/apps/precivox}"

deploy_resolve_path() {
  local p="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$p"
  else
    readlink -f "$p"
  fi
}

deploy_pm2_frontend_cwd() {
  pm2 describe precivox-frontend 2>/dev/null \
    | awk -F'│' '/exec cwd/ { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $3); print $3; exit }'
}

deploy_load_env_production() {
  local dir="$1"
  if [[ -f "$dir/.env.production" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$dir/.env.production"
    set +a
    echo "🔐 Variáveis carregadas de $dir/.env.production"
  elif [[ -f "$dir/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$dir/.env"
    set +a
    echo "🔐 Variáveis carregadas de $dir/.env"
  fi
}

deploy_require_next_static() {
  local dir
  dir="$(deploy_resolve_path "$1")"
  if [[ ! -d "$dir/.next/static/chunks" ]]; then
    echo "❌ Build incompleto em $dir: .next/static/chunks não existe."
    exit 1
  fi
  if [[ ! -f "$dir/.next/BUILD_ID" ]]; then
    echo "❌ Build incompleto em $dir: .next/BUILD_ID não existe."
    exit 1
  fi
}

deploy_sync_to_dest() {
  local src dest
  src="$(deploy_resolve_path "$DEPLOY_SRC")"
  dest="$(deploy_resolve_path "$DEPLOY_DEST")"

  if [[ "$src" == "$dest" ]]; then
    echo "ℹ️  DEPLOY_SRC == DEPLOY_DEST ($src) — rsync ignorado."
    return 0
  fi

  deploy_require_next_static "$src"

  echo "📤 Sincronizando código: $src → $dest"
  rsync -a --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.production' \
    --exclude '.next/cache' \
    "$src/" "$dest/"

  echo "📤 Sincronizando .next (chunks estáticos)..."
  rsync -a --delete "$src/.next/" "$dest/.next/"

  deploy_require_next_static "$dest"
  echo "✅ BUILD_ID em produção: $(cat "$dest/.next/BUILD_ID")"
}

deploy_verify_pm2_alignment() {
  local src dest pm2_cwd src_id dest_id
  src="$(deploy_resolve_path "$DEPLOY_SRC")"
  dest="$(deploy_resolve_path "$DEPLOY_DEST")"
  pm2_cwd="$(deploy_pm2_frontend_cwd)"

  if [[ -z "$pm2_cwd" ]]; then
    echo "⚠️  precivox-frontend não encontrado no PM2 (ok antes do primeiro start)."
    return 0
  fi

  pm2_cwd="$(deploy_resolve_path "$pm2_cwd")"

  if [[ "$pm2_cwd" != "$dest" ]]; then
    echo "❌ PM2 cwd ($pm2_cwd) ≠ DEPLOY_DEST ($dest)."
    echo "   Ajuste: PM2_CWD=$dest pm2 start ecosystem.config.js"
    echo "   Ou exporte DEPLOY_DEST para o path real do PM2."
    return 1
  fi

  if [[ ! -f "$dest/.next/BUILD_ID" ]]; then
    echo "❌ $dest/.next/BUILD_ID ausente — PM2 serviria chunks inexistentes."
    echo "   Rode: bash deploy-prod.sh  ou  bash scripts/deploy-prod-rsync.sh"
    return 1
  fi

  if [[ -f "$src/.next/BUILD_ID" ]]; then
    src_id="$(cat "$src/.next/BUILD_ID")"
    dest_id="$(cat "$dest/.next/BUILD_ID")"
    if [[ "$src_id" != "$dest_id" && "$src" != "$dest" ]]; then
      echo "❌ BUILD_ID dessincronizado:"
      echo "   DEPLOY_SRC  ($src): $src_id"
      echo "   DEPLOY_DEST ($dest): $dest_id"
      echo "   Rode: bash scripts/deploy-prod-rsync.sh"
      return 1
    fi
  fi

  echo "✅ PM2 alinhado com DEPLOY_DEST (BUILD_ID: $(cat "$dest/.next/BUILD_ID"))"
  return 0
}

deploy_smoke_static_assets() {
  local base="${1:-http://127.0.0.1:3000}"
  local build_id chunk webpack css

  build_id="$(cat "$(deploy_resolve_path "$DEPLOY_DEST")/.next/BUILD_ID" 2>/dev/null || true)"
  webpack="$(ls "$(deploy_resolve_path "$DEPLOY_DEST")/.next/static/chunks/webpack-"*.js 2>/dev/null | head -1 | xargs basename 2>/dev/null || true)"
  css="$(ls "$(deploy_resolve_path "$DEPLOY_DEST")/.next/static/css/"*.css 2>/dev/null | head -1 | xargs basename 2>/dev/null || true)"

  if [[ -z "$webpack" ]]; then
    echo "⚠️  Smoke: nenhum chunk webpack encontrado em DEPLOY_DEST."
    return 1
  fi

  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$base/_next/static/chunks/$webpack")"
  echo "  chunk $webpack → HTTP $code"
  if [[ "$code" != "200" ]]; then
    echo "❌ Chunk estático retornou $code (esperado 200). Verifique PM2 e .next em DEPLOY_DEST."
    return 1
  fi

  if [[ -n "$css" ]]; then
    code="$(curl -s -o /dev/null -w '%{http_code}' "$base/_next/static/css/$css")"
    echo "  css $css → HTTP $code"
    if [[ "$code" != "200" ]]; then
      echo "❌ CSS estático retornou $code (esperado 200)."
      return 1
    fi
  fi

  echo "✅ Smoke estático OK (BUILD_ID: ${build_id:-desconhecido})"
  return 0
}
