# 🚀 GUIA RÁPIDO - SISTEMA DE LOGIN CORRIGIDO

## ⚡ INÍCIO RÁPIDO

### 1. Iniciar o Sistema
```bash
npm run dev
```

### 2. Acessar o Login
```
http://localhost:3000
```
→ Será redirecionado automaticamente para `/login`

### 3. Fazer Login
**Credenciais Admin:**
- Email: `admin@precivox.com`
- Senha: `senha123`

**Credenciais Gestor (se existir):**
- Email: `gestor@precivox.com`
- Senha: `senha123`

**Credenciais Cliente (se existir):**
- Email: `cliente@precivox.com`
- Senha: `senha123`

---

## 🎯 REDIRECIONAMENTOS AUTOMÁTICOS

Após login, você será redirecionado automaticamente para:

| Role | Dashboard |
|------|-----------|
| 👑 ADMIN | `/admin/dashboard` |
| 👔 GESTOR | `/gestor/home` |
| 👤 CLIENTE | `/cliente/home` |

---

## 🔒 PROTEÇÃO DE ROTAS

### Como funciona:
1. **Middleware** verifica autenticação em todas as rotas protegidas
2. **RouteGuard** adiciona camada extra de proteção client-side
3. **Layouts** garantem que apenas roles corretos acessam cada área

### Tentativa de acesso não autorizado:
- ❌ Cliente tenta acessar `/admin/dashboard` → Redirecionado para `/cliente/home`
- ❌ Gestor tenta acessar `/admin/dashboard` → Redirecionado para `/gestor/home`
- ✅ Admin acessa qualquer área → Permitido

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ "Ainda está em loop"
```bash
# Limpar cookies e reiniciar
1. Abrir DevTools (F12)
2. Application → Cookies → Deletar todos
3. Ctrl+C no terminal
4. npm run dev
5. Tentar login novamente
```

### ❌ "Erro de sessão"
```bash
# Verificar variável de ambiente
echo $NEXTAUTH_SECRET

# Se vazio, adicionar no .env:
NEXTAUTH_SECRET=sua_chave_secreta_aqui_muito_segura_32_caracteres
```

### ❌ "Não redireciona após login"
```bash
# Limpar cache do Next.js
rm -rf .next
npm run dev
```

---

## 📝 CRIAR NOVO USUÁRIO

### Via Prisma Studio:
```bash
npm run prisma:studio
```

### Via Script Node.js:
```javascript
// criar-usuario.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function criarUsuario() {
  const senhaHash = await bcrypt.hash('senha123', 10);
  
  await prisma.usuarios.create({
    data: {
      id: `user-${Date.now()}`,
      email: 'novo@usuario.com',
      nome: 'Novo Usuário',
      senha_hash: senhaHash,
      role: 'CLIENTE', // ou 'GESTOR' ou 'ADMIN'
      data_atualizacao: new Date(),
    },
  });
  
  console.log('✅ Usuário criado com sucesso!');
  await prisma.$disconnect();
}

criarUsuario();
```

```bash
node criar-usuario.js
```

---

## 🔐 LOGIN SOCIAL (OPCIONAL)

### Para ativar Google/Facebook/LinkedIn:

1. **Configurar variáveis de ambiente** (`.env`):
```env
GOOGLE_CLIENT_ID=seu_id_aqui
GOOGLE_CLIENT_SECRET=seu_secret_aqui

FACEBOOK_CLIENT_ID=seu_id_aqui
FACEBOOK_CLIENT_SECRET=seu_secret_aqui

LINKEDIN_CLIENT_ID=seu_id_aqui
LINKEDIN_CLIENT_SECRET=seu_secret_aqui
```

2. **Configurar OAuth nos respectivos consoles:**
- Google: https://console.cloud.google.com/
- Facebook: https://developers.facebook.com/
- LinkedIn: https://www.linkedin.com/developers/

3. **Adicionar Redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/linkedin
```

---

## 🧪 TESTAR FLUXO COMPLETO

### Teste 1: Login e Logout
```bash
1. Acessar http://localhost:3000
2. Fazer login com admin@precivox.com
3. Verificar redirecionamento para /admin/dashboard
4. Abrir DevTools → Console
5. Executar: signOut()
6. Verificar redirecionamento para /login
```

### Teste 2: Proteção de Rotas
```bash
1. Fazer login como CLIENTE
2. Abrir nova aba
3. Tentar acessar http://localhost:3000/admin/dashboard
4. Deve redirecionar para /cliente/home
```

### Teste 3: Persistência
```bash
1. Fazer login
2. Fechar navegador completamente
3. Reabrir navegador
4. Acessar http://localhost:3000
5. Deve estar logado (não pede login novamente)
```

---

## 📊 VERIFICAR LOGS

### No Terminal:
```bash
npm run dev

# Procurar por:
# ✅ "Usuário autenticado: email@exemplo.com"
# ✅ "Role: ADMIN"
# ✅ "Redirecionando para: /admin/dashboard"
```

### No Navegador (DevTools):
```bash
1. Abrir DevTools (F12)
2. Ir na aba "Network"
3. Fazer login
4. Verificar requests:
   - POST /api/auth/callback/credentials (200 OK)
   - GET /api/auth/session (200 OK)
```

---

## 🎓 CONCEITOS-CHAVE

### JWT (Token)
- Armazenado em cookie seguro
- Validade: 7 dias
- Renovação automática: a cada 24h

### Sessão
- Baseada em JWT
- Não requer consulta ao banco
- Sincronizada com token

### Middleware
- Roda antes de cada request
- Verifica autenticação
- Redireciona se necessário

### RouteGuard
- Componente React
- Proteção client-side
- Evita flash de conteúdo

---

## ✅ CHECKLIST DE FUNCIONAMENTO

Marque cada item após testar:

- [ ] Login com email e senha funciona
- [ ] Redirecionamento automático correto
- [ ] Proteção de rotas funcionando
- [ ] Não há loop de autenticação
- [ ] Não há tela piscando
- [ ] Persistência por 7 dias
- [ ] Logout funciona corretamente
- [ ] Mensagens de erro aparecem
- [ ] Loading state funciona

---

## 🆘 COMANDOS ÚTEIS

```bash
# Resetar banco de dados
npm run prisma:migrate reset

# Ver banco de dados
npm run prisma:studio

# Gerar Prisma Client
npm run prisma:generate

# Limpar cache do Next.js
rm -rf .next

# Verificar dependências
npm list next-auth @prisma/client

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 SUPORTE RÁPIDO

**Problema:** Loop infinito  
**Solução:** Limpar cookies + reiniciar servidor

**Problema:** Erro de sessão  
**Solução:** Verificar NEXTAUTH_SECRET no .env

**Problema:** 401 Unauthorized  
**Solução:** Verificar senha e email do usuário no banco

**Problema:** Não redireciona  
**Solução:** Verificar role do usuário no banco

---

**Status:** ✅ FUNCIONANDO  
**Versão:** 1.0.0  
**Data:** $(date)

