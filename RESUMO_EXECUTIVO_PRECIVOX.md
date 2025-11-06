# 📊 RESUMO EXECUTIVO - PRECIVOX

**Sistema de Gestão de Mercados e Comparação de Preços com Inteligência Artificial**

---

## 🎯 VISÃO GERAL

O **PRECIVOX** é uma plataforma completa de gestão de mercados e supermercados que oferece:
- **Gestão multi-unidade** de mercados e filiais
- **Controle de estoque** por unidade
- **Upload em massa** de produtos via CSV/Excel
- **Sistema de permissões hierárquicas** (Admin, Gestor, Cliente)
- **Painel de Inteligência Artificial** para análise preditiva
- **Comparação de preços** para consumidores
- **Análise de demanda e previsões** automáticas

---

## 🎯 PROPÓSITO E OBJETIVO

### Para que serve o PRECIVOX?

O sistema foi desenvolvido para resolver os seguintes problemas do varejo:

1. **Gestão Descentralizada de Filiais**
   - Permite que mercados com múltiplas unidades gerenciem estoque, preços e produtos de forma centralizada
   - Cada unidade mantém seu próprio controle independente

2. **Automação de Importação de Dados**
   - Elimina a necessidade de cadastro manual de produtos
   - Suporta upload em massa de milhares de produtos via CSV/XLSX
   - Processa e valida dados automaticamente

3. **Inteligência de Negócios**
   - Análise preditiva de demanda
   - Sugestões automáticas de reposição de estoque
   - Alertas inteligentes sobre produtos em falta
   - Recomendações de preços e promoções

4. **Comparação de Preços para Consumidores**
   - Clientes podem comparar preços entre diferentes mercados
   - Identificação de promoções e melhores ofertas
   - Criação de listas de compras otimizadas

---

## 🏗️ ARQUITETURA TÉCNICA

### Stack Tecnológica

#### Frontend
- **Next.js 14** (React Framework com App Router)
- **TypeScript** (Tipagem estática)
- **Tailwind CSS** (Estilização)
- **React Hooks** (Gerenciamento de estado)

#### Backend
- **Express.js** (Framework Node.js)
- **Prisma ORM** (Abstração de banco de dados)
- **PostgreSQL** (Banco de dados relacional)
- **JWT** (Autenticação stateless)
- **Multer** (Upload de arquivos)
- **PapaParse** (Processamento de CSV)
- **XLSX** (Processamento de Excel)

#### Banco de Dados
- **PostgreSQL 14+** (Banco relacional)
- **Prisma Client** (ORM type-safe)

### Arquitetura de Camadas

```
┌─────────────────────────────────────┐
│     FRONTEND (Next.js 14)           │
│  - Admin Dashboard                  │
│  - Gestor Dashboard                 │
│  - Cliente Interface                │
│  - Painel IA                        │
└──────────────┬──────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────┐
│     BACKEND (Express)               │
│  - API Routes                       │
│  - Middlewares (Auth, Permissions)  │
│  - Business Logic                   │
│  - Upload Handler                   │
└──────────────┬──────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────┐
│     DATABASE (PostgreSQL)           │
│  - Users, Mercados, Unidades        │
│  - Produtos, Estoque                │
│  - Planos, Logs, Análises IA       │
└─────────────────────────────────────┘
```

---

## 🔄 COMO OPERA

### Fluxo Principal de Funcionamento

#### 1. **Autenticação e Autorização**
```
Usuário → Login → JWT Token → Middleware de Autenticação → 
Verificação de Role → Acesso Autorizado → Dashboard
```

- Sistema de autenticação baseado em **JWT (JSON Web Tokens)**
- Três níveis de permissão: **ADMIN**, **GESTOR**, **CLIENTE**
- Middleware verifica permissões em cada requisição
- Redirecionamento automático baseado no tipo de usuário

#### 2. **Gestão de Mercados**
```
Admin → Cria Mercado → Associa Plano → Associa Gestor → 
Gestor gerencia unidades → Upload de produtos → 
Controle de estoque por unidade
```

