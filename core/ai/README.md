# 🤖 PRECIVOX AI Core - Módulos de Inteligência Artificial

## 📋 Visão Geral

Este diretório contém a infraestrutura base para os 4 módulos de IA do PRECIVOX:

1. **Demand Predictor** - Previsão de demanda baseada em histórico
2. **Stock Health Engine** - Análise de saúde do estoque e alertas
3. **Smart Pricing Engine** - Precificação inteligente e elasticidade
4. **GROOC Recommendation Engine** - Recomendações de produtos e rotas

## 🏗️ Estrutura de Diretórios

```
/core/ai/
├── engines/                    # Engines de IA
│   ├── demand-predictor/       # Previsão de demanda
│   │   ├── index.ts           # Entry point
│   │   ├── calculator.ts      # Lógica de cálculo
│   │   └── types.ts           # Interfaces TypeScript
│   ├── stock-health/          # Análise de estoque
│   │   ├── index.ts
│   │   ├── analyzer.ts
│   │   └── types.ts
│   ├── smart-pricing/         # Precificação inteligente
│   │   ├── index.ts
│   │   ├── calculator.ts
│   │   └── types.ts
│   └── grooc-recommendation/  # Recomendações GROOC
│       ├── index.ts
│       ├── recommender.ts
│       └── types.ts
├── services/                   # Camada de serviços
│   ├── stock-data.service.ts  # Acesso a dados de estoque
│   └── sales-data.service.ts  # Acesso a dados de vendas
├── utils/                      # Utilitários
│   ├── logger.ts              # Sistema de logs
│   └── metrics.ts             # Coleta de métricas
├── types/                      # Tipos compartilhados
│   └── common.ts
└── index.ts                    # Export principal
```

## 🚀 Como Usar

### 1. Demand Predictor

Prevê demanda futura baseada em histórico de vendas.

```typescript
import { DemandPredictor } from '@/core/ai';

const predictor = new DemandPredictor();

const result = await predictor.predict({
  produtoId: 'produto-123',
  unidadeId: 'unidade-456',
  periodoHistorico: 30,  // dias de histórico
  periodoPrevisao: 7      // dias para prever
});

console.log(result.data.previsoes);
console.log(result.data.tendencia); // CRESCENTE | ESTAVEL | DECRESCENTE
console.log(result.data.recomendacoes);
```

### 2. Stock Health Engine

Analisa saúde do estoque e gera alertas.

```typescript
import { StockHealthEngine } from '@/core/ai';

const engine = new StockHealthEngine();

const result = await engine.analyze({
  unidadeId: 'unidade-456',
  mercadoId: 'mercado-789',
  categorias: ['Alimentos', 'Bebidas'] // opcional
});

console.log(result.data.score);      // 0-100
console.log(result.data.status);     // CRITICO | ATENCAO | SAUDAVEL | OTIMO
console.log(result.data.alertas);    // Array de alertas
console.log(result.data.metricas);   // Métricas gerais
```

### 3. Smart Pricing Engine

Analisa elasticidade de preço e sugere precificação ótima.

```typescript
import { SmartPricingEngine } from '@/core/ai';

const engine = new SmartPricingEngine();

const result = await engine.analyze({
  produtoId: 'produto-123',
  unidadeId: 'unidade-456',
  precoAtual: 15.90,
  custoProduto: 10.00 // opcional
});

console.log(result.data.elasticidade);
console.log(result.data.precoOtimo);
console.log(result.data.impactoEstimado);
console.log(result.data.recomendacoes);
```

### 4. GROOC Recommendation Engine

Recomenda produtos e otimiza rotas de compra.

```typescript
import { GROOCRecommendationEngine } from '@/core/ai';

const engine = new GROOCRecommendationEngine();

const result = await engine.recommend({
  produtos: ['produto-1', 'produto-2', 'produto-3'],
  localizacaoUsuario: {
    latitude: -23.550520,
    longitude: -46.633308
  },
  preferencias: {
    prefereMenorPreco: true,
    prefereMenorDistancia: false,
    distanciaMaxima: 10 // km
  }
});

console.log(result.data.recomendacoes);
console.log(result.data.rotaOtimizada);
console.log(result.data.economiaEstimada);
```

## 🔌 API Endpoints

Todos os engines possuem endpoints REST correspondentes:

### POST /api/ai/demand-prediction
```json
{
  "produtoId": "produto-123",
  "unidadeId": "unidade-456",
  "periodoHistorico": 30,
  "periodoPrevisao": 7
}
```

### POST /api/ai/stock-health
```json
{
  "unidadeId": "unidade-456",
  "mercadoId": "mercado-789",
  "categorias": ["Alimentos"]
}
```

### POST /api/ai/smart-pricing
```json
{
  "produtoId": "produto-123",
  "unidadeId": "unidade-456",
  "precoAtual": 15.90,
  "custoProduto": 10.00
}
```

