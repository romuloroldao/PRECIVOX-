# Épico 16 — Parceiros âncora ✅ (MVP técnico)

MVP jun/2026.

> **Estado comercial:** **5 parceiros âncora designados** em prod (18/06/2026) — região piloto CEP5 (Empório Select como referência). Script: `npm run db:setup:go-live`.

## Objetivo

Designar **3–5 redes/atacados por região piloto** como parceiros âncora PRECIVOX (Tier 2+), cobertura de referência regional para comparação, rotas e densidade do grafo.

## Modelo de dados

| Campo | Tipo | Uso |
|-------|------|-----|
| `mercados.parceiro_ancora` | JSONB | `{ ativo, tipo, regiaoModo, prioridade, rotulo?, designadoEm? }` |

Migration: `20260602120000_mercado_parceiro_ancora`

## Regras

1. **Elegibilidade:** Tier ≥ 2, contrato vigente, catálogo ≤ 15% stale, unidade ativa
2. **Região:** reutiliza modos `cep5` / `cidade` / `poligono` (Épico 13)
3. **Limite:** máx. **5** âncoras ativas por região; meta operacional **3+**
4. **Tipos:** `rede` | `atacado` | `atacarejo`
5. **Designação:** apenas **ADMIN** via API (`PATCH /api/admin/parceiros-ancora`)

## Módulos

| Arquivo | Função |
|---------|--------|
| `lib/parceiros-ancora/types.ts` | Tipos + metas 3–5 |
| `lib/parceiros-ancora/config.ts` | Parse/persist JSON |
| `lib/parceiros-ancora/elegibilidade.ts` | Valida Tier 2+ + saúde catálogo |
| `lib/parceiros-ancora/regiao.ts` | Lista âncoras, designação, preferência rota |

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PATCH | `/api/admin/parceiros-ancora` | Designar/remover âncora (ADMIN) |
| GET | `/api/gestor/parceiros-ancora?mercadoId=` | Status + rede piloto (gestor) |
| GET | `/api/cliente/parceiros-ancora?mercadoId=` | Badge consumidor |
| GET | `/api/public/parceiros-ancora?mercadoId=` | Lista pública regional |

## UI

- `ParceiroAncoraGestorCard` — Gestor → Produtos (leitura + elegibilidade)
- `ParceiroAncoraRegiaoChip` — Busca cliente (rede piloto)
- `lista-rota-proposta.ts` — prefere âncora designada na consolidação de rota

## Ops — designar âncora (admin)

```bash
curl -X PATCH -H "Cookie: ..." -H "Content-Type: application/json" \
  -d '{"mercadoId":"...","ativo":true,"tipo":"atacarejo","prioridade":1,"regiaoModo":"cep5"}' \
  https://precivox.com.br/api/admin/parceiros-ancora
```

## Testes

```bash
npm run test -- tests/unit/parceiros-ancora/parceiros-ancora.test.ts
```

## Próximo épico

**17 — Monetização** (SaaS gestor + insights CPG + promo direcionada).