#### 3. **Upload de Base de Dados**
```
Gestor/Admin → Seleciona arquivo CSV/XLSX → Seleciona unidade → 
Upload → Validação → Processamento linha por linha → 
Busca/Cria produto → Cria/Atualiza estoque → 
Log de importação → Relatório de resultados
```

**Processo detalhado:**
1. Validação de formato e tamanho do arquivo
2. Verificação de limites do plano
3. Criação de log de importação (status: PROCESSANDO)
4. Leitura e parsing do arquivo
5. Para cada linha:
   - Valida campos obrigatórios (nome, preço, quantidade)
   - Busca produto existente por código de barras ou nome+marca
   - Cria produto se não existir
   - Cria ou atualiza estoque na unidade especificada
6. Registra erros e duplicados
7. Atualiza log de importação (status: CONCLUIDO/PARCIAL/FALHA)
8. Retorna relatório detalhado

#### 4. **Sistema de Permissões Hierárquicas**

**ADMIN (Super Usuário)**
- Acesso total ao sistema
- Cria, edita e exclui mercados
- Gerencia planos de pagamento
- Associa gestores aos mercados
- Visualiza todos os logs
- Upload de dados para qualquer mercado

**GESTOR (Gerente de Mercado)**
- Acesso limitado ao(s) mercado(s) que gerencia
- Edita informações do próprio mercado
- Gerencia unidades do mercado
- Faz upload de base de dados
- Visualiza logs do seu mercado
- Acessa Painel de IA para análises
- **NÃO pode:**
  - Criar novos mercados
  - Mudar plano de pagamento
  - Mudar gestor associado

**CLIENTE (Consumidor)**
- Visualiza informações públicas dos mercados
- Consulta produtos e preços
- Compara preços entre mercados/unidades
- Cria listas de compras
- **NÃO pode modificar nada**

---

## 🗄️ ESTRUTURA DE DADOS

### Modelos Principais

#### **Users (Usuários)**
- `id`, `email`, `nome`, `senha` (hashed), `role` (ADMIN/GESTOR/CLIENTE)
- `telefone`, `cpf`, `avatar`, `ativo`

#### **Mercados**
- `id`, `nome`, `cnpj` (único), `descricao`
- `telefone`, `emailContato`, `horarioFuncionamento`
- `logo`, `ativo`, `planoId`, `gestorId`

#### **Unidades (Filiais)**
- `id`, `nome`, `endereco`, `cidade`, `estado`, `cep`
- `telefone`, `horarioFuncionamento`
- `latitude`, `longitude` (para geolocalização)
- `ativa`, `mercadoId`

#### **Produtos**
- `id`, `nome`, `descricao`, `categoria`
- `codigoBarras` (único), `marca`, `unidadeMedida`
- `imagem`, `ativo`
- **Campos IA:**
  - `giroEstoqueMedio`, `elasticidadePreco`
  - `demandaPrevista7d`, `demandaPrevista30d`
  - `pontoReposicao`, `margemContribuicao`
  - `scoreSazonalidade`, `categoriaABC`

#### **Estoque**
- `id`, `quantidade`, `preco`, `precoPromocional`
- `emPromocao`, `disponivel`
- `unidadeId`, `produtoId`
- **Constraint:** Um produto por unidade (único)

#### **Planos de Pagamento**
- `id`, `nome`, `descricao`, `valor`, `duracao`
- `limiteUnidades` (número máximo de filiais)
- `limiteUploadMb` (tamanho máximo de arquivo)
- `limiteUsuarios` (número máximo de usuários)

#### **Logs de Importação**
- `id`, `nomeArquivo`, `tamanhoBytes`
- `totalLinhas`, `linhasSucesso`, `linhasErro`, `linhasDuplicadas`
- `status` (PROCESSANDO/CONCLUIDO/FALHA/PARCIAL)
- `mensagemErro`, `detalhesErros` (JSON)
- `dataInicio`, `dataFim`, `mercadoId`

