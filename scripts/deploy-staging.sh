#!/bin/bash

# ============================================
# SCRIPT DE DEPLOY PARA AMBIENTE DE STAGING
# test.precivox.com - Docker + Ambiente Isolado
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configurações
PROJECT_NAME="precivox-staging"
COMPOSE_FILE="docker compose.staging.yml"
ENV_FILE=".env.staging"
BACKUP_DIR="./backups"

log_info "🚀 Iniciando deploy do ambiente de staging..."

# Verificar se os arquivos necessários existem
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Arquivo $COMPOSE_FILE não encontrado!"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    log_error "Arquivo $ENV_FILE não encontrado!"
    exit 1
fi

# Criar diretórios necessários
log_info "📁 Criando diretórios necessários..."
mkdir -p $BACKUP_DIR
mkdir -p nginx/logs
mkdir -p backend/logs
mkdir -p ssl

# Backup do banco atual (se existir)
if [ -f "backend/data/precivox_analytics.db" ]; then
    log_info "💾 Fazendo backup do banco atual..."
    cp backend/data/precivox_analytics.db $BACKUP_DIR/precivox_backup_$(date +%Y%m%d_%H%M%S).db
    log_success "Backup criado em $BACKUP_DIR/"
fi

# Parar containers existentes
log_info "⏹️  Parando containers existentes..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down --remove-orphans

# Remover imagens antigas (opcional)
read -p "🗑️  Remover imagens antigas para rebuild completo? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "🧹 Removendo imagens antigas..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down --rmi all --volumes
fi

# Build das imagens
log_info "🔨 Fazendo build das imagens Docker..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache

# Iniciar os serviços
log_info "🚀 Iniciando serviços..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

# Aguardar os serviços ficarem prontos
log_info "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Health checks
log_info "🔍 Verificando saúde dos serviços..."

# Check backend
if curl -f http://localhost:3001/api/admin/status > /dev/null 2>&1; then
    log_success "✅ Backend respondendo em http://localhost:3001"
else
    log_error "❌ Backend não está respondendo"
fi

# Check frontend
if curl -f http://localhost:80/health > /dev/null 2>&1; then
    log_success "✅ Frontend respondendo em http://localhost:80"
else
    log_error "❌ Frontend não está respondendo"
fi

# Check proxy (se estiver rodando)
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    log_success "✅ Proxy Nginx respondendo em http://localhost:8080"
else
    log_warning "⚠️  Proxy Nginx não está respondendo (normal se não configurado)"
fi

# Mostrar status dos containers
log_info "📊 Status dos containers:"
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

# Mostrar logs recentes
log_info "📝 Logs recentes (últimas 50 linhas):"
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs --tail=50

# Informações finais
log_success "🎉 Deploy do ambiente de staging concluído!"
echo ""
echo "📋 Informações do ambiente:"
echo "  - Frontend: http://localhost:80"
echo "  - Backend API: http://localhost:3001"
echo "  - Proxy (se configurado): http://localhost:8080"
echo "  - Health Check: http://localhost:80/health"
echo ""
echo "📚 Comandos úteis:"
echo "  - Ver logs: docker compose -f $COMPOSE_FILE logs -f"
echo "  - Parar: docker compose -f $COMPOSE_FILE down"
echo "  - Status: docker compose -f $COMPOSE_FILE ps"
echo "  - Rebuild: $0"
echo ""

# Opção de abrir navegador
read -p "🌐 Abrir no navegador? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:80
    elif command -v open > /dev/null; then
        open http://localhost:80
    else
        log_info "Abra manualmente: http://localhost:80"
    fi
fi

log_success "✨ Ambiente de staging pronto para desenvolvimento!"