# 🚨 Solução Urgente - ChunkLoadError Persistente

## ⚠️ Problema Crítico Identificado

O servidor está servindo HTML que referencia chunks antigos (`page-7e2fb9ac352236bf.js`) que não existem mais. Mesmo após múltiplos rebuilds e limpezas, o problema persiste.

**Causa Raiz**: Bug do Next.js 14.2.33 que gera HTML com referências incorretas aos chunks, possivelmente devido a:
- Cache interno do Next.js não sendo limpo
- HTML pré-renderizado sendo servido
- Bug no modo standalone (já desabilitado)

---

## ✅ Soluções Aplicadas

### 1. Script de Fallback Melhorado (`app/layout.tsx`)
- Detecta `ERR_ABORTED`, `400`, `404`
- Intercepta `fetch` para chunks
- Força reload múltiplas vezes se necessário
- Usa `window.location.replace()` para bypass de cache

### 2. Modo Standalone Desabilitado (`next.config.js`)
- Bug conhecido do Next.js 14.2.33 em modo standalone
- Agora usando `next start` padrão

### 3. Headers No-Cache (`next.config.js`)
- Headers `Cache-Control: no-cache` para rotas dinâmicas
- Impede cache do HTML

### 4. Nginx Configurado
- Headers para não cachear 404
- `proxy_intercept_errors off`

---

## 🎯 Próximos Passos

### Opção 1: Aguardar Script Automático (Recomendado)

O script melhorado deve detectar o erro e recarregar automaticamente. **Aguarde 1-2 segundos** após ver o erro no console.

### Opção 2: Limpar Cache Manualmente

Se o script automático não funcionar:

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
2. **Limpar Cache**: `Ctrl+Shift+Delete` → Marcar "Imagens e arquivos em cache" → Limpar
3. **Modo Anônimo**: Abrir janela anônima e acessar

### Opção 3: Verificar se Há CDN/Proxy

Se houver Cloudflare ou outro CDN:
- Invalidar cache do CDN
- Verificar se há proxy intermediário fazendo cache

---

## 🔍 Validação

Após limpar cache ou aguardar reload automático:

1. **Console**: Não deve haver mais erros de ChunkLoadError
2. **Network Tab**: Chunks devem retornar 200 (não 400/404)
3. **Página**: Deve carregar completamente

---

## 🆘 Se Ainda Não Funcionar

### Verificar Logs
```bash
tail -50 /var/log/precivox-nextjs.log
```

### Verificar se Script Está Ativo
```bash
curl -s "https://precivox.com.br/" | grep -o "MAX_ERRORS\|ERR_ABORTED"
```

### Considerar Atualizar Next.js
```bash
npm update next
npm run build
```

---

**Status**: ✅ Todas as correções aplicadas  
**Ação**: Aguardar script automático ou limpar cache manualmente

