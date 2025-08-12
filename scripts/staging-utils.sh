#!/bin/bash

# ============================================
# UTILITÁRIOS PARA AMBIENTE DE STAGING
# Scripts auxiliares para gerenciar test.precivox.com
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
COMPOSE_FILE="docker compose.staging.yml"
ENV_FILE=".env.staging"
PROJECT_NAME="precivox-staging"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Função para mostrar ajuda
show_help() {
    echo "🛠️  Utilitários do Ambiente de Staging - Precivox"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start     - Iniciar ambiente de staging"
    echo "  stop      - Parar ambiente de staging"
    echo "  restart   - Reiniciar ambiente de staging"
    echo "  logs      - Ver logs em tempo real"
    echo "  status    - Ver status dos containers"
    echo "  clean     - Limpar containers e volumes"
    echo "  backup    - Fazer backup do banco de dados"
    echo "  restore   - Restaurar backup do banco de dados"
    echo "  test      - Executar testes básicos"
    echo "  monitor   - Monitorar recursos dos containers"
    echo "  shell     - Acessar shell do container"
    echo "  help      - Mostrar esta ajuda"
    echo ""
}

# Função para iniciar o ambiente
start_staging() {
    log_info "🚀 Iniciando ambiente de staging..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    log_success "✅ Ambiente iniciado!"
    show_urls
}

# Função para parar o ambiente
stop_staging() {
    log_info "⏹️  Parando ambiente de staging..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down
    log_success "✅ Ambiente parado!"
}

# Função para reiniciar o ambiente
restart_staging() {
    log_info "🔄 Reiniciando ambiente de staging..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart
    log_success "✅ Ambiente reiniciado!"
    show_urls
}

# Função para ver logs
show_logs() {
    log_info "📝 Mostrando logs em tempo real (Ctrl+C para sair)..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f
}

# Função para ver status
show_status() {
    log_info "📊 Status dos containers:"
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps
    echo ""
    log_info "💾 Uso de disco:"
    docker system df
    echo ""
    log_info "🔍 Health checks:"
    check_health
}

# Função para limpar ambiente
clean_staging() {
    log_warning "🧹 Esta ação irá remover todos os containers, imagens e volumes!"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "🗑️  Limpando ambiente..."
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down --rmi all --volumes --remove-orphans
        docker system prune -f
        log_success "✅ Ambiente limpo!"
    else
        log_info "❌ Operação cancelada"
    fi
}

# Função para fazer backup
backup_database() {
    log_info "💾 Fazendo backup do banco de dados..."
    mkdir -p backups
    
    BACKUP_NAME="precivox_staging_backup_$(date +%Y%m%d_%H%M%S).db"
    
    if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T backend cp /app/data/precivox_analytics.db /tmp/backup.db 2>/dev/null; then
        docker cp $(docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps -q backend):/tmp/backup.db "./backups/$BACKUP_NAME"
        log_success "✅ Backup criado: ./backups/$BACKUP_NAME"
    else
        log_error "❌ Erro ao criar backup"
    fi
}

# Função para restaurar backup
restore_database() {
    log_info "📁 Backups disponíveis:"
    ls -la backups/*.db 2>/dev/null || {
        log_error "❌ Nenhum backup encontrado!"
        return 1
    }
    
    echo ""
    read -p "Digite o nome do arquivo de backup: " backup_file
    
    if [ -f "backups/$backup_file" ]; then
        log_warning "⚠️  Esta ação irá sobrescrever o banco atual!"
        read -p "Continuar? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker cp "backups/$backup_file" $(docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps -q backend):/app/data/precivox_analytics.db
            docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart backend
            log_success "✅ Backup restaurado!"
        fi
    else
        log_error "❌ Arquivo de backup não encontrado!"
    fi
}

# Função para executar testes
run_tests() {
    log_info "🧪 Executando testes básicos..."
    
    # Test backend health
    if curl -f http://localhost:3001/api/admin/status > /dev/null 2>&1; then
        log_success "✅ Backend: OK"
    else
        log_error "❌ Backend: FALHOU"
    fi
    
    # Test frontend health
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        log_success "✅ Frontend: OK"
    else
        log_error "❌ Frontend: FALHOU"
    fi
    
    # Test API endpoint
    if curl -f http://localhost:3001/api/products > /dev/null 2>&1; then
        log_success "✅ API Products: OK"
    else
        log_error "❌ API Products: FALHOU"
    fi
}

# Função para monitorar recursos
monitor_resources() {
    log_info "📊 Monitorando recursos (Ctrl+C para sair)..."
    watch -n 2 'docker stats --no-stream'
}

# Função para acessar shell
access_shell() {
    echo "Containers disponíveis:"
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps --format "table {{.Service}}\t{{.State}}"
    echo ""
    read -p "Digite o nome do serviço (backend/frontend): " service
    
    case $service in
        backend)
            log_info "🐚 Acessando shell do backend..."
            docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec backend sh
            ;;
        frontend)
            log_info "🐚 Acessando shell do frontend..."
            docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec frontend sh
            ;;
        *)
            log_error "❌ Serviço inválido!"
            ;;
    esac
}

# Função para mostrar URLs
show_urls() {
    echo ""
    echo "🌐 URLs do ambiente:"
    echo "  - Frontend: http://localhost:80"
    echo "  - Backend: http://localhost:3001"
    echo "  - Health: http://localhost:80/health"
    echo ""
}

# Função para verificar saúde
check_health() {
    # Backend
    if curl -f http://localhost:3001/api/admin/status > /dev/null 2>&1; then
        echo "  ✅ Backend: Saudável"
    else
        echo "  ❌ Backend: Com problemas"
    fi
    
    # Frontend
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        echo "  ✅ Frontend: Saudável"
    else
        echo "  ❌ Frontend: Com problemas"
    fi
}

# Main script logic
case ${1:-help} in
    start)
        start_staging
        ;;
    stop)
        stop_staging
        ;;
    restart)
        restart_staging
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_staging
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database
        ;;
    test)
        run_tests
        ;;
    monitor)
        monitor_resources
        ;;
    shell)
        access_shell
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "❌ Comando inválido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac