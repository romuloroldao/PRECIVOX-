# Contexto atualizado para LLM (Google Gemini / assistentes)

**Objetivo:** Este documento consolida arquitetura, documentação nova e funcionalidades atuais do projeto PRECIVOX para ingestão por modelos de linguagem (ex.: Gemini) ou assistentes. Atualize-o quando houver mudanças estruturais ou novos docs.

**Última atualização:** reflete isolamento do backend, BFF único, auth em /api/v1, checklist de deploy em dois gates e diagnósticos de página crua.

---

## 1. Arquitetura em vigor

### Regras obrigatórias (ARCHITECTURE.md)

| Regra | Descrição |
|-------|-----------|
| **RULE 1** | Apenas Next (BFF) chama Express. Cliente e outros serviços não falam direto com 3001. |
| **RULE 2** | Express expõe só `/api/v1`. Resto de `/api` retorna 410 Gone (exceto `/api/health` e `/api/admin/*`). |
| **RULE 3** | Porta 3001 nunca pública: bind em 127.0.0.1, Docker não publica 3001, firewall bloqueia externo. |
| **RULE 4** | Único gateway server-side para Express: `internalFetch(path, options)` em `lib/internal-backend.ts`. Proibido fetch direto com 3001 ou BACKEND_INTERNAL_URL/BACKEND_URL fora do helper. |

### Fluxo de tráfego

- **Cliente** → Nginx (HTTPS) → **Next.js (porta 3000)** → BFF usa `internalFetch` → **Express (127.0.0.1:3001)**.
- Nenhum `proxy_pass` no Nginx aponta para 3001. Tudo que é `/api` vai para nextjs_upstream (3000).
- Config de produção Nginx: **production-nextjs.conf** (único válido). production.conf e nextjs-production.conf foram removidos.

### Auth

- **Express:** `app.use('/api/v1/auth', userRoutes)` e `app.use('/api/v1/users', userRoutes)`. Rotas públicas (login/register) têm bypass em validateJWT e checkTokenVersion.
- **BFF:** `POST /api/auth/login` em `app/api/auth/login/route.ts`: recebe { email, password }, chama `internalFetch('/api/v1/auth/login')`, em caso de sucesso busca usuário no Prisma, emite tokens via TokenManager, define cookie e retorna token + user (+ accessToken, refreshToken, expiresAt).
- Cliente chama `/api/auth/login` (Next); Next chama Express `/api/v1/auth/login` com x-internal-secret; Express valida e devolve user; BFF emite tokens e responde ao cliente.

---

## 2. Documentação nova / relevante

| Documento | Conteúdo |
|-----------|----------|
| **ARCHITECTURE.md** (raiz) | Contrato RULE 1–4, Docker, governança. |
| **docs/CHECKLIST_DEPLOY.md** | Go/no-go em dois gates: Gate 1 (estrutural: _next 200, / e /login normais, Console limpo, sem 500 em session) e Gate 2 (funcional: login válido/inválido, persistência de sessão, logout, rota protegida). Só deploy se ambos passarem. |
| **docs/DIAGNOSTIC_PAGINA_CRUA.md** | Diagnóstico de página “crua”: critério mínimo para deploy, quando não subir, pergunta de estabilidade, teste no servidor (curl _next), três respostas (_next 200?, / normal?, Console limpo?), estratégia segura (restart, hard refresh, aba anônima). |
| **docs/CONTEXTO_ATUALIZADO_LLM.md** | Este arquivo: resumo para LLM. |

---

## 3. Funcionalidades / mudanças recentes

- **internalFetch:** Única API pública de `lib/internal-backend.ts`. Headers `x-internal-secret` e `authorization` não podem ser passados em `options.headers` (erro explícito). Secret e Authorization são aplicados por último. Suporte a objeto ou instância Headers; validação por existência da chave (valor undefined também dispara erro).
- **Rota BFF de login:** `app/api/auth/login/route.ts` — POST; usa internalFetch, Prisma, TokenManager; retorna token, user, accessToken, refreshToken, expiresAt e cookie.
- **Express:** Rotas públicas `/auth/login`, `/auth/register`, `/users/login`, `/users/register` não exigem JWT (bypass em validateJWT e checkTokenVersion). Demais rotas em `/api/v1` exigem internalOnly + JWT + tokenVersion.
- **Nginx:** `location /_next/static` e `location /_next/` (fallback) com proxy_pass para nextjs_upstream. Comentário explícito de que _next deve retornar 200 para não ficar página crua.
- **ESLint:** Regras que proíbem uso direto de BACKEND_INTERNAL_URL, BACKEND_URL e fetch com URL contendo 3001 fora dos arquivos internal-backend.ts.
- **Docker (backend):** Dockerfile sem EXPOSE 3001; comentário de que em produção não publicar 3001 no compose.

---

## 4. Decisões de deploy

- **Não subir** se: _next não 200, / ou /login cruas, Console com erro (hidratação, parse, etc.), 500 em /api/auth/session, ou qualquer item do Gate 2 falhar ou for intermitente.
- **Subir** só quando: Gate 1 e Gate 2 do CHECKLIST_DEPLOY passarem de forma consistente. Deploy não é ferramenta de debugging.

---

## 5. Onde está o quê (referência rápida)

- Contrato de arquitetura: **ARCHITECTURE.md**
- Checklist go/no-go: **docs/CHECKLIST_DEPLOY.md**
- Diagnóstico página crua e estabilidade: **docs/DIAGNOSTIC_PAGINA_CRUA.md**
- Helper BFF (único gateway para Express): **lib/internal-backend.ts** (e cópia em **apps/frontend/lib/internal-backend.ts**)
- Login BFF: **app/api/auth/login/route.ts**
- Auth Express (rotas): **backend/routes/users.js** (login em router.post('/login', ...)); montado em **backend/server.js** como `app.use('/api/v1/auth', userRoutes)` e `app.use('/api/v1/users', userRoutes)`.
- Middlewares de bypass para login/register: **backend/middleware/validateJWT.js** e **backend/middleware/checkTokenVersion.js** (array PUBLIC_PATHS).
- Nginx produção: **nginx/production-nextjs.conf**
