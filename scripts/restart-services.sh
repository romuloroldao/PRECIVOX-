#!/bin/bash

# restart-services.sh - Script para reiniciar serviços PRECIVOX
# Autor: Sistema PRECIVOX
# Data: $(date +%Y-%m-%d)

set -e

echo "🔄 =============================================="
echo "   REINICIANDO SERVIÇOS PRECIVOX"
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

cd /var/www/precivox

# Status atual
info "Status antes do restart:"
pm2 status || warning "PM2 não está rodando"

# Restart usando PM2
log "Reiniciando Backend..."
pm2 restart precivox-backend 2>/dev/null || {
    warning "Backend não estava rodando, iniciando..."
    pm2 start ecosystem.config.cjs --only precivox-backend
}

log "Reiniciando Frontend..."
pm2 restart precivox-frontend 2>/dev/null || {
    warning "Frontend não estava rodando, iniciando..."
    pm2 start ecosystem.config.cjs --only precivox-frontend
}

# Aguardar estabilização
sleep 8

# Verificar status final
log "Status após restart:"
pm2 status

# Testar conectividade
log "Testando conectividade..."

# Backend
if curl -s -f http://localhost:3001/api/health > /dev/null; then
    log "✅ Backend OK (porta 3001)"
else
    error "❌ Backend falhou (porta 3001)"
    pm2 logs precivox-backend --lines 10
fi

# Frontend
if curl -s -f http://localhost:8080 > /dev/null; then
    log "✅ Frontend OK (porta 8080)"
else
    error "❌ Frontend falhou (porta 8080)"
    pm2 logs precivox-frontend --lines 10
fi

# Recarregar nginx (sem reiniciar)
log "Recarregando Nginx..."
systemctl reload nginx

# Salvar estado
pm2 save

log "✅ Restart concluído!"
log "🌐 Site: https://precivox.com.br"

echo "=============================================="
echo "✅ PRECIVOX SERVICES RESTARTED"
echo "=============================================="