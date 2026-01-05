#!/bin/bash

# clean-build.sh
# Garante um build limpo e consistente para produção
# Usage: ./scripts/clean-build.sh

echo "🧹 Iniciando limpeza profunda..."

# 1. Remover artefatos antigos
echo "   - Removendo .next..."
rm -rf .next

# 2. Remover cache de node_modules (opcional, mas recomendado para builds limpos)
if [ -d "node_modules/.cache" ]; then
    echo "   - Removendo node_modules/.cache..."
    rm -rf node_modules/.cache
fi

# 3. Validar dependências
echo "📦 Verificando dependências..."
npm install

# 4. Executar build
echo "🏗️  Executando build de produção..."
npm run build

# 5. Validação pós-build
if [ -d ".next/static" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "   Static files generated in .next/static"
else
    echo "❌ Erro: Build falhou ou não gerou arquivos estáticos."
    exit 1
fi
