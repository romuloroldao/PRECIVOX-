#!/bin/bash

# send-alert.sh - Sistema de alertas por email para PRECIVOX
# Autor: PRECIVOX Team
# Email: romulo.roldao@gmail.com

ALERT_EMAIL="romulo.roldao@gmail.com"
SERVER_NAME="PRECIVOX Server"
LOG_FILE="/var/www/precivox/alerts.log"

# Função para log
log_alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

# Função para enviar email via curl (usando serviço gratuito)
send_email_curl() {
    local subject="$1"
    local message="$2"
    
    # Usando emailjs ou similar (substitua pela sua configuração)
    local email_data=$(cat <<EOF
{
    "service_id": "default_service",
    "template_id": "template_precivox_alert",
    "user_id": "your_user_id",
    "template_params": {
        "to_email": "$ALERT_EMAIL",
        "subject": "$subject",
        "message": "$message",
        "server": "$SERVER_NAME",
        "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')"
    }
}
EOF
)
    
    # Tentar enviar via API (exemplo com emailjs)
    curl -X POST \
        -H "Content-Type: application/json" \
        -d "$email_data" \
        "https://api.emailjs.com/api/v1.0/email/send" \
        --max-time 30 --silent
    
    return $?
}

# Função para enviar via mailx (se disponível)
send_email_mailx() {
    local subject="$1"
    local message="$2"
    
    if command -v mailx &> /dev/null; then
        echo "$message" | mailx -s "$subject" "$ALERT_EMAIL"
        return $?
    fi
    
    return 1
}

# Função para enviar via msmtp (se disponível)
send_email_msmtp() {
    local subject="$1"
    local message="$2"
    
    if command -v msmtp &> /dev/null; then
        (
            echo "To: $ALERT_EMAIL"
            echo "Subject: $subject"
            echo "Content-Type: text/plain; charset=UTF-8"
            echo ""
            echo "$message"
        ) | msmtp "$ALERT_EMAIL"
        return $?
    fi
    
    return 1
}

# Função principal para enviar alerta
send_alert() {
    local alert_type="$1"
    local service="$2"
    local details="$3"
    
    local subject="🚨 ALERTA $SERVER_NAME: $alert_type - $service"
    local message="
🚨 ALERTA CRÍTICO DO SERVIDOR PRECIVOX 🚨

📅 Data/Hora: $(date '+%d/%m/%Y %H:%M:%S')
🖥️ Servidor: $SERVER_NAME
⚠️ Tipo: $alert_type
🔧 Serviço: $service

📝 DETALHES:
$details

🔍 AÇÕES RECOMENDADAS:
• Verificar logs em /var/www/precivox/backend/logs/
• Conectar via SSH e verificar status dos serviços
• Executar: pm2 status ou ./start-backend.sh
• Verificar uso de recursos: top, free -h, df -h

📞 COMANDOS ÚTEIS:
• Verificar backend: curl http://localhost:3001/api/health
• Reiniciar PM2: pm2 restart all
• Ver logs: tail -f /var/www/precivox/backend/logs/error.log

---
Este alerta foi gerado automaticamente pelo sistema de monitoramento PRECIVOX.
Servidor: $(hostname)
IP: $(hostname -I | awk '{print $1}')
Uptime: $(uptime)

Para parar alertas: pkill -f monitor-backend.sh
"

    log_alert "🚨 ENVIANDO ALERTA: $alert_type - $service"
    
    # Tentar múltiplos métodos de envio
    local sent=false
    
    # Método 1: mailx
    if send_email_mailx "$subject" "$message"; then
        log_alert "✅ Email enviado via mailx"
        sent=true
    else
        log_alert "❌ Falha no envio via mailx"
    fi
    
    # Método 2: msmtp (se mailx falhou)
    if [ "$sent" = false ] && send_email_msmtp "$subject" "$message"; then
        log_alert "✅ Email enviado via msmtp"
        sent=true
    else
        log_alert "❌ Falha no envio via msmtp"
    fi
    
    # Método 3: curl (último recurso)
    if [ "$sent" = false ] && send_email_curl "$subject" "$message"; then
        log_alert "✅ Email enviado via API"
        sent=true
    else
        log_alert "❌ Falha no envio via API"
    fi
    
    if [ "$sent" = false ]; then
        log_alert "💀 FALHA CRÍTICA: Não foi possível enviar alerta por email!"
        
        # Salvar alerta em arquivo como backup
        local backup_file="/var/www/precivox/unsent_alerts.txt"
        echo "========================================" >> "$backup_file"
        echo "$subject" >> "$backup_file"
        echo "$message" >> "$backup_file"
        echo "========================================" >> "$backup_file"
        
        log_alert "📄 Alerta salvo em $backup_file"
        return 1
    fi
    
    return 0
}

# Verificar se recebeu parâmetros
if [ $# -lt 2 ]; then
    echo "Uso: $0 <tipo_alerta> <serviço> [detalhes]"
    echo "Exemplo: $0 'SERVIÇO PARADO' 'Backend API' 'Não responde na porta 3001'"
    exit 1
fi

# Executar envio de alerta
send_alert "$1" "$2" "$3"