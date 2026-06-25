#!/usr/bin/env bash
# Verifica propagação dos registros SendGrid para precivox.com.br
set -uo pipefail

check() {
  local label="$1"
  local type="$2"
  local host="$3"
  local expected="$4"
  local got
  got="$(dig +short "$type" "$host" 2>/dev/null | tr -d '\r' | head -1)"
  if [[ -n "$got" && "$got" == *"$expected"* ]]; then
    echo "✅ $label → $got"
  elif [[ -n "$got" ]]; then
    echo "⚠️  $label → $got (esperado conter: $expected)"
  else
    echo "❌ $label → ainda não propagado"
  fi
}

echo "Verificando DNS SendGrid para precivox.com.br..."
echo ""

check "em9492" CNAME em9492.precivox.com.br u109742655.wl156.sendgrid.net
check "s1._domainkey" CNAME s1._domainkey.precivox.com.br s1.domainkey.u109742655.wl156.sendgrid.net
check "s2._domainkey" CNAME s2._domainkey.precivox.com.br s2.domainkey.u109742655.wl156.sendgrid.net
check "_dmarc" TXT _dmarc.precivox.com.br "v=DMARC1"

echo ""
echo "Quando todos estiverem ✅, clique em Verify no painel SendGrid."
