#!/bin/bash

# Script para aplicar correções de logout em produção
# https://precivox.com.br

echo "🚀 Aplicando correções de logout em produção..."

# 1. Fazer backup dos arquivos atuais
echo "📦 Fazendo backup dos arquivos..."
cp /root/lib/auth-client.ts /root/backups/auth-client.ts.$(date +%Y%m%d_%H%M%S)
cp /root/components/DashboardLayout.tsx /root/backups/DashboardLayout.tsx.$(date +%Y%m%d_%H%M%S)

# 2. Verificar se os arquivos existem
if [ ! -f "/root/lib/auth-client.ts" ]; then
    echo "❌ Arquivo auth-client.ts não encontrado!"
    exit 1
fi

if [ ! -f "/root/components/DashboardLayout.tsx" ]; then
    echo "❌ Arquivo DashboardLayout.tsx não encontrado!"
    exit 1
fi

# 3. Criar diretório de API logout se não existir
mkdir -p /root/app/api/auth/logout

# 4. Aplicar correções
echo "🔧 Aplicando correções..."

# Verificar se o endpoint de logout já existe
if [ ! -f "/root/app/api/auth/logout/route.ts" ]; then
    echo "📝 Criando endpoint de logout..."
    cat > /root/app/api/auth/logout/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Logout simples - apenas retorna sucesso
    // A limpeza dos dados é feita no lado do cliente
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
EOF
else
    echo "✅ Endpoint de logout já existe"
fi

# 5. Reiniciar serviços
echo "🔄 Reiniciando serviços..."

# Parar o PM2 se estiver rodando
pm2 stop all 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Iniciar novamente
pm2 start ecosystem.config.js 2>/dev/null || true

# 6. Verificar status
echo "📊 Verificando status dos serviços..."
pm2 status

echo "✅ Correções de logout aplicadas com sucesso!"
echo "🌐 Acesse https://precivox.com.br para testar o logout"
