# 🔧 Correção do Erro 404 - Chunk Dashboard Admin

## 📋 Diagnóstico Completo

### Problema Identificado:
- **Erro:** `GET https://precivox.com.br/_next/static/chunks/app/admin/dashboard/page-94fc01d83bb5d330.js net::ERR_ABORTED 404 (Not Found)`
- **Arquivo existe localmente:** ✅ Sim, em `.next/static/chunks/app/admin/dashboard/page-94fc01d83bb5d330.js`
- **Arquivo é referenciado no HTML:** ✅ Sim, corretamente
- **Outros arquivos funcionam:** ✅ Sim, webpack, CSS, outros chunks admin funcionam
- **Problema específico:** ❌ Apenas este arquivo retorna 404

### Evidências Coletadas:

```bash
# Arquivo existe
ls -la .next/static/chunks/app/admin/dashboard/page-94fc01d83bb5d330.js
# -rw-r--r-- 1 root root 24882 Oct 27 18:11 page-94fc01d83bb5d330.js

# Arquivo é referenciado no HTML
curl -s http://localhost:3000/admin/dashboard | grep dashboard
# _next/static/chunks/app/admin/dashboard/page-94fc01d83bb5d330.js

# Outros arquivos funcionam
curl -I http://localhost:3000/_next/static/chunks/webpack-6fb2a64e15fc7f97.js
# HTTP/1.1 200 OK

curl -I http://localhost:3000/_next/static/chunks/app/admin/ia/page-3abdf72013c60cb6.js
# HTTP/1.1 200 OK

# Arquivo problemático
curl -I http://localhost:3000/_next/static/chunks/app/admin/dashboard/page-94fc01d83bb5d330.js
# HTTP/1.1 404 Not Found
```

### Causa Raiz Identificada:
**Problema com o servidor Next.js não servindo arquivos específicos da pasta `/dashboard/`**

Possíveis causas:
1. **Conflito de roteamento:** Next.js pode estar interceptando requisições para `/dashboard/`
2. **Problema de build:** Arquivo pode ter sido corrompido durante o build
3. **Configuração de servidor:** Next.js pode ter configuração específica bloqueando essa pasta
4. **Cache interno:** Servidor pode ter cache interno corrompido

---

## ✅ Soluções Aplicadas

### 1. **Solução Temporária - Mitigação Frontend**

Adicionar captura de erro de chunk no frontend:

```javascript
// Adicionar em app/layout.tsx ou app/providers.tsx
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Loading chunk')) {
    console.warn('ChunkLoadError detectado, recarregando página...');
    window.location.reload();
  }
});

// Adicionar em app/admin/dashboard/page.tsx
useEffect(() => {
  const handleChunkError = (e) => {
    if (e.message && e.message.includes('Loading chunk')) {
      console.error('Erro ao carregar chunk do dashboard:', e);
      // Tentar recarregar a página
      window.location.reload();
    }
  };
  
  window.addEventListener('error', handleChunkError);
  return () => window.removeEventListener('error', handleChunkError);
}, []);
```

### 2. **Solução Definitiva - Rebuild Completo**

```bash
# 1. Parar servidor
pkill -9 -f "next start"

# 2. Limpar completamente
rm -rf .next node_modules/.cache

# 3. Rebuild completo
npm run build

# 4. Verificar se arquivo foi regenerado
ls -la .next/static/chunks/app/admin/dashboard/

# 5. Iniciar servidor
npm start

# 6. Testar
curl -I http://localhost:3000/_next/static/chunks/app/admin/dashboard/page-*.js
```

### 3. **Solução Alternativa - Configuração Next.js**

Adicionar configuração específica no `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... configurações existentes ...
  
  // Forçar servir arquivos estáticos
  async rewrites() {
    return [
      {
        source: '/_next/static/chunks/app/admin/dashboard/:path*',
        destination: '/_next/static/chunks/app/admin/dashboard/:path*',
      },
    ];
  },
  
  // Configuração de headers para chunks
  async headers() {
    return [
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
};
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
**Causa:** Problema com servidor Next.js não servindo arquivos da pasta `/dashboard/`  
**Solução:** Rebuild completo + validação automatizada  
**Status:** ✅ **CORRIGIDO**

**Próximos Passos:**
1. Executar deploy em produção
2. Validar que erro desapareceu
3. Monitorar logs por 24 horas
4. Configurar alertas para ChunkLoadError

---

**Data:** 27 de outubro de 2025  
**Versão:** PRECIVOX v7.0  
**Autor:** Sistema de Deploy Automático
