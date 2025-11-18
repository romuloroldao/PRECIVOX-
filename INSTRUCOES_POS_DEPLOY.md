# ✅ Instruções Pós-Deploy - ChunkLoadError

## 🎯 Deploy Realizado

Todas as correções foram aplicadas em produção:

- ✅ Script de fallback automático (`app/layout.tsx`)
- ✅ generateBuildId dinâmico (`next.config.js`)
- ✅ Headers no-cache para rotas dinâmicas
- ✅ Nginx configurado para não cachear 404
- ✅ Rebuild completo realizado
- ✅ Serviços reiniciados

---

## 🧪 Como Testar

### 1. Limpar Cache do Navegador (OBRIGATÓRIO)

Mesmo após o deploy, você precisa limpar o cache porque:

- O navegador ainda tem HTML antigo em cache
- O novo HTML com o script de fallback precisa ser carregado
- Após limpar, o script vai funcionar automaticamente

**Método Recomendado**:
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Shift+R`

**OU** Limpar cache manualmente:
- `Ctrl+Shift+Delete` → Marcar "Imagens e arquivos em cache" → Limpar

### 2. Acessar o Site

1. Acesse https://precivox.com.br
2. Se aparecer ChunkLoadError, **aguarde 1-2 segundos**
3. O script vai detectar o erro e **recarregar automaticamente**
4. A página deve carregar normalmente após o reload

### 3. Verificar se Funcionou

**Console do DevTools** (F12 → Console):
- Não deve haver mais erros de ChunkLoadError após o reload automático
- Deve aparecer mensagem: "ChunkLoadError detectado. Forçando reload com bypass de cache..."

**Network Tab** (F12 → Network):
- Chunks devem retornar status 200 (não 400 ou 404)
- Página deve carregar completamente

---

## 🔍 Validação Técnica

### Verificar se o Script Está Presente

```bash
# Verificar se o script de fallback está no HTML
curl -s "https://precivox.com.br/" | grep -o "handleChunkError\|reloadAttempted"

# Deve retornar: handleChunkError ou reloadAttempted
```

### Verificar Chunks Disponíveis

```bash
# No servidor
ls -1 .next/standalone/.next/static/chunks/app/page-*.js
```

### Verificar Status dos Serviços

```bash
pm2 status precivox-nextjs
# Deve mostrar: online
```

---

## ⚠️ Se Ainda Não Funcionar

### 1. Verificar Logs

```bash
tail -50 /var/log/precivox-nextjs.log
```

### 2. Verificar se o Script Está no HTML

Abra DevTools → Network → Recarregar → Verificar resposta HTML → Procurar por "handleChunkError"

### 3. Tentar Modo Anônimo

Abra uma janela anônima/privada e acesse o site. Isso bypassa completamente o cache.

### 4. Verificar se Há CDN/Proxy Intermediário

Se houver Cloudflare ou outro CDN, pode ser necessário invalidar o cache do CDN também.

---

## 📊 Status Esperado

Após limpar cache e acessar:

1. ✅ **Primeira carga**: Pode aparecer ChunkLoadError (esperado)
2. ✅ **Script detecta**: "ChunkLoadError detectado. Forçando reload..."
3. ✅ **Reload automático**: Navegador recarrega com bypass de cache
4. ✅ **Segunda carga**: Página carrega normalmente ✅

---

## 🎯 Resumo

1. ✅ **Deploy realizado** - Todas as correções aplicadas
2. ⚠️ **Limpar cache do navegador** - `Ctrl+Shift+R`
3. ✅ **Script vai corrigir automaticamente** - Aguarde 1-2 segundos após erro
4. ✅ **Página deve carregar normalmente** - Após reload automático

---

**Data**: 2025-11-17  
**Status**: ✅ Deploy concluído  
**Próximo passo**: Limpar cache do navegador (`Ctrl+Shift+R`) e testar

