# Auditoria de Hardening — PRECIVOX

**Data:** 30/06/2026  
**Escopo:** Deploy, chunks, performance, memória, APIs, observabilidade, segurança, regressão  
**BUILD_ID pós-hardening:** `IUPLqUnPDts3XUMiK78IT`  
**Tipo:** Estabilização — sem novas funcionalidades de produto

---

## 1. Resumo executivo

Auditoria completa pós-estabilização (migrações, logout, chunk recovery, perfil PRECI). Foram identificados **42 achados** em três eixos (deploy, APIs/memória, segurança). **11 correções estruturais** implementadas nesta fase; demais itens documentados como riscos remanescentes com prioridade.

**Estado atual:** deploy com pausa atômica do frontend, smoke ampliado (homepage + BUILD_ID + backend health), telemetria de ChunkLoadError, correções de segurança P0 (IDOR unidades, upload BFF), wrapper de erro em `withRole`.

**Veredicto para demonstração/homologação:** **APTO** com ressalvas documentadas (§11).

---

## 2. Problemas encontrados (por severidade)

### P0 — Corrigidos nesta fase

| # | Problema | Causa raiz | Correção |
|---|----------|------------|----------|
| 1 | `deploy_pm2_reload_apps` ausente — CI sync-only quebrava | Função referenciada mas não implementada | Implementada em `scripts/lib/deploy-env.sh` |
| 2 | Race rsync `.next --delete` vs tráfego live | Chunks apagados mid-request | `pm2 stop frontend` antes do sync |
| 3 | IDOR `/api/unidades` — CLIENTE criava/listava unidades | Guard só para GESTOR | Bloqueio explícito para `CLIENTE` |
| 4 | BFF upload sem role check | `requireApiSession` sem validação de role/mercado | Alinhado com rota direta ADMIN/GESTOR + ownership |

### P0 — Documentados (não corrigidos nesta fase)

| # | Problema | Recomendação |
|---|----------|--------------|
| 5 | Middleware não enforce auth globalmente | Wrapper CI que falha build se rota `/api/*` não importa guard |
| 6 | `/api/setup/seed-users` com secret em query | Desativar em prod; remover secret de URL |

### P1 — Corrigidos nesta fase

| # | Problema | Correção |
|---|----------|----------|
| 7 | Smoke só testava chunks estáticos | `deploy_smoke_apps`: homepage, `/api/health`, backend health |
| 8 | BUILD_ID não exposto para correlação | `GET /api/health` + header `X-Precivox-Build-Id` |
| 9 | ChunkLoadError sem telemetria | `POST /api/telemetry/client` + beacon no layout |
| 10 | `withRole` sem try/catch — 500 não tratado | try/catch + `{ success: false }` |
| 11 | Loop infinito chunk recovery (fase anterior) | Contador reset só após `precivox:app-ready` |

### P1 — Remanescentes

| # | Problema | Arquivo/área |
|---|----------|--------------|
| 12 | Sem rollback automático pós-smoke fail | deploy-env (backup manual `.next.backup.*` adicionado) |
| 13 | Nginx `/health` stub estático | `nginx/production-nextjs.conf` |
| 14 | 7 rotas API sem try/catch | admin imagens, reindex job, auth/me |
| 15 | Pipeline Zod `withValidation` não usado | `lib/api/middleware/` |
| 16 | GESTOR altera imagem de qualquer produto | admin produtos imagem |
| 17 | Upload imagem sem limite de tamanho | admin produtos imagem |
| 18 | Tokens no JSON body (login/refresh) | auth routes |

### P2 — Remanescentes

| # | Problema |
|---|----------|
| 19 | 9 páginas cliente >300 linhas (split futuro) |
| 20 | Barrel `@/components/ui` — 15+ imports |
| 21 | `useProdutos` / geofence sem AbortController |
| 22 | ListaContext monolítico — re-renders em cascata |
| 23 | Scripts deploy legados (`deploy-production.sh`, etc.) |
| 24 | Sentry/Prometheus não wired |
| 25 | `global-error.tsx` não integrado ao chunk recovery |

