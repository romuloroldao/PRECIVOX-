# ⌨️ PRECIVOX - Guia de Comandos

Lista completa de comandos úteis para desenvolvimento e manutenção.

---

## 🚀 Desenvolvimento

### Iniciar Servidor

```bash
# Servidor de desenvolvimento (com hot reload)
npm run dev

# Servidor em porta específica
PORT=3001 npm run dev

# Servidor em modo watch (reinicia ao detectar mudanças)
npm run dev -- --turbo
```

### Build e Produção

```bash
# Build para produção
npm run build

# Iniciar servidor de produção (após build)
npm run start

# Build + Start
npm run build && npm run start
```

### Linting

```bash
# Verificar erros de código
npm run lint

# Corrigir erros automaticamente
npm run lint -- --fix
```

---

## 🗄️ Banco de Dados (Prisma)

### Migrations

```bash
# Criar nova migration (desenvolvimento)
npm run prisma:migrate

# Criar migration com nome específico
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations pendentes (produção)
npx prisma migrate deploy

# Resetar banco (CUIDADO: apaga tudo!)
npx prisma migrate reset

# Verificar status das migrations
npx prisma migrate status
```

### Cliente Prisma

```bash
# Gerar cliente Prisma (após mudar schema)
npm run prisma:generate

# Regenerar forçado
npx prisma generate --force
```

### Prisma Studio

```bash
# Abrir interface visual do banco
npm run prisma:studio

# Acesse: http://localhost:5555
```

### Seed

```bash
# Popular banco com dados de teste
npm run prisma:seed

# Seed personalizado
npx ts-node prisma/seed.ts
```

### Inspeção e Debug

```bash
# Ver SQL gerado por query
npx prisma db pull

# Validar schema
npx prisma validate

# Formatar schema
npx prisma format
```

---

## 📦 Instalação e Setup

### Instalação Completa

```bash
# Instalar todas as dependências
npm install

# Instalar dependência específica
npm install nome-do-pacote

# Instalar dependência de dev
npm install -D nome-do-pacote

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Setup Rápido

```bash
# Setup completo (install + migrate + seed)
npm run setup

# Setup manual passo a passo
npm install
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

---

## 🔐 Autenticação e Usuários

### Gerar Hash de Senha

```bash
# Via Node.js direto
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('SuaSenha123', 10));"

# Via script personalizado
node -p "require('bcryptjs').hashSync('SuaSenha123', 10)"
```

### Gerar JWT Secret

```bash
# Gerar secret aleatório (64 caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"

# Ou mais longo (128 caracteres)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'));"
```

### Criar Usuário Admin via SQL

```bash
# Conectar ao PostgreSQL
psql -U postgres -d precivox

# Inserir admin (substitua o hash)
INSERT INTO usuarios (id, nome, email, senha_hash, role, provider, data_criacao)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@precivox.com',
  '$2a$10$seu_hash_aqui',
  'ADMIN',
  'LOCAL',
  NOW()
);
```

---

## 🗃️ PostgreSQL

### Comandos Básicos

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Conectar a banco específico
psql -U usuario -d precivox

# Listar bancos
\l

# Conectar a banco
\c precivox

# Listar tabelas
\dt

# Descrever tabela
\d usuarios

# Executar query
SELECT * FROM usuarios;

# Sair
\q
```

### Backup e Restore

```bash
# Backup do banco
pg_dump -U postgres precivox > backup.sql

# Backup com timestamp
pg_dump -U postgres precivox > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -U postgres precivox < backup.sql

# Backup apenas schema
pg_dump -U postgres --schema-only precivox > schema.sql

# Backup apenas dados
pg_dump -U postgres --data-only precivox > data.sql
```

### Gerenciamento

```bash
# Iniciar PostgreSQL
sudo service postgresql start

# Parar PostgreSQL
sudo service postgresql stop

# Reiniciar PostgreSQL
sudo service postgresql restart

# Status
sudo service postgresql status

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 🔍 Debug e Logs

### Logs do Next.js

```bash
# Logs em tempo real
npm run dev

# Logs detalhados
DEBUG=* npm run dev

# Logs específicos
DEBUG=prisma:* npm run dev
```

### Inspecionar Banco

```bash
# Abrir Prisma Studio
npm run prisma:studio

# Query direto no terminal
psql -U postgres -d precivox -c "SELECT * FROM usuarios;"

# Contar usuários por role
psql -U postgres -d precivox -c "SELECT role, COUNT(*) FROM usuarios GROUP BY role;"
```

### Network e Processos

