# Issues — Sprint 1 (implementado)

| ID | Título | Status |
|----|--------|--------|
| PREC-101 | UI preço: frescor + confiança (`PrecoTruthBadge`) | ✅ |
| PREC-102 | EL em `ProductCard` via `includeEconomia` | ✅ |
| PREC-103 | EL na lista (`ListaInteligentePanel` banner rota) | ✅ |
| PREC-104 | Defaults EL em `lib/economia-liquida.ts` (valor/hora configurável na API — UI perfil Sprint 2) | 🟡 |
| PREC-105 | `POST /api/economia-liquida/calcular` | ✅ (Sprint 0) |
| PREC-106 | Dashboard `CatalogoSaudeCard` + `GET /api/gestor/catalogo-saude` | ✅ |

## Arquivos principais

- `components/cliente/PrecoTruthBadge.tsx`
- `components/cliente/EconomiaLiquidaChip.tsx`
- `lib/melhor-alternativa-preco.ts`
- `lib/catalogo-saude.ts`
- `app/api/produtos/buscar/route.ts` — `truth`, `includeEconomia`
- `app/api/gestor/catalogo-saude/route.ts`

## Pré-requisito

```bash
npx prisma migrate deploy
```

Sem migration, campos `fonte`/`confianca`/`verificado_em` podem falhar no Prisma.

## Próximo: Sprint 2

Crowd confirmar preço, confirmação compra, Perfil PRECI.
