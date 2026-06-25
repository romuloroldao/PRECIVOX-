# ⚡ PRECIVOX - Quick Start Guide

Guia rápido para colocar o sistema no ar em **5 minutos**.

## 🚀 Instalação Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp env.example.txt .env

# 3. Editar .env (IMPORTANTE!)
# Mínimo necessário:
# - DATABASE_URL="postgresql://user:pass@localhost:5432/precivox"
# - JWT_SECRET="sua-chave-secreta-min-32-caracteres"
# - NEXT_PUBLIC_URL="http://localhost:3000"

# 4. Setup completo (migrations + seed)
npm run setup

# 5. Iniciar servidor
npm run dev
```

Acesse: **http://localhost:3000**

## 👤 Usuários de Teste (criados automaticamente)

| E-mail | Senha | Role |
|--------|-------|------|
| `admin@precivox.com` | `Admin123!` | ADMIN |
| `gestor@precivox.com` | `Gestor123!` | GESTOR |
| `cliente@precivox.com` | `Cliente123!` | CLIENTE |

## 📋 Pré-requisitos

Antes de começar, você precisa ter:

```bash
# Node.js 18+
node --version  # v18.x.x ou superior

# PostgreSQL 14+
psql --version  # 14.x ou superior
```

Se não tiver:
- Node.js: [Baixar aqui](https://nodejs.org)
- PostgreSQL: [Baixar aqui](https://www.postgresql.org/download/)

## 🗄️ Configurar PostgreSQL

```bash
# Entrar no PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE precivox;

# Sair
\q
```

## ⚙️ Variáveis de Ambiente Mínimas

Edite o arquivo `.env`:

```env
# Banco de Dados
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/precivox"

# JWT (MUDE ESTA CHAVE!)
JWT_SECRET="minha-chave-super-secreta-precivox-2024"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_URL="http://localhost:3000"

# Login Social (opcional, deixe false no início)
ALLOW_SOCIAL_LOGIN=false
```

## 🎯 Testar o Sistema

### 1. Acessar Login
```
http://localhost:3000
```

### 2. Fazer Login como Admin
- E-mail: `admin@precivox.com`
- Senha: `Admin123!`
- Você será redirecionado para: `/admin/dashboard`

### 3. Testar Cadastro
- Clique em "Cadastre-se gratuitamente"
- Preencha:
  - Nome: Seu Nome
  - E-mail: seu@email.com
  - Senha: SuaSenha123!
- Novo usuário será criado como CLIENTE
- Redirecionado para: `/cliente/home`

### 4. Testar Diferentes Roles
Faça logout e teste com:
- **Gestor:** `gestor@precivox.com` / `Gestor123!`
- **Cliente:** `cliente@precivox.com` / `Cliente123!`

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev (porta 3000)

# Banco de Dados
npm run prisma:studio    # Interface visual do banco
npm run prisma:seed      # Popular banco com usuários de teste
npm run prisma:migrate   # Criar/aplicar migrations

# Build
npm run build            # Build para produção
npm run start            # Iniciar produção

# Linting
npm run lint             # Verificar código
```

## 🐛 Problemas Comuns

### ❌ Erro: "Cannot connect to database"

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status

# Iniciar PostgreSQL
sudo service postgresql start
```

### ❌ Erro: "Prisma Client not generated"

**Solução:**
```bash
npm run prisma:generate
```

### ❌ Erro: "JWT_SECRET is not defined"

**Solução:**
- Certifique-se de que o arquivo `.env` existe
- Verifique se todas as variáveis estão definidas
- Reinicie o servidor após editar `.env`

### ❌ Porta 3000 já em uso

**Solução:**
```bash
# Usar outra porta
PORT=3001 npm run dev
```

## 📁 Estrutura Básica

```
precivox/
├── app/
│   ├── api/auth/           # Rotas de autenticação
│   ├── login/              # Página de login
│   ├── cliente/home/       # Dashboard cliente
│   ├── gestor/home/        # Dashboard gestor
│   └── admin/dashboard/    # Dashboard admin
├── components/             # Componentes React
├── lib/                    # Utilitários (JWT, validações, etc)
├── prisma/                 # Schema e migrations
├── .env                    # Variáveis de ambiente
└── package.json            # Dependências
```

## 🎨 Personalização Rápida

### Cores do Sistema

Edite `tailwind.config.ts`:

```typescript
colors: {
  precivox: {
    blue: "#0066CC",   // Azul principal
    green: "#00CC66",  // Verde destaque
    dark: "#1A1A2E",   // Texto escuro
    light: "#F5F7FA",  // Fundo claro
  },
}
```

### Textos de Conversão

Edite `components/LoginForm.tsx`:

```typescript
<p className="text-gray-600">
  Acesse insights e preços inteligentes em segundos
</p>
```

## 🚀 Próximos Passos

1. ✅ **Login funcionando** - Sistema básico pronto
2. 🔧 **Configurar login social** - Adicionar Google, Facebook, etc
3. 🎨 **Personalizar dashboards** - Adicionar funcionalidades específicas
4. 📊 **Implementar features** - Comparação de preços, alertas, etc
5. 🚀 **Deploy** - Colocar em produção

## 📚 Documentação Completa

- **README.md** - Documentação geral
- **INSTALACAO.md** - Guia de instalação detalhado
- **ARQUITETURA.md** - Explicação da arquitetura

## 🆘 Precisa de Ajuda?

### Verificar Logs
```bash
# Logs do servidor aparecem no terminal onde rodou npm run dev
npm run dev
```

### Inspecionar Banco de Dados
```bash
# Abrir Prisma Studio
npm run prisma:studio

# Acesse http://localhost:5555
```

### Reset Completo
```bash
# Limpar e recriar banco
npm run prisma:migrate reset

# Popular novamente
npm run prisma:seed
```

## ✅ Checklist de Validação

Antes de considerar que está tudo funcionando:

- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados criado
- [ ] Migrations aplicadas (`npm run prisma:migrate`)
- [ ] Seed executado (`npm run prisma:seed`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Login com admin funciona
- [ ] Login com gestor funciona
- [ ] Login com cliente funciona
- [ ] Cadastro de novo usuário funciona
- [ ] Redirecionamento por role funciona

## 🎉 Pronto!

Se tudo funcionou, você tem:

- ✅ Sistema de autenticação completo
- ✅ Login tradicional (e-mail + senha)
- ✅ Suporte a login social (configurável)
- ✅ 3 tipos de usuários (Cliente, Gestor, Admin)
- ✅ Dashboards individuais
- ✅ Proteção de rotas
- ✅ JWT seguro
- ✅ Interface moderna

**Agora é só desenvolver as funcionalidades específicas do PRECIVOX!** 🚀

---

💡 **Dica:** Mantenha os usuários de teste para desenvolvimento. Em produção, remova-os ou mude as senhas.