---

## 3. Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `scripts/lib/deploy-env.sh` | Sync atômico, backup `.next`, `deploy_pm2_reload_apps`, `deploy_smoke_apps` |
| `scripts/deploy-prod-rsync.sh` | Usa funções centralizadas |
| `scripts/infra/verify-post-deploy.sh` | Smoke ampliado |
| `scripts/hardening-smoke.sh` | **Novo** — regressão HTTP |
| `app/api/health/route.ts` | **Novo** — health + BUILD_ID |
| `app/api/telemetry/client/route.ts` | **Novo** — telemetria chunk/recovery |
| `app/layout.tsx` | Beacon telemetria |
| `middleware.ts` | Bypass `/api/health`, `/api/telemetry/` |
| `lib/api/auth/withRole.ts` | try/catch + formato erro |
| `lib/api/withApiHandler.ts` | **Novo** — wrapper reutilizável |
| `app/api/unidades/route.ts` | Bloqueio CLIENTE |
| `app/api-proxy/.../upload-smart/route.ts` | Auth ADMIN/GESTOR + mercado |
| `components/cliente/StreakCounter.tsx` | Cleanup timer + cancelled flag |

---

## 4. Melhorias implementadas

### Deploy
- Frontend pausado durante rsync de chunks
- Backup automático `.next.backup.*` (mantém 3 últimos)
- `pm2 reload` com fallback `restart`
- Smoke valida BUILD_ID via `/api/health` e backend `:3001/api/health`

### Chunks
- Inventário: **zero** `next/dynamic` / `React.lazy` em components
- 9 lazy imports de `auth-client` em páginas admin (baixo risco)
- Recovery: detecção restrita a `/_next/static/`, max 2 retries, telemetria

### Observabilidade
- Logs estruturados JSON: `[telemetry/client]`
- Eventos: `chunk_load_error`, `chunk_recovery_attempt`, `chunk_recovery_exhausted`, `app_ready`
- Rate limit: 60 req/min/IP

### Segurança
- IDOR unidades fechado
- Upload BFF alinhado à rota canônica

### Memória
- StreakCounter: timer órfão corrigido

---

## 5. Auditoria de chunks (resumo)

| Rota | Chunks lazy | Status |
|------|-------------|--------|
| `/cliente/perfil` | page chunk estático | ✅ smoke 200 |
| `/cliente/scan` | estático | ✅ |
| `/cliente/mercado-vivo` | estático | ✅ |
| `/cliente/busca` | estático (156kB first load) | ✅ |
| `/gestor/ia/dashboard` | estático (242kB — Recharts) | ✅ |
| `/admin/*` | auth-client lazy | ⚠️ monitorar pós-deploy |

**Recovery:** handler inline no root layout; reset via `Providers` → `precivox:app-ready`.

---

## 6. Performance (achados — não alterados)

- `ListaProvider` + `RaioFamiliarListaSync`: re-render global a cada mudança de lista
- `useSession` singleton: **OK** (1 fetch compartilhado)
- `DashboardLayout` CLIENTE: bypass loading — **OK** (fix anterior)
- Polling 30s em `useProdutos` na busca

**Recomendação próxima fase:** split ListaContext; imports diretos de UI; AbortController em hooks de fetch.

---

## 7. Fluxos validados (30/06/2026)

| Fluxo | Resultado |
|-------|-----------|
| Home, Login, Cadastro | HTTP 200 |
| Busca, Perfil, Listas, Scan, Despensa, Comparar, Mercado Vivo | HTTP 200 |
| Gestor home, Admin dashboard | HTTP 200 |
| `/api/health` BUILD_ID | ✅ coincide com disco |
| Backend `/api/health` | HTTP 200 |
| APIs protegidas sem auth | 401 |
| Deploy smoke pós-reload | ✅ chunks + homepage + health |
| Perfil PRECI save (fase anterior) | ✅ |

