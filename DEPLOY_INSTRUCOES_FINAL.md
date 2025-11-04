# 🚀 Instruções Finais de Deploy

## 📋 Status Atual

✅ **Correções Aplicadas:**
- APIs criadas para página de busca
- Nomes de tabelas do Prisma corrigidos
- Build completo sem erros
- Mitigação frontend para ChunkLoadError funcionando

⚠️ **Servidor não está subindo corretamente**

## 🔧 Passos para Deploy

### 1. Parar todos os processos Next.js
```bash
cd /root
pkill -9 -f "next"
pkill -9 -f "node.*server.js"
sleep 5
```

### 2. Verificar porta 3000
```bash
lsof -i :3000
# Se houver processo, matar: kill -9 $(lsof -t -i:3000)
```

### 3. Rebuild e Deploy
```bash
cd /root
rm -rf .next node_modules/.cache
npm run build
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &
sleep 10
```

### 4. Verificar se subiu
```bash
curl -I http://localhost:3000/
curl -I https://precivox.com.br/
tail -f /var/log/precivox-nextjs.log
```

### 5. Testar APIs
```bash
curl https://precivox.com.br/api/mercados?ativo=true
curl https://precivox.com.br/api/produtos/categorias
curl https://precivox.com.br/api/produtos/marcas
curl https://precivox.com.br/api/unidades/cidades
```

## 📝 Arquivos Modificados

1. **`app/api/mercados/route.ts`** - Criado
2. **`app/api/produtos/categorias/route.ts`** - Criado  
3. **`app/api/produtos/marcas/route.ts`** - Criado
4. **`app/api/unidades/cidades/route.ts`** - Criado
5. **`app/api/produtos/buscar/route.ts`** - Criado
6. **`app/api/admin/stats/route.ts`** - Atualizado (dynamic)
7. **`app/api/admin/recent-users/route.ts`** - Atualizado (dynamic)
8. **`app/layout.tsx`** - Atualizado (ChunkLoadError)
9. **`app/admin/dashboard/page.tsx`** - Atualizado (ChunkLoadError)
10. **`next.config.js`** - Atualizado (rewrites)

## ✅ Validação

Após deploy, testar:
1. Acessar https://precivox.com.br/
2. Verificar que página carrega (não fica em loading)
3. Testar busca de produtos
4. Verificar console do navegador (sem erros 404)

---

**Data:** 27 de outubro de 2025
**Status:** ✅ Correções aplicadas - Aguardando deploy manual
