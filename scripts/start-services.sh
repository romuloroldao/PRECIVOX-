#!/bin/bash

# start-services.sh - Script para iniciar serviços PRECIVOX
# Autor: Sistema PRECIVOX
# Data: $(date +%Y-%m-%d)

set -e

echo "🚀 =============================================="
echo "   INICIANDO SERVIÇOS PRECIVOX"
echo "   Data: $(date)"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    error "PM2 não está instalado. Instalando..."
    npm install -g pm2
fi

cd /var/www/precivox

# Parar processos existentes (se houver)
info "Parando processos existentes..."
pm2 stop all 2>/dev/null || warning "Nenhum processo PM2 estava rodando"

# Iniciar serviços com PM2
log "Iniciando Backend (porta 3001)..."
pm2 start ecosystem.config.cjs --only precivox-backend

log "Iniciando Frontend (porta 8080)..."
pm2 start ecosystem.config.cjs --only precivox-frontend

# Aguardar inicialização
sleep 5

# Verificar status
log "Verificando status dos serviços..."
pm2 status

# Testar conectividade
log "Testando conectividade..."

# Testar Backend
if curl -s -f http://localhost:3001/api/health > /dev/null; then
    log "✅ Backend OK (porta 3001)"
else
    error "❌ Backend falhou (porta 3001)"
fi

# Testar Frontend
if curl -s -f http://localhost:8080 > /dev/null; then
    log "✅ Frontend OK (porta 8080)"
else
    error "❌ Frontend falhou (porta 8080)"
fi

# Verificar nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx ativo"
else
    warning "⚠️ Nginx não está ativo"
fi

# Salvar configuração PM2
pm2 save

log "✅ Serviços iniciados com sucesso!"
log "📊 Dashboard: https://precivox.com.br"
log "🔧 PM2 Monitor: pm2 monit"
log "📋 Logs: pm2 logs"

echo "=============================================="
echo "🎯 PRECIVOX SERVICES ONLINE"
echo "=============================================="