#!/usr/bin/env bash
# Remove variáveis legado NextAuth de arquivos .env* e reinicia PM2 com ecosystem limpo.
set -euo pipefail

ROOT="${1:-/root}"
DEPLOY="${DEPLOY_DEST:-/home/deploy/apps/precivox}"

strip_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  sed -i '/^NEXTAUTH_URL=/d' "$f"
  sed -i '/^NEXTAUTH_SECRET=/d' "$f"
  sed -i '/^NEXT_PUBLIC_NEXTAUTH_URL=/d' "$f"
  echo "  limpo: $f"
}

echo "=== strip-nextauth-from-env ==="

for dir in "$ROOT" "$DEPLOY"; do
  [[ -d "$dir" ]] || continue
  echo ">> $dir"
  while IFS= read -r -d '' f; do
    strip_file "$f"
  done < <(find "$dir" -maxdepth 3 -name '.env*' -type f ! -path '*/node_modules/*' -print0 2>/dev/null)
done

# standalone do Next (artefato de build — será regerado no próximo build)
if [[ -d "$DEPLOY/.next/standalone" ]]; then
  find "$DEPLOY/.next/standalone" -name '.env*' -type f 2>/dev/null | while read -r f; do
    strip_file "$f"
  done
fi

if command -v pm2 >/dev/null 2>&1 && [[ -f "$DEPLOY/ecosystem.config.js" ]]; then
  echo ">> PM2 reload ($DEPLOY)"
  cd "$DEPLOY"
  pm2 reload ecosystem.config.js --update-env 2>/dev/null || pm2 start ecosystem.config.js
  pm2 save
  echo ">> PM2 env frontend (NEXTAUTH deve estar ausente):"
  pm2 env "$(pm2 id precivox-frontend 2>/dev/null | head -1)" 2>/dev/null | grep NEXTAUTH || echo "  OK — sem NEXTAUTH"
fi

echo "=== concluído ==="
echo "GitHub: remova manualmente secrets NEXTAUTH_SECRET / NEXTAUTH_URL em Settings → Secrets."
