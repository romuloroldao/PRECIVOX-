#!/bin/bash

# Script para Configurar Backend Permanente no Precivox
# Este script garante que o backend fique sempre rodando

echo "🚀 Configurando Backend Permanente do Precivox"
echo "=============================================="

# 1. Parar processos manuais do backend
echo "🛑 Parando processos manuais do backend..."
pkill -f "node server.js" 2>/dev/null || true
sleep 2

# 2. Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado. Instalando..."
    npm install -g pm2
fi

# 3. Remover processo antigo do PM2 (se existir)
echo "🗑️ Removendo configuração antiga..."
pm2 delete precivox-backend 2>/dev/null || true

# 4. Iniciar backend com PM2
echo "🚀 Iniciando backend com PM2..."
cd /root/backend
pm2 start server.js --name precivox-backend --time

# 5. Salvar configuração do PM2
echo "💾 Salvando configuração do PM2..."
pm2 save

# 6. Configurar startup automático
echo "⚙️ Configurando startup automático..."
pm2 startup systemd -u root --hp /root

# 7. Verificar status
echo ""
echo "📊 Status do Backend:"
pm2 list | grep precivox-backend

# 8. Testar endpoint
echo ""
echo "🧪 Testando endpoint de upload..."
sleep 3
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/products)

if [ "$RESPONSE" -eq "200" ] || [ "$RESPONSE" -eq "500" ] || [ "$RESPONSE" -eq "401" ]; then
    echo "✅ Backend está respondendo (HTTP $RESPONSE)"
else
    echo "❌ Backend não está respondendo (HTTP $RESPONSE)"
fi

echo ""
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "📋 Comandos úteis:"
echo "   pm2 list                  - Ver status de todos os processos"
echo "   pm2 logs precivox-backend - Ver logs do backend"
echo "   pm2 restart precivox-backend - Reiniciar backend"
echo "   pm2 stop precivox-backend - Parar backend"
echo "   pm2 start precivox-backend - Iniciar backend"
echo ""
echo "🎯 O backend agora está configurado para:"
echo "   1. Rodar permanentemente"
echo "   2. Reiniciar automaticamente em caso de crash"
echo "   3. Iniciar automaticamente na inicialização do sistema"

