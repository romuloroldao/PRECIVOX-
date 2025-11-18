# 🚨 AVISO URGENTE - Limpar Cache do Navegador

## ⚠️ PROBLEMA CRÍTICO

Você está vendo o erro:
```
ChunkLoadError: Loading chunk 1931 failed.
(page-7e2fb9ac352236bf.js)
```

**Causa**: O navegador está usando **HTML antigo em cache** que referencia chunks que não existem mais.

## ✅ SOLUÇÃO IMEDIATA

### Método 1: Hard Refresh (MAIS RÁPIDO) ⚡

**Chrome/Edge (Windows/Linux)**:
- Pressione `Ctrl+Shift+R`

**Chrome/Edge (Mac)**:
- Pressione `Cmd+Shift+R`

**Firefox (Windows/Linux)**:
- Pressione `Ctrl+F5`

**Firefox (Mac)**:
- Pressione `Cmd+Shift+R`

**Safari**:
- Pressione `Cmd+Shift+R`

---

### Método 2: Limpar Cache Manualmente

1. Pressione `Ctrl+Shift+Delete` (Windows/Linux) ou `Cmd+Shift+Delete` (Mac)
2. Selecione **"Imagens e arquivos em cache"**
3. Período: **"Todo o período"**
4. Clique em **"Limpar dados"**
5. Recarregue a página

---

### Método 3: Modo Anônimo/Privado

1. Abra uma janela anônima/privada:
   - Chrome/Edge: `Ctrl+Shift+N` (Windows) ou `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P` (Windows) ou `Cmd+Shift+P` (Mac)
   - Safari: `Cmd+Shift+N`
2. Acesse https://precivox.com.br
3. Isso bypassa completamente o cache

---

### Método 4: DevTools (Mais Completo)

1. Abra DevTools: Pressione `F12`
2. Clique com **botão direito** no botão de refresh (↻)
3. Selecione **"Esvaziar cache e atualizar forçadamente"**

---

## 🔍 Como Verificar se Funcionou

Após limpar o cache:

1. Abra o **Console do DevTools** (F12 → Console)
2. Verifique se **NÃO há mais erros** de ChunkLoadError
3. A página deve carregar completamente **sem tela branca**

---

## 📊 Status do Servidor

✅ **Todas as correções foram aplicadas no servidor:**
- Rebuild completo realizado
- Assets sincronizados
- Headers no-cache configurados
- Nginx configurado corretamente
- Serviços reiniciados

**O problema agora é 100% cache do navegador.**

---

## ❓ Por Que Isso Aconteceu?

1. O servidor foi atualizado com novos chunks
2. O navegador ainda tem HTML antigo em cache
3. O HTML antigo referencia chunks que não existem mais
4. Resultado: ChunkLoadError

**Solução**: Limpar cache força o navegador a buscar HTML novo do servidor.

---

## 🆘 Se Ainda Não Funcionar

1. **Tente em modo anônimo** primeiro
2. **Verifique se há extensões do navegador** interferindo (desabilite temporariamente)
3. **Tente em outro navegador** (Chrome, Firefox, Edge)
4. **Aguarde alguns minutos** - pode haver cache intermediário (CDN, proxy)

---

**Última atualização**: 2025-11-17  
**Ação necessária**: ⚠️ **LIMPAR CACHE DO NAVEGADOR AGORA**

