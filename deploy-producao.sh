#!/bin/bash

# 🚀 SCRIPT DE DEPLOY PARA PRODUÇÃO - PRECIVOX
# Execute este script no servidor de produção

echo "🚀 Iniciando deploy do PRECIVOX para produção..."

# 1. Parar serviços atuais
echo "⏹️ Parando serviços atuais..."
pm2 stop precivox || true
pm2 stop precivox-backend || true
pm2 stop precivox-frontend || true

# 2. Backup do banco (opcional)
echo "💾 Fazendo backup do banco de dados..."
pg_dump precivox > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Ir para o diretório do projeto
cd /var/www/precivox || cd /root/precivox || cd /home/precivox

# 4. Pull das mudanças
echo "📥 Baixando mudanças do Git..."
git fetch origin
git reset --hard origin/staging

# 5. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 6. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# 7. Executar migrações do banco
echo "🗄️ Executando migrações do banco..."
npx prisma migrate deploy

# 8. Build do Next.js
echo "🏗️ Fazendo build do Next.js..."
npm run build

# 9. Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou!"
    exit 1
fi

# 10. Reiniciar serviços
echo "🔄 Reiniciando serviços..."
pm2 restart precivox || pm2 start ecosystem.config.js

# 11. Verificar status
echo "✅ Verificando status dos serviços..."
pm2 status

# 12. Testar se está funcionando
echo "🧪 Testando se o sistema está funcionando..."
sleep 5
curl -I http://localhost:3000 || curl -I https://precivox.com.br

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://precivox.com.br"
echo "2. Faça login com:"
echo "   Email: admin@precivox.com"
echo "   Senha: senha123"
echo "3. Verifique se não há loops de autenticação"
echo "4. Teste as outras credenciais:"
echo "   - Gestor: gestor@precivox.com / senha123"
echo "   - Cliente: cliente@precivox.com / senha123"
echo ""
echo "📞 Se houver problemas, verifique os logs:"
echo "   pm2 logs precivox"
echo ""
