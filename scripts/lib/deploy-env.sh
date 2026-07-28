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
  local src dest backup_path
  src="$(deploy_resolve_path "$DEPLOY_SRC")"
  dest="$(deploy_resolve_path "$DEPLOY_DEST")"

  if [[ "$src" == "$dest" ]]; then
    echo "ℹ️  DEPLOY_SRC == DEPLOY_DEST ($src) — rsync ignorado."
    return 0
  fi

  deploy_require_next_static "$src"

  # Pausa frontend durante sync de chunks — evita 404 mid-request (race condition).
  if pm2 describe precivox-frontend >/dev/null 2>&1; then
    echo "⏸️  Pausando precivox-frontend durante sync..."
    pm2 stop precivox-frontend >/dev/null 2>&1 || true
  fi

  # Backup para rollback manual se smoke falhar após reload.
  if [[ -d "$dest/.next" ]]; then
    backup_path="${dest}/.next.backup.$(date +%Y%m%d%H%M%S)"
    echo "💾 Backup .next → $(basename "$backup_path")"
    cp -a "$dest/.next" "$backup_path"
    echo "$backup_path" > "${dest}/.next.last-backup"
    ls -dt "${dest}"/.next.backup.* 2>/dev/null | tail -n +4 | xargs -r rm -rf
  fi

  echo "📤 Sincronizando código: $src → $dest"
  # Excludes: tooling/IDE/caches não fazem parte do runtime PM2.
  # Sem isto o DEST herda .cursor-server, .nvm, etc. (GB de dívida).
  # .next.backup.* vive só no DEST — preservar contra --delete.
  rsync -a --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.production' \
    --exclude '.next' \
    --exclude '.next/cache' \
    --exclude '.next.backup.*' \
    --exclude '.next.last-backup' \
    --exclude '.cursor' \
    --exclude '.cursor-server' \
    --exclude '.antigravity-server' \
    --exclude '.nvm' \
    --exclude '.npm' \
    --exclude '.cache' \
    --exclude '.agents' \
    --exclude '.claude' \
    --exclude '.gemini' \
    --exclude '.composer' \
    --exclude '.pm2' \
    --exclude '.ssh' \
    --exclude '.local' \
    --exclude '.vscode' \
    --exclude '.pki' \
    --exclude '.config' \
    --exclude 'snap' \
    --exclude 'backups' \
    --exclude '.bash_history' \
    --exclude '.bashrc' \
    --exclude '.gitconfig' \
    --exclude '.tmux.conf' \
    --exclude 'skills-lock.json' \
    --exclude 'tsconfig.tsbuildinfo' \
    --exclude 'tsconfig.lib.strict.tsbuildinfo' \
    "$src/" "$dest/"

  echo "📤 Sincronizando .next (chunks estáticos)..."
  rsync -a --delete "$src/.next/" "$dest/.next/"

  deploy_require_next_static "$dest"
  echo "✅ BUILD_ID em produção: $(cat "$dest/.next/BUILD_ID")"
}

deploy_pm2_reload_apps() {
  echo ">>> PM2 reload (fallback restart)..."
  pm2 reload precivox-backend --update-env 2>/dev/null \
    || pm2 restart precivox-backend
  pm2 reload precivox-frontend --update-env 2>/dev/null \
    || pm2 restart precivox-frontend
  pm2 reload precivox-ai-scheduler --update-env 2>/dev/null \
    || pm2 restart precivox-ai-scheduler
  pm2 save
}

deploy_smoke_apps() {
  local front_base="${1:-http://127.0.0.1:3000}"
  local back_base="${2:-http://127.0.0.1:3001}"
  local code build_id health_build

  if ! deploy_smoke_static_assets "$front_base"; then
    return 1
  fi

  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$front_base/")"
  echo "  homepage → HTTP $code"
  if [[ "$code" != "200" && "$code" != "307" && "$code" != "308" ]]; then
    echo "❌ Homepage Next retornou $code"
    return 1
  fi

  health_build="$(curl -s --max-time 10 "$front_base/api/health" 2>/dev/null | grep -o '"buildId":"[^"]*"' | cut -d'"' -f4 || true)"
  build_id="$(cat "$(deploy_resolve_path "$DEPLOY_DEST")/.next/BUILD_ID" 2>/dev/null || true)"
  echo "  /api/health buildId → ${health_build:-n/a} (esperado: ${build_id:-?})"
  if [[ -n "$build_id" && -n "$health_build" && "$health_build" != "$build_id" ]]; then
    echo "❌ BUILD_ID divergente entre disco e /api/health"
    return 1
  fi

  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$back_base/api/health")"
  echo "  backend /api/health → HTTP $code"
  if [[ "$code" != "200" ]]; then
    echo "❌ Backend health retornou $code"
    return 1
  fi

  echo "✅ Smoke apps OK"
  return 0
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

  local perfil_chunk
  perfil_chunk="$(ls "$(deploy_resolve_path "$DEPLOY_DEST")/.next/static/chunks/app/cliente/perfil/"page-*.js 2>/dev/null | head -1 | xargs basename 2>/dev/null || true)"
  if [[ -n "$perfil_chunk" ]]; then
    code="$(curl -s -o /dev/null -w '%{http_code}' "$base/_next/static/chunks/app/cliente/perfil/$perfil_chunk")"
    echo "  perfil $perfil_chunk → HTTP $code"
    if [[ "$code" != "200" ]]; then
      echo "❌ Chunk /cliente/perfil retornou $code (esperado 200)."
      return 1
    fi
  fi

  echo "✅ Smoke estático OK (BUILD_ID: ${build_id:-desconhecido})"
  return 0
}
