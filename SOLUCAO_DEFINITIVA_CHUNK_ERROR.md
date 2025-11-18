# 🔧 Solução Definitiva - ChunkLoadError

## 🎯 Problema Identificado

O navegador está usando **HTML em cache** que referencia chunks antigos (`page-7e2fb9ac352236bf.js`) que não existem mais no servidor.

## ✅ Correções Aplicadas

### 1. **generateBuildId Dinâmico** (`next.config.js`)
```javascript
generateBuildId: async () => {
  return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
```
**Objetivo**: Forçar BUILD_ID único a cada build, evitando cache de manifests.

### 2. **Headers No-Cache para Rotas Dinâmicas** (`next.config.js`)
```javascript
{
  source: '/admin/mercados/:path*',
  headers: [
    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
    { key: 'Pragma', value: 'no-cache' },
    { key: 'Expires', value: '0' },
  ],
}
```
**Objetivo**: Impedir que navegadores façam cache do HTML de rotas dinâmicas.

### 3. **Nginx: Headers para 404 em Chunks** (`nginx/production-nextjs.conf`)
```nginx
if ($upstream_http_status = 404) {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
}
```
**Objetivo**: Quando um chunk não existe (404), forçar o navegador a não cachear a resposta.

---

## 🚨 AÇÃO CRÍTICA PARA USUÁRIOS

### ⚠️ LIMPAR CACHE DO NAVEGADOR É OBRIGATÓRIO

Mesmo com todas as correções no servidor, **o navegador ainda tem HTML antigo em cache**. 

#### Método 1: Hard Refresh (RECOMENDADO)
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Shift+R`

#### Método 2: Limpar Cache Manualmente
1. Pressione `Ctrl+Shift+Delete` (ou `Cmd+Shift+Delete` no Mac)
2. Selecione "Imagens e arquivos em cache"
3. Período: "Todo o período"
4. Clique em "Limpar dados"

#### Método 3: Modo Anônimo/Privado
- Abra uma janela anônima/privada
- Acesse https://precivox.com.br
- Isso bypassa completamente o cache

#### Método 4: DevTools (Mais Completo)
1. Abra DevTools (F12)
2. Clique com botão direito no botão de refresh
3. Selecione **"Esvaziar cache e atualizar forçadamente"**

---

## 🔍 Validação

Após limpar o cache, verifique:

1. **Console do DevTools**: Não deve haver erros de ChunkLoadError
2. **Network Tab**: Chunks devem retornar status 200 (não 400 ou 404)
3. **Página**: Deve carregar completamente sem tela branca

### Comandos de Validação no Servidor

```bash
# Verificar chunks disponíveis
ls -1 .next/standalone/.next/static/chunks/app/page-*.js

# Verificar o que o HTML referencia
curl -s "http://localhost:3000/admin/mercados/1" | grep -oE "page-[a-f0-9]{16}\.js"

# Verificar se corresponde
HTML_CHUNK=$(curl -s "http://localhost:3000/admin/mercados/1" | grep -oE "page-[a-f0-9]{16}\.js" | head -1)
test -f ".next/standalone/.next/static/chunks/app/$HTML_CHUNK" && echo "✅ OK" || echo "❌ FALHA"
```

---

## 📊 Status das Correções

- [x] `generateBuildId` dinâmico adicionado
- [x] Headers no-cache para rotas dinâmicas
- [x] Nginx configurado para não cachear 404
- [x] Rebuild completo realizado
- [x] Assets sincronizados
- [x] Serviços reiniciados
- [ ] **Usuários precisam limpar cache do navegador** ⚠️

---

## 🎯 Por Que Isso Resolve

1. **generateBuildId dinâmico**: Cada build gera um ID único, forçando regeneração de manifests
2. **Headers no-cache**: Impede que navegadores façam cache do HTML de rotas dinâmicas
3. **Nginx 404 headers**: Quando um chunk não existe, o navegador não cacheia a resposta de erro
4. **Limpeza de cache do navegador**: Remove HTML antigo que referencia chunks inexistentes

---

## 🔄 Se o Problema Persistir

Se após limpar o cache o problema persistir:

1. **Verificar logs do Next.js**:
   ```bash
   tail -50 /var/log/precivox-nextjs.log
   ```

2. **Verificar se há chunks antigos no servidor**:
   ```bash
   find .next/standalone -name "*7e2fb9ac*" -o -name "*9bbd8294*"
   ```

3. **Considerar desabilitar modo standalone temporariamente**:
   ```javascript
   // next.config.js
   // output: 'standalone', // Comentar esta linha
   ```

4. **Verificar se há problema com CDN ou proxy intermediário**:
   - Verificar se há CDN (Cloudflare, etc.) fazendo cache
   - Invalidar cache do CDN se necessário

---

**Data**: 2025-11-17  
**Status**: ✅ Correções aplicadas no servidor  
**Ação necessária**: ⚠️ Usuários devem limpar cache do navegador

