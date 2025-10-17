# ✅ CHECKLIST DE VALIDAÇÃO - PRODUÇÃO PRECIVOX

## 🌐 Site: https://precivox.com.br

---

## ⚠️ IMPORTANTE: DEPLOY DAS CORREÇÕES

As correções foram feitas nos arquivos locais. Para que funcionem em produção, você precisa:

### 1️⃣ **Fazer Deploy das Mudanças**

```bash
# 1. Commitar as mudanças
git add .
git commit -m "fix: corrigir loop de autenticação e melhorar sistema de login"

# 2. Fazer push para produção
git push origin main
# ou
git push production main

# 3. Rebuild em produção (dependendo do seu setup)
# Se estiver usando PM2:
pm2 restart precivox

# Se estiver usando Docker:
docker-compose up -d --build

# Se estiver usando serviço de deploy (Vercel, Railway, etc):
# O deploy é automático após o push
```

---

## 🧪 TESTES EM PRODUÇÃO

### ✅ **Teste 1: Site Está Acessível**
```bash
curl -I https://precivox.com.br
```

**Status Atual:** ✅ **FUNCIONANDO** (HTTP 200)

---

### ✅ **Teste 2: Página de Login**

1. Acesse: https://precivox.com.br/login
2. Verifique se a página carrega
3. Verifique se não há erros no console (F12)

**Resultado Esperado:**
- ✅ Página carrega sem erros
- ✅ Formulário está visível
- ✅ Não há loops de redirecionamento

**Status:** [ ] Testado

---

### ✅ **Teste 3: Login com Credenciais Admin**

1. Acesse: https://precivox.com.br/login
2. Digite:
   - Email: `admin@precivox.com`
   - Senha: `senha123`
3. Clique em "Login"
4. Aguarde processamento

**Resultado Esperado:**
- ✅ Login processa rapidamente (< 2 segundos)
- ✅ Redireciona para `/admin/dashboard`
- ✅ Não há loop ou piscar
- ✅ Dashboard carrega corretamente

**Status:** [ ] Testado

---

### ✅ **Teste 4: Verificar Cookies de Sessão**

1. Após fazer login, abra DevTools (F12)
2. Vá em: Application > Cookies > https://precivox.com.br
3. Procure por: `__Secure-next-auth.session-token`

**Resultado Esperado:**
- ✅ Cookie existe
- ✅ HttpOnly: true
- ✅ Secure: true
- ✅ SameSite: Lax

**Status:** [ ] Testado

---

### ✅ **Teste 5: Persistência de Sessão**

1. Fazer login em https://precivox.com.br
2. Fechar navegador completamente
3. Reabrir navegador
4. Acessar https://precivox.com.br

**Resultado Esperado:**
- ✅ Ainda está logado
- ✅ Redireciona para dashboard correto
- ✅ Não pede login novamente

**Status:** [ ] Testado

---

### ✅ **Teste 6: Proteção de Rotas**

**Teste 6.1: Tentar acessar área protegida sem login**
1. Abrir navegador em modo anônimo
2. Tentar acessar: https://precivox.com.br/admin/dashboard

**Resultado Esperado:**
- ✅ Bloqueia acesso
- ✅ Redireciona para `/login`

**Status:** [ ] Testado

---

**Teste 6.2: Cliente tentando acessar área admin**
1. Fazer login como CLIENTE
2. Tentar acessar: https://precivox.com.br/admin/dashboard

**Resultado Esperado:**
- ✅ Bloqueia acesso
- ✅ Redireciona para `/cliente/home`

**Status:** [ ] Testado

---

### ✅ **Teste 7: Verificar Variáveis de Ambiente em Produção**

**Verifique se estas variáveis estão configuradas no servidor:**

```env
NEXTAUTH_URL=https://precivox.com.br
NEXTAUTH_SECRET=<sua_chave_secreta>
DATABASE_URL=<url_do_banco_producao>
```

**Como verificar (no servidor):**
```bash
# SSH no servidor
ssh usuario@seu-servidor

# Verificar variáveis (cuidado com logs!)
echo $NEXTAUTH_URL
# Deve mostrar: https://precivox.com.br

# Se usar PM2
pm2 env 0 | grep NEXTAUTH
```

**Status:** [ ] Verificado

---

### ✅ **Teste 8: Verificar Logs do Servidor**

```bash
# No servidor, verificar logs
pm2 logs precivox --lines 50

# Ou
tail -f /var/log/nginx/error.log
tail -f /var/log/precivox/error.log
```

