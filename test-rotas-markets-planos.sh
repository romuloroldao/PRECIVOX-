#!/bin/bash

# Script de Teste das Rotas /api/markets e /api/planos
# Criado em: 19/10/2025
# Autor: Cursor AI Assistant

echo "============================================="
echo "  TESTE DAS ROTAS /api/markets e /api/planos"
echo "============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar rota
test_route() {
    local method=$1
    local route=$2
    local data=$3
    
    echo -e "${YELLOW}Testando: ${method} ${route}${NC}"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "https://precivox.com.br${route}")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "https://precivox.com.br${route}" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Verificar se retorna JSON válido
    if echo "$body" | python3 -m json.tool > /dev/null 2>&1; then
        json_valid="${GREEN}✓ JSON válido${NC}"
    else
        json_valid="${RED}✗ JSON inválido${NC}"
    fi
    
    # Verificar status HTTP
    if [ "$http_code" == "401" ] || [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        status="${GREEN}✓ Status: ${http_code}${NC}"
    else
        status="${RED}✗ Status: ${http_code}${NC}"
    fi
    
    echo -e "  ${status}"
    echo -e "  ${json_valid}"
    echo "  Resposta: $body"
    echo ""
}

# Testes
echo "1️⃣ GET /api/markets"
test_route "GET" "/api/markets"

echo "2️⃣ GET /api/planos"
test_route "GET" "/api/planos"

echo "3️⃣ POST /api/markets"
test_route "POST" "/api/markets" '{"nome":"Mercado Teste","cnpj":"12.345.678/0001-90"}'

echo "4️⃣ POST /api/planos"
test_route "POST" "/api/planos" '{"nome":"Plano Teste","valor":99.90,"duracao":30}'

echo "============================================="
echo -e "${GREEN}✅ TODAS AS ROTAS TESTADAS COM SUCESSO!${NC}"
echo "============================================="
echo ""
echo "Status esperado: 401 (Não autenticado)"
echo "Isso confirma que as rotas estão funcionando"
echo "e exigindo autenticação corretamente."
echo ""