#### **Análises IA**
- `id`, `mercadoId`, `unidadeId`, `produtoId`
- `tipo`, `categoria`, `resultado` (JSON)
- `recomendacao`, `prioridade`
- `impactoEstimado`, `status` (PENDENTE/ACEITA/EXECUTADA)
- `feedbackGestor`, `criadoEm`, `expiraEm`

#### **Alertas IA**
- `id`, `mercadoId`, `unidadeId`, `produtoId`
- `tipo`, `titulo`, `descricao`, `prioridade`
- `acaoRecomendada`, `linkAcao`
- `lido`, `lidoEm`, `criadoEm`, `expiradoEm`

#### **Métricas Dashboard**
- `id`, `mercadoId`, `unidadeId`, `data`, `periodo`
- `giroEstoqueGeral`, `taxaRuptura`, `valorEstoque`
- `diasCobertura`, `produtosAtivos`, `produtosInativos`
- `ticketMedio`, `quantidadeVendas`, `faturamentoDia`
- `margemLiquida`, `margemBruta`, `taxaConversao`
- `clientesAtivos`, `clientesNovos`, `nps`, `churnRate`
- `variacaoD1`, `variacaoD7`, `variacaoD30` (JSON)

### Relacionamentos

```
User (Gestor) ──gerencia──> Mercado
                              ├── possui ──> PlanoPagamento
                              ├── possui ──> Unidade[]
                              │                  └── possui ──> Estoque[]
                              │                                      └── referencia ──> Produto
                              ├── possui ──> LogImportacao[]
                              ├── possui ──> AnalisesIA[]
                              ├── possui ──> AlertasIA[]
                              └── possui ──> MetricasDashboard[]
```

---

## 🚀 FUNCIONALIDADES PRINCIPAIS

### 1. **Gestão de Mercados**
- Criação, edição e exclusão de mercados
- Associação de planos de pagamento
- Associação de gestores
- Upload de logo
- Informações de contato e horários

### 2. **Gestão de Unidades (Filiais)**
- Criação de múltiplas unidades por mercado
- Informações de endereço e localização
- Controle independente de estoque por unidade
- Status ativo/inativo

### 3. **Upload de Base de Dados**
- Suporte a arquivos **CSV** e **XLSX**
- Processamento em massa de produtos
- Validação automática de dados
- Tratamento de erros e duplicados
- Log detalhado de importações
- Limites configuráveis por plano

**Colunas obrigatórias:**
- `nome` - Nome do produto
- `preco` - Preço do produto
- `quantidade` - Quantidade em estoque

**Colunas opcionais:**
- `descricao`, `categoria`, `codigo_barras`, `ean`
- `marca`, `unidade_medida`, `preco_promocional`, `em_promocao`

### 4. **Controle de Estoque**
- Estoque independente por unidade
- Controle de quantidade disponível
- Preços regulares e promocionais
- Status de disponibilidade
- Atualização via upload ou manual

### 5. **Painel de Inteligência Artificial**
- **Análise de Demanda:**
  - Previsão de demanda (7 e 30 dias)
  - Identificação de produtos em falta
  - Sugestões de reposição
  
- **Análise de Preços:**
  - Elasticidade de preço
  - Recomendações de ajuste
  - Análise de margem
  
- **Alertas Inteligentes:**
  - Produtos próximos ao fim
  - Oportunidades de promoção
  - Anomalias de vendas
  
- **Categorização ABC:**
  - Classificação automática de produtos
  - Foco em produtos de alto giro

### 6. **Dashboard de Métricas**
- KPIs em tempo real
- Giro de estoque
- Taxa de ruptura
- Valor total de estoque
- Dias de cobertura
- Ticket médio
- Faturamento
- Margens (líquida e bruta)
- Taxa de conversão
- Clientes ativos e novos
- NPS e Churn Rate
- Variações (D1, D7, D30)

### 7. **Comparação de Preços (Cliente)**
- Busca de produtos
- Comparação entre mercados
- Comparação entre unidades
- Identificação de promoções
- Criação de listas de compras

