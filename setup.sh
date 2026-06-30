#!/bin/bash
# Script de Setup Automático PRECIVOX
# Execute: chmod +x setup.sh && ./setup.sh

set -e

echo "🚀 Iniciando setup do PRECIVOX..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}1/7 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale: https://nodejs.org${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION instalado${NC}"
echo ""

# Verificar PostgreSQL
echo -e "${BLUE}2/7 Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL não encontrado no PATH${NC}"
    echo "   Certifique-se de que está instalado e rodando"
else
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✅ $PSQL_VERSION instalado${NC}"
fi
echo ""

# Verificar arquivo .env
echo -e "${BLUE}3/7 Verificando arquivo .env...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando a partir do exemplo...${NC}"
    cp env.example.txt .env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
    echo -e "${YELLOW}   IMPORTANTE: Edite o arquivo .env com suas configurações!${NC}"
    echo ""
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
fi
echo ""

# Instalar dependências
echo -e "${BLUE}4/7 Instalando dependências do npm...${NC}"
npm install
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Gerar cliente Prisma
echo -e "${BLUE}5/7 Gerando cliente Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Cliente Prisma gerado${NC}"
echo ""

# Executar migrations (baseline 00000000000000_init_baseline + futuras)
echo -e "${BLUE}6/7 Executando migrations do banco de dados...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations executadas${NC}"
echo ""

# Executar seed
echo -e "${BLUE}7/7 Populando banco com usuários de teste...${NC}"
npm run prisma:seed
echo -e "${GREEN}✅ Seed executado${NC}"
echo ""

# Resumo final
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Setup concluído com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Usuários de teste criados:${NC}"
echo ""
echo "   Admin:   admin@precivox.com   | Senha: Admin123!"
echo "   Gestor:  gestor@precivox.com  | Senha: Gestor123!"
echo "   Cliente: cliente@precivox.com | Senha: Cliente123!"
echo ""
echo -e "${BLUE}🚀 Para iniciar o servidor:${NC}"
echo ""
echo "   npm run dev"
echo ""
echo -e "${BLUE}📱 Acesse:${NC}"
echo ""
echo "   http://localhost:3000"
echo ""
echo -e "${GREEN}Bom desenvolvimento! 🎉${NC}"
echo ""

