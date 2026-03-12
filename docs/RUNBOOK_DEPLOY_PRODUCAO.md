# Runbook — Deploy e boot em produção (PRECIVOX)

Objetivo: processo determinístico para subir frontend (Next) e backend (Express) sem crash loop e sem uso de `npx`/`tsx` em produção.

---

## 1. Pré-requisitos no servidor

- Node.js 18+ (recomendado 20 LTS)
- PM2 instalado globalmente: `npm i -g pm2`
- Variáveis de ambiente definidas **antes** de subir o PM2 (ver seção 4)

---

## 2. Build (na raiz do projeto)

```bash
cd /home/deploy/apps/precivox

# Frontend Next.js
npm ci
npm run build

# Backend: instalar deps (rodar da raiz do projeto)
(cd backend && npm ci)
```

Garanta que existam:

- `.next/` (saída do `next build`)
- `backend/server.js` (já é JS; não compilar `src/server.ts` em produção)

---

## 3. Teste manual antes do PM2

### Backend (porta 3001)

```bash
cd /home/deploy/apps/precivox/backend
NODE_ENV=production PORT=3001 node server.js
```

- Se subir: deve logar algo como “Servidor rodando na porta 3001”.
- Teste: `curl -s http://localhost:3001/health` (ou a rota de health que existir).
- Ctrl+C para parar.

### Frontend (porta 3000)

```bash
cd /home/deploy/apps/precivox
NODE_ENV=production PORT=3000 node node_modules/next/dist/bin/next start
```

- Se subir: “Ready on http://localhost:3000”.
- Teste: `curl -sI http://localhost:3000`.
- Ctrl+C para parar.

Se algum dos dois falhar aqui, o PM2 só repetirá o mesmo erro (crash loop). Corrija antes de seguir.

---

## 4. Variáveis de ambiente

O PM2 usa o `env` do `ecosystem.config.js`; variáveis sensíveis devem vir do **ambiente do shell** antes de `pm2 start` (ou de um arquivo carregado no deploy).

Exporte no shell ou no script de deploy:

```bash
export NODE_ENV=production
export NEXTAUTH_SECRET='...'           # obrigatório para NextAuth
export NEXTAUTH_URL='https://www.precivox.com.br'
export DATABASE_URL='...'              # se o backend usar Prisma/Postgres
export INTERNAL_API_SECRET='...'      # BFF → backend (internalFetch)
# Outras que o backend ou o Next precisem (BACKEND_INTERNAL_URL, etc.)
```

Depois:

```bash
pm2 start ecosystem.config.js --update-env
pm2 save
```

Assim o PM2 herda o ambiente atual (incluindo `NEXTAUTH_SECRET`, etc.).

---

## 5. Subir com PM2 (ação cirúrgica)

Se existir o script `scripts/deploy-pm2.sh` na raiz do projeto (após git pull/deploy), você pode rodar:

```bash
cd /home/deploy/apps/precivox
bash scripts/deploy-pm2.sh
```

**Se o script não existir no servidor** (ex.: pasta `scripts/` ainda não deployada), use os comandos manuais:

```bash
# Parar e remover processos antigos
pm2 delete all || true

# Carregar .env se existir (ex.: export $(cat .env | xargs) — cuidado com valores com espaço)
# [opcional] source .env.production

# Subir com o ecosystem atual
pm2 start ecosystem.config.js

# Persistir para restart do servidor
pm2 save
pm2 startup  # só uma vez, se ainda não configurado
```

---

## 6. Verificação

```bash
pm2 list
```

Esperado:

- `precivox-backend`  — **online** (porta 3001)
- `precivox-frontend` — **online** (porta 3000)
- `precivox-ai-scheduler` — **online** (se usar)

Testes rápidos:

```bash
curl -s http://localhost:3000 | head -5
curl -s http://localhost:3001/health
```

Se algum processo estiver **errored** ou **restarting**, ver o motivo:

```bash
pm2 logs precivox-backend --lines 50
pm2 logs precivox-frontend --lines 50
```

A última stack trace indica a causa (ex.: variável ausente, módulo não encontrado, porta em uso).

---

## 7. Entrypoints (ecosystem.config.js)

| App                   | Script / entrypoint                         | Observação                    |
|-----------------------|---------------------------------------------|-------------------------------|
| precivox-backend      | `server.js` (cwd: `.../backend`)            | Node ESM, sem tsx             |
| precivox-frontend     | `node_modules/next/dist/bin/next start`     | Binário estável do Next       |
| precivox-ai-scheduler| `node_modules/tsx/dist/cli.mjs` + args      | Único que ainda usa tsx (TS)  |

Não usar `npx` em produção: resolve dinâmico e menos estável.

---

## 8. Resumo de causas comuns de 502 / crash loop

1. **Nada ouvindo em 3000/3001**  
   Processo morre no bootstrap → ver `pm2 logs` e teste manual (passo 3).

2. **Variáveis de ambiente ausentes**  
   Ex.: `NEXTAUTH_SECRET`, `DATABASE_URL`, `INTERNAL_API_SECRET`.  
   Exportar antes de `pm2 start` ou usar `--update-env` após export.

3. **Entrypoint errado**  
   Evitar `npx next start` e `tsx src/server.ts` em produção.  
   Usar os entrypoints do `ecosystem.config.js` (passo 7).

4. **Backend errado**  
   Em produção o BFF espera o backend em **backend/server.js** (rotas `/api/v1/*`), não `src/server.ts`.

---

## 9. Deploy completo (checklist)

- [ ] `cd /home/deploy/apps/precivox`
- [ ] `npm ci && npm run build`
- [ ] Exportar env (NEXTAUTH_SECRET, DATABASE_URL, INTERNAL_API_SECRET, etc.)
- [ ] Testar backend manual: `cd backend && PORT=3001 node server.js`
- [ ] Testar frontend manual: `PORT=3000 node node_modules/next/dist/bin/next start`
- [ ] `pm2 delete all || true`
- [ ] `pm2 start ecosystem.config.js`
- [ ] `pm2 save`
- [ ] `pm2 list` e `curl` em 3000 e 3001
- [ ] Se algo falhar: `pm2 logs <nome> --lines 50`
