# Plano de Execução Paralela - Fases 3 & 4

## 🎯 Objetivo
Maximizar produtividade com 2 agentes trabalhando em paralelo sem conflitos.

---

## 🔵 AGENTE A: Infraestrutura e Build TypeScript

### Responsabilidades
Configurar compilação dos engines TypeScript e integrar com backend Express.

### Arquivos de Trabalho
- `tsconfig.build.json` (criar)
- `package.json` (adicionar scripts)
- `backend/routes/ai-engines.js` (atualizar imports)
- `deploy-production.sh` (adicionar build step)
- `/dist/ai/` (output compilado)

### Tarefas
1. **Criar `tsconfig.build.json`**
   - Configurar para compilar apenas `/core/ai`
   - Output: `/dist/ai`
   - Module: CommonJS (para compatibilidade com Express)

2. **Adicionar script `build:ai` em `package.json`**
   ```json
   "scripts": {
     "build:ai": "tsc --project tsconfig.build.json"
   }
   ```

3. **Atualizar `backend/routes/ai-engines.js`**
   - Substituir lógica inline por imports dos engines compilados
   - Exemplo: `const { DemandPredictor } = require('../../dist/ai/engines/demand-predictor');`

4. **Atualizar `deploy-production.sh`**
   - Adicionar `npm run build:ai` antes de `npm run build`

5. **Testar compilação**
   - Rodar `npm run build:ai`
   - Verificar que `/dist/ai` foi criado
   - Reiniciar backend e testar rotas

### ⚠️ Evitar Conflitos
- **NÃO TOCAR** em `prisma/schema.prisma`
- **NÃO TOCAR** em arquivos dentro de `core/ai/services/` (dados)
- **NÃO TOCAR** em migrations

---

## 🟢 AGENTE B: Dados e Banco de Dados

### Responsabilidades
Criar esquema de dados reais e conectar serviços à base de dados.

### Arquivos de Trabalho
- `prisma/schema.prisma` (adicionar models)
- `core/ai/services/stock-data.service.ts` (implementar queries)
- `core/ai/services/sales-data.service.ts` (implementar queries)
- `prisma/seed.ts` (criar dados de teste)

### Tarefas
1. **Modelar `Sale` em `prisma/schema.prisma`**
   ```prisma
   model Sale {
     id          String   @id @default(uuid())
     produtoId   String
     unidadeId   String
     quantidade  Int
     precoUnitario Decimal
     data        DateTime @default(now())
     // relações
     produto     Produto  @relation(fields: [produtoId], references: [id])
     unidade     Unidade  @relation(fields: [unidadeId], references: [id])
   }
   ```

2. **Modelar `StockMovement`**
   ```prisma
   model StockMovement {
     id         String   @id @default(uuid())
     produtoId  String
     unidadeId  String
     tipo       String   // "ENTRADA", "SAIDA", "AJUSTE"
     quantidade Int
     data       DateTime @default(now())
     // relações
   }
   ```

3. **Rodar migrações**
   ```bash
   npx prisma migrate dev --name add-sales-and-movements
   ```

4. **Implementar `SalesDataService.getHistoricoVendas()`**
   - Usar `prisma.sale.findMany()` com filtros de data
   - Calcular médias e tendências

5. **Implementar `StockDataService.getMovimentacoes()`**
   - Consultar movimentações recentes
   - Calcular saldo atual

6. **Criar `prisma/seed.ts` com dados realistas**
   - Gerar vendas dos últimos 90 dias
   - Gerar movimentações de estoque

### ⚠️ Evitar Conflitos
- **NÃO TOCAR** em `tsconfig.build.json`
- **NÃO TOCAR** em `backend/routes/ai-engines.js`
- **NÃO TOCAR** em scripts de build do `package.json`
- **NÃO TOCAR** em `/dist/ai/`

---

## 🔄 Pontos de Sincronia

### Checkpoint 1: Após Agente A completar build
- Agente B pode testar se os engines compilados funcionam
- Ambos podem validar que não há erros de TypeScript

### Checkpoint 2: Após Agente B completar migrations
- Agente A pode testar rotas com dados reais
- Ambos podem rodar testes de integração

---

## 📊 Critérios de Sucesso

### Agente A
- ✅ `npm run build:ai` executa sem erros
- ✅ `/dist/ai/` contém arquivos `.js` compilados
- ✅ Backend importa engines compilados sem erros
- ✅ `POST /api/ai-engines/demand` retorna dados (mesmo mock)

### Agente B
- ✅ Migrações rodam sem erros
- ✅ Queries Prisma retornam dados reais
- ✅ Seed script popula banco com dados de teste
- ✅ Serviços retornam dados estruturados corretamente

---

## 🚀 Ordem de Execução Recomendada

1. **Ambos iniciam simultaneamente**
2. **Agente A termina primeiro** (build mais rápido)
3. **Agente A testa com dados mock** enquanto Agente B continua
4. **Agente B termina migrations e seed**
5. **Ambos testam juntos** com dados reais

---

## 📝 Comunicação entre Agentes

**Ao completar uma tarefa**, comente aqui no chat.

**Se encontrar bloqueio**, sinalize imediatamente.
