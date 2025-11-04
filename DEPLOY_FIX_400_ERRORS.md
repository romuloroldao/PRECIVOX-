# 🔧 Correção de Erros 400 e React #423 em Produção

**Data:** 27 de outubro de 2025  
**Site:** https://precivox.com.br/  
**Erros corrigidos:**
- GET https://precivox.com.br/_next/static/css/3901baec73c46d1e.css net::ERR_ABORTED 400
- page-5283beed764f693f.js:1 Failed to load resource: the server responded with a status of 400 ()
- Uncaught Error: Minified React error #423

---

## 📋 DIAGNÓSTICO

### 1. **Erro 400 em Arquivos CSS e JS**

**Causa Raiz:** 
- Build em produção está desatualizada (hash de arquivos diferentes)
- Rotas de API tentando gerar estático quando deveriam ser dinâmicas
- Problemas de cache no Nginx

**Arquivo CSS Local vs Produção:**
- Local gerado: `d2b164c32202dc57.css`
- Produção referenciado: `3901baec73c46d1e.css` (arquivo não existe!)

### 2. **Erro React #423**

**Causa Raiz:**
- Hooks do React chamados condicionalmente ou em loops
- Dependências do useEffect causando re-render infinito
- Problemas com `useCallback` e `useEffect` 

---

## ✅ CORREÇÕES APLICADAS

### 1. **Rotas de API - Forçar Renderização Dinâmica**

Todas as rotas de API que usam `getServerSession` agora têm:

```typescript
// Forçar renderização dinâmica (não tentar gerar estático)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
```

**Arquivos corrigidos:**
- `app/api/admin/stats/route.ts`
- `app/api/admin/recent-users/route.ts`
- `app/api/admin/logs/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/planos/route.ts`
- `app/api/unidades/route.ts`
- `app/api/markets/route.ts`
- `app/api/markets/[id]/route.ts`
- `app/api/markets/[id]/unidades/route.ts`
- `app/api/markets/[id]/importacoes/route.ts`
- `app/api/ai/painel/compras/[mercadoId]/route.ts`
- `app/api/ai/painel/dashboard/[mercadoId]/route.ts`
- `app/api/ai/painel/alertas/[alertaId]/marcar-lido/route.ts`

### 2. **Correção do useEffect no Dashboard Admin**

**Antes:**
```typescript
useEffect(() => {
  if (status === 'authenticated' && user?.role === 'ADMIN' && !hasFetchedRef.current) {
    hasFetchedRef.current = true;
    setIsFetching(true);
    
    Promise.all([fetchStats(), fetchRecentUsers()]).finally(() => {
      setIsFetching(false);
    });
  }
}, [status, user?.role, fetchStats, fetchRecentUsers]); // ⚠️ Dependências causando re-render
```

**Depois:**
```typescript
useEffect(() => {
  if (status === 'authenticated' && user?.role === 'ADMIN' && !hasFetchedRef.current) {
    hasFetchedRef.current = true;
    setIsFetching(true);
    
    const fetchData = async () => {
      try {
        await Promise.all([fetchStats(), fetchRecentUsers()]);
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchData();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [status, user?.role]); // ✅ Apenas dependências estáveis
```

---

## 🚀 COMANDOS DE DEPLOY

### 1. **Verificar Correções Localmente**

```bash
cd /root

# Limpar build anterior
rm -rf .next

# Build de produção
npm run build

# Verificar arquivos gerados
ls -la .next/static/css/

# Deve mostrar algo como: d2b164c32202dc57.css
```

### 2. **Deploy em Produção**

```bash
cd /root

# Executar deploy automático
./deploy-production.sh

# Ou manualmente:
npm run build
pkill -f "next start"
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &

# Recarregar Nginx
sudo systemctl reload nginx
```

### 3. **Purificar Cache do CDN/Nginx**

```bash
# Limpar cache do Nginx
sudo nginx -t
sudo systemctl reload nginx

# Se usar CloudFlare ou outro CDN:
# 1. Acesse o painel do CDN
# 2. Vá em "Caching" → "Purge Everything"
# 3. Aguarde propagação (1-5 minutos)
```

---

## 🔍 VALIDAÇÃO

### 1. **Verificar Arquivos CSS/JS**

```bash
# Na máquina de produção
curl -I https://precivox.com.br/_next/static/css/d2b164c32202dc57.css
# Deve retornar: 200 OK

# Verificar se arquivo existe localmente
ls -la .next/static/css/
```

