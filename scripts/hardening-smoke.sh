#!/bin/bash
# Smoke test de regressão pós-hardening — rotas críticas HTTP + health BUILD_ID.
set -euo pipefail

BASE="${1:-https://precivox.com.br}"
BACKEND="${2:-http://127.0.0.1:3001}"
FAIL=0

check() {
  local code path="$1"
  local url="$2"
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url")"
  if [[ "$code" =~ ^(200|307|308)$ ]]; then
    echo "  OK $code $path"
  else
    echo "  FAIL $code $path"
    FAIL=1
  fi
}

echo ">>> Smoke regressão PRECIVOX ($BASE)"
echo ""

echo ">>> Páginas públicas / cliente"
for path in / /login /signup /cliente/home /cliente/busca /cliente/listas \
  /cliente/perfil /cliente/scan /cliente/despensa /cliente/comparar \
  /cliente/mercado-vivo /gestor/home /admin/dashboard; do
  check "$path" "$BASE$path"
done

echo ""
echo ">>> Health & BUILD_ID"
health="$(curl -s --max-time 10 "$BASE/api/health" 2>/dev/null || echo '{}')"
echo "  frontend health: $health"
if ! echo "$health" | grep -q '"ok":true'; then
  echo "  FAIL /api/health"
  FAIL=1
fi

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BACKEND/api/health")"
echo "  backend /api/health → HTTP $code"
if [[ "$code" != "200" ]]; then FAIL=1; fi

echo ""
echo ">>> APIs protegidas (401 esperado sem auth)"
for path in /api/admin/stats /api/cliente/perfil-preci /api/auth/me; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE$path")"
  if [[ "$code" == "401" ]]; then
    echo "  OK 401 $path"
  else
    echo "  WARN $code $path (esperado 401)"
  fi
done

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ Smoke regressão OK"
  exit 0
fi
echo "❌ Smoke regressão com falhas"
exit 1
