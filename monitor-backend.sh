#!/bin/bash

# monitor-backend.sh - Script de monitoramento contínuo do backend PRECIVOX
# Autor: PRECIVOX Team
# Versão: 1.0

echo "🔍 PRECIVOX Backend Monitor v1.0"
echo "================================"

# Definir cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
BACKEND_URL="http://localhost:3001/api/health"
CHECK_INTERVAL=30  # segundos
MAX_FAILURES=3
FAILURE_COUNT=0

# Função de log com timestamp
log_with_time() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_info() {
    log_with_time "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log_with_time "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    log_with_time "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    log_with_time "${RED}[ERROR]${NC} $1"
}

# Função para verificar saúde do backend
check_backend_health() {
    local response
    local http_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BACKEND_URL" --max-time 10)
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        FAILURE_COUNT=0
        log_success "✅ Backend funcionando - HTTP $http_code"
        
        # Extrair informações do health check
        local body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        local produtos=$(echo "$body" | grep -o '"produtos_carregados":[0-9]*' | cut -d: -f2)
        local uptime=$(echo "$body" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
        
        if [ ! -z "$produtos" ]; then
            log_info "📊 Produtos carregados: $produtos"
        fi
        
        return 0
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        log_error "❌ Backend não respondeu - HTTP $http_code (Falhas: $FAILURE_COUNT/$MAX_FAILURES)"
        return 1
    fi
}

# Função para verificar se processo está rodando
check_process() {
    if pgrep -f "node.*server.js" > /dev/null; then
        log_info "🔄 Processo Node.js encontrado"
        return 0
    else
        log_error "💀 Processo Node.js não encontrado"
        return 1
    fi
}

# Função para tentar reiniciar o backend
restart_backend() {
    log_warn "🔄 Tentando reiniciar backend..."
    
    # Se PM2 estiver disponível, usar PM2
    if command -v pm2 &> /dev/null; then
        log_info "📦 Usando PM2 para reiniciar..."
        pm2 restart precivox-backend
        if [ $? -eq 0 ]; then
            log_success "✅ Reiniciado via PM2"
            sleep 10  # Aguardar inicialização
            return 0
        else
            log_error "❌ Falha ao reiniciar via PM2"
        fi
    fi
    
    # Fallback: usar script manual
    if [ -f "./start-backend.sh" ]; then
        log_info "📜 Usando script manual..."
        pkill -f "node.*server.js" 2>/dev/null
        sleep 3
        ./start-backend.sh &
        log_success "✅ Script manual executado"
        sleep 10
        return 0
    fi
    
    log_error "❌ Não foi possível reiniciar o backend"
    return 1
}

# Função principal de monitoramento
monitor_loop() {
    log_info "🚀 Iniciando monitoramento contínuo..."
    log_info "⏱️ Intervalo de verificação: ${CHECK_INTERVAL}s"
    log_info "⚠️ Limite de falhas: $MAX_FAILURES"
    
    while true; do
        if check_backend_health; then
            # Backend está saudável
            if [ $FAILURE_COUNT -gt 0 ]; then
                log_success "💚 Backend recuperado após $FAILURE_COUNT falha(s)"
                FAILURE_COUNT=0
            fi
        else
            # Backend com problemas
            log_warn "🔥 Backend com problemas (Tentativa $FAILURE_COUNT/$MAX_FAILURES)"
            
            if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
                log_error "💥 Limite de falhas atingido! Tentando reiniciar..."
                
                if restart_backend; then
                    log_success "🎯 Backend reiniciado com sucesso"
                    FAILURE_COUNT=0
                    
                    # Aguardar mais tempo após reinicialização
                    log_info "⏳ Aguardando estabilização..."
                    sleep 30
                else
                    log_error "💀 FALHA CRÍTICA: Não foi possível reiniciar o backend!"
                    log_error "🚨 AÇÃO MANUAL NECESSÁRIA!"
                    
                    # Enviar alerta por email
                    ./send-alert.sh "SERVIÇO CRÍTICO" "Backend API" "Backend não responde e falha ao reiniciar. Intervenção manual necessária."
                    
                    # Continuar monitorando mesmo assim
                    FAILURE_COUNT=0
                    sleep 60  # Aguardar mais tempo em caso de falha crítica
                fi
            fi
        fi
        
        # Verificar uso de memória e CPU (informativo)
        if check_process; then
            local pid=$(pgrep -f "node.*server.js" | head -1)
            if [ ! -z "$pid" ]; then
                local mem=$(ps -p $pid -o rss= 2>/dev/null | awk '{print int($1/1024)}')
                local cpu=$(ps -p $pid -o pcpu= 2>/dev/null | awk '{print $1}')
                
                if [ ! -z "$mem" ] && [ ! -z "$cpu" ]; then
                    log_info "📈 Uso: ${mem}MB RAM, ${cpu}% CPU"
                    
                    # Alerta se uso de memória muito alto
                    if [ "$mem" -gt 500 ]; then
                        log_warn "⚠️ Alto uso de memória: ${mem}MB"
                    fi
                fi
            fi
        fi
        
        # Aguardar próxima verificação
        sleep $CHECK_INTERVAL
    done
}

# Verificar se já há outro monitor rodando
if pgrep -f "monitor-backend.sh" | grep -v "$$" > /dev/null; then
    log_error "❌ Monitor já está executando!"
    log_info "Para parar: pkill -f monitor-backend.sh"
    exit 1
fi

# Capturar sinais para limpeza
trap 'log_info "🛑 Monitor interrompido"; exit 0' SIGINT SIGTERM

# Verificação inicial
log_info "🔍 Verificação inicial..."
if check_backend_health; then
    log_success "✅ Backend está funcionando"
else
    log_warn "⚠️ Backend não está respondendo no início"
fi

# Iniciar loop de monitoramento
monitor_loop