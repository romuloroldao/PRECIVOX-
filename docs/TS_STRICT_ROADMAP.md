# TypeScript strict — roadmap incremental

Habilitar `strict: true` no monorepo de uma vez quebra o build. Estratégia: **pastas por fase**, cada uma com `tsconfig.lib.strict.json` e `npm run typecheck:lib`.

## Fase 1 — utilitários puros ✅

- `lib/redirect.ts`, `lib/safe-callback-url.ts`, `lib/utils.ts`
- `lib/password.ts`, `lib/validations.ts`
- `lib/geo.ts`, `lib/geocoding.ts`, `lib/geolocation.ts`
- `lib/geofence-constants.ts`, `lib/raio-familiar-constants.ts`
- `lib/estoque-truth-labels.ts`, `lib/crowd-reputacao-labels.ts`, `lib/regiao-preco-ui.ts`

## Fase 2 — auth e API client ✅

- `lib/jwt-secret.ts`, `lib/jwt.ts`, `lib/api-auth.ts`
- `lib/token-manager.ts`, `lib/auth-helpers.ts`, `lib/auth-client.ts`
- `lib/logout-client.ts`, `lib/internal-backend.ts`
- Tipagem em `lib/prisma-adapter-custom.ts`

## Fase 3 — domínio de negócio ✅

Economia, despensa, perfil, estoque, ML leve, crowd, oferta agregada, SKU:

- `lib/economia-liquida.ts`, `lib/despensa-digital.ts`, `lib/cesta-*`, `lib/perfil-preci.ts`
- `lib/estoque-truth.ts`, `lib/economia-streak.ts`, `lib/atacado-varejo.ts`
- `lib/melhor-alternativa-preco.ts`, `lib/el-config-*`, `lib/ranking-busca-hibrido.ts`
- `lib/produtos-chaves.ts`, `lib/catalogo-saude.ts`
- `lib/ai/types.ts`, `lib/ai/event-collector.ts`
- `lib/oferta-agregada/{types,config,chave-produto,regiao}.ts`
- `lib/ml-leve/{types,churn-scorer,coocorrencia,elasticidade-usuario}.ts`
- `lib/crowd-v2/ocr-crowd.ts`, `lib/crowd-reputacao-peso.ts`
- `lib/sku-nacional/{types,compute}.ts`
- `types/ssh2-sftp-client.d.ts` (transitivo via `catalogo-saude` → `parceiro-sla`)

Correção: `chaveLogicaProduto` não referenciava campo inexistente em `computeCamposChaveProduto`.

CI: `.github/workflows/typecheck-lib.yml`

## Fase 4 — engines IA, upload, catálogo, parceiro ✅

Módulos restantes de `lib/` antes de `app/`:

- `lib/produtos-{nome-normalize,busca-where,busca-comparativo}.ts`
- `lib/events/frontend-events.ts`
- `lib/upload-handler.ts`, `lib/scan-ocr-{parse,merge}.ts`, `lib/preco-crowd-feedback.ts`
- `lib/catalogo-mercado.ts`, `lib/lista-rota-{proposta,ia}.ts`, `lib/raio-familiar.ts`
- `lib/partner-api-auth.ts`, `lib/parceiro-sla.ts`, `lib/sync-agendado.ts`
- `lib/ai/{nps-themes,intent-score-engine,resumo-semana-gestor,gondola-engine,promotion-engine,report-generator,grooc-engine,behavior-engine,health-engine,conversao-metrics}.ts`

Correções strict:

- `report-generator.ts` — tipos `MarketHealthScore` / `PromotionSuggestion`
- `benchmark-preco-regional.ts` — filtro `unidades` sem `null`; `_avg` opcional (transitivo)
- `catalogo-mercado.ts` — `computeSkuNacionalFields` em vez de campos inexistentes em `computeCamposChaveProduto`

## Fase 5 — `app/` e `components/` (próximo)

Só quando todo `lib/` estiver coberto ou restarem dependências transitivas mínimas.

## Comando

```bash
npm run typecheck:lib
```
