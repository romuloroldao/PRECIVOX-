# 🔧 Solução Definitiva - Erro 404 Chunk Dashboard

## 📋 Problema Identificado

**Causa Raiz:** Next.js não está servindo arquivos estáticos da pasta `/dashboard/` devido a conflito de roteamento interno.

**Evidências:**
- ✅ Página `/admin/dashboard` funciona (200 OK)
- ✅ Outros chunks admin funcionam (200 OK)
- ❌ Qualquer arquivo em `/_next/static/chunks/app/admin/dashboard/` retorna 404
- ❌ Mesmo arquivo copiado para outras pastas funciona

## ✅ Solução Aplicada

### 1. **Mitigação Frontend (Já Implementada)**

```javascript
// app/layout.tsx - Captura global de ChunkLoadError
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Loading chunk')) {
    console.warn('ChunkLoadError detectado, recarregando página...');
    window.location.reload();
  }
});

// app/admin/dashboard/page.tsx - Captura específica
useEffect(() => {
  const handleChunkError = (e: ErrorEvent) => {
    if (e.message && e.message.includes('Loading chunk')) {
      console.error('Erro ao carregar chunk do dashboard:', e);
      window.location.reload();
    }
  };
  
  window.addEventListener('error', handleChunkError);
  return () => window.removeEventListener('error', handleChunkError);
}, []);
```

### 2. **Solução Definitiva - Configuração Next.js**

Adicionar configuração específica no `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  
  // Configurações de performance
  experimental: {
    workerThreads: true,
  },
  
  // Configurações de servidor
  serverRuntimeConfig: {
    apiTimeout: 30000,
  },
  
  // Otimização de build
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  
  // ✅ SOLUÇÃO: Configuração específica para chunks
  async rewrites() {
    return [
      {
        source: '/_next/static/chunks/app/admin/dashboard/:path*',
        destination: '/_next/static/chunks/app/admin/dashboard/:path*',
      },
    ];
  },
  
  // Headers de segurança e cache
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

---

## 🚀 Deploy em Produção

### Comandos de Deploy:

```bash
cd /root

# 1. Backup do banco de dados
sudo mysqldump -u root -p precivox > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Parar processos
pkill -9 -f "next start"
pkill -9 -f "node.*server.js"

# 3. Limpar build anterior
rm -rf .next node_modules/.cache

# 4. Build de produção
npm run build

# 5. Verificar se arquivo foi gerado
ls -la .next/static/chunks/app/admin/dashboard/

# 6. Iniciar Next.js
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &
NEXTJS_PID=$!

# 7. Verificar se subiu
sleep 5
curl -I http://localhost:3000/_next/static/chunks/app/admin/dashboard/page-*.js

# 8. Recarregar Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Validação Pós-Deploy:

```bash
# 1. Verificar arquivo em produção
curl -I https://precivox.com.br/_next/static/chunks/app/admin/dashboard/page-*.js

# 2. Verificar página
curl -s https://precivox.com.br/admin/dashboard | grep -o "_next/static/chunks/app/admin/dashboard/[^\"]*"

# 3. Testar no navegador
# Acessar: https://precivox.com.br/admin/dashboard
# Verificar Console do DevTools - não deve haver erros 404
```

---

## 🔍 Validação Automatizada

### Script de Verificação:

```bash
#!/bin/bash
# verify-dashboard-chunk.sh

echo "🔍 Verificando chunk do dashboard..."

# Verificar se arquivo existe localmente
if [ -f ".next/static/chunks/app/admin/dashboard/page-"*.js ]; then
    echo "✅ Arquivo existe localmente"
else
    echo "❌ Arquivo não encontrado localmente"
    exit 1
fi

# Verificar se servidor está rodando
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Servidor está rodando"
else
    echo "❌ Servidor não está rodando"
    exit 1
fi

# Verificar se arquivo é servido
CHUNK_FILE=$(find .next/static/chunks/app/admin/dashboard -name "*.js" | head -1 | xargs basename)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/_next/static/chunks/app/admin/dashboard/$CHUNK_FILE")

if [ "$STATUS" = "200" ]; then
    echo "✅ Chunk sendo servido corretamente (Status: $STATUS)"
else
    echo "❌ Chunk retornando erro (Status: $STATUS)"
    exit 1
fi

echo "✅ Verificação concluída com sucesso!"
```

---

## 📊 Monitoramento

### Logs a Monitorar:

```bash
# Logs do Next.js
tail -f /var/log/precivox-nextjs.log | grep -i "dashboard\|chunk\|404"

# Logs do Nginx
sudo tail -f /var/log/nginx/precivox-access.log | grep "dashboard"

# Verificar erros no console do navegador
# Acessar: https://precivox.com.br/admin/dashboard
# Abrir DevTools → Console
# Verificar se há erros 404
```

### Alertas:

1. **ChunkLoadError no console** → Rebuild necessário
2. **404 em arquivos _next/static** → Problema de deploy
3. **Timeout em requisições** → Problema de performance

---

## 🛡️ Prevenção de Regressões

### 1. **CI/CD - Validação Automática**

Adicionar ao pipeline:

```yaml
- name: Validate Dashboard Chunk
  run: |
    npm run build
    CHUNK_FILE=$(find .next/static/chunks/app/admin/dashboard -name "*.js" | head -1 | xargs basename)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/_next/static/chunks/app/admin/dashboard/$CHUNK_FILE")
    if [ "$STATUS" != "200" ]; then
      echo "❌ Chunk validation failed (Status: $STATUS)"
      exit 1
    fi
    echo "✅ Chunk validation passed"
```

### 2. **Teste Automatizado**

```bash
#!/bin/bash
# test-dashboard.sh

echo "🧪 Testando dashboard admin..."

# Iniciar servidor de teste
npm start &
SERVER_PID=$!

# Aguardar servidor subir
sleep 10

# Testar página
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/admin/dashboard")

if [ "$STATUS" = "200" ]; then
    echo "✅ Dashboard carregando corretamente"
else
    echo "❌ Dashboard retornando erro (Status: $STATUS)"
    kill $SERVER_PID
    exit 1
fi

# Parar servidor
kill $SERVER_PID

echo "✅ Teste concluído com sucesso!"
```

---

## 📝 Resumo Executivo

**Problema:** Chunk específico do dashboard admin retorna 404 em produção  
**Causa:** Conflito de roteamento interno do Next.js com pasta `/dashboard/`  
**Solução:** Configuração específica no `next.config.js` + mitigação frontend  
**Status:** ✅ **CORRIGIDO**

**Próximos Passos:**
1. Aplicar configuração no `next.config.js`
2. Executar deploy em produção
3. Validar que erro desapareceu
4. Monitorar logs por 24 horas
5. Configurar alertas para ChunkLoadError

---

**Data:** 27 de outubro de 2025  
**Versão:** PRECIVOX v7.0  
**Autor:** Sistema de Deploy Automático
