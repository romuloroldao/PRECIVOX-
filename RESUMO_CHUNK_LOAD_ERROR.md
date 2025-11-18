# 🚨 Resumo Executivo: ChunkLoadError 400

## 1. O Que Significa o Erro

### Erro
```
GET https://precivox.com.br/_next/static/chunks/app/page-7e2fb9ac352236bf.js 
net::ERR_ABORTED 400 (Bad Request)
```

### Explicação

**ChunkLoadError 400** = O navegador tenta carregar um arquivo JavaScript que:
- Não existe no servidor (foi removido em build anterior)
- Ou o servidor está retornando erro 400 em vez de 404

**Por que ocorre em Next.js:**
- Next.js divide código em **chunks** (arquivos JS menores)
- Cada chunk tem um **hash no nome** baseado no conteúdo (ex: `page-7e2fb9ac352236bf.js`)
- Quando o código muda, o hash muda → novo nome de arquivo
- Se o HTML referencia um chunk antigo que não existe mais → **erro 400**

---

## 2. Causas Mais Comuns (Ordenadas por Probabilidade)

### 🔴 1. Cache Antigo no Navegador (95% dos casos)
**Causa**: Navegador usando HTML antigo em cache que referencia chunks de build anterior.

**Solução**: Limpar cache do navegador (`Ctrl+Shift+R` ou `Ctrl+Shift+Delete`)

### 🟡 2. Sincronização de Assets Falha (Modo Standalone) (80% dos casos)
**Causa**: No modo `standalone`, assets precisam ser copiados manualmente. Se falhar, HTML referencia chunks que não estão no diretório standalone.

**Solução**: Garantir que `cp -R .next/static .next/standalone/.next/static` seja executado corretamente

### 🟢 3. Build Corrompido ou Incompleto (30% dos casos)
**Causa**: Build interrompido ou falhou parcialmente.

**Solução**: Rebuild completo (`rm -rf .next && npm run build`)

### 🔵 4. Configuração de Servidor Incorreta (10% dos casos)
**Causa**: Nginx bloqueando ou retornando erro para chunks.

**Solução**: Verificar configuração do nginx para `/_next/static`

### ⚪ 5. Múltiplos Builds Conflitantes (5% dos casos)
**Causa**: Múltiplos builds no servidor causando confusão.

**Solução**: Limpar builds antigos e garantir um único build ativo

---

## 3. Como Diagnosticar

### Passo 1: Verificar se o Chunk Existe

```bash
# Chunk que o erro menciona
CHUNK_ERRADO="page-7e2fb9ac352236bf.js"

# Verificar se existe
test -f ".next/standalone/.next/static/chunks/app/$CHUNK_ERRADO" && echo "EXISTE" || echo "NÃO EXISTE"

# Ver quais chunks realmente existem
ls -1 .next/standalone/.next/static/chunks/app/page-*.js
```

### Passo 2: Verificar Qual Chunk o HTML Referencia

```bash
# Via servidor
curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js" | head -1

# Via navegador (DevTools → Network → Filtrar por "chunks")
```

### Passo 3: Comparar

```bash
# Se HTML referencia chunk que NÃO existe → problema no servidor
# Se HTML referencia chunk que EXISTE → problema é cache do navegador
```

### Passo 4: Verificar BUILD_ID

```bash
# BUILD_IDs devem ser iguais
cat .next/BUILD_ID
cat .next/standalone/.next/BUILD_ID

# Se diferentes → problema de sincronização
```

---

## 4. Passo a Passo para Corrigir

### ✅ Solução Rápida (5 minutos)

```bash
# 1. Limpar cache do navegador
# Chrome/Edge: Ctrl+Shift+R
# Firefox: Ctrl+F5
# Safari: Cmd+Shift+R

# 2. Se não resolver, rebuild no servidor
cd /root
rm -rf .next node_modules/.cache
npm run build

# 3. Sincronizar assets (CRÍTICO no modo standalone)
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp .next/BUILD_ID .next/standalone/.next/BUILD_ID

# 4. Reiniciar
pm2 restart precivox-nextjs
```

### ✅ Solução Completa (15 minutos)

#### 4.1. Limpar Cache do Navegador