```bash
# Ver quem está usando a porta 3000
lsof -i :3000

# Matar processo na porta 3000
kill -9 $(lsof -t -i:3000)

# Ver processos Node.js rodando
ps aux | grep node

# Matar todos os processos Node.js
pkill -f node
```

---

## 🧹 Limpeza e Manutenção

### Limpar Cache

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules
rm -rf node_modules

# Limpar tudo e reinstalar
rm -rf node_modules .next package-lock.json
npm install
```

### Limpar Banco de Dados

```bash
# Resetar banco (apaga tudo e recria)
npm run prisma:migrate reset

# Deletar manualmente
psql -U postgres -c "DROP DATABASE precivox;"
psql -U postgres -c "CREATE DATABASE precivox;"
npm run prisma:migrate
```

### Limpar Sessões Expiradas

```sql
-- Conectar ao banco
psql -U postgres -d precivox

-- Deletar sessões expiradas
DELETE FROM sessoes WHERE expires_at < NOW();

-- Contar sessões ativas
SELECT COUNT(*) FROM sessoes WHERE expires_at > NOW();
```

---

## 🧪 Testes e Validação

### Testar Autenticação

```bash
# Login via curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@precivox.com","senha":"Admin123!"}'

# Obter dados do usuário (substitua TOKEN)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Cadastro via curl
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@example.com","senha":"Teste123!"}'
```

### Validar Estrutura

```bash
# Verificar TypeScript
npx tsc --noEmit

# Verificar Prisma schema
npx prisma validate

# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update
```

---

## 🚀 Deploy

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy (produção)
vercel --prod

# Ver logs
vercel logs
```

### Build Local para Produção

```bash
# Variáveis de ambiente de produção
export NODE_ENV=production
export DATABASE_URL="postgresql://..."

# Build
npm run build

# Testar produção localmente
npm run start
```

### Docker (Opcional)

```bash
# Build image
docker build -t precivox .

# Run container
docker run -p 3000:3000 --env-file .env precivox

# Docker Compose
docker-compose up -d
```

---

## 📊 Monitoramento

### Queries de Monitoramento

```sql
-- Total de usuários
SELECT COUNT(*) FROM usuarios;

-- Usuários por role
SELECT role, COUNT(*) FROM usuarios GROUP BY role;

-- Usuários por provider
SELECT provider, COUNT(*) FROM usuarios GROUP BY provider;

-- Sessões ativas
SELECT COUNT(*) FROM sessoes WHERE expires_at > NOW();

-- Últimos 10 logins
SELECT nome, email, ultimo_login 
FROM usuarios 
WHERE ultimo_login IS NOT NULL 
ORDER BY ultimo_login DESC 
LIMIT 10;

-- Usuários criados hoje
SELECT COUNT(*) FROM usuarios 
WHERE DATE(data_criacao) = CURRENT_DATE;
```

### Performance

```bash
# Analisar bundle size
npm run build -- --analyze

# Verificar lighthouse
npx lighthouse http://localhost:3000

# Benchmark de queries
npx prisma studio --debug
```

---

## 🛠️ Utilitários

### Git

```bash
# Status
git status

# Adicionar tudo
git add .

# Commit
git commit -m "feat: adicionar login social"

# Push
git push origin main

# Ver histórico
git log --oneline --graph

# Criar branch
git checkout -b feature/nova-funcionalidade
```

### Environment

```bash
# Ver variáveis de ambiente
printenv | grep NEXT

# Carregar .env
source .env

# Exportar variável
export JWT_SECRET="minha-chave"

# Verificar se variável está definida
echo $JWT_SECRET
```

---

## ⚡ Scripts Personalizados

Adicione estes scripts úteis ao `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    
    "setup": "npm install && npm run prisma:migrate && npm run prisma:seed",
    "clean": "rm -rf .next node_modules",
    "reset": "npm run clean && npm install",
    
    "db:reset": "prisma migrate reset",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "jest"
  }
}
```

---

## 📝 Notas Importantes

### Segurança

- ⚠️ **NUNCA** commite o arquivo `.env`
- ⚠️ **SEMPRE** use secrets diferentes para dev/prod
- ⚠️ **ALTERE** JWT_SECRET e NEXTAUTH_SECRET em produção

### Performance

- ✅ Use `npm run build` antes de deploy
- ✅ Configure CDN para assets estáticos
- ✅ Habilite compressão gzip/brotli
- ✅ Use connection pooling no PostgreSQL

### Manutenção

- 📅 Limpe sessões expiradas semanalmente
- 📅 Faça backup do banco diariamente
- 📅 Revise logs de erro regularmente
- 📅 Atualize dependências mensalmente

---

**Comandos essenciais sempre à mão!** 🚀