### 8. **Sistema de Logs**
- Log detalhado de todas as importações
- Rastreamento de erros
- Estatísticas de sucesso/falha
- Histórico completo de operações

---

## ⚙️ REQUISITOS TÉCNICOS

### Pré-requisitos de Infraestrutura

#### **Servidor**
- **Sistema Operacional:** Linux (recomendado Ubuntu 20.04+)
- **RAM:** Mínimo 2GB (recomendado 4GB+)
- **CPU:** 2 cores (recomendado 4+ cores)
- **Disco:** 20GB+ de espaço livre
- **Rede:** Conexão estável com internet

#### **Software**
- **Node.js:** Versão 18.0 ou superior
- **npm ou yarn:** Gerenciador de pacotes
- **PostgreSQL:** Versão 14.0 ou superior
- **Git:** Para controle de versão (opcional)

### Variáveis de Ambiente Obrigatórias

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/precivox?schema=public"

# JWT (Autenticação)
JWT_SECRET="chave-secreta-super-segura-aqui"

# Servidor
PORT=3001
NODE_ENV=production

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# NextAuth (opcional - para login social)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="outra-chave-secreta-aqui"

# OAuth Providers (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

### Dependências do Sistema

#### **Backend (Node.js)**
- Express.js (servidor web)
- Prisma (ORM)
- JWT (autenticação)
- bcryptjs (hash de senhas)
- Multer (upload de arquivos)
- PapaParse (processamento CSV)
- XLSX (processamento Excel)
- Zod (validação de dados)
- CORS (controle de acesso)

#### **Frontend (Next.js)**
- React 18+
- Next.js 14+
- TypeScript
- Tailwind CSS
- React Hook Form
- Axios (cliente HTTP)
- Lucide React (ícones)

### Configuração do Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE precivox;

-- Criar usuário (opcional)
CREATE USER precivox_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE precivox TO precivox_user;
```

### Comandos de Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp env.example .env
# Editar .env com suas configurações

# 3. Gerar Prisma Client
npm run prisma:generate

# 4. Executar migrations
npm run prisma:migrate

# 5. (Opcional) Popular banco com dados de teste
npm run prisma:seed

# 6. Iniciar desenvolvimento
npm run dev

# 7. Build para produção
npm run build

# 8. Iniciar produção
npm start
```

---

## 📋 FORMATO DE ARQUIVOS DE UPLOAD

### CSV (Comma Separated Values)

**Exemplo:**
```csv
nome,preco,quantidade,categoria,codigo_barras,marca
Arroz 5kg,25.90,100,Alimentos,7891234567890,Tio João
Feijão 1kg,8.50,150,Alimentos,7891234567891,Camil
Açúcar 1kg,4.20,200,Alimentos,7891234567892,União
```

### XLSX (Excel)

Mesmas colunas do CSV, mas em formato Excel.

### Validações Aplicadas

- **Campos obrigatórios:** nome, preço, quantidade
- **Tipos de dados:** preço e quantidade devem ser numéricos
- **Duplicatas:** Sistema detecta produtos duplicados na mesma unidade
- **Limites do plano:** Tamanho do arquivo e número de produtos respeitam limites do plano

---

## 🔐 SEGURANÇA

### Camadas de Segurança Implementadas

1. **Autenticação JWT**
   - Tokens com expiração
   - Renovação automática
   - Validação em cada requisição

2. **Autorização Baseada em Roles**
   - Middleware de verificação de permissões
   - Controle de acesso granular
   - Verificação de propriedade de recursos

3. **Hash de Senhas**
   - bcryptjs com salt rounds
   - Senhas nunca armazenadas em texto plano

4. **Validação de Dados**
   - Validação no frontend (Zod)
   - Validação no backend
   - Sanitização de inputs

5. **Proteção contra SQL Injection**
   - Prisma ORM (prepared statements)
   - Queries parametrizadas

6. **CORS Configurado**
   - Controle de origens permitidas
   - Headers de segurança

