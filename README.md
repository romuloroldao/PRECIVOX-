# 🛒 PRECIVOX - Sistema de Gestão de Mercados

Sistema completo de gestão de mercados com múltiplas unidades, controle de estoque, upload de base de dados e sistema de permissões hierárquicas.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Reference](#api-reference)
- [Estrutura de Dados](#estrutura-de-dados)
- [Fluxo de Dados](#fluxo-de-dados)
- [Permissões](#permissões)

---

## 🎯 Funcionalidades

### Para Administradores
- ✅ Criar, editar e excluir mercados
- ✅ Associar mercados a planos de pagamento
- ✅ Associar gestores aos mercados
- ✅ Gerenciar unidades de todos os mercados
- ✅ Fazer upload de base de dados para qualquer mercado
- ✅ Visualizar histórico completo de importações

### Para Gestores
- ✅ Editar informações do próprio mercado
- ✅ Criar e gerenciar unidades do mercado
- ✅ Fazer upload de base de dados de produtos
- ✅ Visualizar histórico de importações
- ✅ Gerenciar estoque por unidade

### Para Clientes
- ✅ Visualizar informações públicas dos mercados
- ✅ Consultar produtos e preços
- ✅ Comparar preços entre mercados/unidades

---

## 🏗️ Arquitetura

### Backend (Express + Prisma)

```
src/
├── server.ts                    # Servidor Express principal
├── middleware/
│   ├── auth.ts                 # Autenticação JWT
│   └── permissions.ts          # Verificação de permissões
├── routes/
│   ├── mercados.ts             # Rotas de mercados
│   ├── unidades.ts             # Rotas de unidades
│   └── planos.ts               # Rotas de planos
└── lib/
    └── uploadHandler.ts        # Processamento de CSV/XLSX
```

### Frontend (Next.js 14)

```
src/
├── app/
│   ├── admin/
│   │   └── mercados/
│   │       ├── page.tsx        # Lista de mercados
│   │       └── [id]/
│   │           └── page.tsx    # Detalhes e gestão do mercado
│   └── gestor/
│       └── mercado/
│           └── page.tsx        # Dashboard do gestor
└── components/
    ├── MercadoForm.tsx         # Formulário de mercado
    ├── MercadoCard.tsx         # Card de visualização
    ├── UnidadeForm.tsx         # Formulário de unidade
    └── UploadDatabase.tsx      # Upload de base de dados
```

### Banco de Dados (PostgreSQL + Prisma)

```
prisma/
└── schema.prisma               # Schema completo do banco
```

---

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **PapaParse** - Processamento de CSV
- **XLSX** - Processamento de Excel

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Hooks** - Gerenciamento de estado

### Banco de Dados
- **PostgreSQL** - Banco de dados relacional

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Passo a Passo

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd precivox

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Configure o banco de dados
npm run prisma:generate
npm run prisma:migrate

# 5. (Opcional) Popule o banco com dados de exemplo
npm run prisma:seed

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

O servidor Express estará rodando em `http://localhost:3001`  
O Next.js estará rodando em `http://localhost:3000`

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/precivox?schema=public"

# JWT
JWT_SECRET="seu-jwt-secret-super-seguro-aqui"

# Servidor
PORT=3001
NODE_ENV=development

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Configuração do PostgreSQL

```sql
-- Criar banco de dados
CREATE DATABASE precivox;

-- Criar usuário (opcional)
CREATE USER precivox_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE precivox TO precivox_user;
```

---

## 🚀 Uso

### Criando um Mercado (Admin)

1. Acesse `/admin/mercados`
2. Clique em "Novo Mercado"
3. Preencha os dados:
   - Nome
   - CNPJ
   - Informações de contato
   - Selecione um plano de pagamento
   - Associe um gestor (opcional)
4. Clique em "Criar Mercado"

### Upload de Base de Dados

1. Acesse o mercado desejado
2. Vá para a aba "Upload de Base"
3. Selecione a unidade de destino
4. Faça upload do arquivo CSV ou XLSX
5. Aguarde o processamento

#### Formato do Arquivo CSV/XLSX

**Colunas obrigatórias:**
- `nome` - Nome do produto
- `preco` - Preço do produto (número)
- `quantidade` - Quantidade em estoque (número)

**Colunas opcionais:**
- `descricao` - Descrição do produto
- `categoria` - Categoria do produto
- `codigo_barras` ou `ean` - Código de barras
- `marca` - Marca do produto
- `unidade_medida` - Unidade de medida (UN, KG, L, etc)
- `preco_promocional` - Preço em promoção
- `em_promocao` - Se está em promoção (true/false)

**Exemplo de CSV:**

```csv
nome,preco,quantidade,categoria,codigo_barras,marca
Arroz 5kg,25.90,100,Alimentos,7891234567890,Tio João
Feijão 1kg,8.50,150,Alimentos,7891234567891,Camil
Açúcar 1kg,4.20,200,Alimentos,7891234567892,União
```

---

## 📡 API Reference

### Autenticação

Todas as rotas (exceto públicas) requerem autenticação via JWT no header:

```
Authorization: Bearer <seu-token-jwt>
```

### Mercados

#### `GET /api/mercados`
Lista todos os mercados (filtrado por permissões)

**Query Params:**
- `busca` - Busca por nome ou CNPJ
- `ativo` - Filtro de status (true/false)
- `planoId` - Filtro por plano

**Response:**
```json
[
  {
    "id": "cuid",
    "nome": "Supermercado ABC",
    "cnpj": "12345678901234",
    "plano": { ... },
    "gestor": { ... },
    "_count": { "unidades": 3 }
  }
]
```

#### `POST /api/mercados`
Cria um novo mercado (Admin apenas)

**Body:**
```json
{
  "nome": "Supermercado ABC",
  "cnpj": "12345678901234",
  "descricao": "Descrição do mercado",
  "telefone": "11999999999",
  "emailContato": "contato@mercado.com",
  "horarioFuncionamento": "Seg-Sex: 8h-20h",
  "planoId": "cuid",
  "gestorId": "cuid"
}
```

#### `PUT /api/mercados/:id`
Atualiza um mercado (Admin ou Gestor do mercado)

#### `DELETE /api/mercados/:id`
Exclui um mercado (Admin apenas)

#### `POST /api/mercados/:id/upload`
Faz upload de base de dados (Admin ou Gestor)

**Form Data:**
- `arquivo` - Arquivo CSV ou XLSX
- `unidadeId` - ID da unidade de destino

**Response:**
```json
{
  "message": "Upload processado com sucesso",
  "resultado": {
    "totalLinhas": 100,
    "sucesso": 95,
    "erros": 5,
    "duplicados": 10,
    "detalhesErros": [...]
  }
}
```

### Unidades

#### `GET /api/mercados/:id/unidades`
Lista unidades de um mercado

#### `POST /api/mercados/:id/unidades`
Cria uma nova unidade

#### `PUT /api/unidades/:id`
Atualiza uma unidade

#### `DELETE /api/unidades/:id`
Exclui uma unidade

#### `GET /api/unidades/:id/estoque`
Lista estoque de uma unidade

**Query Params:**
- `categoria` - Filtro por categoria
- `disponivel` - Filtro de disponibilidade
- `busca` - Busca por nome/código de barras

### Planos

#### `GET /api/planos`
Lista planos de pagamento

#### `POST /api/planos`
Cria um plano (Admin apenas)

#### `PUT /api/planos/:id`
Atualiza um plano (Admin apenas)

#### `DELETE /api/planos/:id`
Exclui um plano (Admin apenas)

---

## 🗄️ Estrutura de Dados

### Relacionamentos

```
User (Gestor)
  └── gerencia → Mercado
                   ├── possui → PlanoPagamento
                   ├── possui → Unidade[]
                   │             └── possui → Estoque[]
                   │                           └── referencia → Produto
                   └── possui → LogImportacao[]
```

### Modelos Principais

#### User
```prisma
- id: String
- email: String (unique)
- nome: String
- senha: String (hashed)
- role: ADMIN | GESTOR | CLIENTE
- telefone: String?
- cpf: String? (unique)
```

#### Mercado
```prisma
- id: String
- nome: String
- cnpj: String (unique)
- descricao: String?
- telefone: String?
- emailContato: String?
- horarioFuncionamento: String?
- ativo: Boolean
- planoId: String? → PlanoPagamento
- gestorId: String? → User
```

#### Unidade
```prisma
- id: String
- nome: String
- endereco: String?
- cidade: String?
- estado: String?
- cep: String?
- telefone: String?
- ativa: Boolean
- mercadoId: String → Mercado
```

#### Produto
```prisma
- id: String
- nome: String
- descricao: String?
- categoria: String?
- codigoBarras: String? (unique)
- marca: String?
- unidadeMedida: String?
```

#### Estoque
```prisma
- id: String
- quantidade: Int
- preco: Decimal
- precoPromocional: Decimal?
- emPromocao: Boolean
- disponivel: Boolean
- unidadeId: String → Unidade
- produtoId: String → Produto
```

---

## 🔄 Fluxo de Dados

### 1. Criação de Mercado

```
Admin → POST /mercados
  ├── Valida dados (nome, CNPJ)
  ├── Verifica duplicação de CNPJ
  ├── Valida planoId e gestorId
  └── Cria mercado no banco
      └── Retorna mercado criado
```

### 2. Upload de Base de Dados

```
Admin/Gestor → POST /mercados/:id/upload
  ├── Verifica permissões (canAccessMercado)
  ├── Valida formato do arquivo (CSV/XLSX)
  ├── Verifica limite do plano (checkPlanLimits)
  ├── Cria LogImportacao (status: PROCESSANDO)
  ├── Processa arquivo linha por linha
  │   ├── Valida campos obrigatórios
  │   ├── Busca ou cria Produto
  │   │   └── Por código de barras ou nome+marca
  │   └── Cria ou atualiza Estoque
  │       └── Relaciona Produto + Unidade
  ├── Atualiza LogImportacao (status: CONCLUIDO/PARCIAL/FALHA)
  └── Retorna resultado
      └── {sucesso, erros, duplicados, detalhes}
```

### 3. Associação de Permissões

```
Mercado
  ├── Admin: acesso total a todos os mercados
  ├── Gestor: acesso apenas ao mercado onde gestorId = user.id
  │   ├── Pode editar informações básicas
  │   ├── Pode criar/editar/excluir unidades
  │   └── Pode fazer upload de base de dados
  └── Cliente: acesso somente leitura (visualização pública)
```

### 4. Controle de Estoque por Unidade

```
Mercado (ex: Supermercado ABC)
  ├── Unidade 1 (Centro)
  │   └── Estoque
  │       ├── Produto A: 100 unidades, R$ 10,00
  │       └── Produto B: 50 unidades, R$ 25,00
  │
  └── Unidade 2 (Bairro)
      └── Estoque
          ├── Produto A: 75 unidades, R$ 10,50
          └── Produto C: 200 unidades, R$ 5,00

# Cada unidade tem seu próprio controle independente
```

---

## 🔐 Permissões

### Matriz de Permissões

| Recurso | Admin | Gestor | Cliente |
|---------|-------|--------|---------|
| Criar Mercado | ✅ | ❌ | ❌ |
| Editar Mercado | ✅ Todos | ✅ Próprio | ❌ |
| Excluir Mercado | ✅ | ❌ | ❌ |
| Criar Unidade | ✅ | ✅ No próprio mercado | ❌ |
| Editar Unidade | ✅ | ✅ No próprio mercado | ❌ |
| Excluir Unidade | ✅ | ✅ No próprio mercado | ❌ |
| Upload Base | ✅ | ✅ No próprio mercado | ❌ |
| Ver Estoque | ✅ | ✅ No próprio mercado | ✅ Público |
| Associar Plano | ✅ | ❌ | ❌ |
| Associar Gestor | ✅ | ❌ | ❌ |

### Middlewares de Autorização

#### `authenticate`
Verifica se o usuário está autenticado via JWT

```typescript
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);
req.user = decoded;
```

#### `authorizeRole(...roles)`
Verifica se o usuário tem uma das roles permitidas

```typescript
if (!allowedRoles.includes(req.user.role)) {
  return res.status(403).json({ error: 'Permissão negada' });
}
```

#### `canAccessMercado`
Verifica se o usuário tem permissão para acessar um mercado específico

```typescript
if (role === 'ADMIN') return next(); // Admin: acesso total

if (role === 'GESTOR') {
  const mercado = await prisma.mercado.findFirst({
    where: { id: mercadoId, gestorId: userId }
  });
  if (!mercado) return res.status(403);
}
```

#### `checkPlanLimits`
Verifica se a operação respeita os limites do plano

```typescript
// Exemplo: limite de unidades
if (mercado.unidades.length >= mercado.plano.limiteUnidades) {
  return res.status(400).json({
    error: 'Limite de unidades atingido'
  });
}

// Exemplo: limite de upload
if (fileSizeMb > mercado.plano.limiteUploadMb) {
  return res.status(400).json({
    error: 'Arquivo muito grande'
  });
}
```

---

## 📊 Planos de Pagamento

Os planos definem os limites de uso do sistema:

- **limiteUnidades**: Número máximo de unidades (filiais)
- **limiteUploadMb**: Tamanho máximo de arquivo para upload
- **limiteUsuarios**: Número máximo de usuários/funcionários

Exemplo de planos:

| Plano | Valor | Unidades | Upload | Duração |
|-------|-------|----------|--------|---------|
| Básico | R$ 99/mês | 1 | 10 MB | 30 dias |
| Intermediário | R$ 199/mês | 5 | 50 MB | 30 dias |
| Avançado | R$ 399/mês | 20 | 100 MB | 30 dias |
| Enterprise | R$ 999/mês | Ilimitado | 500 MB | 30 dias |

---

## 🔍 Logs e Monitoramento

### Log de Importação

Cada upload gera um log detalhado:

```typescript
{
  id: "cuid",
  mercadoId: "cuid",
  nomeArquivo: "produtos_2024.csv",
  tamanhoBytes: 1024000,
  totalLinhas: 1000,
  linhasSucesso: 950,
  linhasErro: 40,
  linhasDuplicadas: 10,
  status: "PARCIAL",
  detalhesErros: [
    {
      linha: 15,
      erro: "Preço inválido",
      dados: { nome: "Produto X", preco: "abc" }
    }
  ],
  dataInicio: "2024-01-15T10:00:00Z",
  dataFim: "2024-01-15T10:05:30Z"
}
```

---

## 🧪 Testes

(Seção para testes - a ser implementada)

```bash
# Rodar testes
npm test

# Testes de integração
npm run test:integration

# Coverage
npm run test:coverage
```

---

## 🚢 Deploy

### Preparação para Produção

1. Configure variáveis de ambiente de produção
2. Compile o projeto:
   ```bash
   npm run build
   ```
3. Execute migrations no banco de produção:
   ```bash
   npm run prisma:migrate
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```

### Deploy Recomendado

- **Backend**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify
- **Banco de Dados**: Supabase, Neon, AWS RDS

---

## 📝 Licença

MIT

---

## 👥 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Entre em contato: suporte@precivox.com

---

**Desenvolvido com ❤️ para PRECIVOX**