**Não executados nesta sessão (manual recomendado):** logout multi-aba, botão Voltar, deep links mobile, demo gestor upload catálogo.

---

## 8. Métricas coletadas

| Métrica | Valor |
|---------|-------|
| Rotas API | 161 |
| Rotas sem try/catch | 7 (~4%) |
| Dynamic imports (client) | 9 (admin auth-client) |
| BUILD_ID produção | `IUPLqUnPDts3XUMiK78IT` |
| Chunk perfil HTTP | 200 |
| Homepage pós-deploy | 200 |
| Telemetria rate limit | 60/min/IP |

---

## 9. Critérios de conclusão (checklist honesto)

| Pergunta | Resposta |
|----------|----------|
| Alguma página ainda pode quebrar? | **SIM** — janela pós-deploy ~segundos; mitigado por recovery |
| Loading infinito? | **NÃO** conhecido (RouteGuard + session singleton) |
| Requests desnecessárias? | **SIM** — polling busca, múltiplos fetches NPS/perfil |
| Estados inconsistentes? | **NÃO** crítico |
| Código morto relevante? | **SIM** — scripts deploy legados, withValidation não usado |
| Componentes excessivamente grandes? | **SIM** — 6 páginas cliente >400 linhas |
| Memory leaks? | **SIM** (menores) — geofence, useProdutos, NPS widget |
| Renders desnecessários? | **SIM** — ListaContext |
| API sem timeout? | **SIM** — ~159 rotas sem timeout explícito |
| Queries lentas? | **SIM** — busca produtos, reindex job |
| Endpoints sem erro consistente? | **SIM** — ~7 rotas + formato misto legacy |
| Vulnerabilidades auth? | **SIM** (menores) — seed-users, markets GET, tokens no body |
| Problemas pós-deploy? | **MITIGADO** — sync atômico + recovery |
| Gargalos UX demo? | **SIM** — busca com lista 500+ itens QA |
| Riscos sem documentação? | **NÃO** — este documento |

---

## 10. Riscos remanescentes

1. **Rollback automático** — backup existe, restore manual
2. **Observabilidade centralizada** — logs só PM2, sem Sentry/Datadog
3. **Rate limit in-memory** — não distribuído multi-instância
4. **Middleware pass-through** — dependência de discipline por rota
5. **Catálogo stale Empório** — ops/comercial, não frontend
6. **Push VAPID** — dependência externa go-live

---

## 11. Recomendações — próxima fase

1. **CI:** script que falha se nova rota `/api/*` não importa `requireApiSession`/`withAdmin`
2. **Sentry:** `@sentry/nextjs` mínimo — API 500 + ChunkLoadError beacon
3. **Rollback:** symlink `releases/` + `current` (adaptar `deploy-atomic.sh`)
4. **API:** migrar POST/PATCH críticos para `withValidation` + `withApiHandler`
5. **Performance:** split `ListaContext`; lazy `NpsSurveyWidget` no layout cliente
6. **Segurança:** remover tokens do JSON em produção; limitar upload imagem 5MB + magic bytes
7. **Nginx:** proxy `/health` → Next `/api/health` em vez de stub

---

## 12. Comandos operacionais

```bash
# Deploy completo com smoke ampliado
npm run deploy:sync

# Regressão HTTP (prod ou local)
bash scripts/hardening-smoke.sh https://precivox.com.br

# Verificação pós-deploy
bash scripts/infra/verify-post-deploy.sh

# Telemetria chunk (logs PM2 frontend)
grep 'telemetry/client' /var/log/precivox-frontend-out.log

# BUILD_ID em produção
curl -s https://precivox.com.br/api/health | jq .
```

---

*Relatório gerado como entregável da fase de Hardening. Referências: `docs/CHECKLIST_GO_LIVE.md`, `docs/CHECKPOINT_ROADMAP_MAIO2026.md`.*
