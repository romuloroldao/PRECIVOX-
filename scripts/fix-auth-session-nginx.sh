#!/usr/bin/env bash

###############################################################################
# Script: fix-auth-session-nginx.sh
#
# Objetivo:
# - Garantir que a configuração correta do Nginx para o PRECIVOX esteja ativa,
#   copiando o arquivo de produção do repositório:
#     nginx/production-nextjs.conf
#   para:
#     /etc/nginx/sites-available/precivox.conf
#   e recarregando o Nginx.
#
# Este script NÃO recompila o projeto nem reinicia Node/PM2. Ele atua apenas
# na camada de Nginx, que é o necessário para estabilizar /api/auth/session.
#
# Uso (no servidor de produção):
#   bash scripts/fix-auth-session-nginx.sh
###############################################################################

set -euo pipefail

PROJECT_DIR="/home/deploy/apps/precivox"
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/precivox.conf"
NGINX_SITE_LEGACY="/etc/nginx/sites-available/precivox"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/precivox.conf"
NGINX_CONF_SOURCE="nginx/production-nextjs.conf"

echo "🚀 Iniciando correção de Nginx para PRECIVOX..."
echo "📁 Diretório do projeto: ${PROJECT_DIR}"

if [ ! -d "${PROJECT_DIR}" ]; then
  echo "❌ Diretório do projeto não encontrado: ${PROJECT_DIR}"
  echo "   Ajuste PROJECT_DIR no script antes de continuar."
  exit 1
fi

cd "${PROJECT_DIR}"

if [ ! -f "${NGINX_CONF_SOURCE}" ]; then
  echo "❌ Arquivo de configuração do Nginx não encontrado no repositório:"
  echo "   ${NGINX_CONF_SOURCE}"
  exit 1
fi

echo "🔄 Atualizando repositório git..."
git pull --ff-only || {
  echo "❌ Falha ao executar git pull (conflito ou erro de rede)."
  echo "   Resolva o problema de git manualmente e rode o script novamente."
  exit 1
}

echo "⚙️ Aplicando configuração de Nginx de produção (${NGINX_CONF_SOURCE})..."

if [ -f "${NGINX_SITE_AVAILABLE}" ]; then
  sudo cp "${NGINX_CONF_SOURCE}" "${NGINX_SITE_AVAILABLE}"
  echo "✅ Copiado para ${NGINX_SITE_AVAILABLE}"
elif [ -f "${NGINX_SITE_LEGACY}" ]; then
  sudo cp "${NGINX_CONF_SOURCE}" "${NGINX_SITE_LEGACY}"
  echo "✅ Copiado para ${NGINX_SITE_LEGACY}"
else
  echo "ℹ️ Nenhum arquivo existente encontrado em sites-available; criando novo..."
  sudo cp "${NGINX_CONF_SOURCE}" "${NGINX_SITE_AVAILABLE}"
  if [ ! -f "${NGINX_SITE_ENABLED}" ]; then
    sudo ln -s "${NGINX_SITE_AVAILABLE}" "${NGINX_SITE_ENABLED}"
    echo "✅ Symlink criado: ${NGINX_SITE_ENABLED} -> ${NGINX_SITE_AVAILABLE}"
  fi
fi

echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

echo "🔁 Recarregando Nginx..."
sudo systemctl reload nginx

echo "✅ Nginx recarregado com sucesso."
echo
echo "🔍 Validação rápida sugerida (rode manualmente):"
echo "   curl -sI https://www.precivox.com.br/api/auth/session"
echo "   # Esperado: HTTP/2 200"
echo
echo "🏁 Correção de Nginx concluída."

