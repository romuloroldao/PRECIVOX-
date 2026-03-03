## Arquitetura Auth v2 – PRECIVOX

### 1. Visão geral

- **Objetivo**: autenticação de nível SaaS, com revogação real de sessões, rotation de refresh token e kill switch centralizado.
- **Componentes principais**:
  - **Backend Express** (`/home/deploy/apps/precivox/src/server.ts` + `src/routes/auth.ts`) → autoridade de autenticação.
  - **Next.js (BFF)** (`/root/app` – rotas `api/auth/*`) → proxy + cookies.
  - **Banco (Postgres + Prisma)** (`prisma/schema.prisma`) → modelos `User`, `RefreshToken`, `AuthAuditLog`.

### 2. Modelos de autenticação (Prisma – backend)

- **User** (`usuarios`):
  - `email` (único), `senhaHash` (`senha_hash`), `role` (`Role`), `tokenVersion` (`token_version`).
  - Campos de auditoria: `dataCriacao`, `dataAtualizacao`, `ultimoLogin`.
  - Relações: `refreshTokens` (`RefreshToken[]`), `sessions`, `AuthAuditLog` via `userId`.
- **RefreshToken** (`refresh_tokens`):
  - `tokenHash` (`sha256(refreshToken)`), `userId`, `expiresAt`, `revoked`, `revokedAt`, `userAgent`, `ipAddress`.
  - Índices em `(userId, revoked)`, `(tokenHash)`, `(expiresAt)`.
- **AuthAuditLog** (`auth_audit_logs`):
  - `userId?`, `event` (`login_success`, `login_failure`, `logout`, `refresh`, `token_revoked` etc.), `ip`, `userAgent`, `metadata`.

### 3. Tokens

- **Access Token (JWT curto)**:
  - Emissor: **backend Express** (`src/routes/auth.ts`).
  - Duração: **15 minutos** (`ACCESS_TOKEN_TTL = '15m'`).
  - Payload mínimo:
    - `sub`: `user.id`
    - `role`: `user.role`
    - `tokenVersion`: `user.tokenVersion`
  - Não é salvo no banco; verificação é feita contra o banco via `tokenVersion`.
- **Refresh Token (stateful + rotativo)**:
  - Emissor: backend Express.
  - Gerado com `crypto.randomBytes(64).toString('hex')`.
  - Salvo **apenas como hash** (`sha256`) em `RefreshToken.tokenHash`.
  - Duração padrão: **7 dias** (`REFRESH_TOKEN_TTL_DAYS = 7`).

### 4. Fluxos de backend (Express – `src/routes/auth.ts`)

- **`POST /api/auth/login`**:
  - Entrada: `{ email, password }`.
  - Passos:
    1. Normaliza email (`toLowerCase().trim()`).
    2. Busca `User` por email.
    3. Valida `password` contra `user.senhaHash` com `bcrypt.compare`.
    4. Atualiza `ultimoLogin` e `dataAtualizacao`.
    5. Gera:
       - `accessToken` (JWT 15min com `tokenVersion` atual).
       - `refreshTokenRaw` (string aleatória).
    6. Salva hash em `RefreshToken` com `expiresAt`, `userAgent`, `ipAddress`.
    7. Registra `AuthAuditLog` com `event = 'login_success'`.
  - Resposta:
    - `{ success: true, data: { user, accessToken, refreshToken } }`.

- **`POST /api/auth/refresh`**:
  - Entrada: `{ refreshToken }`.
  - Passos:
    1. Calcula `tokenHash`.
    2. Busca `RefreshToken` por `tokenHash` com `include: { user: true }`.
    3. Valida:
       - existe,
       - não revogado,
       - `expiresAt` > agora.
    4. Marca o registro **atual** como `revoked = true`, `revokedAt = now()` (**rotation**).
    5. Cria **novo** `RefreshToken` (hash + `expiresAt` novo).
    6. Emite **novo** `accessToken` (15min) com `user.tokenVersion` atual.
    7. Registra `AuthAuditLog` com `event = 'refresh_success'`.
  - Reuso de refresh antigo:
    - Falha na validação → `401` + `AuthAuditLog` com `event = 'refresh_invalid'`.

- **`POST /api/auth/logout`**:
  - Entrada: `{ refreshToken }` (opcional).
  - Se houver `refreshToken`:
    - Calcula hash.
    - `updateMany` em `RefreshToken` para `revoked = true`.
  - Resposta: `{ success: true, message: 'Logout realizado com sucesso' }`.

- **`POST /api/auth/logout-all`**:
  - Autenticação: `authenticate` (JWT).
  - Passos:
    1. Revoga **todos** os `RefreshToken` do `userId`.
    2. Faz `User.tokenVersion = tokenVersion + 1` (kill switch).
    3. Atualiza `dataAtualizacao`.
    4. Registra `AuthAuditLog` com `event = 'logout_all'`.
  - Efeito:
    - Todos **access tokens antigos** passam a ser inválidos (ver seção middleware).

