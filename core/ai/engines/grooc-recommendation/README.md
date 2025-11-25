# 🎯 GROOC Engine v2.0 - Enhanced Recommendation System

## 📋 Visão Geral

O motor GROOC (Grocery Optimization and Comparison) foi completamente redesenhado para fornecer recomendações inteligentes baseadas em **6 critérios principais**:

1. ✅ **Custo-Benefício** - Melhor relação preço/qualidade
2. ✅ **Histórico do Usuário** - Baseado em compras anteriores
3. ✅ **Estoque Disponível** - Considera disponibilidade real
4. ✅ **Marca Preferida** - Prioriza marcas favoritas
5. ✅ **Opções Saudáveis** - Sugere alternativas mais saudáveis
6. ✅ **Ordenação Multi-Critério** - Preço, estoque e compatibilidade

## 🚀 Como Usar

### Endpoint

```
POST /api/ai-engines/grooc
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Estrutura da Requisição

```json
{
  "produtos": [
    {
      "nome": "Arroz Integral",
      "categoria": "Alimentos",
      "quantidade": 2,
      "precoMaximo": 25.00
    },
    {
      "nome": "Leite Desnatado",
      "categoria": "Laticínios",
      "quantidade": 3,
      "precoMaximo": 6.50
    }
  ],
  "localizacaoUsuario": {
    "latitude": -23.550520,
    "longitude": -46.633308
  },
  "preferencias": {
    "prefereMenorPreco": true,
    "prefereMenorDistancia": false,
    "marcasPreferidas": ["Marca Premium", "Marca Orgânica"],
    "marcasEvitar": ["Marca X"],
    "categoriasEvitar": ["Congelados"],
    "opcoesSaudaveis": true,
    "distanciaMaxima": 10,
    "aceitaSubstitutos": true
  },
  "historicoUsuario": {
    "produtosComprados": [
      {
        "produtoId": "prod-123",
        "nome": "Arroz Integral Marca Premium",
        "marca": "Marca Premium",
        "categoria": "Alimentos",
        "preco": 22.90,
        "quantidade": 1,
        "dataCompra": "2025-11-20T10:00:00Z",
        "satisfacao": 5
      }
    ],
    "marcasFrequentes": ["Marca Premium", "Marca Orgânica"],
    "categoriasFrequentes": ["Alimentos", "Laticínios"],
    "precoMedioGasto": 50.00,
    "frequenciaCompra": "ALTA"
  }
}
```

### Estrutura da Resposta

```json
{
  "success": true,
  "data": {
    "recomendacoes": [
      {
        "produtoOriginal": "Arroz Integral",
        "produtoId": "prod-001",
        "produtoNome": "Arroz Integral Marca Premium 1kg",
        "tipo": "MELHOR_PRECO",
        "unidadeSugerida": "unidade-centro",
        "unidadeNome": "Unidade Centro",
        "preco": 21.90,
        "precoOriginal": null,
        "economia": 3.10,
        "economiaPercentual": 12.4,
        "distancia": 2.5,
        "estoque": 45,
        "marca": "Marca Premium",
        "categoria": "Alimentos",
        "scores": {
          "custoBeneficio": 92,
          "compatibilidade": 95,
          "estoque": 90,
          "saude": 85,
          "preferencia": 88,
          "total": 91
        },
        "atributosSaude": {
          "calorias": 150,
          "gorduras": 2,
          "acucares": 0,
          "sodio": 5,
          "organico": false,
          "integral": true,
          "semGluten": false,
          "semLactose": true,
          "vegano": true
        },
        "justificativa": [
          "Economia de R$ 3.10 (12.4%)",
          "Excelente custo-benefício",
          "Compatível com suas preferências",
          "Estoque abundante"
        ],
        "confianca": 0.91,
        "prioridade": "ALTA"
      }
    ],
    "rotaOtimizada": {
      "unidades": [
        {
          "unidadeId": "unidade-centro",
          "unidadeNome": "Unidade Centro",
          "endereco": "Rua Principal, 123 - Centro",
          "produtos": [...],
          "ordem": 1,
          "distancia": 2.5,
          "tempoEstimado": 18,
          "economiaAcumulada": 15.50,
          "latitude": -23.551020,
          "longitude": -46.633808
        }
      ],
      "distanciaTotal": 5.8,
      "tempoEstimado": 35,
      "economiaTotal": 25.80,
      "eficiencia": 4.45,
      "ordemOtimizada": true
    },
    "economiaEstimada": 25.80,
    "tempoEstimado": 35,
    "resumo": {
      "totalProdutos": 2,
      "totalRecomendacoes": 6,
      "economiaTotal": 25.80,
      "economiaMedia": 4.30,
      "scoreGeralSaude": 78,
      "scoreGeralCustoBeneficio": 85,
      "produtosForaEstoque": 0,
      "produtosSubstituidos": 1
    }
  },
  "metadata": {
    "engineName": "GROOCEngine",
    "executionTime": 245,
    "timestamp": "2025-11-25T18:40:00Z",
    "version": "2.0.0-enhanced",
    "userId": "user-123",
    "criteriosAplicados": {
      "custoBeneficio": true,
      "historicoUsuario": true,
      "estoqueConsiderado": true,
      "marcaPreferida": true,
      "opcoesSaudaveis": true,
      "ordenacaoMultiCriterio": true
    }
  }
}
```

## 📊 Sistema de Scores

Cada recomendação recebe **5 scores** (0-100) que são combinados em um **score total**:

### 1. Custo-Benefício (30% do total)
- Avalia relação preço/qualidade
- Considera promoções e descontos
- Peso maior se `prefereMenorPreco: true`

### 2. Compatibilidade (25% do total)
- Similaridade com produto solicitado
- Correspondência de nome e categoria
- 100 = correspondência exata

### 3. Estoque (15% do total)
- Disponibilidade do produto
- 100 = estoque abundante (2x quantidade solicitada)
- 0 = sem estoque

### 4. Saúde (5-15% do total)
- Atributos nutricionais
- Palavras-chave: integral, light, orgânico, etc.
- Peso maior se `opcoesSaudaveis: true`

### 5. Preferência do Usuário (20% do total)
- Marca preferida
- Histórico de compras
- Categorias frequentes
- Faixa de preço habitual

## 🎯 Tipos de Recomendação

- **MELHOR_PRECO**: Melhor custo-benefício encontrado
- **SUBSTITUTO**: Produto similar ao solicitado
- **PROMOCAO**: Produto em promoção especial
- **MAIS_SAUDAVEL**: Opção com melhores atributos nutricionais
- **COMPLEMENTAR**: Produto que complementa a compra

## 🗺️ Otimização de Rota

Quando `localizacaoUsuario` é fornecida, o sistema:

1. **Agrupa** produtos por unidade
2. **Calcula** distância e tempo estimado
3. **Ordena** paradas por:
   - Economia (se `prefereMenorPreco: true`)
   - Distância (se `prefereMenorDistancia: true`)
   - Score total (padrão)
4. **Retorna** rota otimizada com:
   - Ordem de visita
   - Tempo total estimado
   - Economia acumulada
   - Eficiência (economia/km)

## 💡 Dicas de UX

### Exibir Scores Visualmente

```jsx
<div className="score-bar">
  <div className="score-fill" style={{ width: `${score.total}%` }}>
    {score.total}
  </div>
