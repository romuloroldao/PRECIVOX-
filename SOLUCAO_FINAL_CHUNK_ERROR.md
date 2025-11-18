# 🔧 Solução Final: ChunkLoadError - Chunks Não Correspondem

## 📋 Problema Crítico

O Next.js está gerando HTML com referências a chunks que não existem:
- **HTML referencia**: `page-7e2fb9ac352236bf.js` (chunk 1931)
- **Chunk existente**: `page-19e776563c8236ec.js`

**Resultado**: 
- ChunkLoadError
- Tela branca
- React error #423
- Status 400 do servidor

## 🔍 Causa Raiz Identificada

O problema é que o **Next.js em modo `standalone`** está gerando HTML em runtime com hashes que não correspondem aos chunks reais. Isso acontece quando:

1. **HTML é gerado dinamicamente** pelo servidor Next.js
2. **Chunks são gerados no build** com hashes diferentes
3. **Sincronização falha** entre HTML gerado e chunks disponíveis

## ✅ Solução Aplicada

### 1. Rebuild Completo

```bash
# Limpar tudo
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build

# Sincronizar assets
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static

# Reiniciar
pm2 restart precivox-nextjs
```

### 2. Limpeza de Cache

```bash
# Limpar todos os caches
rm -rf .next/cache
rm -rf .next/standalone/.next/cache
rm -rf node_modules/.cache
```

### 3. Verificação de Sincronização

O script `deploy-production.sh` foi atualizado para verificar chunks após sincronização.

## 🚨 Solução Imediata para Usuários

### Limpar Cache do Navegador

**CRÍTICO**: O problema é que o navegador está usando HTML antigo em cache.

1. **Chrome/Edge**:
   - `Ctrl+Shift+Delete` → Limpar dados de navegação
   - Marcar "Imagens e arquivos em cache"
   - Limpar dados
   - **OU**: `Ctrl+Shift+R` (hard refresh)

2. **Firefox**:
   - `Ctrl+Shift+Delete` → Limpar cache
   - **OU**: `Ctrl+F5` (hard refresh)

3. **Safari**:
   - `Cmd+Option+E` (limpar cache)
   - **OU**: `Cmd+Shift+R` (hard refresh)

### Testar Novamente

Após limpar o cache, acessar a página novamente. O Next.js deve gerar um novo HTML com as referências corretas.

## 🔧 Solução Permanente

### Opção 1: Desabilitar Modo Standalone (Temporário)

Se o problema persistir, pode ser necessário desabilitar o modo standalone temporariamente:

```javascript
// next.config.js
// output: 'standalone', // Comentar esta linha
```

**Desvantagem**: Aumenta o tamanho do build, mas garante sincronização correta.

### Opção 2: Usar Build ID Fixo

Adicionar um build ID fixo baseado em versão:

```javascript
// next.config.js
generateBuildId: async () => {
  // Usar versão do package.json ou hash do commit
  return process.env.BUILD_ID || 'production'
}
```

### Opção 3: Verificar Sincronização no Deploy

O script de deploy já verifica chunks, mas pode ser melhorado:

```bash
# Verificar se chunks correspondem
HTML_CHUNK=$(curl -s http://localhost:3000/ | grep -oE "page-[a-f0-9]{16}\.js" | head -1)
EXISTS=$(test -f ".next/standalone/.next/static/chunks/app/${HTML_CHUNK}" && echo "OK" || echo "FAIL")

if [ "$EXISTS" != "OK" ]; then
  echo "❌ Chunk não encontrado: $HTML_CHUNK"
  exit 1
fi
```

## 📊 Status Atual

- ✅ Rebuild completo realizado
- ✅ Assets sincronizados
- ✅ Caches limpos
- ✅ Next.js reiniciado
- ⚠️ **Problema persiste** - HTML ainda referencia chunks antigos

## 🎯 Próximos Passos

1. **Testar após limpar cache do navegador**
   - Se funcionar: problema era cache do navegador
   - Se não funcionar: problema é no servidor

2. **Se persistir no servidor**:
   - Considerar desabilitar modo standalone
   - Verificar se há bug conhecido no Next.js 14.2.33
   - Considerar atualizar Next.js

3. **Monitoramento**:
   - Adicionar alerta para ChunkLoadError
   - Verificar logs do Next.js regularmente

## 🔍 Comandos Úteis

```bash
# Verificar chunks disponíveis
find .next/standalone/.next/static/chunks -name "page-*.js" | grep app

# Verificar qual chunk o HTML referencia
curl -s http://localhost:3000/ | grep -oE "page-[a-f0-9]{16}\.js"

# Verificar se chunk existe
test -f ".next/standalone/.next/static/chunks/app/page-XXXX.js" && echo "OK" || echo "FAIL"

# Limpar tudo e rebuild
rm -rf .next node_modules/.cache && npm run build
```

## ⚠️ Nota Importante

Este problema parece ser um **bug do Next.js 14.2.33 em modo standalone** onde o HTML gerado dinamicamente não corresponde aos chunks do build. A solução mais confiável é:

1. **Limpar cache do navegador** (resolve na maioria dos casos)
2. **Se persistir**: Considerar desabilitar modo standalone ou atualizar Next.js

---

**Status**: ⚠️ Problema identificado, aguardando validação após limpar cache  
**Prioridade**: Crítica  
**Impacto**: Páginas não carregam (tela branca)