### POST /api/ai/grooc-recommendations
```json
{
  "produtos": ["produto-1", "produto-2"],
  "localizacaoUsuario": {
    "latitude": -23.550520,
    "longitude": -46.633308
  },
  "preferencias": {
    "prefereMenorPreco": true
  }
}
```

## 📊 Sistema de Logs

Todos os engines utilizam um sistema de logs centralizado:

```typescript
import { logger } from '@/core/ai';

// Visualizar logs de um engine específico
const logs = logger.getLogs('DemandPredictor');

// Visualizar apenas erros
const errors = logger.getLogs(undefined, 'error');

// Estatísticas
const stats = logger.getStats();
console.log(stats.byEngine);
console.log(stats.byLevel);
```

## 📈 Métricas de Performance

Coleta automática de métricas de execução:

```typescript
import { metricsCollector } from '@/core/ai';

// Obter estatísticas de um engine
const stats = metricsCollector.getStats('DemandPredictor');

console.log(stats.avgExecutionTime);
console.log(stats.avgSuccessRate);
console.log(stats.totalExecutions);
```

## ⚠️ Implementações MOCK

**IMPORTANTE**: Todas as implementações atuais são MOCK (simuladas) e devem ser substituídas por modelos reais de Machine Learning.

### O que é MOCK:
- ✅ Estrutura de código e interfaces
- ✅ Sistema de logs e métricas
- ✅ Integração com banco de dados
- ✅ API endpoints funcionais
- ❌ Cálculos baseados em regras heurísticas simples
- ❌ Dados históricos simulados aleatoriamente
- ❌ Sem modelos ML treinados

### Próximos Passos:

1. **Demand Predictor**
   - Implementar ARIMA, Prophet ou LSTM
   - Criar tabela de vendas no banco
   - Treinar modelo com dados históricos reais

2. **Stock Health Engine**
   - Implementar detecção de anomalias (Isolation Forest)
   - Criar tabela de movimentações de estoque
   - Adicionar análise de ciclo de vida do produto

3. **Smart Pricing Engine**
   - Implementar modelo de elasticidade de preço
   - Integrar web scraping de concorrentes
   - Adicionar análise de correlação entre produtos

4. **GROOC Engine**
   - Implementar algoritmo de otimização de rotas (TSP)
   - Adicionar análise de cestas de compras (Apriori/FP-Growth)
   - Integrar API de mapas para rotas reais

## 🔗 Integração com Banco de Dados

Os engines já estão integrados com o Prisma e utilizam as seguintes tabelas:

- `produtos` - Campos de IA: `giroEstoqueMedio`, `elasticidadePreco`, `demandaPrevista7d`, etc.
- `estoques` - Dados de estoque por unidade
- `alertas_ia` - Alertas gerados pelos engines
- `analises_ia` - Histórico de análises
- `metricas_dashboard` - Métricas agregadas

## 📝 Exemplo Completo

```typescript
import { AIEngineFactory } from '@/core/ai';

// Criar todas as engines
const engines = AIEngineFactory.createAll();

// Executar análise completa de uma unidade
async function analyzeUnidade(unidadeId: string, mercadoId: string) {
  // 1. Analisar saúde do estoque
  const healthResult = await engines.stockHealth.analyze({
    unidadeId,
    mercadoId
  });

  console.log(`Score de saúde: ${healthResult.data.score}/100`);
  console.log(`Alertas: ${healthResult.data.alertas.length}`);

  // 2. Para cada produto em risco, prever demanda
  for (const alerta of healthResult.data.alertas) {
    if (alerta.tipo === 'RUPTURA') {
      const demandResult = await engines.demandPredictor.predict({
        produtoId: alerta.produtoId,
        unidadeId,
        periodoHistorico: 30,
        periodoPrevisao: 7
      });

      console.log(`Produto: ${alerta.produtoNome}`);
      console.log(`Demanda prevista (7d): ${demandResult.data.metricas.totalPrevisto}`);
      console.log(`Recomendação: ${alerta.acaoRecomendada}`);
    }
  }
}
```

## 🛠️ Desenvolvimento

Para adicionar um novo engine:

1. Criar diretório em `/core/ai/engines/novo-engine/`
2. Criar arquivos: `index.ts`, `calculator.ts`, `types.ts`
3. Implementar interface `AIEngineResult<T>`
4. Adicionar logs usando `logger`
5. Registrar métricas usando `metricsCollector`
6. Exportar no `/core/ai/index.ts`
7. Criar endpoint em `/app/api/ai/novo-engine/route.ts`

## 📚 Documentação Adicional

- [Implementation Plan](/root/.gemini/antigravity/brain/b6a3062a-e47c-4af1-9804-b995f0631bba/implementation_plan.md)
- [Painel IA Gestor](/root/PAINEL_IA_GESTOR_REVISAO.md)

---

**Versão**: 1.0.0-mock  
**Status**: ✅ Estrutura base implementada - Aguardando modelos ML reais  
**Última atualização**: 25/11/2025
