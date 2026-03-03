# Estado da migração Auth v2 – Token (objetivo)

**Data da análise:** 24/02/2025  
**Base:** inspeção do repositório (backend, frontend, packages).

---

## Onde estamos (resumo)

- **Migração estrutural:** concluída no fluxo principal (Next.js + Auth v2).
- **Backend Express (server.js):** ainda com auth legada/stub; não usa Auth v2 nem jti/blacklist.
- **Validação funcional em produção:** pendente (refresh rotation, logout, auditoria, carga).

Ou seja: **Fase 2.5 — Validação funcional e limpeza do legado.**

---

## O que já está em Auth v2 (implementado no código)

| Componente | Local | Status |
|------------|--------|--------|
| **TokenManager** (tokenVersion + RefreshToken no DB) | `lib/token-manager.ts`, `packages/shared/auth-core`, `apps/frontend/lib/auth-core` | ✅ Implementado |
| **Logout** | `app/api/auth/logout/route.ts` | ✅ Incrementa `tokenVersion` + `TokenManager.revokeUserTokens()` |
| **Refresh com rotação** | `app/api/auth/refresh/route.ts` | ✅ `TokenManager.rotateRefreshToken()` |
| **Login** | Next: cookie + token; backend/src (apps): `TokenManager.issueTokenPair()` | ✅ |
| **Validação de acesso** | `TokenManager.validateSession`, middleware backend `auth.ts` (apps) | ✅ Usa `tokenVersion` |
| **Modelo RefreshToken** | `prisma/schema.prisma` | ✅ Tabela `refresh_tokens` |

Conclusão: **refresh token rotation, logout que invalida sessão e uso de tokenVersion estão implementados** no fluxo que usa o Next.js + TokenManager (e no backend TypeScript em `apps/backend/src`).

---

## O que ainda é legado / não migrado

| Item | Local | Risco |
|------|--------|--------|
| **jti/blacklist** | `backend/middleware/jwtSecurity.js` | Código morto: **não é importado** por `backend/server.js`. Pode ser removido ou arquivado. |
| **Authenticate no backend Express** | `backend/routes/users.js` (e outras rotas) | **Crítico:** `authenticate` é um stub que aceita qualquer Bearer e define `req.user = { id: 'temp-user', role: 'admin' }`. Não valida JWT nem tokenVersion. |
| **Rotas de auth no server.js** | `app.use('/api/users', userRoutes)` e `app.use('/api/auth', userRoutes)` | Login/logout do Express em `users.js` não usam TokenManager; o frontend provavelmente usa as rotas do **Next** (`/api/auth/*`). |

Ou seja: a **migração Auth v2 está completa no fluxo Next.js + TokenManager**; o **backend Express (server.js)** ainda não foi migrado para Auth v2 e mantém um authenticate inseguro.

---

## Respostas às 4 perguntas críticas

| Pergunta | Resposta no código | Validado em produção? |
|----------|--------------------|-------------------------|
| **Refresh token rotation funciona?** | Sim: `rotateRefreshToken` revoga o antigo e emite novo par. | ⏳ Só com teste manual/E2E. |
| **Logout invalida sessão?** | Sim: `tokenVersion` incrementado + `revokeUserTokens`. | ⏳ Idem. |
| **Ainda existe endpoint com lógica antiga (jti/blacklist)?** | Não no fluxo ativo: jwtSecurity não está ligado ao server.js. Mas as rotas do Express usam stub, não Auth v2. | ⚠️ Backend Express = “lógica antiga” (stub). |
| **Comportamento sob carga?** | Não há evidência de testes de carga ou métricas. | ❌ Não. |

---

## Avaliação resumida

- **~80–85%** em termos de “Auth v2 implementado onde o frontend usa”.
- **~60–70%** em termos de “tudo usando Auth v2 + validado em produção + observabilidade”.

---

## Próximos passos recomendados (ordem sugerida)

### 1. Decisão de arquitetura (backend Express)

- Se o frontend **só** usa as APIs do Next (`/api/auth/*`, `/api/products/*`, etc.): o backend Express pode ser tratado como legado e, a médio prazo, desligado ou restrito a rotas que não precisam de auth.
- Se alguma rota do **Express** (`/api/users/*`, `/api/markets/*`, etc.) é usada em produção com auth:
  - Trocar o `authenticate` stub por um middleware que valide o **mesmo JWT** (mesmo secret, `tokenVersion`) e, se possível, reutilizar a mesma lógica do TokenManager (ou um serviço compartilhado).

### 2. Limpeza

- Remover ou arquivar `backend/middleware/jwtSecurity.js` (não usado).
- Documentar que Auth v2 é o padrão e que o Express ainda está em migração/stub.

### 3. Validação funcional (Fase 2.5)

- Teste manual ou E2E: login → refresh → logout; em seguida tentar usar access token e refresh antigos (devem falhar).
- Opcional: teste de carga em login/refresh/logout e métricas (latência, erros).

### 4. Hardening (em paralelo ou depois)

- Rate limit em `/api/auth/*` (já existe em parte no server.js).
- Headers de segurança (CSP, etc.) e revisão do Nginx (conforme sua doc de deploy).

---

## Conclusão

- A **migração principal (Auth v2 com tokenVersion + RefreshToken)** está feita no fluxo Next.js e no backend TypeScript do monorepo.
- O que falta é: **(1)** alinhar o backend Express à Auth v2 ou desativar auth nas rotas legadas, **(2)** remover/arquivar jti/blacklist, **(3)** validar em produção as 4 perguntas críticas e **(4)** hardening e observabilidade.

Isso corresponde à **Fase 2.5 — Validação funcional e consolidação**, com a decisão estratégica sendo: **finalizar a migração Auth (incluindo Express)** **ou** priorizar **harden de infra**; o recomendado é fazer a decisão do Express e a validação funcional primeiro, e em seguida o hardening.
