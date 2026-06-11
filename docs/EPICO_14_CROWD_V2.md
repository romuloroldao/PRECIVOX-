# Épico 14 — Crowd v2

MVP entregue em jun/2026.

## Escopo

| Item | Implementação |
|------|----------------|
| OCR etiqueta | `lib/crowd-v2/ocr-crowd.ts` — `confirmarPrecoPorEtiqueta` reutiliza `extrairPrecoEtiqueta` |
| Anti-fraude | `lib/crowd-v2/antifraude.ts` — limite 3 feedbacks/estoque/dia + intervalo mínimo 45s |
| Reputação mercado | `lib/crowd-v2/reputacao-mercado.ts` — agrega confirmações 48h ponderadas por nível |
| API confirmar | `POST /api/cliente/crowd/confirmar-etiqueta` |
| API reputação | `GET /api/public/crowd-reputacao-mercado?mercadoId=` |
| UI foto | `CrowdEtiquetaConfirm` em `/cliente/scan` — OCR triplo (item + embalagem + etiqueta) |
| Chip mercado | `MercadoCrowdReputacaoChip` no `MercadoVivoBanner` |

## Residuais P1 (mesmo deploy)

| Item | Arquivo |
|------|---------|
| 4.2 Peso crowd na confiança | `lib/crowd-reputacao-peso.ts`, `lib/crowd-confirmacoes-ponderadas.ts` |
| 2.4 Ranking híbrido | `lib/ranking-busca-hibrido.ts`, `GET /api/produtos/buscar?ordenacao=hibrido` |
| 7.1 Despensa UI | `/cliente/despensa`, `GET/PATCH /api/cliente/despensa` |
| 0.6 GROOC fontes | `withFontesGrooc()` em `lib/ai/grooc-engine.ts` |

## Fluxo etiqueta

1. Scan OCR detecta texto/preço.
2. Cliente confirma via botão ou nova foto.
3. Se preço ±8% do catálogo → `preco_confirmado` + truth layer ponderada.
4. Se diverge → `preco_reportado` (mais_caro/mais_barato).

## Testes

```bash
npm run test -- tests/unit/ranking-busca-hibrido.test.ts tests/unit/crowd-v2/crowd-v2.test.ts
```
