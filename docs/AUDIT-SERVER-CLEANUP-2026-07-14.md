# Relatório de Auditoria e Higienização — Servidor Precivox

**Data:** 2026-07-14  
**Host:** r14653s.vps-kinghost.net  
**Metodologia:** Skill Software Engineer + evidências (PM2, nginx, cron, package.json, rsync, referências no código)  
**Política:** Nenhuma exclusão definitiva de artefatos de projeto — apenas quarentena + prune Docker de imagens dangling

---

## 1. Estrutura atual do servidor (após higienização)

| Path | Papel | Tamanho aprox. |
|------|-------|----------------|
| `/root` | **DEPLOY_SRC** — código fonte, build, edição Cursor | ~9.7G (incl. `.git` 2G, `node_modules` 981M, `.next` 507M, IDE caches) |
| `/home/deploy/apps/precivox` | **DEPLOY_DEST** — runtime PM2 | **~1.6G** (antes ~6.3G) |
| `/var/backups/precivox` | Backups diários (cron 03:00) | ~1.7G (9 dias × ~193M SQL) |
| `/archive/2026-07-14-cleanup` | Quarentena desta auditoria | **~5.6G** |
| `/etc/nginx` + Let’s Encrypt | Reverse proxy HTTPS | — |
| PostgreSQL 17 | Banco `precivox` | ~1.2G em `/var/lib/postgresql` |
| `/var/www/html` | Default nginx residual | 116K |
| `/swapfile` | Swap 4G (setup de estabilidade) | 4G (arquivo, não “lixo”) |

### Processos de produção (intactos)

- `precivox-backend` → `/home/deploy/apps/precivox/backend` (porta 3001)
- `precivox-frontend` → `/home/deploy/apps/precivox` Next.js (porta 3000)
- `precivox-ai-scheduler` → `core/ai/run-scheduler.ts`
- nginx → `proxy_pass` somente para `127.0.0.1:3000`
- cron: backup diário + health a cada 6h

---

## 2. Arquivos classificados como críticos (NÃO remover)

### Produção
- `/home/deploy/apps/precivox` (código runtime: `app/`, `backend/`, `core/`, `lib/`, `prisma/`, `components/`, `.next/`, `node_modules/`)
- `/root` como fonte de verdade + `.git`
- `/root/ecosystem.config.js`, `/root/deploy-prod.sh`, `/root/scripts/deploy-prod-rsync.sh`, `/root/scripts/lib/deploy-env.sh`
- `/root/.env.production` e cópia em DEPLOY_DEST
- `/etc/nginx/sites-enabled/precivox.conf`
- Certificados `/etc/letsencrypt/live/precivox.com.br/`
- `/usr/local/bin/backup_precivox.sh` + cron
- `/root/scripts/infra/cron-health.sh`, `precivox-health.sh`
- Banco PostgreSQL 17 `precivox`
- `/root/backups/precivox_pre_pr5_*.dump` (snapshot pré-PR5)
- `RUNBOOK_RESTORE.md`, docs operacionais em `/root/docs/`

### Operação ativa (npm scripts)
`deploy:prod`, `deploy:sync`, `deploy:tmux`, `deploy:verify`, `infra:health`, `infra:stability`, scripts Prisma/DB, auth smoke, etc.

---

## 3. Arquivos classificados como obsoletos → quarentena

Local: `/archive/2026-07-14-cleanup/`

| Pasta | Conteúdo | Evidência | Tamanho |
|-------|----------|-----------|---------|
| `legacy-var-www/` | Antigo stack `/var/www/precivox` (Python venv, React legado, SQLite analytics) | nginx **não** referencia; PM2 usa `/home/deploy/...`; só scripts legados citavam | 853M |
| `deploy-dest-pollution/` | `.cursor-server`, `.antigravity-server`, `.nvm`, `.cache`, `.npm`, IDE configs syncados por engano | rsync sem excludes adequados; PM2 não usa | **4.5G** |
| `next-backups-stale/` | `.next.backup.2026063017*` | Build atual Jul 09; backups de 30/jun ultrapassados | 266M |
| `duplicate-dumps/` | Cópia do dump PR5 no DEST | Original em `/root/backups/` | 24M |
| `orphan-root-files/` | `how --stat…`, `tat -tulpn…`, `top all`, `auth.ts`/`produtos.ts` soltos, wrappers .cjs, `test-prisma.ts`, `requirements.txt` | Artefatos acidentais / órfãos sem import no app Next | 176K |
| `legacy-root-scripts/` | `start-precivox.sh`, `monitor-backend.sh`, `deploy-production.sh`, etc. | Zero refs em package.json, cron, PM2, systemd | 64K |
| `legacy-logs/` | Logs `precivox-nextjs-*` e processos PM2 antigos | Nomes de processo fora do ecosystem atual | 7.8M |