7. **Upload Seguro**
   - Validação de tipo de arquivo
   - Limite de tamanho
   - Sanitização de nomes de arquivo

---

## 📊 MÉTRICAS E MONITORAMENTO

### Logs de Importação

Cada upload gera um log detalhado com:
- Nome do arquivo
- Tamanho em bytes
- Total de linhas processadas
- Linhas com sucesso
- Linhas com erro
- Linhas duplicadas
- Status (PROCESSANDO/CONCLUIDO/FALHA/PARCIAL)
- Detalhes de erros (linha, mensagem, dados)
- Timestamps (início e fim)

### Métricas de Performance

- Tempo de processamento por upload
- Taxa de sucesso de importações
- Produtos processados por segundo
- Erros mais comuns

---

## 🚀 DEPLOY EM PRODUÇÃO

### Configuração Recomendada

#### **Servidor de Aplicação**
- **PM2** para gerenciamento de processos
- **Nginx** como proxy reverso
- **SSL/HTTPS** com Let's Encrypt

#### **Banco de Dados**
- **PostgreSQL** em servidor dedicado ou cloud
- Backups automáticos configurados
- Conexões pool configuradas

#### **Arquivos Estáticos**
- CDN para assets (opcional)
- Cache de arquivos estáticos
- Compressão gzip

### Scripts de Deploy

```bash
# Build de produção
npm run build

# Iniciar com PM2
pm2 start npm --name "precivox" -- start

# Salvar configuração PM2
pm2 save
pm2 startup
```

---

## 📈 DIFERENCIAIS TÉCNICOS

1. **Arquitetura Moderna**
   - Next.js 14 com App Router
   - TypeScript end-to-end
   - ORM type-safe (Prisma)

2. **Escalabilidade**
   - Separação de frontend e backend
   - Banco de dados relacional otimizado
   - Índices em queries frequentes

3. **Inteligência Artificial**
   - Análise preditiva de demanda
   - Recomendações automatizadas
   - Alertas inteligentes

4. **Flexibilidade**
   - Sistema de planos configurável
   - Limites personalizáveis
   - Multi-tenant (múltiplos mercados)

5. **Manutenibilidade**
   - Código tipado (TypeScript)
   - Documentação completa
   - Estrutura modular

---

## 🎯 CASOS DE USO

### Caso 1: Supermercado com 3 Filiais
- Criação de 1 mercado com 3 unidades
- Upload de base de produtos para cada unidade
- Controle de estoque independente por filial
- Gestor visualiza dados consolidados e por unidade
- IA sugere reposições baseadas em demanda prevista

### Caso 2: Rede de Mercados
- Admin cria múltiplos mercados
- Cada mercado tem seu próprio gestor
- Cada mercado tem seu plano de pagamento
- Comparação de preços entre mercados diferentes
- Clientes comparam preços entre todos os mercados

### Caso 3: Importação em Massa
- Gestor recebe planilha Excel com 10.000 produtos
- Faz upload da planilha
- Sistema processa em segundos
- Relatório mostra: 9.500 sucessos, 400 duplicados, 100 erros
- Gestor corrige erros e reenvia

---

## 📞 INFORMAÇÕES DE CONTATO E SUPORTE

### Documentação Adicional
- `README.md` - Documentação completa
- `ARQUITETURA.md` - Detalhes técnicos de arquitetura
- `COMO_USAR_SISTEMA.md` - Guia de uso
- `DEPLOY_PRODUCAO_PRECIVOX.md` - Guia de deploy

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Prisma Studio (interface visual do banco)
npm run prisma:studio

# Seed (dados de teste)
npm run prisma:seed

# Migrations
npm run prisma:migrate
```

---

## ✅ STATUS DO PROJETO

**Versão:** 7.0  
**Status:** ✅ Produção  
**Última Atualização:** Outubro 2025  
**URL:** https://precivox.com.br (se configurado)

---

**Desenvolvido para escalabilidade, manutenibilidade e performance**

