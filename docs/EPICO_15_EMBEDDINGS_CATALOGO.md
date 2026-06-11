# Épico 15 — Embeddings catálogo + SKU nacional

MVP jun/2026.

## Objetivo

Unificar o **mesmo produto lógico** entre mercados (catálogo isolado v3) via `sku_nacional` + embedding TF leve, sem LLM nem vector DB externo.

## Modelo de dados

| Campo | Tipo | Uso |
|-------|------|-----|
| `sku_nacional` | `VARCHAR(128)` | `ean:{codigo}` ou `ins:{hash16}` |
| `embedding_json` | `JSONB` | Vetor TF esparso `{ t, w }[]` (até 48 tokens) |
| `chave_insight` | legado | Nome+marca+cat ou EAN textual |
| `nome_chave` | legado | Tokens normalizados do nome |

Migration: `20260601200000_produto_sku_nacional`

## Regras SKU

1. **EAN válido** → `ean:7891234567890`
2. **Sem EAN** → `ins:` + SHA256(`chaveInsight`).slice(0,16)

Prioridade na agregação (`chaveLogicaProduto`): `skuNacional` > EAN > `chaveInsight`.

## Módulos

| Arquivo | Função |
|---------|--------|
| `lib/sku-nacional/compute.ts` | `resolveSkuNacional`, `computeSkuNacionalFields` |
| `lib/sku-nacional/embedding.ts` | TF → JSON, similaridade cosseno |
| `lib/sku-nacional/resolver.ts` | Ofertas cross-mercado, backfill batch |
| `lib/produtos-chaves.ts` | Persiste chaves + SKU + embedding no write |

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/public/sku-nacional?sku=` | Ofertas do SKU em todos os mercados |
| GET | `/api/cliente/sku-nacional?produtoId=` | Resolve SKU do produto local + outros mercados |
| POST | `/api/admin/jobs/reindex-produto-chaves` | Recalcula chaves + SKU + embedding |
| POST | `/api/cron/sku-nacional-batch` | Backfill em lote (CRON_SECRET) |

## UI

- `SkuNacionalChip` no `ProductCard` — “+N mercados” quando o SKU existe noutras redes.

## Ops

```bash
# Backfill local/prod (lotes de 1000)
npm run db:backfill:sku-nacional
npm run db:backfill:sku-nacional -- --take=2000 --skip=1000

# Cron HTTP
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "https://precivox.com.br/api/cron/sku-nacional-batch?take=800"
```

## Testes

```bash
npm run test -- tests/unit/sku-nacional/sku-nacional.test.ts
```

## Próxima evolução (15+)

- Clustering por similaridade de embedding (>0.88) para fundir `ins:` diferentes
- Índice ANN se volume > 500k SKUs
- Gestor: painel “seu SKU vs rede regional”