**Nenhuma pasta foi apagada.** Restauração: `mv /archive/2026-07-14-cleanup/<item> <destino>`.

---

## 4. Backups encontrados

### Ativos (`/var/backups/precivox`) — política atual: retenção 7 dias
- `db_YYYY-MM-DD_03-00.sql` (~193M cada, **não comprimidos**) — dias 06–14/jul
- `env_*.backup` — agora `chmod 600` + diretório `700`
- `nginx_*.tar.gz`, `app_*.tar.gz` (app tar só inclui `/root/app` — backup parcial de código)

### Históricos
- `/root/backups/precivox_pre_pr5_20260625_180704.dump` (24M) — **manter**
- Duplicata no DEST → quarentena

### Classificação
| Tipo | Status |
|------|--------|
| Ativos diários | OK (cron + retenção 7d) |
| Históricos | 1 dump pré-PR5 válido |
| Duplicados | 1 removido p/ quarentena |
| Corrompidos / vazios | Nenhum detectado (`-s` check no script) |
| Nunca utilizados | N/A |

### Recomendação de política
- **Diário:** 7 dumps (já existe) — preferir `pg_dump -Fc` ou gzip
- **Semanal:** 4 dumps (ex.: domingo)
- **Mensal:** 3–6 dumps
- Atual: 9 × 193M ≈ 1.7G; com compressão típica ~150–300M total diário

---

## 5. Scripts encontrados

### Produção / Deploy (manter)
- `deploy-prod.sh`, `scripts/deploy-prod-rsync.sh`, `deploy-prod-sync-only.sh`, `deploy-pm2.sh`, `lib/deploy-env.sh`
- `infra/*` (health, swap, tmux, verify-post-deploy)
- scripts Prisma/DB referenciados no `package.json`

### Banco / Migração (manter)
- `fix-db-ownership.sh`, backfills, seeds, upgrade produtos

### Debug / QA (manter, uso sob demanda)
- `auth-smoke.sh`, `hardening-smoke.sh`, `ci-auth-guard.mjs`

### Legado → quarentena
- Scripts root de out/2025 sem referência operacional (lista na seção 3)

### Staging (avaliar)
- `deploy-staging.sh`, `staging-utils.sh` — sem Docker staging ativo no PM2; **manter por enquanto** (ainda no package/repo)

---

## 6. Diretórios movidos para quarentena

- `/var/www/precivox` → `/archive/2026-07-14-cleanup/legacy-var-www/precivox`
- Poluição e backups `.next` em DEPLOY_DEST (lista acima)

## 7. Diretórios removidos

- **Nenhum diretório de projeto removido definitivamente.**
- Removido apenas container Docker parado `pensive_raman` + imagens dangling (~688M reais liberados).

---

## 8. Espaço em disco

| Métrica | Valor |
|---------|-------|
| Antes | 32G usados / 69G (48%) |
| Depois (df) | 31G usados / 69G (46%) |
| Liberado de fato (df) | **~856M** (principalmente Docker prune) |
| Isolado em quarentena | **~5.6G** (ainda ocupa disco até exclusão definitiva) |
| Potencial após apagar quarentena | **~6.4G+** |
| DEPLOY_DEST | 6.3G → **1.6G** (organizacionalmente limpo) |

---

## 9. Estrutura final desejada / alcançada

```
/root                          # SRC (edição + build + git)
/home/deploy/apps/precivox     # DEST (runtime PM2 enxuto)
/var/backups/precivox          # Backups diários
/var/log                       # Logs (logrotate ativo)
/archive/YYYY-MM-DD-cleanup    # Quarentena
/etc/nginx + letsencrypt       # Edge
```

