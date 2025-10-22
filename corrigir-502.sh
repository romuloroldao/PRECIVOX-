#!/bin/bash

# 🔧 CORRIGIR ERRO 502 - PRECIVOX.COM.BR
# Execute este script no servidor

echo "🔧 CORRIGINDO ERRO 502 - PRECIVOX.COM.BR"
echo "======================================="

# 1. Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
pm2 status

# 2. Parar todos os serviços
echo "⏹️ Parando todos os serviços..."
pm2 stop all
pkill -f "next"
pkill -f "node"

# 3. Verificar se as portas estão livres
echo "🔍 Verificando portas..."
netstat -tulpn | grep :3000 || echo "Porta 3000 livre"
netstat -tulpn | grep :3001 || echo "Porta 3001 livre"

# 4. Ir para diretório do projeto
echo "📁 Navegando para diretório do projeto..."
cd /var/www/precivox || cd /root/precivox || cd /home/precivox || cd /opt/precivox

# 5. Verificar se existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado!"
    echo "📁 Diretório atual: $(pwd)"
    echo "📋 Conteúdo do diretório:"
    ls -la
    exit 1
fi

# 6. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 7. Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️ Arquivo .env não encontrado, criando..."
    cat > .env << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=https://precivox.com.br
NEXTAUTH_SECRET=precivox-secret-key-2024-production
DATABASE_URL=postgresql://user:password@localhost:5432/precivox
EOF
fi

# 8. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# 9. Build do Next.js
echo "🏗️ Fazendo build do Next.js..."
npm run build

# 10. Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Build falhou! Verificando erros..."
    npm run build 2>&1 | tail -20
    exit 1
fi

# 11. Iniciar servidor Next.js
echo "🚀 Iniciando servidor Next.js..."
pm2 start "npm run start" --name precivox --time

# 12. Aguardar servidor iniciar
echo "⏳ Aguardando servidor iniciar..."
sleep 10

# 13. Verificar se servidor está rodando
echo "🔍 Verificando se servidor está rodando..."
curl -I http://localhost:3000 || echo "❌ Servidor não responde na porta 3000"

# 14. Verificar logs
echo "📋 Logs do PM2:"
pm2 logs precivox --lines 10

# 15. Verificar nginx
echo "🔧 Verificando configuração do nginx..."
nginx -t

# 16. Reiniciar nginx
echo "🔄 Reiniciando nginx..."
systemctl restart nginx

# 17. Teste final
echo "🧪 Teste final..."
sleep 5
curl -I https://precivox.com.br || curl -I http://precivox.com.br

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "📋 Verificações:"
echo "1. PM2 Status:"
pm2 status
echo ""
echo "2. Portas em uso:"
netstat -tulpn | grep :3000
echo ""
echo "3. Teste manual:"
echo "curl -I http://localhost:3000"
echo ""
echo "🌐 Acesse: https://precivox.com.br"
