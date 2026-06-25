# Épico 17 — Monetização ✅ (MVP técnico)

MVP jun/2026.

> **Estado comercial:** planos **Essencial / Pro / Enterprise** criados e mercados piloto vinculados (18/06/2026). Cobrança recorrente e gateway **pendentes** (fora do sistema).

## Objetivo

Receita B2B recorrente via **SaaS gestor**, **insights CPG agregados** (LGPD) e **promo direcionada** por segmento comportamental.

## Modelo de dados

| Campo | Tipo | Uso |
|-------|------|-----|
| `planos_de_pagamento.features` | JSONB | `{ tier, features[] }` opcional |
| `mercados.monetizacao` | JSONB | `promosDirecionadas[]`, notas comerciais |

Migration: `20260602180000_monetizacao`

## Tiers SaaS

| Tier | Features |
|------|----------|
| **Essencial** | Radar, pricing assistido |
| **Pro** | + heatmap, benchmark, ML leve, oferta agregada, promo direcionada |
| **Enterprise** | + insights CPG |

Inferência automática por nome/valor do plano se `features` ausente.

## Módulos

| Arquivo | Função |
|---------|--------|
| `lib/monetizacao/types.ts` | Tiers, features, promos, CPG |
| `lib/monetizacao/saas-plano.ts` | Resumo plano + `mercadoTemFeature` |
| `lib/monetizacao/config.ts` | JSON `mercados.monetizacao` |
| `lib/monetizacao/cpg-insights.ts` | Agregados regionais k≥5 (LGPD) |
| `lib/monetizacao/promo-direcionada.ts` | CRUD promos + match usuário |

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/gestor/monetizacao/saas?mercadoId=` | Plano + features ativas/bloqueadas |
| GET | `/api/gestor/monetizacao/cpg-insights?mercadoId=` | Enterprise — tendências CPG |
| GET/POST/PATCH | `/api/gestor/monetizacao/promo-direcionada` | Pro+ — promos segmentadas |
| GET | `/api/cliente/promo-direcionada?mercadoId=` | Promos personalizadas (auth) |

## UI

- `MonetizacaoSaasGestorCard` — painel gestor home
- `PromoDirecionadaGestorCard` — criar/pausar promos
- `CpgInsightsGestorCard` — insights ou CTA upgrade Enterprise
- `PromoDirecionadaChip` — busca cliente

## Segmentos promo

| Segmento | Critério |
|----------|----------|
| `intent_alta` | Intent Score ≥ 55 |
| `churn_risco` | Churn ML leve médio/alto |
| `cesta_semana` | Item na lista nos últimos 7 dias |
| `todos` | Sem filtro |

## Testes

```bash
npm run test -- tests/unit/monetizacao/monetizacao.test.ts
```

## Próximo (Fase 4)

**PRECI Network** — API de intenção agregada para CPG e parceiros externos.
