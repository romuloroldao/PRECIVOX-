# Plano Fase 2 — Remoção do NextAuth (Auth Hardening v7.0)

**Status:** Fase 2 concluída (PR-1 a PR-5) · 2026-06-25  
**Pré-requisito:** Fase 1 concluída (login social/OTP no Express + BFF + `useUnifiedSession` em ~35 telas)  
**Objetivo:** TokenManager como **única** fonte de sessão no client e no BFF; NextAuth removido sem regressão em produção.

---

## 1. Por que esta fase existe

Hoje coexistem dois mecanismos de sessão:

| Mecanismo | Onde vive | Problema |
|-----------|-----------|----------|
| **TokenManager** (`precivox-access-token` / `precivox-refresh-token`) | Express + BFF + cookies httpOnly | Autoridade canônica v7.0 |
| **NextAuth** (`next-auth.session-token`, `signIn`, `SessionProvider`) | `lib/auth.ts`, `[...nextauth]`, `LoginForm` | Legado; kill switch parcial; social duplicado |

A Fase 1 instalou o **hook-ponte** (`lib/hooks/useUnifiedSession.ts`) para não quebrar a jornada enquanto o social/OTP já emite tokens nativos. A Fase 2 **remove a ponte** e deixa só o TokenManager.

**Direção recomendada (visão de futuro):** bridge → remoção. O hook unificado continua existindo, mas passa a ler **apenas** `/api/auth/me` (TokenManager), sem importar `next-auth/react`.

---

## 2. Estado atual (inventário)

### 2.1 Já migrado (Fase 1)

- Login social: Google, Apple, Facebook via `/api/auth/social/*` → Express → cookies `precivox-*`
- OTP telefone via `/api/auth/otp/*`
- `RouteGuard` + ~35 telas usando `useUnifiedSession`
- `/api/auth/me` usa `requireApiSession` → TokenManager ✅
- `/api/auth/refresh` usa `TokenManager.rotateRefreshToken` ✅
- `/api/auth/logout` limpa cookies Precivox ✅

### 2.2 Estado pós Fase 2 (concluída)

**Client:** TokenManager via `useSession` (`/api/auth/me`) — sem NextAuth.

**Server:** `requireApiSession` / `getOptionalApiSession` / `getServerSessionUser` em todos os handlers protegidos.

**Removido:** `lib/auth.ts`, `[...nextauth]`, adapter, `next-auth` npm, fallbacks NextAuth em `token-manager.ts`.

**Infra atualizada:** CI (JWT_SECRET only), `ecosystem.config.js`, `.env.example`.

**Opcional (PR-5):** ✅ concluída — `accounts`/`sessions` removidos; migration `20260625210000_drop_nextauth_legacy_tables`.

---

## 3. Estratégia: 4 PRs verticais (tracer bullets)

Cada PR deve ser mergeável isoladamente, com checklist de testes antes do próximo.

```
PR-1  Login e-mail/senha nativo (sem signIn)
  ↓
PR-2  Route Handlers: getServerSession → requireApiSession
  ↓
PR-3  Client: remover SessionProvider + simplificar hook + logout
  ↓
PR-4  Deletar NextAuth (lib, rota, adapter, deps, fallbacks)
```

---

## 4. PR-1 — Login e-mail/senha nativo

**Objetivo:** `LoginForm` deixa de chamar `signIn('credentials')` e usa o BFF que já existe.

### 4.1 Alterações

**`components/LoginForm.tsx`**

Substituir bloco `signIn` + `getSession` por:

```ts
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: data.email, password: data.senha }),
});
const json = await res.json();
if (!res.ok || !json.success) { /* tratar EmailNotVerified, credenciais, etc. */ }

// Opcional: espelhar tokens no sessionStorage para authenticatedFetch
const { authClient } = await import('@/lib/auth-client');
if (json.accessToken && json.refreshToken) {
  authClient.saveTokens?.(...) // ou método público equivalente
}

router.push(getDashboardUrl(json.user.role) ?? callbackUrl);
```

