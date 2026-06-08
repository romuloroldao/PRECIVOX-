# TypeScript strict — roadmap incremental

Habilitar `strict: true` no monorepo de uma vez quebra o build. Estratégia: **pastas por fase**, cada uma com `tsconfig.lib.strict.json` (ou equivalente) e script `npm run typecheck:lib`.

## Fase 1 — utilitários puros ✅

Arquivos sem Prisma/React; já passam em `strict`:

- `lib/redirect.ts`, `lib/safe-callback-url.ts`, `lib/utils.ts`
- `lib/password.ts`, `lib/validations.ts`
- `lib/geo.ts`, `lib/geocoding.ts`, `lib/geolocation.ts`
- `lib/geofence-constants.ts`, `lib/raio-familiar-constants.ts`
- `lib/estoque-truth-labels.ts`, `lib/crowd-reputacao-labels.ts`, `lib/regiao-preco-ui.ts`

```bash
npm run typecheck:lib
```

## Fase 2 — auth e API client (próximo)

Após merge do PR de auditoria (`fix/p1-audit-hardening`):

- `lib/jwt-secret.ts`, `lib/jwt.ts`, `lib/api-auth.ts`
- `lib/token-manager.ts`, `lib/auth.ts`, `lib/internal-backend.ts`

## Fase 3 — domínio de negócio

- `lib/economia-liquida.ts`, `lib/despensa-digital.ts`, `lib/ai/*`, etc.

## Fase 4 — `app/` e `components/`

Só quando `lib/` estiver estável; considerar `strictNullChecks` isolado antes de `strict` completo.

## Regras

1. Uma fase = um PR (`chore/ts-strict-lib-phase-N`)
2. Não misturar com features ou fixes de segurança
3. CI: adicionar `npm run typecheck:lib` quando fase 1 estiver na `main`
