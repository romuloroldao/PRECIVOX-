#!/bin/bash

# Script para garantir variáveis de ambiente corretas em produção

ENV_FILE="/root/.env"

echo "🔧 Configurando variáveis de ambiente para produção..."

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Função para adicionar/atualizar variável
update_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Remove linha existente se houver
    sed -i "/^${var_name}=/d" "$ENV_FILE"
    
    # Adiciona nova linha
    echo "${var_name}=${var_value}" >> "$ENV_FILE"
    echo "✅ ${var_name} configurado"
}

# Remover variáveis legado NextAuth (Fase 2 concluída)
sed -i '/^NEXTAUTH_URL=/d' "$ENV_FILE"
sed -i '/^NEXTAUTH_SECRET=/d' "$ENV_FILE"
sed -i '/^NEXT_PUBLIC_NEXTAUTH_URL=/d' "$ENV_FILE"
echo "✅ Variáveis NEXTAUTH_* removidas (se existiam)"

# Verificar e configurar NEXT_PUBLIC_URL
if ! grep -q "^NEXT_PUBLIC_URL=" "$ENV_FILE"; then
    update_env_var "NEXT_PUBLIC_URL" "https://precivox.com.br"
else
    sed -i 's|^NEXT_PUBLIC_URL=.*|NEXT_PUBLIC_URL="https://precivox.com.br"|' "$ENV_FILE"
    echo "✅ NEXT_PUBLIC_URL atualizado"
fi

# Garantir que não há trailing slashes
sed -i 's|NEXT_PUBLIC_URL="https://precivox.com.br/"|NEXT_PUBLIC_URL="https://precivox.com.br"|' "$ENV_FILE"

echo ""
echo "✅ Variáveis de ambiente configuradas:"
echo "   NEXT_PUBLIC_URL=$(grep "^NEXT_PUBLIC_URL=" "$ENV_FILE" | cut -d'=' -f2)"
echo "   JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | head -1 | cut -d'=' -f2 | cut -c1-8)..."
echo ""
echo "📝 Verifique se DATABASE_URL e JWT_SECRET estão configurados corretamente."
