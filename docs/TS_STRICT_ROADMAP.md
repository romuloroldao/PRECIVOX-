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
- Tipagem corrigida em `lib/prisma-adapter-custom.ts` (transitivo via `auth-helpers` → `auth.ts`)

CI: `.github/workflows/typecheck-lib.yml`

## Fase 3 — domínio de negócio (próximo)

- `lib/economia-liquida.ts`, `lib/despensa-digital.ts`, `lib/ai/*`, etc.

## Fase 4 — `app/` e `components/`

Só quando `lib/` estiver estável.

## Comando

```bash
npm run typecheck:lib
```
