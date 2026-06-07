# Checklist — Auth em Route Handlers (`/api/*`)

O middleware (`middleware.ts`) **não** valida JWT globalmente (limitação async do Edge).

## Regra

Toda rota `/api/*` fora das exceções abaixo deve chamar **`requireApiSession`** de `@/lib/api-auth`:

```typescript
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireApiSession(req, { roles: ['ADMIN', 'GESTOR'] });
  if (isAuthResponse(auth)) return auth;
}
```

## Exceções

| Prefixo | Auth |
|---------|------|
| `/api/public/*` | Público |
| `/api/auth/*` | Fluxo de login/registro |
| `/api/stats/global` | Público |
| `/api/cron/*` | `Authorization: Bearer ${CRON_SECRET}` |
| `/api/partner/v1/*` | `PARTNER_API_KEYS` |
| `/api/events/track` | Sessão (`TokenManager`); `userId` do body ignorado |

## Checklist PR

- [ ] `requireApiSession` ou `TokenManager.validateSession` no handler
- [ ] Roles corretas (`ADMIN`, `GESTOR`, `CLIENTE`)
- [ ] Sem confiar em `userId` do body
- [ ] Segredos via `getJwtSecret()` — sem fallback hardcoded