**Procurar por:**
- ❌ Erros de sessão
- ❌ Erros de middleware
- ❌ Loops de redirecionamento
- ✅ Logins bem-sucedidos

**Status:** [ ] Verificado

---

### ✅ **Teste 9: Verificar API de Sessão**

```bash
# Com cookie de sessão válido
curl -H "Cookie: __Secure-next-auth.session-token=SEU_TOKEN" \
  https://precivox.com.br/api/auth/session
```

**Resultado Esperado:**
```json
{
  "user": {
    "id": "user-xxx",
    "email": "admin@precivox.com",
    "name": "Admin",
    "role": "ADMIN",
    "image": null
  },
  "expires": "2025-10-24T..."
}
```

**Status:** [ ] Testado

---

### ✅ **Teste 10: Performance**

1. Abrir DevTools (F12) > Network
2. Fazer login
3. Verificar tempo do request `/api/auth/callback/credentials`

**Resultado Esperado:**
- ✅ Request completa em < 2 segundos
- ✅ Status code: 200
- ✅ Redirecionamento em < 500ms

**Status:** [ ] Testado

---

## 🚨 SE ALGO NÃO FUNCIONAR

### Problema: "Ainda está em loop"

**Possível causa:** Deploy não foi feito ou cache não foi limpo

**Solução:**
```bash
# No servidor
pm2 restart precivox
pm2 flush  # Limpar logs

# Limpar cache do Next.js
cd /caminho/do/projeto
rm -rf .next
pm2 restart precivox
```

---

### Problema: "Erro 500 ao fazer login"

**Possível causa:** Variáveis de ambiente incorretas

**Solução:**
```bash
# Verificar .env em produção
cat .env | grep NEXTAUTH

# Se necessário, atualizar:
nano .env
# Adicionar/corrigir:
NEXTAUTH_URL=https://precivox.com.br
NEXTAUTH_SECRET=sua_chave_aqui

# Reiniciar
pm2 restart precivox
```

---

### Problema: "Cookie não persiste"

**Possível causa:** Configuração de cookies incorreta

**Solução:**
Verificar se `lib/auth.ts` tem:
```typescript
useSecureCookies: process.env.NODE_ENV === 'production',
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true,
    },
  },
},
```

---

## 📋 CHECKLIST DE DEPLOY

Antes de considerar pronto, marque todos:

- [ ] Mudanças commitadas no Git
- [ ] Push para produção feito
- [ ] Build executado (se necessário)
- [ ] Servidor reiniciado
- [ ] Variáveis de ambiente verificadas
- [ ] Site acessível (https://precivox.com.br)
- [ ] Página de login carrega
- [ ] Login funciona sem loops
- [ ] Redirecionamento correto
- [ ] Cookies sendo criados
- [ ] Sessão persiste
- [ ] Proteção de rotas funcionando
- [ ] Sem erros nos logs
- [ ] Performance adequada (< 2s)
- [ ] Testado em produção

---

## 🎯 COMANDOS RÁPIDOS PARA DEPLOY

### Se usar PM2:
```bash
# No servidor
cd /caminho/do/projeto
git pull origin main
npm install
npm run build
pm2 restart precivox
pm2 save
```

### Se usar Docker:
```bash
# No servidor
cd /caminho/do/projeto
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Se usar Vercel/Railway/Render:
```bash
# Local
git push origin main
# Deploy automático
```

---

## ✅ STATUS ATUAL

**Site:** https://precivox.com.br
**Status HTTP:** ✅ 200 OK
**Servidor:** nginx/1.18.0 (Ubuntu)
**Next.js:** ✅ Ativo
**Cache:** ✅ Funcionando

**Correções Locais:** ✅ Aplicadas
**Deploy em Produção:** ⚠️ **PRECISA VERIFICAR**

---

## 📞 PRÓXIMOS PASSOS

1. **Fazer deploy das correções**
   ```bash
   git add .
   git commit -m "fix: corrigir sistema de login"
   git push origin main
   ```

2. **Reiniciar servidor**
   ```bash
   pm2 restart precivox
   ```

3. **Testar em produção**
   - Acesse: https://precivox.com.br/login
   - Faça login
   - Verifique se não há loops

4. **Marcar checklist acima**

---

**Data:** 17 de Outubro de 2025  
**Versão:** 1.0.0  
**Status:** ⚠️ AGUARDANDO DEPLOY