- **`GET /api/auth/me`**:
  - Usa `authenticate`.
  - Retorna `{ user, authenticated: true }`.

### 5. Middleware de autenticação (Express – `src/middleware/auth.ts`)

- Responsável por **validar access tokens** e aplicar o kill switch.
- Fluxo:
  1. Tenta ler `Authorization: Bearer <token>`:
     - Tenta validar com `JWT_SECRET`, depois com `NEXTAUTH_SECRET` (compatibilidade NextAuth).
  2. Se falhar, tenta cookie de sessão do NextAuth (modo legado).
  3. Se ainda assim falhar → `401 "Token não fornecido"`.
  4. Se JWT válido:
     - Extrai `userId = decoded.id || decoded.sub`.
     - Extrai `tokenVersion = decoded.tokenVersion ?? 0`.
     - Busca `dbUser` via Prisma:
       - `select { id, email, role, nome, tokenVersion }`.
     - Se não achar usuário ou `dbUser.tokenVersion !== tokenVersion`:
       - Retorna `401 "Sua sessão foi finalizada. Faça login novamente."` (**kill switch ativo**).
     - Caso contrário:
       - Preenche `req.user` com dados do banco.
       - Chama `next()`.

### 6. Next.js (BFF) – rotas de Auth

- **Login BFF – `POST /api/auth/login` (Next)**:
  - Chama backend Express: `POST /api/v1/auth/login`.
  - Não usa mais Prisma nem `TokenManager` local.
  - Espera do backend: `{ success, data: { user, accessToken, refreshToken } }`.
  - Seta cookies:
    - `precivox-access-token` ou `__Secure-precivox-access-token` (produção).
      - `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`, `maxAge: 15 min`.
    - `precivox-refresh-token` ou `__Secure-precivox-refresh-token`.
      - Mesmo padrão, `maxAge: 7 dias`.
  - Retorna JSON com `{ success, user, accessToken, refreshToken }`.

- **Logout BFF – `POST /api/auth/logout` (Next)**:
  - (Planejado/alinhado na arquitetura):
    - Lê `precivox-refresh-token` dos cookies.
    - Chama backend `POST /api/v1/auth/logout` com `{ refreshToken }`.
    - Limpa cookies de auth (NextAuth + PRECIVOX).

### 7. URL e infraestrutura

- **Domínio produção**:
  - `https://precivox.com.br`
  - `https://www.precivox.com.br`
- **Nginx**:
  - Arquivo principal: `/root/nginx/production-nextjs.conf`.
  - Porta externa 443 → Next.js em `127.0.0.1:3000`.
  - Backend Express (porta 3001) **não é exposto**; apenas acessado via BFF (Next).
  - Todas as rotas `/api/...` passam pelo Next.js como BFF.

### 8. Roteiro de testes oficial (sanidade Auth v2)

Considerando `BASE_URL = https://precivox.com.br`.

1. **Login**
   - `POST BASE_URL/api/auth/login` com `{ email, password }`.
   - Esperado: `success: true` + `accessToken` + `refreshToken`.
2. **Rota protegida**
   - `GET BASE_URL/api/auth/me` com `Authorization: Bearer <accessToken>`.
   - Esperado: `200` + `authenticated: true`.
3. **Refresh (rotation)**
   - `POST BASE_URL/api/auth/refresh` com `{ refreshToken }` (via BFF ou diretamente no backend).
   - Esperado: novo `accessToken` + novo `refreshToken`; token antigo marcado como `revoked = true` no banco.
4. **Reuso de refresh antigo**
   - `POST /api/auth/refresh` com o refresh **antigo**.
   - Esperado: `401` + `AuthAuditLog` com `event = 'refresh_invalid'`.
5. **Logout individual**
   - `POST /api/auth/logout` com o refresh atual.
   - Em seguida, tentar novo refresh com esse token.
   - Esperado: `401`.
6. **Logout-all (kill switch)**
   - `POST /api/auth/logout-all` com `Authorization: Bearer <accessToken_atual>`.
   - Em seguida, tentar:
     - `GET /api/auth/me` com o **mesmo accessToken** (antes do TTL de 15min).
   - Esperado: `401` (“Sua sessão foi finalizada...”) devido ao `tokenVersion` diferente no banco.

### 9. Checklist de segurança

- `JWT_SECRET` forte (≥ 32 caracteres) e mantido só em backend.
- Refresh token:
  - Sempre salvo como **hash** (`sha256`), nunca em claro.
  - Sempre rotacionado em `/refresh`.
  - Nunca reutilizável (antigo sempre revogado).
- Kill switch:
  - `logout-all` incrementa `tokenVersion`.
  - Middleware sempre compara `decoded.tokenVersion` com `User.tokenVersion` no banco.
- Cookies:
  - `httpOnly`, `secure` em produção, `sameSite: 'lax'`, `path: '/'`.
  - Prefixo `__Secure-` para produção, conforme config atual.

