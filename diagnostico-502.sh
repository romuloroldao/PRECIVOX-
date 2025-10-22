#!/bin/bash

# 🔍 DIAGNÓSTICO COMPLETO - ERRO 502
# Execute este script no servidor

echo "🔍 DIAGNÓSTICO COMPLETO - ERRO 502"
echo "=================================="

# 1. Verificar status geral do sistema
echo "📊 Status geral do sistema:"
echo "Data/Hora: $(date)"
echo "Uptime: $(uptime)"
echo "Memória: $(free -h | grep Mem)"
echo "Disco: $(df -h / | tail -1)"

# 2. Verificar serviços PM2
echo ""
echo "📋 Status dos serviços PM2:"
pm2 status

# 3. Verificar processos Node.js
echo ""
echo "🔍 Processos Node.js rodando:"
ps aux | grep node | grep -v grep

# 4. Verificar portas em uso
echo ""
echo "🌐 Portas em uso:"
netstat -tulpn | grep -E ":(3000|3001|80|443)"

# 5. Verificar nginx
echo ""
echo "🔧 Status do nginx:"
systemctl status nginx --no-pager -l

# 6. Verificar logs do nginx
echo ""
echo "📋 Últimos logs do nginx:"
tail -20 /var/log/nginx/error.log

# 7. Verificar logs do PM2
echo ""
echo "📋 Logs do PM2:"
pm2 logs --lines 20

# 8. Verificar se o diretório do projeto existe
echo ""
echo "📁 Verificando diretório do projeto:"
if [ -d "/var/www/precivox" ]; then
    echo "✅ Diretório encontrado: /var/www/precivox"
    cd /var/www/precivox
elif [ -d "/root/precivox" ]; then
    echo "✅ Diretório encontrado: /root/precivox"
    cd /root/precivox
elif [ -d "/home/precivox" ]; then
    echo "✅ Diretório encontrado: /home/precivox"
    cd /home/precivox
else
    echo "❌ Diretório do projeto não encontrado!"
    echo "📋 Diretórios disponíveis:"
    ls -la /var/www/ /root/ /home/ | grep precivox
    exit 1
fi

# 9. Verificar arquivos essenciais
echo ""
echo "📄 Verificando arquivos essenciais:"
[ -f "package.json" ] && echo "✅ package.json" || echo "❌ package.json não encontrado"
[ -f ".env" ] && echo "✅ .env" || echo "❌ .env não encontrado"
[ -f "next.config.js" ] && echo "✅ next.config.js" || echo "❌ next.config.js não encontrado"
[ -d ".next" ] && echo "✅ .next (build)" || echo "❌ .next não encontrado (precisa build)"

# 10. Verificar dependências
echo ""
echo "📦 Verificando node_modules:"
[ -d "node_modules" ] && echo "✅ node_modules" || echo "❌ node_modules não encontrado (precisa npm install)"

# 11. Teste de conectividade
echo ""
echo "🧪 Testando conectividade:"
curl -I http://localhost:3000 2>/dev/null && echo "✅ Servidor responde na porta 3000" || echo "❌ Servidor não responde na porta 3000"
curl -I https://precivox.com.br 2>/dev/null && echo "✅ Site responde via HTTPS" || echo "❌ Site não responde via HTTPS"

# 12. Verificar configuração do nginx
echo ""
echo "🔧 Configuração do nginx para precivox:"
if [ -f "/etc/nginx/sites-available/precivox" ]; then
    echo "✅ Arquivo de configuração encontrado"
    cat /etc/nginx/sites-available/precivox
elif [ -f "/etc/nginx/conf.d/precivox.conf" ]; then
    echo "✅ Arquivo de configuração encontrado"
    cat /etc/nginx/conf.d/precivox.conf
else
    echo "❌ Arquivo de configuração não encontrado"
    echo "📋 Arquivos de configuração disponíveis:"
    ls -la /etc/nginx/sites-available/ | grep precivox
    ls -la /etc/nginx/conf.d/ | grep precivox
fi

echo ""
echo "🎯 DIAGNÓSTICO CONCLUÍDO!"
echo "Execute o script de correção baseado nos resultados acima."
