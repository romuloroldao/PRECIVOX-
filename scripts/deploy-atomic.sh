#!/bin/bash

# deploy-atomic.sh
# Exemplo de script para deploy atômico (Zero Downtime)
# Este script assume que você está rodando em um servidor linux com Nginx/PM2

DEPLOY_DIR="/var/www/precivox"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_SYMLINK="$DEPLOY_DIR/current"

echo "🚀 Iniciando Deploy Atômico [$TIMESTAMP]"

# 1. Criar diretório da nova release
mkdir -p "$NEW_RELEASE_DIR"

# 2. Copiar arquivos do build atual (assumindo que o build já rodou localmente ou em CI)
#    Em um cenário real, você faria um rsync ou git clone + build aqui dentro
echo "📦 Copiando arquivos..."
rsync -a --exclude 'node_modules' --exclude '.git' ./ "$NEW_RELEASE_DIR/"

# 3. Instalar dependências de produção na nova pasta
cd "$NEW_RELEASE_DIR"
npm ci --only=production

# 4. Linkar diretório de uploads/storage (se existir)
# ln -s "$DEPLOY_DIR/storage" "$NEW_RELEASE_DIR/storage"

# 5. Swap Atômico (Link Simbólico)
echo "🔄 Realizando troca de versão..."
ln -sfn "$NEW_RELEASE_DIR" "$CURRENT_SYMLINK"

# 6. Reload do PM2 (Zero Downtime)
echo "⚡ Recarregando aplicação..."
pm2 reload precivox || pm2 start ecosystem.config.js

# 7. Limpeza (manter apenas últimas 5 releases)
cd "$DEPLOY_DIR/releases"
ls -dt * | tail -n +6 | xargs -r rm -rf

echo "✅ Deploy concluído com sucesso!"
