#!/bin/bash

# Script de Deploy Final para Produção Precivox
# Garante build limpo, verificação e restart seguro

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy de produção do Precivox..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir em verde
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para imprimir erro
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para imprimir aviso
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Configurar variáveis de ambiente
echo "📝 Passo 1: Configurando variáveis de ambiente..."
if [ -f "/root/scripts/setup-env-production.sh" ]; then
    bash /root/scripts/setup-env-production.sh
    print_success "Variáveis de ambiente configuradas"
else
    print_warning "Script de setup de env não encontrado, continuando..."
fi
echo ""

# 2. Limpar build anterior
echo "🧹 Passo 2: Limpando build anterior..."
if [ -d "/root/.next" ]; then
    rm -rf /root/.next
    print_success "Diretório .next removido"
fi

# Limpar node_modules opcional (mais seguro não fazer isso)
# if [ -d "/root/node_modules" ]; then
#     print_warning "Removendo node_modules (isso pode demorar)..."
#     rm -rf /root/node_modules
# fi
echo ""

# 3. Instalar dependências (se necessário)
echo "📦 Passo 3: Verificando dependências..."
if [ ! -d "/root/node_modules" ] || [ ! -f "/root/node_modules/.bin/next" ]; then
    print_warning "Instalando dependências..."
    npm install --production=false
    print_success "Dependências instaladas"
else
    print_success "Dependências já instaladas"
fi
echo ""

# 4. Gerar Prisma Client
echo "🗄️  Passo 4: Gerando Prisma Client..."
if [ -f "/root/prisma/schema.prisma" ]; then
    npx prisma generate
    print_success "Prisma Client gerado"
else
    print_warning "Schema Prisma não encontrado, pulando..."
fi
echo ""

# 5. Build de produção
echo "🏗️  Passo 5: Executando build de produção..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build concluído com sucesso"
else
    print_error "Build falhou!"
    exit 1
fi
echo ""

# 6. Verificar build
echo "🔍 Passo 6: Verificando consistência do build..."
if [ -f "/root/scripts/verify-build.js" ]; then
    node /root/scripts/verify-build.js
    if [ $? -eq 0 ]; then
        print_success "Build verificado e consistente"
    else
        print_error "Build inconsistente detectado!"
        exit 1
    fi
else
    print_warning "Script de verificação não encontrado, pulando..."
fi
echo ""

# 7. Verificar permissões do .next/static
echo "🔐 Passo 7: Verificando permissões..."
if [ -d "/root/.next/static" ]; then
    chmod -R 755 /root/.next/static
    print_success "Permissões configuradas"
fi
echo ""

# 8. Restart do PM2
echo "🔄 Passo 8: Reiniciando aplicação no PM2..."
if command -v pm2 &> /dev/null; then
    # Salvar configuração atual
    pm2 save
    
    # Restart da aplicação
    pm2 restart precivox-auth
    
    # Aguardar alguns segundos
    sleep 3
    
    # Verificar status
    pm2 status precivox-auth
    
    print_success "Aplicação reiniciada"
else
    print_warning "PM2 não encontrado, você precisa reiniciar manualmente"
fi
echo ""

# 9. Verificar logs recentes
echo "📋 Passo 9: Verificando logs recentes..."
if command -v pm2 &> /dev/null; then
    echo "Últimas 20 linhas dos logs:"
    pm2 logs precivox-auth --lines 20 --nostream || true
fi
echo ""

# 10. Verificar saúde da aplicação
echo "🏥 Passo 10: Verificando saúde da aplicação..."
sleep 2
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Aplicação respondendo corretamente (HTTP $HTTP_CODE)"
    else
        print_warning "Aplicação pode não estar respondendo (HTTP $HTTP_CODE)"
    fi
else
    print_warning "curl não encontrado, não foi possível verificar saúde"
fi
echo ""

# Resumo final
echo "════════════════════════════════════════════════════════════"
echo "🎉 Deploy concluído!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique os logs: pm2 logs precivox-auth --lines 50"
echo "   2. Teste o site: https://precivox.com.br"
echo "   3. Verifique o console do navegador para erros"
echo "   4. Monitore por alguns minutos: pm2 monit"
echo ""
echo "🔗 Links úteis:"
echo "   - Health check: https://precivox.com.br/health"
echo "   - Status PM2: pm2 status"
echo ""

print_success "Deploy finalizado com sucesso!"

