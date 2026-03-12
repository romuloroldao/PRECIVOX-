#!/bin/bash
# Sanity check simples para fluxo de Auth v2 via BFF (Next)
# Uso:
#   BASE_URL=${BASE_URL:-https://precivox.com.br} ./scripts/auth-sanity-check.sh email senha

set -euo pipefail

BASE_URL="${BASE_URL:-https://precivox.com.br}"
EMAIL="${1:-}"
PASSWORD="${2:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Uso: BASE_URL=<url> $0 <email> <senha>" >&2
  exit 1
fi

echo "== Sanity Auth v2 =="
echo "Base URL: $BASE_URL"

echo
echo "1) Login..."
LOGIN_RESPONSE="$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c /tmp/precivox-auth-cookies.txt \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

echo "Login response: $LOGIN_RESPONSE"
ACCESS_TOKEN="$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // empty')"
REFRESH_TOKEN="$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken // empty')"

if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
  echo "Erro: login não retornou accessToken/refreshToken válidos." >&2
  exit 1
fi

echo
echo "2) /api/auth/me com Bearer..."
ME_RESPONSE="$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")"
echo "Me response: $ME_RESPONSE"

echo
echo "3) Refresh token..."
REFRESH_RESPONSE="$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")"
echo "Refresh response: $REFRESH_RESPONSE"

echo
echo "4) Rotas admin protegidas (se usuário for ADMIN)..."
ADMIN_STATS_STATUS="$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$BASE_URL/api/admin/stats")"
echo "GET /api/admin/stats -> HTTP $ADMIN_STATS_STATUS"

echo
echo "Done."