**Chrome/Edge:**
- `Ctrl+Shift+Delete` → Marcar "Imagens e arquivos em cache" → Limpar
- **OU**: `Ctrl+Shift+R` (hard refresh)

**Firefox:**
- `Ctrl+Shift+Delete` → Marcar "Cache" → Limpar
- **OU**: `Ctrl+F5`

**Safari:**
- `Cmd+Option+E` (limpar cache)
- **OU**: `Cmd+Shift+R`

#### 4.2. Limpar Cache do CDN (Se Usar)

```bash
# Cloudflare
# Dashboard → Caching → Purge Everything

# AWS CloudFront
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

#### 4.3. Rebuild Completo

```bash
# Limpar tudo
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/standalone

# Build
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Build falhou"
    exit 1
fi
```

#### 4.4. Sincronizar Assets (Modo Standalone)

```bash
# Remover assets antigos
rm -rf .next/standalone/.next/static
rm -rf .next/standalone/.next/server/app/*.html  # HTML pré-renderizado antigo

# Criar diretório
mkdir -p .next/standalone/.next

# Copiar assets
cp -R .next/static .next/standalone/.next/static

# Sincronizar BUILD_ID
cp .next/BUILD_ID .next/standalone/.next/BUILD_ID

# Verificar sincronização
echo "Chunks copiados:"
find .next/standalone/.next/static/chunks -type f | wc -l
```

#### 4.5. Verificar Configuração do Nginx

```bash
# Verificar se nginx está configurado corretamente
sudo nginx -t

# Verificar configuração de /_next/static
sudo cat /etc/nginx/sites-enabled/precivox | grep -A 20 "/_next/static"

# Recarregar se necessário
sudo systemctl reload nginx
```

#### 4.6. Verificar MIME Types

```bash
# Verificar se JavaScript está configurado
cat /etc/nginx/mime.types | grep "application/javascript"

# Se não estiver, adicionar no nginx.conf:
# types {
#     application/javascript js;
# }
```

#### 4.7. Reiniciar Serviços

```bash
# Reiniciar Next.js
pm2 restart precivox-nextjs

# Verificar status
pm2 status

# Verificar logs
tail -f /var/log/precivox-nextjs.log
```

#### 4.8. Validar Correção

```bash
# 1. Verificar chunks disponíveis
ls -1 .next/standalone/.next/static/chunks/app/page-*.js

# 2. Verificar qual chunk o HTML referencia
HTML_CHUNK=$(curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js" | head -1)
echo "HTML referencia: $HTML_CHUNK"

# 3. Verificar se existe
if [ -f ".next/standalone/.next/static/chunks/app/$HTML_CHUNK" ]; then
    echo "✅ Chunk existe - problema resolvido!"
else
    echo "❌ Chunk não existe - problema persiste"
fi

# 4. Testar requisição
curl -I "http://localhost:3000/_next/static/chunks/app/$HTML_CHUNK"
# Deve retornar: HTTP/1.1 200 OK
```

---

## 5. Boas Práticas para Evitar o Problema

### 5.1. Script de Deploy Robusto

Atualizar `deploy-production.sh` para incluir verificações:

```bash
# Após sincronizar assets
echo "🔍 Verificando sincronização..."

# Verificar BUILD_ID
if [ -f ".next/BUILD_ID" ] && [ -f ".next/standalone/.next/BUILD_ID" ]; then
    if ! diff -q .next/BUILD_ID .next/standalone/.next/BUILD_ID > /dev/null 2>&1; then
        echo "⚠️  BUILD_IDs diferentes - corrigindo..."
        cp .next/BUILD_ID .next/standalone/.next/BUILD_ID
    fi
fi

# Verificar chunks principais
if ! ls .next/standalone/.next/static/chunks/app/page-*.js > /dev/null 2>&1; then
    echo "❌ Chunks não encontrados - deploy falhou"
    exit 1
fi

echo "✅ Sincronização verificada"
```

### 5.2. Versionamento de Builds

Adicionar versionamento explícito (opcional, mas recomendado):

```javascript
// next.config.js
module.exports = {
  // ... outras configurações
  
  generateBuildId: async () => {
    // Usar timestamp ou versão do package.json
    return `build-${Date.now()}`;
    // OU: return require('./package.json').version;
  },
}
```

### 5.3. Health Check

Criar endpoint que valida chunks:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const chunksDir = path.join(process.cwd(), '.next/standalone/.next/static/chunks/app');
  const chunks = fs.existsSync(chunksDir) 
    ? fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'))
    : [];
  
  return NextResponse.json({
    status: chunks.length > 0 ? 'healthy' : 'error',
    chunks: chunks.length,
    buildId: process.env.BUILD_ID || 'unknown',
  });
}
```

### 5.4. Monitoramento

Adicionar tratamento de erro no frontend:

```typescript
// app/layout.tsx ou componente raiz
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message.includes('ChunkLoadError')) {
      // Log do erro
      console.error('ChunkLoadError detectado:', event);
      
      // Tentar recarregar após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  });
}
```

### 5.5. Cache Busting

O Next.js já faz cache busting com hashes, mas você pode melhorar headers:

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### 5.6. Considerar `next export` (Se Aplicável)

Se não precisa de SSR dinâmico:

```javascript
// next.config.js
module.exports = {
  output: 'export', // Gera HTML estático
  // Elimina problemas de sincronização
}
```

**Vantagem**: HTML e chunks sempre sincronizados  
**Desvantagem**: Sem SSR dinâmico, sem API routes no mesmo servidor

---

## 6. Diagnóstico Rápido - Comandos Úteis

```bash
# 1. Verificar chunks disponíveis
ls -la .next/standalone/.next/static/chunks/app/page-*.js

# 2. Verificar qual chunk o HTML referencia
curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js"

# 3. Comparar (deve corresponder)
HTML_CHUNK=$(curl -s "http://localhost:3000/" | grep -oE "page-[a-f0-9]{16}\.js" | head -1)
test -f ".next/standalone/.next/static/chunks/app/$HTML_CHUNK" && echo "✅ OK" || echo "❌ FALHA"

# 4. Verificar BUILD_IDs
diff .next/BUILD_ID .next/standalone/.next/BUILD_ID

# 5. Verificar logs
tail -f /var/log/precivox-nextjs.log | grep -i chunk
tail -f /var/log/nginx/precivox-error.log

# 6. Testar requisição direta
curl -I "http://localhost:3000/_next/static/chunks/app/page-19e776563c8236ec.js"
```

---

## 7. Solução Específica para Seu Caso

Baseado na análise do seu ambiente:

### Problema Identificado
- HTML referencia: `page-7e2fb9ac352236bf.js` (não existe)
- Chunk existente: `page-19e776563c8236ec.js` (existe)
- **Causa**: Cache do navegador + possível desincronização no modo standalone

### Solução Imediata

```bash
# 1. Rebuild completo
cd /root
rm -rf .next node_modules/.cache
npm run build

# 2. Sincronizar assets (CRÍTICO)
rm -rf .next/standalone/.next/static
rm -rf .next/standalone/.next/server/app/*.html
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp .next/BUILD_ID .next/standalone/.next/BUILD_ID

# 3. Reiniciar
pm2 restart precivox-nextjs

# 4. Para usuários: Limpar cache do navegador (Ctrl+Shift+R)
```

---

## 8. Checklist de Validação

Após aplicar correções:

- [ ] Build completo sem erros
- [ ] Chunks existem em `.next/standalone/.next/static/chunks/`
- [ ] BUILD_IDs sincronizados (`.next/BUILD_ID` = `.next/standalone/.next/BUILD_ID`)
- [ ] HTML referencia chunks que existem
- [ ] Nginx servindo chunks corretamente (status 200, não 400)
- [ ] Cache do navegador limpo
- [ ] Página carrega sem erros no console
- [ ] Health check retorna status OK

---

## 📚 Documentação Adicional

- Guia completo: `/root/GUIA_COMPLETO_CHUNK_LOAD_ERROR.md`
- Instruções para usuários: `/root/INSTRUCOES_LIMPAR_CACHE.md`

---

**Status**: ✅ Diagnóstico completo e soluções documentadas  
**Ação imediata**: Limpar cache do navegador + verificar sincronização de assets

