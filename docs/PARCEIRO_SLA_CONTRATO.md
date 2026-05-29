# SLA e contrato de dados — Parceiro PRECIVOX (9.3)

Versão do contrato em produto: **`2026-05-1`** (`lib/parceiro-sla.ts` → `CONTRATO_VERSAO_ATUAL`).

## Tiers

| Tier | Nome | Cadência | Dias stale (saúde catálogo) | Sync permitido |
|------|------|----------|-------------------------------|----------------|
| 1 | Manual | Até 7 dias | 7 | `semanal`, `24h` |
| 2 | Diário | ≤ 24h | 2 | `24h`, `12h`, `6h` |
| 3 | API | ≤ 24h (webhook 9.4) | 1 | `6h`, `12h`, `24h` |

## Fluxo gestor

1. **Gestor → Produtos** — card **SLA e contrato de dados**
2. Aceitar contrato (checkbox + botão)
3. Escolher tier (Tier 2+ exige contrato vigente)
4. Configurar **Sync agendado** (intervalo validado pelo tier)

## API

```
GET  /api/gestor/parceiro-sla?mercadoId=
PATCH /api/gestor/parceiro-sla
  { mercadoId, aceitarContrato: true }
  { mercadoId, tier: 1|2|3 }
```

## Banco

- `mercados.parceiro_tier` (INT, default 1)
- `mercados.parceiro_sla_contrato` (JSONB): `{ versao, aceitoEm, aceitoPorUserId, aceitoPorNome? }`

Migration: `prisma/migrations/20260528120000_parceiro_sla_tier/migration.sql`

## Integrações

- `lib/catalogo-saude.ts` — limiar de stale por tier
- `lib/sync-agendado.ts` — bloqueia sync ativo sem contrato ou intervalo inválido

## Comercial / ops

- Tier 1: onboarding piloto, upload manual semanal
- Tier 2: contrato + sync URL/SFTP assinado
- Tier 3: negociação API (`9.2`) + webhook (`9.4`) — ver [`PARCEIRO_EXPORT_CATALOGO.md`](./PARCEIRO_EXPORT_CATALOGO.md) § Webhook
