#!/bin/bash

# stop-services.sh - Script para parar serviços PRECIVOX
# Autor: Sistema PRECIVOX
# Data: $(date +%Y-%m-%d)

set -e

echo "🛑 =============================================="
echo "   PARANDO SERVIÇOS PRECIVOX"
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

# Mostrar status atual
info "Status atual dos serviços:"
pm2 status || warning "PM2 não está rodando"

# Parar serviços específicos
log "Parando Backend..."
pm2 stop precivox-backend 2>/dev/null || warning "Backend já estava parado"

log "Parando Frontend..."
pm2 stop precivox-frontend 2>/dev/null || warning "Frontend já estava parado"

# Aguardar finalização
sleep 2

# Verificar se pararam
log "Verificando se os serviços pararam..."
pm2 status

# Opcional: parar todos os processos PM2
if [ "$1" = "--all" ]; then
    warning "Parando TODOS os processos PM2..."
    pm2 stop all
    pm2 delete all
fi

# Opcional: parar nginx
if [ "$1" = "--nginx" ]; then
    warning "Parando Nginx..."
    systemctl stop nginx
fi

log "✅ Serviços parados!"

echo "=============================================="
echo "🛑 PRECIVOX SERVICES STOPPED"
echo "=============================================="

echo ""
echo "Para reiniciar:"
echo "  ./scripts/start-services.sh"
echo ""
echo "Para monitorar:"
echo "  pm2 monit"
echo "  pm2 logs"