# 🔍 Guia Completo: ChunkLoadError 400 em Next.js

## 1. 📋 O Que Significa Esse Erro

### Erro Específico
```
GET https://precivox.com.br/_next/static/chunks/app/page-7e2fb9ac352236bf.js 
net::ERR_ABORTED 400 (Bad Request)
```

### Explicação Técnica

O **ChunkLoadError 400** ocorre quando:

1. **O navegador solicita um chunk JavaScript** que foi referenciado no HTML
2. **O servidor retorna 400 (Bad Request)** em vez de servir o arquivo
3. **O React não consegue carregar o componente**, resultando em tela branca

### Por Que Ocorre em Next.js

Next.js usa **code splitting** para dividir o código em chunks menores:
- Cada página/rota tem seu próprio chunk (ex: `page-[hash].js`)
- O hash no nome do arquivo é gerado baseado no conteúdo do código
- Se o código muda, o hash muda, gerando um novo nome de arquivo
- O HTML gerado referencia esses chunks pelo hash

**O problema**: Se o HTML referencia um chunk que não existe mais (ou nunca existiu), ocorre o erro 400.

---

## 2. 🔍 Causas Mais Comuns

### 2.1. Cache Antigo no Navegador

**Causa**: O navegador está usando HTML antigo em cache que referencia chunks de um build anterior.

**Sintomas**:
- HTML referencia `page-7e2fb9ac352236bf.js` (build antigo)
- Chunk atual é `page-19e776563c8236ec.js` (build novo)
- Arquivo antigo não existe mais no servidor

**Probabilidade**: ⭐⭐⭐⭐⭐ (Muito Alta)

### 2.2. Build Corrompido ou Incompleto

**Causa**: O build foi interrompido ou falhou parcialmente, gerando HTML com referências a chunks que não foram criados.

**Sintomas**:
- Build parece ter sucedido, mas alguns chunks estão faltando
- HTML referencia chunks que não existem no diretório `.next/static`

**Probabilidade**: ⭐⭐⭐ (Média)

### 2.3. Sincronização de Assets Falha (Modo Standalone)

**Causa**: No modo `standalone`, os assets estáticos precisam ser copiados manualmente. Se a sincronização falhar, o HTML pode referenciar chunks que não estão no diretório standalone.

**Sintomas**:
- Chunks existem em `.next/static/` mas não em `.next/standalone/.next/static/`
- HTML gerado dinamicamente referencia chunks que não estão disponíveis

**Probabilidade**: ⭐⭐⭐⭐ (Alta - especialmente no seu caso)

### 2.4. Configuração de Servidor/CDN Incorreta

**Causa**: O servidor web (nginx) ou CDN está bloqueando ou retornando erro para requisições de chunks.

**Sintomas**:
- Chunk existe no servidor, mas nginx retorna 400
- Problemas de MIME type ou headers incorretos
- Regras de proxy incorretas

**Probabilidade**: ⭐⭐ (Baixa, mas possível)

### 2.5. Múltiplos Builds Conflitantes

**Causa**: Há múltiplos builds no servidor e o Next.js está servindo HTML de um build enquanto os chunks são de outro.

**Sintomas**:
- Múltiplos diretórios `.next` ou builds parciais
- BUILD_IDs diferentes entre `.next/` e `.next/standalone/.next/`

**Probabilidade**: ⭐⭐⭐ (Média)

---

## 3. 🔬 Como Diagnosticar

### 3.1. Verificar se o Chunk Existe no Servidor

```bash
# Verificar chunks disponíveis
ls -la .next/standalone/.next/static/chunks/app/page-*.js

# Verificar se o chunk específico existe
test -f ".next/standalone/.next/static/chunks/app/page-7e2fb9ac352236bf.js" && echo "EXISTE" || echo "NÃO EXISTE"

# Listar todos os chunks da página principal
find .next/standalone/.next/static/chunks/app -name "page-*.js" -type f
```

### 3.2. Verificar Qual Chunk o HTML Está Referenciando

```bash
# Via curl (servidor)
curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js" | head -1

# Via DevTools (navegador)
# Abrir DevTools → Network → Filtrar por "chunks" → Ver requisições
```

