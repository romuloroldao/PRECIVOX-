# DEPLOY — Produção PRECIVOX

## Script oficial

Na raiz do projeto:

```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

## O que o script faz (ordem garantida)

1. **Atualizar código** — `git pull origin main`
2. **Dependências (root)** — `npm ci`
3. **Build AI engines** — `npm run build:ai`
4. **Migrations** — `npx prisma migrate deploy`
5. **Build frontend** — em `apps/frontend` (se existir) ou na raiz: `rm -rf .next`, `npm ci`, `npm run build`
6. **Restart PM2** — backend, frontend, ai-scheduler
7. **Persistir PM2** — `pm2 save`

## Por que é robusto

- `set -e`: aborta na primeira falha (sem deploy parcial).
- `set -o pipefail`: falha em qualquer comando de um pipe interrompe o script.
- `npm ci`: lockfile exato, sem drift.
- `.next` sempre removido antes do build do frontend.
- Raiz do projeto detectada pelo próprio script (`PROJECT_ROOT`), portável para qualquer path.

## Pré-requisitos

- **Node 18.20.8** (definido em `.nvmrc`). Use `nvm use` antes do deploy para evitar drift e bugs (ex.: crypto).
- **PM2** instalado globalmente: `npm install -g pm2`.
- **Variáveis de ambiente** de produção já configuradas (`.env.production` ou ambiente do sistema).
- Acesso a `git pull` na branch `main`.

**Nota:** O `ecosystem.config.js` usa `cwd: '/home/deploy/apps/precivox'`. Se o projeto estiver em outro path em produção, altere o `cwd` nos três apps antes de `pm2 start`.

## Pós-deploy

- Hard refresh no navegador.
- Verificar em Network se `_next/static/css/*.css` retorna 200.
- Testar `/login` em desktop, tablet e mobile.

## Rollback

Reverter para uma versão estável (tag ou commit) e rodar o deploy novamente:

```bash
git fetch --tags
git checkout <tag-estavel>   # ex: v2.0.1
./deploy-prod.sh
```

Ou apenas restart sem novo build (usa build anterior em disco):

```bash
pm2 restart precivox-frontend
```
