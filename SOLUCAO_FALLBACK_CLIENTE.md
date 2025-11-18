# ✅ Solução de Fallback no Cliente - ChunkLoadError

## 🎯 Problema

O Next.js em modo `standalone` está gerando HTML dinamicamente com referências a chunks que não existem no servidor. Isso causa `ChunkLoadError` quando o navegador tenta carregar esses chunks.

## ✅ Solução Implementada

### Handler Automático de ChunkLoadError (`app/layout.tsx`)

Adicionado script que:
1. **Detecta ChunkLoadError** automaticamente
2. **Força reload com bypass de cache** quando detecta o erro
3. **Previne loops infinitos** (tenta apenas uma vez)
4. **Funciona mesmo com cache do navegador**

### Como Funciona

```javascript
// Captura erros de chunk
window.addEventListener('error', (e) => {
  if (isChunkError && e.filename.includes('_next/static/chunks')) {
    // Força reload com bypass de cache
    window.location.reload(true);
  }
});

// Captura promises rejeitadas (chunks que falharam)
window.addEventListener('unhandledrejection', (e) => {
  if (isChunkError) {
    // Força reload
    window.location.href = window.location.href + '?v=' + Date.now();
  }
});
```

### Benefícios

- ✅ **Automático**: Não requer ação do usuário
- ✅ **Bypass de cache**: Força o navegador a buscar HTML novo
- ✅ **Previne loops**: Tenta apenas uma vez para evitar reload infinito
- ✅ **Funciona imediatamente**: Não precisa limpar cache manualmente

---

## 🔄 Fluxo de Correção

1. **Usuário acessa a página**
2. **Navegador tenta carregar chunk antigo** → Erro 400/404
3. **Script detecta ChunkLoadError**
4. **Script força reload com bypass de cache**
5. **Navegador busca HTML novo do servidor**
6. **HTML novo referencia chunks corretos**
7. **Página carrega normalmente** ✅

---

## ⚠️ Limitações

- Se o problema persistir após o reload, o script não tentará novamente (previne loops)
- Nesse caso, o usuário precisa limpar cache manualmente (`Ctrl+Shift+R`)

---

## 📊 Status

- [x] Script de fallback implementado
- [x] Handler para `error` events
- [x] Handler para `unhandledrejection` events
- [x] Prevenção de loops infinitos
- [x] Bypass de cache no reload

---

**Data**: 2025-11-17  
**Status**: ✅ Implementado e ativo

