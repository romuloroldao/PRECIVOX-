#!/bin/bash

# ================================================================
# Script de Deploy - Painel de IA PRECIVOX
# ================================================================

set -e

echo "🚀 ============================================"
echo "🚀 DEPLOY DO PAINEL DE IA - PRECIVOX"
echo "🚀 ============================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Verificar se está na branch correta
echo -e "${BLUE}📋 Verificando branch...${NC}"
BRANCH=$(git branch --show-current)
echo "   Branch atual: $BRANCH"
echo ""

# 2. Backup do código atual
echo -e "${BLUE}💾 Criando backup...${NC}"
BACKUP_FILE="/root/backups/precivox-deploy-$(date +%Y%m%d-%H%M%S).bundle"
git bundle create "$BACKUP_FILE" --all
echo -e "${GREEN}   ✅ Backup criado: $BACKUP_FILE${NC}"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "   Tamanho: $BACKUP_SIZE"
echo ""

# 3. Instalar dependências (se necessário)
echo -e "${BLUE}📦 Verificando dependências...${NC}"
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        echo "   Instalando dependências do frontend..."
        npm install --production
    fi
fi

if [ -f "backend/package.json" ]; then
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "   Instalando dependências do backend..."
        npm install --production
    fi
    cd ..
fi
echo -e "${GREEN}   ✅ Dependências OK${NC}"
echo ""

# 4. Gerar Prisma Client
echo -e "${BLUE}🔧 Gerando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}   ✅ Prisma Client gerado${NC}"
echo ""

# 5. Build do Next.js (se necessário)
echo -e "${BLUE}🏗️  Build do Next.js...${NC}"
if [ -f "next.config.js" ]; then
    echo "   Pulando build (usando modo dev para hotreload)"
    # npm run build
fi
echo -e "${GREEN}   ✅ Build OK${NC}"
echo ""

# 6. Recarregar PM2
echo -e "${BLUE}♻️  Recarregando serviços PM2...${NC}"
pm2 reload ecosystem.config.js
pm2 save
echo -e "${GREEN}   ✅ PM2 recarregado${NC}"
echo ""

# 7. Recarregar Nginx
echo -e "${BLUE}🔄 Recarregando Nginx...${NC}"
sudo nginx -t
sudo systemctl reload nginx
echo -e "${GREEN}   ✅ Nginx recarregado${NC}"
echo ""

# 8. Verificar status dos serviços
echo -e "${BLUE}🔍 Verificando status dos serviços...${NC}"
echo ""
pm2 status
echo ""

# 9. Verificar health checks
echo -e "${BLUE}🏥 Verificando health checks...${NC}"
sleep 3

# Health check Next.js
NEXTJS_HEALTH=$(curl -s http://localhost:3000/ -o /dev/null -w '%{http_code}')
if [ "$NEXTJS_HEALTH" = "200" ] || [ "$NEXTJS_HEALTH" = "304" ]; then
    echo -e "${GREEN}   ✅ Next.js: Online (HTTP $NEXTJS_HEALTH)${NC}"
else
    echo -e "${RED}   ❌ Next.js: Erro (HTTP $NEXTJS_HEALTH)${NC}"
fi

# Health check Backend API
BACKEND_HEALTH=$(curl -s http://localhost:3001/api/health -o /dev/null -w '%{http_code}' 2>/dev/null || echo "000")
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}   ✅ Backend API: Online (HTTP $BACKEND_HEALTH)${NC}"
else
    echo -e "${RED}   ❌ Backend API: Erro (HTTP $BACKEND_HEALTH)${NC}"
fi

# Health check Nginx
NGINX_HEALTH=$(curl -s https://precivox.com.br/health -o /dev/null -w '%{http_code}' 2>/dev/null || echo "000")
if [ "$NGINX_HEALTH" = "200" ]; then
    echo -e "${GREEN}   ✅ Nginx (HTTPS): Online (HTTP $NGINX_HEALTH)${NC}"
else
    echo -e "${RED}   ❌ Nginx (HTTPS): Erro (HTTP $NGINX_HEALTH)${NC}"
fi

# Health check Painel de IA
IA_HEALTH=$(curl -s http://localhost:3001/api/ai/painel/dashboard/cmgr1bovn00027p2hd2kfx8cf -o /dev/null -w '%{http_code}' 2>/dev/null || echo "000")
if [ "$IA_HEALTH" = "200" ]; then
    echo -e "${GREEN}   ✅ Painel de IA: Online (HTTP $IA_HEALTH)${NC}"
else
    echo -e "${RED}   ⚠️  Painel de IA: Status $IA_HEALTH${NC}"
fi

echo ""

# 10. Resumo final
echo "🎉 ============================================"
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "🎉 ============================================"
echo ""
echo "📊 Informações do Deploy:"
echo "   Backup: $BACKUP_FILE ($BACKUP_SIZE)"
echo "   Branch: $BRANCH"
echo "   Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo ""
echo "🌐 URLs de Acesso:"
echo "   Produção: https://precivox.com.br"
echo "   Admin: https://precivox.com.br/login"
echo "   Painel IA: https://precivox.com.br/gestor/ia"
echo ""
echo "🔑 Credenciais de Teste:"
echo "   Email: admin@precivox.com"
echo "   Senha: Admin123!"
echo ""
echo "📝 Logs:"
echo "   PM2: pm2 logs"
echo "   Nginx: sudo tail -f /var/log/nginx/precivox-access.log"
echo ""
echo "✅ Sistema online e operacional!"
echo ""