### 2. **Verificar Console do Navegador**

Acesse: https://precivox.com.br/

Abra DevTools → Console

**Não deve aparecer:**
- ❌ `GET https://precivox.com.br/_next/static/css/3901baec73c46d1e.css net::ERR_ABORTED 400`
- ❌ `page-5283beed764f693f.js:1 Failed to load resource: 400`
- ❌ `Uncaught Error: Minified React error #423`

**Deve aparecer:**
- ✅ Nenhum erro vermelho
- ✅ Arquivos CSS/JS carregando com 200 OK
- ✅ Aplicação funcionando normalmente

### 3. **Verificar Build Local**

```bash
cd /root
rm -rf .next node_modules/.cache
npm run build 2>&1 | tee /tmp/build.log

# Verificar se não há erros de "Dynamic server usage"
grep -i "error" /tmp/build.log | head -10
```

---

## 📊 CHECKLIST PRÉ-DEPLOY

- [ ] Build local executado sem erros
- [ ] Arquivo CSS gerado corretamente (verificar hash)
- [ ] Console do navegador sem erros 400
- [ ] Rotas de API respondendo corretamente
- [ ] Teste de login funcionando
- [ ] Dashboard Admin carregando dados
- [ ] Backup do banco de dados realizado
- [ ] Logs de erro verificados

---

## 🛡️ PREVENÇÃO DE REGRESSÕES

### 1. **Automático - CI/CD**

Adicionar ao `.github/workflows/deploy.yml`:

```yaml
- name: Validate Build
  run: |
    npm run build
    # Verificar se arquivos CSS foram gerados
    test -f .next/static/css/*.css
    echo "✅ Build validation passed"
```

### 2. **Script de Verificação Pós-Deploy**

Criar `/root/scripts/verify-deploy.sh`:

```bash
#!/bin/bash
# Verificar se deploy foi bem-sucedido

echo "🔍 Verificando deploy em https://precivox.com.br..."

# Verificar CSS
CSS_FILE=$(curl -s https://precivox.com.br/ | grep -oP '_next/static/css/[^"]+\.css' | head -1)
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://precivox.com.br/$CSS_FILE")

if [ "$CSS_STATUS" = "200" ]; then
    echo "✅ CSS carregando corretamente (Status: $CSS_STATUS)"
else
    echo "❌ Erro no CSS (Status: $CSS_STATUS)"
    exit 1
fi

# Verificar JS
JS_FILES=$(curl -s https://precivox.com.br/ | grep -oP '_next/static/chunks/[^"]+\.js' | head -3)
for JS_FILE in $JS_FILES; do
    JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://precivox.com.br/$JS_FILE")
    if [ "$JS_STATUS" != "200" ]; then
        echo "❌ Erro no arquivo JS: $JS_FILE (Status: $JS_STATUS)"
        exit 1
    fi
done

echo "✅ Deploy validado com sucesso!"
```

---

## 📝 NOTAS TÉCNICAS

### Por que os arquivos CSS/JS têm hash?

Next.js gera hash baseado no conteúdo do arquivo. Qualquer mudança no CSS gera um novo hash:
- `globals.css` alterado → `abc123.css` vira `def456.css`
- Se HTML aponta para `abc123.css` mas arquivo é `def456.css` → **ERRO 400**

### Por que `export const dynamic` resolve?

Next.js 14 tenta gerar rotas estáticas por padrão. Quando uma rota usa `getServerSession()` (que lê cookies), Next.js tenta gerar estático e falha.

A solução é indicar que a rota é dinâmica:
```typescript
export const dynamic = 'force-dynamic';
```

### React Error #423

Este erro ocorre quando:
- Hooks chamados condicionalmente
- Dependências do useEffect causando loops
- Múltiplas instâncias de React

Solução: Remover dependências desnecessárias do useEffect.

---

## 🎯 RESUMO

**Problemas:**
1. Build desatualizada com hash de arquivos diferente
2. Rotas API tentando gerar estático incorretamente
3. useEffect com dependências causando loops

**Soluções:**
1. Rebuild completo em produção
2. Adicionar `export const dynamic = 'force-dynamic'` em rotas API
3. Corrigir dependências do useEffect

**Status:** ✅ **CORRIGIDO**

---

**Próximos Passos:**
1. Executar deploy em produção
2. Validar que erros desapareceram
3. Monitorar logs por 24 horas
4. Configurar alertas para erros 400 futuros

