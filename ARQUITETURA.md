# 🏗️ Arquitetura do PRECIVOX

## Visão Geral

O PRECIVOX é construído com uma arquitetura moderna de três camadas:

1. **Frontend** - Next.js 14 (React)
2. **Backend** - Express (Node.js)
3. **Banco de Dados** - PostgreSQL via Prisma

---

## 📐 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Admin Pages  │  │ Gestor Pages │  │Client Pages  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐    │
│  │            React Components                          │    │
│  │  (Forms, Cards, Upload, Lists)                      │    │
│  └──────────────────────┬───────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────┼────────────────────────────────────┐
│                        ▼                                     │
│                 BACKEND (Express)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Routes                              │   │
│  │  /mercados  /unidades  /planos  /upload            │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────┴──────────────────────────────────────┐   │
│  │            Middlewares                               │   │
│  │  - authenticate (JWT)                                │   │
│  │  - authorizeRole                                     │   │
│  │  - canAccessMercado                                  │   │
│  │  - checkPlanLimits                                   │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────┴──────────────────────────────────────┐   │
│  │          Business Logic                              │   │
│  │  - uploadHandler (CSV/XLSX)                          │   │
│  │  - Validation                                        │   │
│  │  - Data Processing                                   │   │
│  └──────────────┬──────────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────────┘
                  │
                  │ Prisma Client
                  │
┌─────────────────┼──────────────────────────────────────────┐
│                 ▼                                            │
│          DATABASE (PostgreSQL)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables:                                              │  │
│  │  - users                                              │  │
│  │  - mercados                                           │  │
│  │  - unidades                                           │  │
│  │  - produtos                                           │  │
│  │  - estoques                                           │  │
│  │  - planos_de_pagamento                                │  │
│  │  - logs_importacao                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados Detalhado

### 1. Autenticação e Autorização

```
Cliente
  │
  │ 1. POST /auth/login { email, senha }
  ▼
Express Server
  │
  │ 2. Valida credenciais
  │ 3. Gera JWT com { id, email, role, nome }
  ▼
Cliente recebe token
  │
  │ 4. Armazena no localStorage
  │ 5. Envia em todas as requisições:
  │    Authorization: Bearer <token>
  ▼
Middleware authenticate
  │
  │ 6. Verifica e decodifica JWT
  │ 7. Anexa user info à request
  ▼
Middleware authorizeRole
  │
  │ 8. Verifica se user.role está permitido
  ▼
Controller executa ação
```

### 2. Criação de Mercado (Admin)

```
Admin Interface
  │
  │ 1. Preenche formulário MercadoForm
  │    { nome, cnpj, planoId, gestorId, ... }
  ▼
Frontend
  │
  │ 2. POST /api/mercados
  │    Headers: { Authorization: Bearer <token> }
  │    Body: { dados do mercado }
  ▼
Backend - authenticate
  │
  │ 3. Valida JWT
  │ 4. Verifica role = ADMIN
  ▼
Backend - Controller
  │
  │ 5. Valida dados obrigatórios
  │ 6. Verifica CNPJ duplicado
  │ 7. Valida planoId (se informado)
  │ 8. Valida gestorId (se informado)
  ▼
Prisma
  │
  │ 9. INSERT INTO mercados (...)
  │ 10. Retorna mercado criado
  ▼
Frontend
  │
  │ 11. Atualiza lista de mercados
  │ 12. Exibe mensagem de sucesso
```

### 3. Upload de Base de Dados

