# 📦 Guia de Instalação - PRECIVOX

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **npm** ou **yarn** (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))

## Verificando as instalações

```bash
node --version   # deve mostrar v18.0.0 ou superior
npm --version    # deve mostrar 9.0.0 ou superior
psql --version   # deve mostrar PostgreSQL 14 ou superior
```

---

## Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/precivox.git
cd precivox
```

---

## Passo 2: Instale as Dependências

```bash
npm install
```

Isso instalará todas as dependências necessárias:
- Next.js, React, TypeScript
- Express, Prisma, JWT
- Multer, PapaParse, XLSX
- Tailwind CSS

---

## Passo 3: Configure o PostgreSQL

### 3.1 Inicie o PostgreSQL

**Linux/Mac:**
```bash
sudo service postgresql start
# ou
brew services start postgresql
```

**Windows:**
- Inicie o serviço PostgreSQL pelo painel de serviços

### 3.2 Crie o Banco de Dados

```bash
# Acesse o PostgreSQL
sudo -u postgres psql

# Ou simplesmente
psql -U postgres
```

No console do PostgreSQL:

```sql
-- Crie o banco de dados
CREATE DATABASE precivox;

-- Crie um usuário (opcional, mas recomendado)
CREATE USER precivox_user WITH PASSWORD 'sua_senha_segura';

-- Conceda permissões
GRANT ALL PRIVILEGES ON DATABASE precivox TO precivox_user;

-- Saia do console
\q
```

---

## Passo 4: Configure as Variáveis de Ambiente

### 4.1 Copie o arquivo de exemplo

```bash
cp .env.example .env
```

### 4.2 Edite o arquivo `.env`

Abra o arquivo `.env` e configure:

```env
# Banco de Dados
DATABASE_URL="postgresql://precivox_user:sua_senha_segura@localhost:5432/precivox?schema=public"

# JWT Secret (use um valor aleatório e seguro!)
JWT_SECRET="gere-uma-chave-secreta-muito-segura-aqui-com-pelo-menos-32-caracteres"

# Porta do servidor Express
PORT=3001

# Ambiente
NODE_ENV=development

# URL da API para o Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4.3 Gere uma chave JWT segura

**Opção 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opção 2: OpenSSL**
```bash
openssl rand -hex 32
```

**Opção 3: Site**
Visite: https://generate-secret.now.sh/32

---

## Passo 5: Configure o Prisma

### 5.1 Gere o Prisma Client

```bash
npm run prisma:generate
```

### 5.2 Execute as Migrations

```bash
npm run prisma:migrate
```

Isso criará todas as tabelas no banco de dados:
- users
- mercados
- unidades
- produtos
- estoques
- planos_de_pagamento
- logs_importacao

### 5.3 (Opcional) Popule o banco com dados de exemplo

```bash
npm run prisma:seed
```

Isso criará:
- 4 usuários (admin, 2 gestores, 1 cliente)
- 3 planos de pagamento
- 2 mercados
- 3 unidades
- 8 produtos
- Estoques associados

**Credenciais de acesso:**
```
Admin:   admin@precivox.com / senha123
Gestor1: gestor1@mercado.com / senha123
Gestor2: gestor2@mercado.com / senha123
Cliente: cliente@email.com / senha123
```

---

## Passo 6: Crie o Diretório de Uploads

```bash
mkdir -p uploads
```

---

## Passo 7: Inicie o Servidor de Desenvolvimento

### Opção 1: Tudo de uma vez (Recomendado)

```bash
npm run dev
```

Isso iniciará:
- **Next.js** em `http://localhost:3000`
- **Express API** em `http://localhost:3001`

### Opção 2: Separadamente

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:next
```

---

## Passo 8: Acesse a Aplicação

### Frontend (Next.js)
```
http://localhost:3000
```

### Páginas disponíveis:
- `/admin/mercados` - Gestão de mercados (Admin)
- `/admin/mercados/[id]` - Detalhes do mercado (Admin)
- `/gestor/mercado` - Dashboard do gestor (Gestor)

### API (Express)
```
http://localhost:3001/api
```

### Endpoints disponíveis:
- `GET /api/mercados` - Listar mercados
- `POST /api/mercados` - Criar mercado
- `GET /api/planos` - Listar planos
- E muitos outros...

### Prisma Studio (Visualizar banco de dados)
```bash
npm run prisma:studio
```

Acesse: `http://localhost:5555`

---

## Verificação da Instalação

### 1. Teste a API

```bash
# Teste de saúde
curl http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 2. Teste o Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@precivox.com",
    "password": "senha123"
  }'
```

Deve retornar um token JWT.

### 3. Acesse o Frontend

Abra o navegador e acesse:
```
http://localhost:3000/admin/mercados
```

---

## Problemas Comuns

### Erro: "Port 3000 is already in use"

**Solução:**
```bash
# Encontre o processo usando a porta
lsof -i :3000

# Mate o processo
kill -9 [PID]

# Ou use outra porta
PORT=3005 npm run dev:next
```

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se o PostgreSQL está rodando:
   ```bash
   sudo service postgresql status
   ```

2. Verifique as credenciais no `.env`

3. Teste a conexão:
   ```bash
   psql -U precivox_user -d precivox
   ```

### Erro: "Prisma Client is not generated"

**Solução:**
```bash
npm run prisma:generate
```

### Erro: "Module not found"

**Solução:**
```bash
# Limpe node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro no Upload: "MulterError: Unexpected field"

**Solução:**
- Certifique-se de que o campo do formulário se chama `arquivo`
- Verifique se o diretório `uploads/` existe

---

## Próximos Passos

✅ Instalação concluída!

Agora você pode:

1. **Explorar a interface**
   - Faça login como admin
   - Crie mercados e unidades
   - Teste o upload de produtos

2. **Testar a API**
   - Use Postman ou Insomnia
   - Veja a documentação em `README.md`

3. **Desenvolver novos recursos**
   - Adicione novos endpoints
   - Crie novos componentes
   - Implemente testes

4. **Configurar para produção**
   - Veja `README.md` seção de Deploy
   - Configure variáveis de ambiente de produção
   - Execute build e deploy

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Inicia tudo
npm run dev:next           # Apenas Next.js
npm run dev:server         # Apenas Express

# Prisma
npm run prisma:generate    # Gera Prisma Client
npm run prisma:migrate     # Executa migrations
npm run prisma:studio      # Abre interface visual
npm run prisma:seed        # Popula banco

# Build
npm run build              # Compila para produção
npm start                  # Inicia produção

# Linting
npm run lint               # Verifica código
```

---

## Suporte

Problemas durante a instalação?

1. Verifique os logs de erro
2. Consulte a documentação em `README.md`
3. Abra uma issue no GitHub
4. Entre em contato: suporte@precivox.com

---

**Boa sorte com o desenvolvimento! 🚀**
