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
pkill -9 -f "next start" || true
pkill -9 -f "next-server" || true
pkill -9 -f "npm.*start" || true
pkill -9 -f "node.*server.js" || true

# Aguardar processos terminarem
sleep 2

# Verificar se porta 3000 está livre
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Porta 3000 ainda em uso, forçando liberação..."
    fuser -k 3000/tcp || true
    sleep 1
fi

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production=false

# 3. Fazer build do projeto
echo "🧹 Limpando build anterior..."
rm -rf .next

echo  # Remove Next.js cache to avoid stale HTML references
rm -rf .next/cache

echo "🔨 Fazendo build do projeto..."
echo "🤖 Compilando engines de IA..."
npm run build:ai || true
echo "✅ Build de IA concluído (ou ignorado)"
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou - pasta .next não encontrada"
    exit 1
fi

echo "🔨 Compilando core (TypeScript → JS para backend)..."
npx tsc -p core/tsconfig.json
if [ $? -ne 0 ]; then
    echo "❌ Erro: Build do core falhou"
    exit 1
fi
echo "✅ Core compilado em core/dist/"

echo "📁 Sincronizando assets estáticos para Nginx..."
# Criar diretório se não existir
sudo mkdir -p /var/www/precivox/_next/static
sudo mkdir -p /var/www/precivox/public

# Limpar assets antigos
sudo rm -rf /var/www/precivox/_next/static/*
sudo rm -rf /var/www/precivox/public/*

# Copiar novos assets
sudo cp -R .next/static/* /var/www/precivox/_next/static/
sudo cp -R public/* /var/www/precivox/public/

# Ajustar permissões para o Nginx (www-data)
sudo chown -R www-data:www-data /var/www/precivox
sudo chmod -R 755 /var/www/precivox

echo "✅ Assets sincronizados em /var/www/precivox"

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
if [ -f "/etc/nginx/sites-available/precivox.conf" ]; then
    sudo cp nginx/production-nextjs.conf /etc/nginx/sites-available/precivox.conf
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configurado e recarregado"
elif [ -f "/etc/nginx/sites-available/precivox" ]; then
    # Fallback para nome antigo
    sudo cp nginx/production-nextjs.conf /etc/nginx/sites-available/precivox
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configurado e recarregado (arquivo antigo)"
else
    # Criar novo se não existir
    sudo cp nginx/production-nextjs.conf /etc/nginx/sites-available/precivox.conf
    # Criar symlink se não existir
    if [ ! -f "/etc/nginx/sites-enabled/precivox.conf" ]; then
        sudo ln -s /etc/nginx/sites-available/precivox.conf /etc/nginx/sites-enabled/precivox.conf
    fi
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configurado e recarregado (novo arquivo)"
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