```
Gestor/Admin
  │
  │ 1. Seleciona arquivo CSV/XLSX
  │ 2. Seleciona unidade de destino
  ▼
UploadDatabase Component
  │
  │ 3. Valida:
  │    - Formato do arquivo
  │    - Tamanho (max 50MB)
  │ 4. Cria FormData
  │    - arquivo: File
  │    - unidadeId: string
  ▼
Frontend
  │
  │ 5. POST /api/mercados/:id/upload
  │    Headers: { Authorization: Bearer <token> }
  │    Body: FormData
  ▼
Backend - Middlewares
  │
  │ 6. authenticate → valida JWT
  │ 7. canAccessMercado → verifica se gestor pode acessar
  │ 8. checkPlanLimits → valida limite de upload
  ▼
Multer
  │
  │ 9. Salva arquivo em /uploads/
  │ 10. Passa caminho para controller
  ▼
uploadHandler
  │
  │ 11. Cria LogImportacao (status: PROCESSANDO)
  │
  │ 12. Lê arquivo (CSV ou XLSX)
  │     - CSV: PapaParse
  │     - XLSX: biblioteca xlsx
  │
  │ 13. Para cada linha:
  │     ├─ Valida campos obrigatórios
  │     │
  │     ├─ Busca ou cria Produto
  │     │  ├─ Busca por codigoBarras
  │     │  └─ Se não existe, busca por nome+marca
  │     │
  │     └─ Cria ou atualiza Estoque
  │        ├─ Verifica se já existe (unidade + produto)
  │        ├─ Se existe: UPDATE
  │        └─ Se não: INSERT
  │
  │ 14. Registra erros em detalhesErros[]
  │
  │ 15. Atualiza LogImportacao
  │     - totalLinhas
  │     - linhasSucesso
  │     - linhasErro
  │     - linhasDuplicadas
  │     - status: CONCLUIDO/PARCIAL/FALHA
  │     - dataFim
  │
  │ 16. Remove arquivo temporário
  ▼
Frontend
  │
  │ 17. Recebe resultado
  │ 18. Exibe estatísticas:
  │     - ✅ Sucesso: X
  │     - ❌ Erros: Y
  │     - 🔄 Duplicados: Z
  │ 19. Atualiza histórico de importações
```

### 4. Controle de Permissões em Tempo Real

```
Request para /api/mercados/123/unidades
  │
  │ Headers: { Authorization: Bearer <token> }
  ▼
authenticate
  │
  │ Decodifica JWT:
  │ user = {
  │   id: "user123",
  │   role: "GESTOR",
  │   email: "gestor@email.com"
  │ }
  ▼
canAccessMercado
  │
  │ if (role === 'ADMIN')
  │   ✅ Permite (acesso total)
  │
  │ if (role === 'GESTOR')
  │   ├─ Query: SELECT * FROM mercados
  │   │         WHERE id = '123'
  │   │         AND gestorId = 'user123'
  │   │
  │   ├─ Se encontrou: ✅ Permite
  │   └─ Se não: ❌ Nega (403 Forbidden)
  │
  │ if (role === 'CLIENTE')
  │   ❌ Nega (403 Forbidden)
  ▼
Controller
  │
  │ Executa lógica de negócio
  ▼
Response
```

---

## 🗃️ Modelo de Dados Relacional

### Diagrama ER

```
┌─────────────┐         ┌──────────────────┐
│    User     │         │ PlanoPagamento   │
│─────────────│         │──────────────────│
│ id          │         │ id               │
│ email       │◄────┐   │ nome             │
│ nome        │     │   │ valor            │
│ role        │     │   │ limiteUnidades   │
└─────────────┘     │   │ limiteUploadMb   │
                    │   └────────┬─────────┘
                    │            │
                    │            │ 1
                    │            │
                    │ 1          │ N
                    │            │
                    │   ┌────────▼─────────┐
                    └───┤    Mercado       │
                        │──────────────────│
                        │ id               │
                        │ nome             │
                        │ cnpj             │
                        │ gestorId (FK)    │
                        │ planoId (FK)     │
                        └────────┬─────────┘
                                 │
                                 │ 1
                                 │
                                 │ N
                                 │
                        ┌────────▼─────────┐
                        │    Unidade       │
                        │──────────────────│
                        │ id               │
                        │ nome             │
                        │ endereco         │
                        │ mercadoId (FK)   │
                        └────────┬─────────┘
                                 │
                                 │ 1
                                 │
                                 │ N
                                 │
                        ┌────────▼─────────┐        ┌──────────────┐
                        │    Estoque       │───N────│   Produto    │
                        │──────────────────│        │──────────────│
                        │ id               │   1    │ id           │
                        │ quantidade       │        │ nome         │
                        │ preco            │        │ codigoBarras │
                        │ unidadeId (FK)   │        │ categoria    │
                        │ produtoId (FK)   │        │ marca        │
                        └──────────────────┘        └──────────────┘

                        
┌─────────────┐
│  Mercado    │
│─────────────│
│ id          │
└──────┬──────┘
       │ 1
       │
       │ N
       │
┌──────▼───────────┐
│ LogImportacao    │
│──────────────────│
│ id               │
│ nomeArquivo      │
│ totalLinhas      │
│ linhasSucesso    │
│ linhasErro       │
│ status           │
│ mercadoId (FK)   │
└──────────────────┘
```

