#!/bin/bash

# setup-always-online.sh - Configuração completa para manter PRECIVOX sempre online
# Autor: PRECIVOX Team
# Versão: 1.0

echo "🚀 PRECIVOX Always Online Setup v1.0"
echo "===================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    log_error "❌ Execute este script na pasta raiz do projeto PRECIVOX!"
    exit 1
fi

log_info "📁 Verificando estrutura do projeto..."

# 1. Instalar PM2 globalmente se não existir
log_info "📦 Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    log_warn "PM2 não encontrado. Instalando..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        log_success "✅ PM2 instalado com sucesso!"
    else
        log_error "❌ Falha ao instalar PM2"
        exit 1
    fi
else
    log_success "✅ PM2 já está instalado"
fi

# 2. Instalar dependências do backend
log_info "📦 Instalando dependências do backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        log_success "✅ Dependências do backend instaladas!"
    else
        log_error "❌ Falha ao instalar dependências do backend"
        exit 1
    fi
else
    log_success "✅ Dependências do backend já instaladas"
fi
cd ..

# 3. Criar estrutura de logs
log_info "📂 Criando estrutura de logs..."
mkdir -p backend/logs frontend-react/logs
touch backend/logs/combined.log backend/logs/out.log backend/logs/error.log
touch frontend-react/logs/frontend-combined.log
chmod 664 backend/logs/*.log frontend-react/logs/*.log 2>/dev/null
log_success "✅ Estrutura de logs criada!"

# 4. Tornar scripts executáveis
log_info "🔧 Configurando permissões dos scripts..."
chmod +x start-backend.sh
chmod +x monitor-backend.sh
chmod +x send-alert.sh
log_success "✅ Scripts configurados!"

# 5. Configurar PM2
log_info "⚙️ Configurando PM2..."

# Parar processos existentes
pm2 delete all 2>/dev/null || true

# Iniciar com a nova configuração
pm2 start ecosystem.config.cjs
if [ $? -eq 0 ]; then
    log_success "✅ PM2 configurado e iniciado!"
else
    log_error "❌ Falha ao iniciar PM2"
    exit 1
fi

# Salvar configuração do PM2
pm2 save
log_success "✅ Configuração PM2 salva!"

# 6. Configurar PM2 para iniciar automaticamente no boot
log_info "🔄 Configurando inicialização automática..."
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
log_warn "⚠️ Execute o comando exibido acima como root para habilitar inicialização automática!"

# 7. Verificar se tudo está funcionando
log_info "🧪 Testando configuração..."
sleep 5

# Testar API
if curl -s http://localhost:3001/api/health > /dev/null; then
    log_success "✅ Backend está respondendo!"
else
    log_error "❌ Backend não está respondendo"
fi

# Verificar PM2
pm2_status=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null)
if [ "$pm2_status" = "online" ]; then
    log_success "✅ PM2 está executando corretamente!"
else
    log_warn "⚠️ PM2 pode não estar funcionando corretamente"
fi

# 8. Configurar monitoramento opcional
log_info "🔍 Configurando monitoramento..."
cat << 'EOF' > start-monitor.sh
#!/bin/bash
# Script para iniciar monitoramento em background
nohup ./monitor-backend.sh > monitor.log 2>&1 &
echo "Monitor iniciado em background (PID: $!)"
echo "Para parar: pkill -f monitor-backend.sh"
echo "Para ver logs: tail -f monitor.log"
EOF
chmod +x start-monitor.sh
log_success "✅ Script de monitoramento criado!"

# 9. Instalar mailx para alertas (opcional)
log_info "📧 Verificando sistema de email..."
if ! command -v mailx &> /dev/null; then
    log_warn "mailx não encontrado. Para receber alertas por email, instale:"
    log_warn "Ubuntu/Debian: sudo apt-get install mailutils"
    log_warn "CentOS/RHEL: sudo yum install mailx"
else
    log_success "✅ Sistema de email configurado!"
fi

# 10. Criar arquivo de comandos úteis
log_info "📝 Criando guia de comandos..."
cat << 'EOF' > COMANDOS_UTEIS.md
# 🚀 PRECIVOX - Comandos Úteis

## ⚡ Comandos Básicos
```bash
# Verificar status
pm2 status

# Reiniciar backend
pm2 restart precivox-backend

# Ver logs em tempo real
pm2 logs precivox-backend

# Parar tudo
pm2 stop all

# Iniciar tudo
pm2 start ecosystem.config.cjs
```

## 🔍 Monitoramento
```bash
# Iniciar monitor em background
./start-monitor.sh

# Ver status do monitor
ps aux | grep monitor-backend

# Parar monitor
pkill -f monitor-backend.sh

# Ver logs do monitor
tail -f monitor.log
```

## 🧪 Testes
```bash
# Testar API
curl http://localhost:3001/api/health

# Testar busca
curl "http://localhost:3001/api/produtos?q=coca"

# Ver produtos carregados
curl -s http://localhost:3001/api/health | jq '.produtos_carregados'
```

## 🚨 Emergência
```bash
# Reiniciar manualmente
./start-backend.sh

# Matar todos os processos Node
pkill -f "node.*server.js"

# Verificar portas ocupadas
lsof -i:3001

# Ver uso de recursos
top -p $(pgrep -f "node.*server.js")
```

## 📧 Configurar Email de Alertas
```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# Testar email
echo "Teste" | mail -s "Teste PRECIVOX" romulo.roldao@gmail.com

# Testar alerta
./send-alert.sh "TESTE" "Sistema" "Teste de alerta"
```
EOF

log_success "✅ Guia criado em COMANDOS_UTEIS.md!"

# 11. Resumo final
echo ""
echo "🎉 =================================="
echo "   CONFIGURAÇÃO COMPLETA!"
echo "=================================="
log_success "✅ Backend configurado com PM2"
log_success "✅ Auto-restart habilitado"
log_success "✅ Logs configurados"
log_success "✅ Scripts de monitoramento prontos"
log_success "✅ Sistema de alertas configurado"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Execute como root o comando PM2 startup exibido acima"
echo "2. Para monitoramento: ./start-monitor.sh"
echo "3. Configure email: sudo apt-get install mailutils"
echo "4. Leia COMANDOS_UTEIS.md para comandos importantes"

echo ""
echo "🔗 URLs Importantes:"
echo "• Backend: http://localhost:3001/api/health"
echo "• Frontend: http://localhost (se configurado)"
echo "• Logs: tail -f backend/logs/combined.log"
echo "• Monitor: tail -f monitor.log"

echo ""
echo "📧 Alertas serão enviados para: romulo.roldao@gmail.com"
echo ""
log_success "🚀 PRECIVOX está agora configurado para funcionar 24/7!"