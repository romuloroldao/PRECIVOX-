# Épico 12 — ML leve (Fase 3) ✅

> Heurísticas + batch sobre `user_events`. Sem modelo pesado; IA explicável.

## Entregas

| # | Feature | Onde |
|---|---------|------|
| 12.1 | **Basket completion** | `lib/ml-leve/basket-completion.ts`, `BasketCompletionBlock`, `GET /api/cliente/basket-completion` |
| 12.2 | **Churn heurístico** | `lib/ml-leve/churn-scorer.ts`, snapshot em `perfilPreci.mlLevePorMercado` |
| 12.3 | **Elasticidade por usuário** | `lib/ml-leve/elasticidade-usuario.ts` |
| 12.4 | **Batch noturno** | `executarMlLeveBatch`, cron `POST /api/cron/ml-leve-batch`, scheduler 3h |
| 12.5 | **Painel gestor** | `MlLeveGestorCard`, `GET /api/gestor/ml-leve` |
| 12.6 | **Espelho cliente** | `MlLeveClienteCard` em `/cliente/perfil`, `GET /api/cliente/ml-insights` |
| 12.7 | **Testes unitários** | `tests/unit/ml-leve/ml-leve.test.ts` |

## Persistência batch

Snapshots por mercado em `perfilPreci.mlLevePorMercado[mercadoId]` (corrige sobrescrita quando o usuário compra em vários mercados). Leitura compatível com legado `mlLeve`.

## APIs

```bash
# Basket completion (auth cliente)
GET /api/cliente/basket-completion?mercadoId=&produtoIds=id1,id2

# Insights churn + elasticidade
GET /api/cliente/ml-insights?mercadoId=

# Resumo gestor
GET /api/gestor/ml-leve?mercadoId=

# Batch (CRON_SECRET)
POST /api/cron/ml-leve-batch?limite=400
```

## Scheduler PM2

Job `ML Leve Batch` em `core/ai/jobs/scheduler.ts` — `0 3 * * *`.

## Próximo épico

**13 — Oferta agregada** (mercado aceita cesta da região).
