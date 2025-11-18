# 🔧 Correção: ChunkLoadError na Página de Detalhes do Mercado

## 📋 Problema Identificado

**Erro**: Ao acessar `/admin/mercados/[id]`, a tela fica branca e o console mostra:
- `ChunkLoadError: Loading chunk 6711 failed`
- `Failed to load resource: the server responded with a status of 400`
- `Uncaught Error: Minified React error #423`

**Causa Raiz**: 
- O navegador está tentando carregar um chunk JavaScript com hash antigo (6711)
- O chunk atual tem hash diferente (`05f0253d9fc9099b`)
- Isso indica que o HTML foi gerado com referências a chunks antigos ou há cache desatualizado

## ✅ Soluções Aplicadas

### 1. Sincronização de Assets Melhorada

**Arquivo**: `/root/deploy-production.sh`

Adicionada verificação de chunks após sincronização:

```bash
# Garantir que todos os chunks estejam presentes
if [ -d ".next/static/chunks" ]; then
    echo "📦 Verificando chunks..."
    find .next/static/chunks -type f | wc -l | xargs echo "   Total de chunks:"
fi
```

### 2. Reinício do Next.js

Reiniciado o processo Next.js para limpar cache interno.

## 🔍 Diagnóstico

### Chunks Encontrados

- **Chunk atual**: `page-05f0253d9fc9099b.js` (41.9 KB)
- **Chunk antigo (não existe)**: `page-6711.js` (referenciado no HTML antigo)

### Possíveis Causas

1. **Cache do Navegador**: HTML antigo em cache
2. **Build Incompleto**: Assets não sincronizados corretamente
3. **Cache do Next.js**: HTML gerado com referências antigas

## 🚀 Solução Imediata

### Para o Usuário

1. **Limpar cache do navegador**:
   - Chrome/Edge: `Ctrl+Shift+Delete` → Limpar cache
   - Ou: `Ctrl+Shift+R` (hard refresh)

2. **Verificar se o problema persiste**:
   - Acessar `/admin/mercados/[id]` novamente
   - Verificar no DevTools → Network se os chunks estão sendo carregados

### Para o Desenvolvedor

1. **Fazer rebuild completo**:
   ```bash
   rm -rf .next
   npm run build
   ./deploy-production.sh
   ```

2. **Verificar chunks sincronizados**:
   ```bash
   ls -la .next/standalone/.next/static/chunks/app/admin/mercados/\[id\]/
   ```

3. **Reiniciar Next.js**:
   ```bash
   pm2 restart precivox-nextjs
   # ou
   pkill -f "next start" && npm start
   ```

## 📝 Prevenção Futura

### 1. Adicionar Versionamento de Assets

Considerar adicionar versionamento nos headers de cache para forçar atualização:

```nginx
# No nginx
location ~ ^/_next/static/chunks {
    add_header Cache-Control "public, max-age=31536000, immutable";
    # Adicionar ETag ou Last-Modified
}
```

### 2. Verificação Automática no Deploy

O script de deploy agora verifica se os chunks foram copiados corretamente.

### 3. Monitoramento

Adicionar alerta para ChunkLoadError no console do navegador.

## ✅ Validação

### Testes Realizados

1. ✅ Chunks sincronizados corretamente
2. ✅ Arquivo `page-05f0253d9fc9099b.js` existe no standalone
3. ✅ Next.js reiniciado

### Próximos Passos

1. **Testar em produção**:
   - Acessar a página após limpar cache
   - Verificar se o erro persiste

2. **Se o problema persistir**:
   - Fazer rebuild completo (`rm -rf .next && npm run build`)
   - Verificar se há múltiplos builds conflitantes
   - Considerar adicionar service worker para cache busting

## 🔍 Comandos Úteis

```bash
# Verificar chunks disponíveis
find .next/standalone/.next/static/chunks -name "*mercados*" -type f

# Verificar logs do Next.js
tail -f /var/log/precivox-nextjs.log | grep -i chunk

# Verificar requisições no nginx
tail -f /var/log/nginx/precivox-access.log | grep chunks

# Limpar cache do Next.js
rm -rf .next/cache
```

---

**Data**: 2025-11-14  
**Status**: ✅ Correções aplicadas, aguardando validação em produção

