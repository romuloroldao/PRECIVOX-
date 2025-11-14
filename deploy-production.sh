#!/bin/bash

# ===========================================
# SCRIPT DE DEPLOY PRODUÇÃO - PRECIVOX
# ===========================================

echo "🚀 ================================"
echo "🚀 DEPLOY PRECIVOX - PRODUÇÃO"
echo "🚀 ================================"

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto"
    exit 1
fi

# 1. Parar processos antes de atualizar dependências/build
echo "🛑 Parando processos existentes..."
pkill -f "next start" || true
pkill -f "node.*server.js" || true

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production=false

# 3. Fazer build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou - pasta .next não encontrada"
    exit 1
fi

echo "📁 Sincronizando assets do bundle standalone..."
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
echo "✅ Build concluído e assets atualizados!"

# 4. Iniciar Next.js em produção
echo "🚀 Iniciando Next.js em produção..."
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "✅ Next.js iniciado com PID: $NEXTJS_PID"

# 5. Iniciar Backend Express
echo "🚀 Iniciando Backend Express..."
cd backend
nohup node server.js > /var/log/precivox-backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado com PID: $BACKEND_PID"
cd ..

# 6. Configurar Nginx (se necessário)
echo "⚙️ Configurando Nginx..."
if [ -f "/etc/nginx/sites-available/precivox" ]; then
    sudo cp nginx/nextjs-production.conf /etc/nginx/sites-available/precivox
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configurado e recarregado"
else
    echo "⚠️ Configuração do Nginx não encontrada - configure manualmente"
fi

# 7. Verificar status
echo "🔍 Verificando status dos serviços..."
sleep 5

# Verificar Next.js
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js (porta 3000): Online"
else
    echo "❌ Next.js (porta 3000): Offline"
fi

# Verificar Backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend (porta 3001): Online"
else
    echo "❌ Backend (porta 3001): Offline"
fi

echo "🚀 ================================"
echo "🚀 DEPLOY CONCLUÍDO!"
echo "🚀 ================================"
echo "📊 Status:"
echo "   Next.js PID: $NEXTJS_PID"
echo "   Backend PID: $BACKEND_PID"
echo "   Logs Next.js: /var/log/precivox-nextjs.log"
echo "   Logs Backend: /var/log/precivox-backend.log"
echo ""
echo "🌐 Acesse: https://precivox.com.br"
echo "🔍 Health Check: https://precivox.com.br/health"