**Tratamento `EmailNotVerified`**

- Backend/BFF deve retornar código explícito (`403` + `{ code: 'EMAIL_NOT_VERIFIED' }`) em vez de depender do redirect NextAuth.
- Manter UX atual: banner em `/login?error=EmailNotVerified`.

**`app/api/auth/login/route.ts`**

- Garantir que **sempre** emite tokens reais (hoje pode cair no fallback `TokenManager.issueTokenPair` se backend retorna placeholder).
- Preferir tokens emitidos pelo Express (`/api/v1/auth/login` real com `issueTokenPair` no backend) — alinhar com social/OTP.

**`app/api/auth/token/route.ts`**

- Deprecar ou reescrever: hoje exige `getServerSession`. Após PR-1, login já seta cookies; rota pode virar no-op ou ser removida na PR-4.

### 4.2 Critérios de aceite PR-1

- [ ] Login e-mail/senha em `/login` funciona sem cookie `next-auth.session-token`
- [ ] Cookies `precivox-access-token` e `precivox-refresh-token` presentes após login
- [ ] `GET /api/auth/me` retorna usuário autenticado
- [ ] `RouteGuard` libera `/cliente/home` sem NextAuth
- [ ] Fluxo `EmailNotVerified` continua claro para CLIENTE
- [ ] GESTOR/ADMIN entram mesmo com e-mail não verificado (regra atual em `lib/auth.ts`)

---

## 5. PR-2 — Route Handlers: uma autoridade (`requireApiSession`)

**Objetivo:** Nenhum handler protegido usa `getServerSession`. Padrão único conforme `docs/AUTH_AUTHORITY_MODEL.md` e `.cursor/rules/api-auth-required.mdc`.

### 5.1 Padrão de migração (mecânico)

**Antes:**

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**Depois:**

```ts
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';

const auth = await requireApiSession(req, { roles: ['ADMIN', 'GESTOR'] }); // roles opcionais
if (isAuthResponse(auth)) return auth;
// auth é SessionUser
```

### 5.2 Ordem sugerida dentro do PR

1. Rotas gestor (`app/api/gestor/*`) — 5 arquivos
2. Rotas produtos/markets/planos — 8 arquivos
3. Rotas IA painel — 2 arquivos
4. `app/api-proxy/products/upload-smart/[marketId]/route.ts`
5. `app/api/auth/jwt/route.ts` — reescrever para TokenManager
6. `app/dashboard/page.tsx` — SSR: usar cookies + `TokenManager.validateSession` ou redirect para login

### 5.3 Critérios de aceite PR-2

- [x] `rg 'getServerSession' app/` retorna zero (exceto `[...nextauth]` até PR-4)
- [ ] Admin/gestor/cliente APIs retornam 401 sem cookie Precivox
- [ ] Kill switch (`logout-all` / `tokenVersion++`) invalida acesso imediato em todas as rotas migradas
- [x] `npm run ci:auth-guard` passa (se aplicável)

---

## 6. PR-3 — Client: remover SessionProvider e simplificar sessão

**Objetivo:** React não depende mais de contexto NextAuth.

### 6.1 Alterações

**`app/providers.tsx`**

```diff
- import { SessionProvider } from 'next-auth/react';
  export function Providers({ children }) {
    return (
-     <SessionProvider>
        <ToastProvider>
          <ListaProvider>...</ListaProvider>
        </ToastProvider>
-     </SessionProvider>
    );
  }
```

**`lib/hooks/useUnifiedSession.ts` → renomear para `lib/hooks/useSession.ts`**

- Remover import de `next-auth/react`
- Implementação única:

```ts
export function useSession() {
  const [state, setState] = useState<{ status: Status; user: UnifiedUser | null }>({ status: 'loading', user: null });

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => setState(d?.success ? { status: 'authenticated', user: d.user } : { status: 'unauthenticated', user: null }))
      .catch(() => setState({ status: 'unauthenticated', user: null }));
  }, []);

  return { data: state.user ? { user: state.user, expires: '' } : null, status: state.status, update: async () => {} };
}
```

