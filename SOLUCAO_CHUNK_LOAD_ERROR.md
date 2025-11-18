# 🔧 Solução: ChunkLoadError - Chunk Não Encontrado

## 📋 Problema

Ao acessar `/admin/mercados/[id]`, o navegador tenta carregar:
- `page-9bbd8294c0c0d5db.js` (referenciado no HTML)

Mas o arquivo que existe é:
- `page-05f0253d9fc9099b.js` (no diretório)

**Resultado**: ChunkLoadError, tela branca, React error #423

## 🔍 Causa Raiz

O Next.js em modo `standalone` está gerando HTML com referências a chunks que não correspondem aos arquivos reais. Isso pode acontecer quando:

1. **Build incompleto**: O HTML foi gerado antes dos chunks finais
2. **Cache interno**: O Next.js está usando referências antigas em cache
3. **Sincronização**: Os arquivos do servidor standalone não estão sincronizados

## ✅ Solução Imediata (Para o Usuário)

### Limpar Cache do Navegador

1. **Chrome/Edge**:
   - `Ctrl+Shift+Delete` → Limpar dados de navegação
   - Ou: `Ctrl+Shift+R` (hard refresh)

2. **Firefox**:
   - `Ctrl+Shift+Delete` → Limpar cache
   - Ou: `Ctrl+F5` (hard refresh)

3. **Safari**:
   - `Cmd+Option+E` (limpar cache)
   - Ou: `Cmd+Shift+R` (hard refresh)

### Testar Novamente

Após limpar o cache, acessar a página novamente. O Next.js deve gerar um novo HTML com as referências corretas.

## 🔧 Solução Permanente (Para o Desenvolvedor)

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

### 2. Verificar Sincronização

```bash
# Verificar chunks
ls -la .next/standalone/.next/static/chunks/app/admin/mercados/\[id\]/

# Verificar se o HTML referencia chunks corretos
curl -s http://localhost:3000/admin/mercados/[id] | grep -o "page-[a-f0-9]*\.js"
```

### 3. Adicionar Verificação no Deploy

O script `deploy-production.sh` já foi atualizado para verificar chunks após sincronização.

## 🚨 Workaround Temporário

Se o problema persistir, pode ser necessário:

1. **Desabilitar cache do Next.js temporariamente**:
   ```javascript
   // next.config.js
   experimental: {
     workerThreads: true,
   },
   // Adicionar:
   generateBuildId: async () => {
     return `build-${Date.now()}`
   }
   ```

2. **Forçar regeneração do HTML**:
   - Acessar a página com query string: `?v=${Date.now()}`
   - Isso força o Next.js a regenerar o HTML

3. **Verificar se há múltiplos builds**:
   ```bash
   find .next -name "page-*.js" | grep mercados
   ```

## 📝 Monitoramento

### Verificar Logs

```bash
# Logs do Next.js
tail -f /var/log/precivox-nextjs.log | grep -i chunk

# Logs do Nginx
tail -f /var/log/nginx/precivox-error.log | grep -i chunk
```

### Verificar Requisições

No DevTools do navegador:
1. Abrir Network tab
2. Filtrar por "chunks"
3. Verificar quais chunks estão sendo solicitados
4. Verificar status (200, 404, 400)

## ✅ Validação

Após aplicar as correções:

1. ✅ Limpar cache do navegador
2. ✅ Acessar `/admin/mercados/[id]`
3. ✅ Verificar no DevTools → Network se os chunks carregam (status 200)
4. ✅ Verificar se a página renderiza corretamente
5. ✅ Verificar se não há erros no console

## 🔄 Próximos Passos

Se o problema persistir após todas as tentativas:

1. **Verificar versão do Next.js**: Pode ser um bug conhecido
2. **Considerar desabilitar modo standalone temporariamente**
3. **Abrir issue no GitHub do Next.js** se for um bug

---

**Status**: ⚠️ Problema identificado, solução em andamento  
**Prioridade**: Alta  
**Impacto**: Página de detalhes do mercado não carrega

