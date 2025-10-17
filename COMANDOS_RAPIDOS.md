# ⚡ COMANDOS RÁPIDOS - PRECIVOX LOGIN

## 🚀 INICIAR SISTEMA

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# O servidor estará disponível em:
# http://localhost:3000
```

---

## 🔐 LOGIN PADRÃO

```
Email: admin@precivox.com
Senha: senha123
```

---

## 📦 GERENCIAR BANCO DE DADOS

```bash
# Abrir Prisma Studio (interface visual)
npm run prisma:studio

# Gerar Prisma Client após mudanças no schema
npm run prisma:generate

# Criar nova migração
npm run prisma:migrate

# Resetar banco de dados (⚠️ APAGA TUDO)
npm run prisma:migrate reset
```

---

## 🧹 LIMPAR CACHE

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar tudo e recomeçar
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

---

## 🐛 RESOLVER PROBLEMAS

### Loop infinito:
```bash
# 1. Limpar cookies do navegador
# DevTools (F12) > Application > Cookies > Delete All

# 2. Limpar cache e reiniciar
rm -rf .next
npm run dev
```

### Erro de sessão:
```bash
# Verificar variável de ambiente
cat .env | grep NEXTAUTH_SECRET

# Se vazio, adicionar:
echo 'NEXTAUTH_SECRET="sua_chave_super_secreta_aqui"' >> .env
```

### Banco de dados travado:
```bash
# Resetar conexões
npm run prisma:migrate reset

# Recriar banco
npm run prisma:migrate
```

---

## 👤 CRIAR NOVO USUÁRIO

### Via Prisma Studio:
```bash
npm run prisma:studio
# Ir em "usuarios" > "Add record" > Preencher campos
```

### Via Node.js:
```javascript
// criar-usuario.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash('senha123', 12);
  
  await prisma.usuarios.create({
    data: {
      id: `user-${Date.now()}`,
      email: 'novo@usuario.com',
      nome: 'Novo Usuário',
      senha_hash: senha,
      role: 'CLIENTE',
      data_atualizacao: new Date(),
    },
  });
  
  console.log('✅ Usuário criado!');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(console.error);
```

```bash
node criar-usuario.js
```

---

## 🧪 TESTAR SISTEMA

```bash
# 1. Abrir navegador
open http://localhost:3000

# 2. Abrir DevTools
# Pressionar F12

# 3. Fazer login e verificar:
# - Console (não deve ter erros)
# - Network (requests 200 OK)
# - Application > Cookies (deve ter session token)
```

---

## 📊 VERIFICAR STATUS

```bash
# Ver logs do servidor
# Terminal onde rodou npm run dev

# Ver sessão atual
curl http://localhost:3000/api/auth/session

# Ver providers configurados
curl http://localhost:3000/api/auth/providers
```

---

## 🔍 DEBUG

```bash
# Ver logs detalhados
NODE_ENV=development npm run dev

# Ver SQL queries do Prisma
DATABASE_URL="postgresql://...?connection_limit=1&pool_timeout=20" npm run dev
```

---

## 🚀 BUILD PARA PRODUÇÃO

```bash
# Build do projeto
npm run build

# Iniciar em produção
npm start

# Verificar se build funcionou
ls -la .next
```

---

## 🔒 VARIÁVEIS DE AMBIENTE

```bash
# Verificar todas as variáveis
cat .env

# Adicionar nova variável
echo 'NOVA_VAR="valor"' >> .env

# Editar .env
nano .env
# ou
vim .env
```

---

## 📝 VARIÁVEIS OBRIGATÓRIAS

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/precivox"
NEXTAUTH_SECRET="sua_chave_muito_secreta_32_caracteres_minimo"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🎯 WORKFLOW DIÁRIO

```bash
# 1. Iniciar servidor
npm run dev

# 2. Se houver mudanças no schema do Prisma
npm run prisma:generate

# 3. Se der erro de cache
rm -rf .next
npm run dev

# 4. Ver banco de dados
npm run prisma:studio

# 5. Parar servidor
# Ctrl+C no terminal
```

---

## 🆘 COMANDOS DE EMERGÊNCIA

```bash
# Sistema travou completamente
pkill -f "node"
rm -rf .next node_modules package-lock.json
npm install
npm run prisma:generate
npm run dev

# Banco corrompido
npm run prisma:migrate reset
# ⚠️ ISSO APAGA TODOS OS DADOS!

# Resetar tudo do zero
git clean -fdx
npm install
npm run prisma:migrate
npm run dev
```

---

## 📚 DOCUMENTAÇÃO RÁPIDA

```bash
# Ver README principal
cat README_SISTEMA_LOGIN.md

# Ver guia rápido
cat GUIA_RAPIDO_LOGIN.md

# Ver resumo da correção
cat RESUMO_CORRECAO_LOGIN.md

# Ver testes
cat TESTES_LOGIN.md
```

---

## ✅ CHECKLIST RÁPIDO

Antes de começar a trabalhar:
- [ ] `npm run dev` funcionando
- [ ] Banco de dados conectado
- [ ] `http://localhost:3000` acessível
- [ ] Login funcionando

Se algo não funciona:
- [ ] Limpar cache: `rm -rf .next`
- [ ] Reinstalar: `npm install`
- [ ] Verificar `.env`
- [ ] Verificar porta 3000 livre: `lsof -i :3000`

---

## 🎓 ATALHOS ÚTEIS

```bash
# Alias úteis (adicionar no ~/.bashrc ou ~/.zshrc)
alias dev="npm run dev"
alias studio="npm run prisma:studio"
alias clean="rm -rf .next"
alias reset="rm -rf .next node_modules && npm install"
```

---

**Status:** ✅ PRONTO  
**Versão:** 1.0.0  
**Data:** Outubro 2025