- Atualizar imports em ~35 arquivos: `@/lib/hooks/useUnifiedSession` → `@/lib/hooks/useSession`
- Manter re-export temporário em `useUnifiedSession.ts` (deprecated) por 1 release se necessário

**`lib/logout-client.ts`**

```diff
- await signOut({ redirect: false });
  // cookies já limpos por POST /api/auth/logout
```

**`lib/auth-client.ts`**

- Após login (email ou social), chamar helper `persistTokensFromLoginResponse(json)` para manter `sessionStorage` alinhado com cookies (para `authenticatedFetch`).

**`app/onboarding/page.tsx`**

- Remover `signIn` comentado; usar `/api/auth/social/{provider}/start` se onboarding social for necessário.

### 6.2 Critérios de aceite PR-3

- [x] App carrega sem `SessionProvider`
- [x] Nenhum import de `next-auth/react` no client (exceto arquivos marcados para PR-4)
- [ ] Logout limpa sessão e redireciona para `/login`
- [ ] Refresh automático de access token (`authClient.refreshAccessToken`) continua funcionando

---

## 7. PR-4 — Deletar NextAuth (cleanup final)

**Objetivo:** Zero referências a NextAuth no repositório.

### 7.1 Arquivos a remover

| Arquivo | Motivo |
|---------|--------|
| `app/api/auth/[...nextauth]/route.ts` | Handler NextAuth |
| `lib/auth.ts` | authOptions + providers legados |
| `lib/prisma-adapter-custom.ts` | Adapter NextAuth |
| `auth.ts` (raiz) | Re-export legado |
| `src/middleware/auth-nextauth.ts` | Middleware dedicado |
| `app/admin/dashboard/page-old.tsx` | Morto |
| `app/admin/dashboard/page-refactored.tsx` | Morto |

### 7.2 Código a limpar (não deletar arquivo inteiro)

| Arquivo | Ação |
|---------|------|
| `lib/token-manager.ts` | Remover imports `next-auth/jwt`, bloco fallback cookie NextAuth (~L279–322) |
| `src/middleware/auth.ts` | Remover `tryNextAuthCookie` e fallback NextAuth |
| `middleware.ts` | Remover `/api/auth/[...nextauth]` e `/api/auth/token` da lista pública se rota deletada |
| `app/api/auth/logout/route.ts` | Remover expiração de cookies `next-auth.*` |
| `app/api/auth/token/route.ts` | Deletar rota (login já emite tokens) |

### 7.3 Dependências e env

```bash
npm uninstall next-auth
```

**Removidas (Fase 2 concluída):** ~~`NEXTAUTH_SECRET`~~, ~~`NEXTAUTH_URL`~~, ~~`NEXT_PUBLIC_NEXTAUTH_URL`~~

**Manter:**

- `JWT_SECRET` (ou segredo unificado via `lib/jwt-secret.cjs`)
- `INTERNAL_API_SECRET`
- Credenciais OAuth (agora só usadas pelo Express/BFF social)

### 7.4 Schema Prisma (opcional, PR separado)

A tabela `accounts` e `sessions` são legado NextAuth. **Não deletar na PR-4** (risco de migration em prod). Planejar PR-5:

- Migrar dados úteis de `accounts` → `social_identities` se ainda existirem usuários só via NextAuth
- Deprecar `sessions` após período de observação

### 7.5 Critérios de aceite PR-4

- [x] `rg 'next-auth' --glob '!package-lock.json'` retorna zero em imports (apenas comentários/docs)
- [x] `npm run build` passa
- [ ] `npm run ci:auth-guard` passa
- [x] Login social, OTP, e-mail/senha, refresh, logout, logout-all funcionam em staging
- [x] Nenhum cookie `next-auth.*` é setado em fluxo feliz