Não foi criada árvore `/apps`/`/scripts` global — a convenção oficial do projeto já é SRC=`/root` + DEST=`/home/deploy/apps/precivox` (documentada em `.cursor/rules/deploy-production.mdc`).

---

## 10. Segurança (Fase 11)

| Achado | Severidade | Ação tomada |
|--------|------------|-------------|
| Senha DB **hardcoded** em `/usr/local/bin/backup_precivox.sh` | **CRÍTICA** | Script reescrito para `source .env.production` + `chmod 700` |
| `env_*.backup` com permissão `644` (world-readable) | **ALTA** | `chmod 600` em todos + dir `700` |
| Vários `.env` (root, DEST, legado www) | MÉDIA | Legado www na quarentena; root/DEST necessários |
| `/root/.ssh/authorized_keys` vazio | INFO | Verificar se acesso SSH esperado é só console/KingHost |
| Imagens Docker antigas com tags precivox | BAIXA | Manter até validação; não usadas pelo PM2 atual |
| PostgreSQL 12 cluster inactive (42M) | BAIXA | Validar e `pg_dropcluster` se confirmado unused |
| Credenciais históricas na quarentena (`legacy-var-www/.env`) | MÉDIA | Manter quarentena restrita root; apagar após rotação se necessário |

**Recomendação urgente:** rotacionar senha do Postgres / `JWT_SECRET` / chaves de API se houver dúvida de exposição anterior (script de backup era world-readable `755`).

---

## 11. Critérios de sucesso — checklist

| Pergunta | Resposta pós-auditoria |
|----------|------------------------|
| Scripts mortos? | Isolados na quarentena; scripts npm ativos preservados |
| Backups duplicados? | Duplicata do dump PR5 isolada; diários OK |
| Builds antigas? | `.next.backup` jun/30 em quarentena |
| Caches desnecessários? | Removidos do DEST; ainda existem em `/root` (necessários p/ build) |
| Temporários? | `/tmp` limpo (~372K) |
| Projetos antigos? | `/var/www/precivox` em quarentena |
| Dirs sem uso? | Tratados |
| Artefatos de teste? | Playwright cache permanece em `/root/.cache` (dev); não em prod runtime |
| Deps órfãs? | node_modules no DEST necessários; Docker images antigas pendentes validação |
| Riscos segurança? | Mitigados (backup script + perms); rotação de secrets recomendada |

---

## 12. Mudanças preventivas aplicadas

1. **`scripts/lib/deploy-env.sh`** — excludes amplos (IDE, nvm, npm cache, `.next.backup.*`, `backups`, etc.) para o rsync não recontaminar o DEST.
2. Também excluído `.next` do rsync de código (já havia rsync dedicado de `.next/`).
3. Backup diário sem senha hardcoded + permissões restritas.

---

## 13. Itens que exigem validação manual antes da exclusão definitiva

1. Apagar `/archive/2026-07-14-cleanup` após 7–14 dias de estabilidade.
2. Remover imagens Docker `precivox-frontend-staging`, `precivox-backend`, bases `node`/`nginx` se staging Docker estiver abandonado (~380M+).
3. Drop do cluster PostgreSQL 12 inactive.
4. `git gc --aggressive` / limpeza de objects grandes em `/root/.git` (2G) — só com backup.
5. Reduzir journal (`944M`) via `journalctl --vacuum-size=200M` se aceitável.
6. Compactar dumps SQL diários.
7. Rotação de secrets (pós exposição potencial).
8. Docs MD grandes no root (`PAINEL_IA_*`) — mover p/ `/root/docs/` se desejado (não bloqueiam produção).

---

## 14. Recomendações para manter limpo

1. Nunca ampliar rsync sem atualizar a lista de `--exclude`.
2. Política de backup diário/semanal/mensal com compressão.
3. Não usar `/root` home como DEST; manter separação SRC/DEST.
4. Revisar `/archive` mensalmente e apagar quarentenas >30 dias.
5. `npm run deploy:verify` após cada deploy.
6. Evitar deixar outputs de shell redirecionados com nomes acidentais no repo.
7. Restringir permissões de qualquer arquivo com secrets (`600`).

---

## 15. Validação pós-limpeza

- Frontend local: HTTP **200**
- PM2: backend, frontend, scheduler **online** (uptime preservado)
- nginx/sites-enabled intacto
- Cron de backup e health intactos
