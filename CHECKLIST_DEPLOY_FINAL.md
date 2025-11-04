# ✅ Checklist Final - Deploy Correções de Erros 400

## 📋 Resumo das Correções

### Erros Corrigidos:
1. ✅ **Erro 400 em arquivos CSS** - Hash de build desatualizado
2. ✅ **Erro 400 em arquivos JS** - Hash de build desatualizado  
3. ✅ **React Error #423** - Dependências incorretas no useEffect

### Alterações Aplicadas:
- ✅ 12 rotas de API corrigidas com `export const dynamic = 'force-dynamic'`
- ✅ `app/api/admin/stats/route.ts`
- ✅ `app/api/admin/recent-users/route.ts`
- ✅ `app/api/admin/users/route.ts`
- ✅ `app/api/admin/logs/route.ts`
- ✅ `app/api/planos/route.ts`
- ✅ `app/api/unidades/route.ts`
- ✅ `app/api/markets/route.ts`
- ✅ `app/api/markets/[id]/route.ts`
- ✅ `app/api/markets/[id]/unidades/route.ts`
- ✅ `app/api/markets/[id]/importacoes/route.ts`
- ✅ `app/api/ai/painel/compras/[mercadoId]/route.ts`
- ✅ `app/api/ai/painel/dashboard/[mercadoId]/route.ts`
- ✅ `app/api/ai/painel/alertas/[alertaId]/marcar-lido/route.ts`
- ✅ `app/api/placeholder/route.ts`
- ✅ `app/admin/dashboard/page.tsx` - useEffect corrigido

---

## 🚀 Comandos de Deploy

### 1. Preparação Local

```bash
cd /root

# Limpar builds anteriores
rm -rf .next node_modules/.cache

# Garantir que todos os arquivos estão salvos
git status

# Build de teste local
npm run build

# Verificar se não há erros
ls -la .next/static/css/
# Deve mostrar: d2b164c32202dc57.css ou similar

# Verificar arquivos gerados
find .next/static -name "*.js" | wc -l
# Deve mostrar vários arquivos JS
```

### 2. Deploy em Produção

```bash
cd /root

# Backup do banco de dados (IMPORTANTE!)
# sudo mysqldump -u root -p precivox > backup_$(date +%Y%m%d_%H%M%S).sql

# Parar processos existentes
pkill -f "next start"
pkill -f "node.*server.js"

# Limpar build anterior
rm -rf .next

# Build de produção
npm run build

# Verificar build
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou!"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Iniciar Next.js
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js iniciado com PID: $NEXTJS_PID"

# Verificar se subiu
sleep 3
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js está rodando"
else
    echo "❌ Next.js não subiu corretamente"
    tail -20 /var/log/precivox-nextjs.log
    exit 1
fi

# Recarregar Nginx
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx recarregado"
```

### 3. Verificação Pós-Deploy

```bash
# Verificar health check
curl https://precivox.com.br/health

# Verificar arquivos CSS
CSS_FILE=$(curl -s https://precivox.com.br/ | grep -oP '_next/static/css/[^"]+\.css' | head -1)
echo "CSS File: $CSS_FILE"
curl -I "https://precivox.com.br/$CSS_FILE" | head -5

# Verificar logs sem erros
tail -50 /var/log/precivox-nextjs.log | grep -i error

# Verificar processos
ps aux | grep -E "next|node.*server.js" | grep -v grep
```

---

## 🔍 Validação no Navegador

Acesse: https://precivox.com.br/

### 1. Abrir DevTools (F12)

**Console (aba Console):**
- ❌ NÃO deve aparecer erros como:
  - `GET https://precivox.com.br/_next/static/css/3901baec73c46d1e.css net::ERR_ABORTED 400`
  - `page-5283beed764f693f.js:1 Failed to load resource: 400`
  - `Uncaught Error: Minified React error #423`

- ✅ Deve aparecer:
  - Nenhum erro vermelho
  - Build ID: `9uwmB2CNJVl3LoLzjUyd6` ou similar

**Network (aba Network):**
- ✅ Todos os arquivos devem retornar 200 OK
- ❌ Nenhum arquivo deve retornar 400 Bad Request

**Elementos para verificar:**
1. Página inicial carregando
2. Login funcionando
3. Dashboard Admin carregando dados corretamente
4. Sem erros no console

---

## 📊 Testes de Funcionalidade

### 1. Teste de Login

```bash
# Verificar se API de login está funcionando
curl -X POST https://precivox.com.br/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@precivox.com","password":"senha"}' \
  -v
```

### 2. Teste de APIs do Dashboard

```bash
# Executar em um navegador com sessão ativa
# Acessar: https://precivox.com.br/admin/dashboard
# Observar: Dados carregando, sem erros no console
```

### 3. Teste de Arquivos Estáticos

```bash
# CSS
curl -I https://precivox.com.br/_next/static/css/d2b164c32202dc57.css
# Esperado: HTTP/2 200

# JS
curl -I https://precivox.com.br/_next/static/chunks/webpack-6fb2a64e15fc7f97.js
# Esperado: HTTP/2 200
```

---

## 🛡️ Monitoramento

### Logs Importantes:

```bash
# Logs do Next.js
tail -f /var/log/precivox-nextjs.log

# Logs do Nginx
sudo tail -f /var/log/nginx/precivox-access.log
sudo tail -f /var/log/nginx/precivox-error.log

# Verificar processos
ps aux | grep next
```

### Alertas a Monitorar:

1. **Erro 400 em arquivos estáticos** → Rebuild necessário
2. **React Error #423** → Verificar hooks
3. **Erro 500 em APIs** → Verificar banco de dados
4. **Timeout em requisições** → Verificar performance

---

## 🔄 Rollback (Se Necessário)

```bash
cd /root

# Parar processos
pkill -f "next start"

# Restaurar build anterior
# git checkout HEAD~1 .next/ || echo "Sem backup .next"
rm -rf .next

# Restaurar do backup anterior
# sudo cp -r /backup/.next .next

# Rebuild
npm run build

# Restart
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &
```

---

## 📝 Comandos Rápidos

```bash
# Deploy completo
cd /root && ./deploy-production.sh

# Ver status
ps aux | grep next

# Ver logs
tail -50 /var/log/precivox-nextjs.log

# Limpar cache
rm -rf .next && npm run build

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## ✅ Checklist Final

Antes de considerar o deploy concluído:

- [ ] Build executado sem erros
- [ ] Arquivos CSS gerados (`ls .next/static/css/`)
- [ ] Servidor Next.js rodando (`ps aux | grep next`)
- [ ] Nginx recarregado (`sudo nginx -t`)
- [ ] Health check funcionando (`curl https://precivox.com.br/health`)
- [ ] Site acessível (sem erros 400 no console)
- [ ] Login funcionando
- [ ] Dashboard Admin carregando dados
- [ ] Logs sem erros críticos
- [ ] Testado em navegador (Chrome/Firefox)

---

**Última atualização:** 27 de outubro de 2025  
**Status:** ✅ **PRONTO PARA DEPLOY**

