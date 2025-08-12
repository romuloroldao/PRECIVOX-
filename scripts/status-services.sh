#!/bin/bash

# status-services.sh - Script para verificar status dos serviços PRECIVOX
# Autor: Sistema PRECIVOX
# Data: $(date +%Y-%m-%d)

echo "📊 =============================================="
echo "   STATUS SERVIÇOS PRECIVOX"
echo "   Data: $(date)"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "${BLUE}[INFO]${NC} Verificando serviços..."
echo ""

# 1. PM2 Status
echo "🔧 PM2 Processes:"
pm2 status || echo -e "${RED}❌ PM2 não está rodando${NC}"
echo ""

# 2. Backend API
echo "🖥️ Backend API (porta 3001):"
if curl -s -f http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend Online${NC}"
    echo "   URL: http://localhost:3001/api/health"
else
    echo -e "${RED}❌ Backend Offline${NC}"
fi
echo ""

# 3. Frontend
echo "🌐 Frontend (porta 8080):"
if curl -s -f http://localhost:8080 > /dev/null; then
    echo -e "${GREEN}✅ Frontend Online${NC}"
    echo "   URL: http://localhost:8080"
else
    echo -e "${RED}❌ Frontend Offline${NC}"
fi
echo ""

# 4. Nginx
echo "🔧 Nginx:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx Ativo${NC}"
    echo "   Status: $(systemctl is-active nginx)"
else
    echo -e "${RED}❌ Nginx Inativo${NC}"
fi
echo ""

# 5. Site Principal
echo "🌍 Site Principal (HTTPS):"
if curl -s -f https://precivox.com.br > /dev/null; then
    echo -e "${GREEN}✅ Site Online${NC}"
    echo "   URL: https://precivox.com.br"
else
    echo -e "${RED}❌ Site Offline${NC}"
fi
echo ""

# 6. Portas
echo "🔌 Portas em uso:"
echo "   Porta 80 (nginx): $(netstat -tuln | grep :80 | wc -l) conexão(ões)"
echo "   Porta 443 (nginx SSL): $(netstat -tuln | grep :443 | wc -l) conexão(ões)"
echo "   Porta 3001 (backend): $(netstat -tuln | grep :3001 | wc -l) conexão(ões)"
echo "   Porta 8080 (frontend): $(netstat -tuln | grep :8080 | wc -l) conexão(ões)"
echo ""

# 7. Recursos do Sistema
echo "💾 Recursos do Sistema:"
echo "   Memória: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "   CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "   Espaço em Disco: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo ""

# 8. Logs recentes
echo "📋 Logs Recentes (últimas 5 linhas):"
if [ -f "/var/www/precivox/backend/logs/error.log" ]; then
    echo "   Backend Errors:"
    tail -n 5 /var/www/precivox/backend/logs/error.log 2>/dev/null || echo "   Nenhum erro recente"
else
    echo "   Arquivo de log do backend não encontrado"
fi
echo ""

# 9. Uptime dos processos
echo "⏱️ Uptime dos Processos:"
pm2 show precivox-backend 2>/dev/null | grep "uptime" || echo "   Backend: N/A"
pm2 show precivox-frontend 2>/dev/null | grep "uptime" || echo "   Frontend: N/A"
echo ""

echo "=============================================="
echo "📊 STATUS CHECK COMPLETED"
echo "=============================================="

echo ""
echo "Comandos úteis:"
echo "  pm2 monit      - Monitor em tempo real"
echo "  pm2 logs       - Ver todos os logs"
echo "  pm2 restart all - Reiniciar serviços"