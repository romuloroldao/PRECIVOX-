#!/bin/bash

# start-backend.sh - Script para inicializar backend automaticamente
# Autor: PRECIVOX Team
# Versão: 1.0

echo "🚀 PRECIVOX Backend Starter v1.0"
echo "=================================="

# Definir cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos na pasta correta
if [ ! -f "backend/server.js" ]; then
    log_error "❌ Arquivo backend/server.js não encontrado!"
    log_warn "Certifique-se de estar na pasta raiz do projeto precivox"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "❌ Node.js não está instalado!"
    log_warn "Instale Node.js: https://nodejs.org/"
    exit 1
fi

log_success "✅ Node.js encontrado: $(node --version)"

# Ir para pasta do backend
cd backend

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    log_error "❌ package.json não encontrado na pasta backend!"
    exit 1
fi

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    log_info "📦 Instalando dependências do backend..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "❌ Falha ao instalar dependências!"
        exit 1
    fi
    log_success "✅ Dependências instaladas com sucesso"
else
    log_info "📦 Dependências já instaladas"
fi

# Verificar se o servidor já está rodando na porta 3001
if lsof -i:3001 > /dev/null 2>&1; then
    log_warn "⚠️ Porta 3001 já está em uso!"
    log_info "Tentando finalizar processo existente..."
    
    # Encontrar e matar processo na porta 3001
    PID=$(lsof -ti:3001)
    if [ ! -z "$PID" ]; then
        kill -9 $PID
        log_success "✅ Processo anterior finalizado (PID: $PID)"
        sleep 2
    fi
fi

# Definir variáveis de ambiente
export NODE_ENV=production
export PORT=3001

# Log de inicialização
log_info "🚀 Iniciando servidor PRECIVOX..."
log_info "📍 Porta: 3001"
log_info "🌍 Ambiente: $NODE_ENV"
log_info "📁 Diretório: $(pwd)"

# Iniciar servidor
log_success "🎯 Executando: node server.js"
echo "=================================="

# Executar servidor com logs coloridos e redirecionamento
node server.js 2>&1 | while IFS= read -r line; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line"
done