### 3.3. Comparar HTML vs Chunks Disponíveis

```bash
# Chunk referenciado no HTML
HTML_CHUNK=$(curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js" | head -1)
echo "HTML referencia: $HTML_CHUNK"

# Chunks disponíveis
echo "Chunks disponíveis:"
ls -1 .next/standalone/.next/static/chunks/app/page-*.js | xargs -I {} basename {}

# Verificar se corresponde
if [ -f ".next/standalone/.next/static/chunks/app/$HTML_CHUNK" ]; then
    echo "✅ Chunk existe - problema pode ser cache do navegador"
else
    echo "❌ Chunk NÃO existe - problema no servidor"
fi
```

### 3.4. Verificar BUILD_ID

```bash
# Verificar BUILD_IDs
echo "BUILD_ID principal:"
cat .next/BUILD_ID

echo "BUILD_ID standalone:"
cat .next/standalone/.next/BUILD_ID

# Comparar
diff .next/BUILD_ID .next/standalone/.next/BUILD_ID
```

### 3.5. Verificar Logs do Servidor

```bash
# Logs do Next.js
tail -f /var/log/precivox-nextjs.log | grep -i chunk

# Logs do Nginx
tail -f /var/log/nginx/precivox-error.log | grep -i chunk
tail -f /var/log/nginx/precivox-access.log | grep "chunks"
```

### 3.6. Testar Requisição Direta

```bash
# Testar via localhost (bypass nginx)
curl -I "http://localhost:3000/_next/static/chunks/app/page-7e2fb9ac352236bf.js"

# Testar via nginx (produção)
curl -I "https://precivox.com.br/_next/static/chunks/app/page-7e2fb9ac352236bf.js"

# Verificar resposta
# Status 200 = arquivo existe
# Status 400/404 = arquivo não existe ou erro de configuração
```

---

## 4. 🛠️ Passo a Passo para Corrigir

### 4.1. Limpar Cache do Navegador

#### Chrome/Edge
1. Pressione `Ctrl+Shift+Delete` (Windows/Linux) ou `Cmd+Shift+Delete` (Mac)
2. Selecione "Imagens e arquivos em cache"
3. Período: "Todo o período"
4. Clique em "Limpar dados"
5. **OU** simplesmente: `Ctrl+Shift+R` (hard refresh)

#### Firefox
1. `Ctrl+Shift+Delete` → Marcar "Cache" → "Limpar agora"
2. **OU**: `Ctrl+F5` (hard refresh)

#### Safari
1. `Cmd+Option+E` (limpar cache)
2. **OU**: `Cmd+Shift+R` (hard refresh)

#### Via DevTools (Todos os Navegadores)
1. Abrir DevTools (F12)
2. Clicar com botão direito no botão de refresh
3. Selecionar "Esvaziar cache e atualizar forçadamente"

### 4.2. Limpar Cache do CDN (Se Aplicável)

Se você usa CDN (Cloudflare, AWS CloudFront, etc.):

```bash
# Cloudflare (via API)
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://precivox.com.br/_next/static/chunks/**"]}'

# AWS CloudFront
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/_next/static/chunks/*"
```

### 4.3. Rodar `next build` Novamente

```bash
# 1. Limpar build anterior
rm -rf .next
rm -rf node_modules/.cache

# 2. Fazer build limpo
npm run build

# 3. Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Build falhou"
    exit 1
fi

# 4. Verificar chunks gerados
find .next/static/chunks/app -name "page-*.js" | wc -l
```

### 4.4. Garantir que `_next/static/...` Está Sendo Servido Corretamente

#### Verificar Configuração do Nginx

```nginx
# Configuração correta no nginx
location /_next/static {
    proxy_pass http://nextjs_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # IMPORTANTE: Não interceptar erros (permite 404 correto)
    proxy_intercept_errors off;
    
    # Cache para arquivos estáticos
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    
    # Timeouts
    proxy_connect_timeout 5s;
    proxy_send_timeout 10s;
    proxy_read_timeout 10s;
    
    # Não fazer buffering para arquivos estáticos
    proxy_buffering off;
}
```

