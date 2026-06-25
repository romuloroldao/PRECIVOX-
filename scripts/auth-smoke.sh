#!/usr/bin/env bash
# Smoke test Auth TokenManager — login, me, refresh, logout
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
EMAIL="${E2E_ADMIN_EMAIL:-admin@precivox.com}"
PASSWORD="${E2E_ADMIN_PASSWORD:-senha123}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

echo "=== Auth smoke @ $BASE_URL ==="

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/auth/me")
if [ "$code" != "401" ]; then
  echo "FAIL: /api/auth/me sem sessão esperava 401, got $code"
  exit 1
fi
echo "OK  /api/auth/me → 401 (sem sessão)"

login_json=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if ! echo "$login_json" | grep -q '"success":true'; then
  echo "FAIL: login — $login_json"
  exit 1
fi
echo "OK  POST /api/auth/login"

access_token=$(echo "$login_json" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
refresh_token=$(echo "$login_json" | sed -n 's/.*"refreshToken":"\([^"]*\)".*/\1/p')

if [ -z "$access_token" ] || [ -z "$refresh_token" ]; then
  echo "FAIL: tokens ausentes no login"
  exit 1
fi

# Bearer (sempre funciona); cookies Secure podem não ser enviados em http://localhost
me_json=$(curl -s -H "Authorization: Bearer $access_token" "$BASE_URL/api/auth/me")
if ! echo "$me_json" | grep -q '"success":true'; then
  echo "FAIL: /api/auth/me autenticado — $me_json"
  exit 1
fi
echo "OK  GET /api/auth/me (Bearer)"

refresh_json=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$refresh_token\"}")

if ! echo "$refresh_json" | grep -q '"success":true'; then
  echo "FAIL: refresh — $refresh_json"
  exit 1
fi
echo "OK  POST /api/auth/refresh (rotação)"

logout_code=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/logout")
if [ "$logout_code" != "200" ]; then
  echo "FAIL: logout HTTP $logout_code"
  exit 1
fi
echo "OK  POST /api/auth/logout"

code_after=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $access_token" "$BASE_URL/api/auth/me")
if [ "$code_after" != "401" ]; then
  echo "WARN: token ainda válido após logout (esperado se logout não revoga access JWT imediatamente)"
else
  echo "OK  /api/auth/me → 401 (pós-logout)"
fi

echo "=== Auth smoke PASS ==="