### Relacionamentos Chave

1. **User → Mercado** (1:N)
   - Um gestor pode gerenciar múltiplos mercados
   - `mercado.gestorId → user.id`

2. **PlanoPagamento → Mercado** (1:N)
   - Um plano pode ser usado por múltiplos mercados
   - `mercado.planoId → plano.id`

3. **Mercado → Unidade** (1:N)
   - Um mercado pode ter múltiplas unidades (filiais)
   - `unidade.mercadoId → mercado.id`
   - DELETE CASCADE: se mercado for excluído, unidades também são

4. **Unidade → Estoque** (1:N)
   - Uma unidade tem múltiplos estoques (um por produto)
   - `estoque.unidadeId → unidade.id`
   - DELETE CASCADE: se unidade for excluída, estoques também são

5. **Produto → Estoque** (1:N)
   - Um produto pode estar em múltiplos estoques (várias unidades)
   - `estoque.produtoId → produto.id`

6. **Mercado → LogImportacao** (1:N)
   - Um mercado tem múltiplos logs de importação
   - `logImportacao.mercadoId → mercado.id`

### Constraints Importantes

```sql
-- Unique: Um produto por unidade
ALTER TABLE estoques 
ADD CONSTRAINT unique_unidade_produto 
UNIQUE (unidadeId, produtoId);

-- Unique: CNPJ do mercado
ALTER TABLE mercados 
ADD CONSTRAINT unique_cnpj 
UNIQUE (cnpj);

-- Unique: Código de barras do produto
ALTER TABLE produtos 
ADD CONSTRAINT unique_codigo_barras 
UNIQUE (codigoBarras);
```

---

## 🔐 Sistema de Permissões

### Hierarquia de Roles

```
ADMIN (Super Usuário)
  │
  ├─ Acesso total ao sistema
  ├─ Gerencia todos os mercados
  ├─ Gerencia planos de pagamento
  ├─ Associa gestores aos mercados
  └─ Visualiza todos os logs

GESTOR (Gerente de Mercado)
  │
  ├─ Acesso limitado ao(s) mercado(s) que gerencia
  ├─ Edita informações do mercado
  ├─ Gerencia unidades do mercado
  ├─ Faz upload de base de dados
  ├─ Visualiza logs do seu mercado
  └─ NÃO pode:
      ├─ Criar novos mercados
      ├─ Mudar plano
      └─ Mudar gestor

CLIENTE (Consumidor)
  │
  ├─ Visualiza informações públicas
  ├─ Consulta produtos e preços
  ├─ Compara preços entre mercados
  └─ NÃO pode modificar nada
```

### Verificação de Permissões

#### Nível 1: Autenticação
```typescript
// Verifica se está logado
authenticate(req, res, next)
```

#### Nível 2: Role
```typescript
// Verifica se tem a role adequada
authorizeRole('ADMIN', 'GESTOR')(req, res, next)
```

#### Nível 3: Ownership (Propriedade)
```typescript
// Verifica se o gestor é dono do recurso
canAccessMercado(req, res, next)
canAccessUnidade(req, res, next)
```

#### Nível 4: Plan Limits
```typescript
// Verifica limites do plano
checkPlanLimits(req, res, next)
```

### Exemplo de Rota Protegida

```typescript
router.post(
  '/mercados/:id/unidades',
  authenticate,                  // Nível 1: Está logado?
  authorizeRole('ADMIN', 'GESTOR'), // Nível 2: É admin ou gestor?
  canAccessMercado,              // Nível 3: Gestor é dono?
  checkPlanLimits,               // Nível 4: Plano permite?
  createUnidadeController        // Executa ação
);
```