</div>
```

### Badges de Tipo

```jsx
const badges = {
  MELHOR_PRECO: { color: 'green', icon: '💰', label: 'Melhor Preço' },
  PROMOCAO: { color: 'red', icon: '🔥', label: 'Promoção' },
  MAIS_SAUDAVEL: { color: 'blue', icon: '🥗', label: 'Saudável' },
  SUBSTITUTO: { color: 'yellow', icon: '🔄', label: 'Substituto' }
};
```

### Ordenação Customizada

```javascript
// Ordenar por preço
recomendacoes.sort((a, b) => a.preco - b.preco);

// Ordenar por economia
recomendacoes.sort((a, b) => b.economia - a.economia);

// Ordenar por score de saúde
recomendacoes.sort((a, b) => b.scores.saude - a.scores.saude);

// Ordenar por prioridade + score total (padrão)
recomendacoes.sort((a, b) => {
  if (a.prioridade !== b.prioridade) {
    const order = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
    return order[a.prioridade] - order[b.prioridade];
  }
  return b.scores.total - a.scores.total;
});
```

### Filtros Úteis

```javascript
// Apenas alta prioridade
const topRecommendations = recomendacoes.filter(r => r.prioridade === 'ALTA');

// Apenas com estoque
const inStock = recomendacoes.filter(r => r.estoque > 0);

// Apenas opções saudáveis
const healthy = recomendacoes.filter(r => r.scores.saude >= 70);

// Apenas promoções
const onSale = recomendacoes.filter(r => r.tipo === 'PROMOCAO');
```

## 🔧 Personalização

### Ajustar Pesos dos Scores

Para ajustar a importância de cada critério, modifique os pesos no código:

```typescript
const weights = {
  custoBeneficio: 0.30,  // 30%
  compatibilidade: 0.25, // 25%
  estoque: 0.15,         // 15%
  saude: 0.15,           // 15%
  preferencia: 0.20      // 20%
};
```

### Configurar Preferências Padrão

```typescript
const defaultPreferences = {
  prefereMenorPreco: true,
  prefereMenorDistancia: false,
  opcoesSaudaveis: false,
  distanciaMaxima: 15,
  aceitaSubstitutos: true
};
```

## 📈 Métricas e Analytics

Acompanhe o desempenho do GROOC:

```javascript
// Taxa de aceitação
const taxaAceitacao = recomendacoesAceitas / totalRecomendacoes;

// Economia média realizada
const economiaMedia = totalEconomizado / totalCompras;

// Score médio das recomendações aceitas
const scoresMedios = recomendacoesAceitas.map(r => r.scores.total);
const scoreMedio = scoresMedios.reduce((a, b) => a + b) / scoresMedios.length;
```

## 🚀 Próximas Melhorias

- [ ] Integração com ML para previsão de preferências
- [ ] Análise de cestas de compras (market basket analysis)
- [ ] Algoritmo TSP real para otimização de rotas
- [ ] Dados nutricionais reais via API
- [ ] Comparação de preços com concorrentes
- [ ] Recomendações baseadas em sazonalidade
- [ ] Sistema de feedback do usuário
- [ ] A/B testing de algoritmos de recomendação

---

**Versão**: 2.0.0-enhanced  
**Última atualização**: 25/11/2025  
**Documentado por**: Antigravity AI
