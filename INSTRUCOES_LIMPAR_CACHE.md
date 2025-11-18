# 🚨 INSTRUÇÕES URGENTES: Limpar Cache para Resolver ChunkLoadError

## ⚠️ PROBLEMA CRÍTICO

O navegador está tentando carregar chunks JavaScript que não existem mais, causando:
- Tela branca
- ChunkLoadError
- React error #423

## ✅ SOLUÇÃO IMEDIATA (PARA O USUÁRIO)

### Passo 1: Limpar Cache do Navegador

**Chrome/Edge:**
1. Pressione `Ctrl+Shift+Delete` (Windows/Linux) ou `Cmd+Shift+Delete` (Mac)
2. Selecione "Imagens e arquivos em cache"
3. Período: "Todo o período"
4. Clique em "Limpar dados"

**OU** simplesmente:
- Pressione `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac) para fazer hard refresh

**Firefox:**
1. Pressione `Ctrl+Shift+Delete`
2. Selecione "Cache"
3. Clique em "Limpar agora"

**OU**:
- Pressione `Ctrl+F5` para hard refresh

**Safari:**
1. Pressione `Cmd+Option+E` para limpar cache
2. **OU** `Cmd+Shift+R` para hard refresh

### Passo 2: Testar Novamente

Após limpar o cache:
1. Acesse https://precivox.com.br
2. Verifique se a página carrega corretamente
3. Tente acessar `/admin/mercados/[id]`

## 🔧 SOLUÇÃO PARA O DESENVOLVEDOR

### Se o Problema Persistir Após Limpar Cache

Execute um rebuild completo:

```bash
cd /root
rm -rf .next
rm -rf node_modules/.cache
npm run build
./deploy-production.sh
```

### Verificar se Chunks Estão Sincronizados

```bash
# Verificar chunks disponíveis
ls -la .next/standalone/.next/static/chunks/app/page-*.js

# Verificar qual chunk o HTML referencia
curl -s http://localhost:3000/ | grep -oE "page-[a-f0-9]{16}\.js"
```

## 📝 O Que Foi Feito

1. ✅ Rebuild completo realizado
2. ✅ Assets sincronizados
3. ✅ Script de deploy atualizado para remover HTML pré-renderizado antigo
4. ✅ Verificação de BUILD_ID adicionada
5. ✅ Cache do Next.js limpo

## 🎯 Próximos Passos

1. **Limpar cache do navegador** (CRÍTICO)
2. Testar novamente
3. Se persistir, executar rebuild completo

---

**Status**: ⚠️ Aguardando limpeza de cache do navegador  
**Prioridade**: Crítica  
**Impacto**: Páginas não carregam sem limpar cache