#### Verificar se Nginx Está Servindo Corretamente

```bash
# Testar requisição direta
curl -I "http://localhost:3000/_next/static/chunks/app/page-19e776563c8236ec.js"

# Verificar logs do nginx
sudo tail -f /var/log/nginx/precivox-access.log | grep chunks
sudo tail -f /var/log/nginx/precivox-error.log
```

### 4.5. Configurar MIME Types Corretos

O nginx geralmente já tem MIME types corretos, mas verifique:

```bash
# Verificar MIME types no nginx
cat /etc/nginx/mime.types | grep "application/javascript"

# Se não estiver configurado, adicionar no nginx.conf:
# types {
#     application/javascript js;
#     ...
# }
```

### 4.6. Sincronizar Assets no Modo Standalone

**CRÍTICO**: No modo `standalone`, os assets precisam ser copiados manualmente:

```bash
# 1. Remover assets antigos
rm -rf .next/standalone/.next/static

# 2. Criar diretório
mkdir -p .next/standalone/.next

# 3. Copiar assets
cp -R .next/static .next/standalone/.next/static

# 4. Verificar sincronização
diff -r .next/static .next/standalone/.next/static | head -20

# 5. Verificar BUILD_ID
cp .next/BUILD_ID .next/standalone/.next/BUILD_ID
```

### 4.7. Reiniciar Serviços

```bash
# Reiniciar Next.js
pm2 restart precivox-nextjs

# OU se não usar PM2
pkill -f "next start"
npm start

# Recarregar Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. ✅ Boas Práticas para Evitar o Problema

### 5.1. Versionamento de Builds

Adicionar versionamento explícito no `next.config.js`:

```javascript
// next.config.js
module.exports = {
  // ... outras configurações
  
  // Usar versão do package.json ou hash do commit
  generateBuildId: async () => {
    // Opção 1: Versão do package.json
    const pkg = require('./package.json');
    return `v${pkg.version}-${Date.now()}`;
    
    // Opção 2: Hash do commit Git
    // const { execSync } = require('child_process');
    // return execSync('git rev-parse --short HEAD').toString().trim();
  },
}
```

### 5.2. Cache Busting Automático

O Next.js já faz cache busting com hashes, mas você pode melhorar:

```javascript
// next.config.js
module.exports = {
  // Headers para forçar atualização em caso de problema
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Adicionar ETag para validação
          {
            key: 'ETag',
            value: 'W/"${Date.now()}"',
          },
        ],
      },
    ];
  },
}
```

### 5.3. Script de Deploy Robusto

Melhorar o script de deploy para verificar sincronização:

```bash
#!/bin/bash
# deploy-production.sh

# ... build ...

# Sincronizar assets
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static

# VERIFICAÇÃO: Garantir que chunks correspondem
echo "🔍 Verificando sincronização de chunks..."

# Verificar BUILD_ID
if [ -f ".next/BUILD_ID" ] && [ -f ".next/standalone/.next/BUILD_ID" ]; then
    if ! diff -q .next/BUILD_ID .next/standalone/.next/BUILD_ID > /dev/null 2>&1; then
        echo "⚠️  BUILD_IDs diferentes - corrigindo..."
        cp .next/BUILD_ID .next/standalone/.next/BUILD_ID
    fi
fi

# Verificar se chunks principais existem
REQUIRED_CHUNKS=(
    "app/page-*.js"
    "app/admin/mercados/[id]/page-*.js"
)

for chunk_pattern in "${REQUIRED_CHUNKS[@]}"; do
    if ! ls .next/standalone/.next/static/chunks/${chunk_pattern} > /dev/null 2>&1; then
        echo "❌ Chunk não encontrado: ${chunk_pattern}"
        exit 1
    fi
done

echo "✅ Chunks verificados e sincronizados"
```

### 5.4. Health Check com Validação de Chunks

Criar endpoint de health check que valida chunks:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Verificar se chunks principais existem
    const chunksDir = path.join(process.cwd(), '.next/standalone/.next/static/chunks/app');
    const mainPageChunk = fs.readdirSync(chunksDir).find(f => f.startsWith('page-') && f.endsWith('.js'));
    
    if (!mainPageChunk) {
      return NextResponse.json(
        { status: 'error', message: 'Main page chunk not found' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      buildId: process.env.BUILD_ID || 'unknown',
      mainChunk: mainPageChunk,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
```