---

## 8. Plano de testes (sanidade Auth v2 estendido)

Base: `ARQUITETURA_AUTH_V2_PRECIVOX.md` + fluxos sociais.

| # | Cenário | Esperado |
|---|---------|----------|
| 1 | Login e-mail/senha | cookies Precivox + `/api/auth/me` 200 |
| 2 | Login Google (web) | redirect → `/cliente/home`, RouteGuard OK |
| 3 | Login Apple (form_post) | mesmo que #2 |
| 4 | Login Facebook | mesmo que #2 |
| 5 | OTP SMS | código → sessão + redirect |
| 6 | Refresh rotation | novo refresh; antigo revogado |
| 7 | Reuso refresh antigo | 401 |
| 8 | Logout | cookies limpos; `/api/auth/me` 401 |
| 9 | Logout-all | access token invalidado via tokenVersion |
| 10 | API protegida sem token | 401 |
| 11 | CLIENTE em rota gestor | 403 ou redirect RouteGuard |
| 12 | Mobile deep link | tokens no fragmento ou cookies conforme platform |

**Automatização sugerida:** estender `tests/e2e/` com Playwright para cenários 1, 2, 6, 8 (mínimo).

---

## 9. Rollback

Cada PR é revertível independentemente:

| PR | Rollback |
|----|----------|
| PR-1 | Restaurar `signIn('credentials')` no LoginForm |
| PR-2 | Restaurar `getServerSession` nos handlers afetados |
| PR-3 | Restaurar `SessionProvider` + hook ponte |
| PR-4 | Reinstalar `next-auth`, restaurar rotas deletadas |

**Flag de feature (opcional):** `AUTH_NATIVE_ONLY=true` para forçar TokenManager durante rollout; remover após PR-4.

---

## 10. Cronograma sugerido

| PR | Esforço | Risco |
|----|---------|-------|
| PR-1 Login nativo | 0,5–1 dia | Médio (fluxo crítico) |
| PR-2 Route Handlers | 1 dia | Baixo (mecânico) |
| PR-3 Client cleanup | 0,5 dia | Médio |
| PR-4 Delete NextAuth | 0,5 dia | Baixo após PR-1–3 |

**Total estimado:** 2,5–3 dias de engenharia + 1 dia de QA em staging.

---

## 11. Issues sugeridas (GitHub)

Copiar cada bloco como issue independente:

### Issue: `auth-fase2-pr1-login-nativo`
Migrar LoginForm para POST `/api/auth/login`; remover dependência de signIn credentials; garantir tokens Precivox e tratamento EmailNotVerified.

### Issue: `auth-fase2-pr2-require-api-session`
Substituir getServerSession por requireApiSession em 19 route handlers listados na seção 2.2.

### Issue: `auth-fase2-pr3-client-sem-sessionprovider`
Remover SessionProvider; simplificar useUnifiedSession para TokenManager-only; limpar logout-client.

### Issue: `auth-fase2-pr4-remover-nextauth`
Deletar lib/auth.ts, [...nextauth], adapter, fallbacks token-manager; npm uninstall next-auth; limpar env vars.

### Issue: `auth-fase2-pr5-deprecar-tabelas-nextauth` (opcional)
Migrar accounts → social_identities; deprecar sessions após observação.

---

## 12. Referências internas

- `ARQUITETURA_AUTH_V2_PRECIVOX.md` — fluxos token/refresh/logout
- `docs/AUTH_AUTHORITY_MODEL.md` — TokenManager primeiro, banco autoriza
- `docs/auth-v2.md` — JWT + tokenVersion
- `lib/hooks/useUnifiedSession.ts` — ponte atual (será simplificado na PR-3)
- `backend/routes/auth-social.js` — autoridade social/OTP no Express
- `.cursor/rules/api-auth-required.mdc` — requireApiSession obrigatório

---

*Documento gerado em 2026-06-25. Atualizar status das PRs conforme merge.*