---

## 📦 Estrutura de Arquivos

```
precivox/
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/
│   │   │   └── mercados/
│   │   │       ├── page.tsx    # Lista de mercados
│   │   │       └── [id]/
│   │   │           └── page.tsx # Detalhes do mercado
│   │   └── gestor/
│   │       └── mercado/
│   │           └── page.tsx    # Dashboard do gestor
│   │
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── MercadoForm.tsx
│   │   ├── MercadoCard.tsx
│   │   ├── UnidadeForm.tsx
│   │   └── UploadDatabase.tsx
│   │
│   ├── lib/                    # Bibliotecas e utilitários
│   │   └── uploadHandler.ts    # Lógica de upload
│   │
│   ├── middleware/             # Middlewares do Express
│   │   ├── auth.ts             # Autenticação JWT
│   │   └── permissions.ts      # Autorização e permissões
│   │
│   ├── routes/                 # Rotas do Express
│   │   ├── mercados.ts
│   │   ├── unidades.ts
│   │   └── planos.ts
│   │
│   └── server.ts               # Servidor Express principal
│
├── uploads/                    # Arquivos temporários de upload
│
├── .env                        # Variáveis de ambiente
├── package.json                # Dependências
├── tsconfig.json               # Configuração TypeScript
├── tailwind.config.ts          # Configuração Tailwind
└── README.md                   # Documentação
```

---

## 🚀 Otimizações e Boas Práticas

### 1. Performance do Banco de Dados

```sql
-- Índices para queries frequentes
CREATE INDEX idx_mercados_gestor ON mercados(gestorId);
CREATE INDEX idx_unidades_mercado ON unidades(mercadoId);
CREATE INDEX idx_estoques_unidade ON estoques(unidadeId);
CREATE INDEX idx_estoques_produto ON estoques(produtoId);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigoBarras);
```

### 2. Caching (Futuro)

```typescript
// Redis para cache de produtos e mercados frequentemente acessados
const cacheKey = `mercado:${id}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const mercado = await prisma.mercado.findUnique(...);
await redis.setex(cacheKey, 3600, JSON.stringify(mercado));
```

### 3. Validação de Dados

```typescript
// Usar bibliotecas como Zod para validação robusta
import { z } from 'zod';

const mercadoSchema = z.object({
  nome: z.string().min(3).max(100),
  cnpj: z.string().regex(/^\d{14}$/),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
});

// Valida antes de processar
const validData = mercadoSchema.parse(req.body);
```

### 4. Tratamento de Erros

```typescript
// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Registro duplicado',
      field: err.meta?.target
    });
  }
  
  // Validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors
    });
  }
  
  // Generic error
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});
```

---

## 🔄 Ciclo de Vida de uma Requisição

```
1. Cliente faz requisição HTTP
   ↓
2. Next.js (se for rota de página)
   ├─ Server-side rendering
   └─ Ou redireciona para API route
   ↓
3. Express recebe requisição
   ↓
4. Middleware authenticate
   ├─ Extrai JWT do header
   ├─ Verifica validade
   └─ Decodifica e anexa user à request
   ↓
5. Middleware authorizeRole
   ├─ Verifica role do usuário
   └─ Permite ou nega acesso
   ↓
6. Middleware específico (canAccess, checkLimits)
   ├─ Consulta banco de dados
   └─ Verifica propriedade/limites
   ↓
7. Controller/Route Handler
   ├─ Valida dados de entrada
   ├─ Executa lógica de negócio
   └─ Interage com Prisma
   ↓
8. Prisma Client
   ├─ Gera SQL otimizado
   ├─ Executa no PostgreSQL
   └─ Retorna dados tipados
   ↓
9. Response
   ├─ Formata resposta JSON
   ├─ Define status code
   └─ Envia para cliente
   ↓
10. Frontend recebe resposta
    ├─ Atualiza estado (useState)
    ├─ Re-renderiza componentes
    └─ Exibe feedback ao usuário
```

---

**Arquitetura desenvolvida para escalabilidade e manutenibilidade**