### 5.5. Monitoramento e Alertas

Adicionar monitoramento para ChunkLoadError:

```javascript
// app/layout.tsx ou _app.tsx
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message.includes('ChunkLoadError') || event.message.includes('Loading chunk')) {
      // Enviar para serviço de monitoramento
      fetch('/api/errors', {
        method: 'POST',
        body: JSON.stringify({
          type: 'ChunkLoadError',
          message: event.message,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      
      // Tentar recarregar após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  });
}
```

### 5.6. Usar `next export` (Se Aplicável)

Se você não precisa de SSR dinâmico, considere usar `next export`:

```javascript
// next.config.js
module.exports = {
  output: 'export', // Gera HTML estático
  // Isso elimina problemas de sincronização de chunks
}
```

**Vantagens**:
- HTML e chunks sempre sincronizados
- Sem problemas de cache dinâmico
- Mais fácil de fazer deploy

**Desvantagens**:
- Sem SSR dinâmico
- Sem API routes no mesmo servidor

### 5.7. Estratégia de Deploy com Zero Downtime

```bash
#!/bin/bash
# deploy-zero-downtime.sh

# 1. Build em diretório temporário
BUILD_DIR=".next-build-$(date +%s)"
npm run build
mv .next "$BUILD_DIR"

# 2. Sincronizar assets
cp -R "$BUILD_DIR/static" "$BUILD_DIR/standalone/.next/static"

# 3. Verificar se está tudo OK
# ... validações ...

# 4. Fazer swap atômico
mv .next/standalone ".next/standalone-backup-$(date +%s)"
mv "$BUILD_DIR/standalone" .next/standalone

# 5. Reiniciar (com rollback automático se falhar)
pm2 restart precivox-nextjs || {
    echo "❌ Rollback..."
    mv .next/standalone-backup-* .next/standalone
    pm2 restart precivox-nextjs
}
```

### 5.8. Documentação de Troubleshooting

Manter documentação atualizada com comandos de diagnóstico:

```markdown
# Troubleshooting ChunkLoadError

## Diagnóstico Rápido
```bash
# Verificar chunks
ls -la .next/standalone/.next/static/chunks/app/page-*.js

# Verificar HTML
curl -s http://localhost:3000/ | grep -oE "page-[a-f0-9]{16}\.js"

# Comparar
# Se não corresponderem, limpar cache e rebuild
```
```

---

## 6. 🎯 Solução Específica para Seu Caso

Baseado na análise do seu ambiente, o problema é **cache do navegador + possível desincronização no modo standalone**.

### Solução Imediata

```bash
# 1. Rebuild completo
cd /root
rm -rf .next node_modules/.cache
npm run build

# 2. Sincronizar assets (CRÍTICO)
rm -rf .next/standalone/.next/static
rm -rf .next/standalone/.next/server/app/*.html  # Remover HTML antigo
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp .next/BUILD_ID .next/standalone/.next/BUILD_ID

# 3. Reiniciar
pm2 restart precivox-nextjs

# 4. Verificar
curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js"
ls -1 .next/standalone/.next/static/chunks/app/page-*.js | xargs -I {} basename {}
```

### Para Usuários

**Instrução clara**: Limpar cache do navegador (`Ctrl+Shift+R` ou `Ctrl+Shift+Delete`).

---

## 7. 📊 Checklist de Validação

Após aplicar as correções, verificar:

- [ ] Build completo sem erros
- [ ] Chunks existem em `.next/standalone/.next/static/chunks/`
- [ ] BUILD_IDs sincronizados
- [ ] HTML referencia chunks que existem
- [ ] Nginx servindo chunks corretamente (status 200)
- [ ] Cache do navegador limpo
- [ ] Página carrega sem erros no console
- [ ] Health check retorna status OK

---

**Status**: ✅ Guia completo criado  
**Próximo passo**: Aplicar soluções e validar

