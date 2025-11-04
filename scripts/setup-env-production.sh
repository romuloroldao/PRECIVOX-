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

# Verificar e configurar NEXTAUTH_URL
if ! grep -q "^NEXTAUTH_URL=" "$ENV_FILE"; then
    update_env_var "NEXTAUTH_URL" "https://precivox.com.br"
else
    # Atualizar se já existe mas está incorreto
    sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL="https://precivox.com.br"|' "$ENV_FILE"
    echo "✅ NEXTAUTH_URL atualizado"
fi

# Verificar e configurar NEXT_PUBLIC_URL
if ! grep -q "^NEXT_PUBLIC_URL=" "$ENV_FILE"; then
    update_env_var "NEXT_PUBLIC_URL" "https://precivox.com.br"
else
    sed -i 's|^NEXT_PUBLIC_URL=.*|NEXT_PUBLIC_URL="https://precivox.com.br"|' "$ENV_FILE"
    echo "✅ NEXT_PUBLIC_URL atualizado"
fi

# Garantir que não há trailing slashes
sed -i 's|NEXTAUTH_URL="https://precivox.com.br/"|NEXTAUTH_URL="https://precivox.com.br"|' "$ENV_FILE"
sed -i 's|NEXT_PUBLIC_URL="https://precivox.com.br/"|NEXT_PUBLIC_URL="https://precivox.com.br"|' "$ENV_FILE"

echo ""
echo "✅ Variáveis de ambiente configuradas:"
echo "   NEXTAUTH_URL=$(grep "^NEXTAUTH_URL=" "$ENV_FILE" | cut -d'=' -f2)"
echo "   NEXT_PUBLIC_URL=$(grep "^NEXT_PUBLIC_URL=" "$ENV_FILE" | cut -d'=' -f2)"
echo ""
echo "📝 Verifique se DATABASE_URL está configurado corretamente."

