# Relatório de Validação E2E Pós-Higienização — Precivox

**Data:** 2026-07-14  
**Metodologia:** Skill Software Engineer + crawl HTTP autenticado + Playwright (Chromium) + Browser + monitoramento de logs  
**Ambiente:** https://precivox.com.br (produção)  
**BUILD_ID pós-correção:** `7tHTIDv5LEGwUQjMM9xsR`

---

## 1. Resumo executivo

A limpeza do servidor **não quebrou** as jornadas principais. Login, refresh de sessão, páginas Cliente/Gestor/Admin, APIs críticas, chunks estáticos, PM2, Nginx, SSL e PostgreSQL estão operacionais.

Foram encontrados e **corrigidos** dois problemas (um pré-existente à limpeza, outro de schema):

| Problema | Causa | Impacto limpeza? | Correção |
|----------|-------|------------------|----------|
| Cliente acessava shell `/admin/*` (sidebar admin) | `app/admin/layout.tsx` sem `RouteGuard` | Não (pré-existente) | RouteGuard `ADMIN`/`GESTOR` + deploy |
| `GET /api/admin/demo-requests` → 500 | Tabela `demo_requests` ausente no Postgres | Não (drift de schema) | `CREATE TABLE` alinhado ao Prisma |

**Recomendação final:** ambiente **apto para produção**, com acompanhamento de itens residuais (seção 8).

---

## 2. Infraestrutura (pré e pós testes)

| Componente | Resultado |
|------------|-----------|
| PM2 `precivox-backend/frontend/ai-scheduler` | online após reload |
| Nginx + HTTPS | 200; certificado válido até 2026-09-10 |
| PostgreSQL 17 | connected; 33 tabelas app |
| Redis / OpenSearch | não instalados (N/A) |
| Cron backup + health | presentes |
| Chunks `/_next/static` | 200 |
| DEPLOY_DEST tamanho | ~2.0G (sem recontaminação IDE) |
| Quarentena | intacta em `/archive/2026-07-14-cleanup` (5.6G) |

Smoke pós-deploy: chunks/CSS/perfil 200. Warning conhecido: `"next start" does not work with "output: standalone"` (pré-existente, sem impacto imediato).

---

## 3. Fluxos por perfil

### 3.1 Cliente (`cliente@precivox.com`)

| Fluxo | Resultado |
|-------|-----------|
| Login e-mail/senha | OK → `/cliente/busca` |
| Refresh (F5) | Sessão persistida |
| Home | OK (economia, listas, bottom nav) |
| Busca + filtros/categorias | OK |
| Comparar | OK (mercados, distância, share/PDF) |
| Listas / Lista nova | OK |
| Perfil PRECI + Economia Líquida | OK |
| Raio Familiar (`/cliente/familia`) | OK (casa, convite, sync) |
| Scan | OK |
| Despensa / Alertas / Relatórios / Referral | OK |
| Mercado vivo / Modo corredor | OK |
| Página produto | 200 |
| Logout | OK (landing marketing; React #418/#423 hydration no marketing — residual) |
| Recuperação de senha (`/resetar-senha`) | Página 200 |
| Cadastro (`/signup`) | Página 200 |
| Acesso `/admin` e `/gestor` | **Bloqueado** → redirect `/cliente/home` (após fix) |

**APIs Cliente (com `mercadoId` quando exigido):** perfil-preci, raio-familiar, economia-streak, cesta-semana, parceiros-ancora, sugestoes-lista, markets → **200**.

### 3.2 Gestor (`gestor@precivox.com`)

| Fluxo | Resultado |
|-------|-----------|
| Login | OK → `/gestor/home` |
| Home / Produtos / IA (+ dashboard, resumo, conversão, promoções, compras) | OK |
| APIs radar, heatmap, catálogo-saúde, parceiros-ancora | 200 (mercado do gestor) |
| Admin APIs (`/api/admin/stats`, `/users`) | **403** (correto) |
| UI `/admin/dashboard` | Shell + “Acesso Negado” (dados bloqueados) |
| UI `/admin/users` | Shell visível sem dados (API 403) — residual |

### 3.3 Administrador (`admin@precivox.com`)

| Fluxo | Resultado |
|-------|-----------|
| Login | OK → `/admin/dashboard` |
| Dashboard / Users / Mercados / Produtos / Imagens | OK |
| Planos / Settings / Logs / IA / IA dashboard | OK |
| Demo-requests | OK **após** criação da tabela |
| Acesso `/gestor/home` | OK (admin permitido no RouteGuard gestor) |
| APIs admin stats/users/logs/ia-stats/demo-requests | 200 |

---

## 4. Auth / permissões / persistência

| Teste | Resultado |
|-------|-----------|
| Auth smoke (login/me/refresh/logout) × 3 roles | PASS |
| Bearer + cookies HTTPS | OK |
| Cliente → APIs gestor/admin | 403 |
| Gestor → APIs admin | 403 |
| Cliente → páginas admin/gestor (pós-fix) | redirect home cliente |
| localStorage preferências cliente | presente (onboarding, listas, geofence, etc.) |
| Sessão após F5 | OK |

---

## 5. Erros em logs durante a auditoria

| Fonte | Achados novos |
|-------|----------------|
| Frontend error log | +1 linha: warning `standalone` no restart (15:10) |
| Backend error | vazio |
| Nginx error | nenhum novo no período dos testes |
| Console Playwright | React hydration #418/#423 na landing pós-logout (pré-existente/marketing) |
| Server Action “x” | apenas histórico anterior (~12:56), fora da janela E2E |

Nenhum erro crítico novo atribuível à higienização.

---

## 6. Correções realizadas nesta auditoria

1. **`app/admin/layout.tsx`** — envolvido com `RouteGuard allowedRoles={['ADMIN','GESTOR']}`; deploy via `npm run deploy:sync` (BUILD `7tHTIDv5LEGwUQjMM9xsR`).
2. **Schema** — criada tabela `demo_requests` (+ índices) conforme migration baseline/Prisma.
3. Reteste authz Cliente: **AUTHZ_LEAK eliminado**.

---

## 7. Evidências

| Artefato | Path |
|----------|------|
| Crawl HTTP TSV | `/tmp/e2e-post-cleanup/results.tsv` |
| Playwright inicial | `/tmp/e2e-post-cleanup/playwright-report.json` |
| UI roles pós-fix | `/tmp/e2e-post-cleanup/ui-roles.json` |
| Log deploy correção | `/tmp/e2e-post-cleanup/deploy-authz-fix.log` |
| Auth smoke | stdout (PASS × 3) |

---

## 8. Comparativo antes × depois da limpeza

| Aspecto | Antes limpeza | Depois limpeza + E2E |
|---------|---------------|----------------------|
| Runtime DEST | ~6.3G (poluído) | ~2.0G limpo |
| App sobe / HTTP 200 | Sim | Sim |
| Chunks | OK | OK (revalidados pós-deploy) |
| Auth 3 roles | — | PASS |
| Jornadas UI | — | PASS (Cliente/Gestor/Admin) |
| Regressão por arquivos removidos | — | **Nenhuma** detectada |
| Scripts removidos ainda referenciados | — | **Não** |

---

## 9. Itens residuais (não bloqueiam go-live; não causados pela limpeza)

1. **Gestor vê chrome de `/admin/users`** sem dados (API 403) — restringir UI admin-only por rota.
2. **Hydration React #418/#423** na landing após logout.
3. Warning Next `output: standalone` vs `next start`.
4. APIs stub sem query (`mercadoId`) retornam 400 — comportamento esperado.
5. Rotas `/api/gestor/monetizacao` e `/api/gestor/ia` (GET raiz) 404 — paths aninhados; UI usa páginas corretas.
6. `pricing-assistido` nega mercado que não é do gestor (403) — correto.
7. Quarentena 5.6G ainda no disco até exclusão definitiva validada.

---

## 10. Checklist de sucesso

| Pergunta | Resposta |
|----------|----------|
| Jornadas Cliente OK? | **Sim** |
| Jornadas Gestor OK? | **Sim** |
| Jornadas Admin OK? | **Sim** |
| Funcionalidade quebrada pela limpeza? | **Não** |
| Erros de console críticos? | Hydration residual no marketing; sem ChunkLoadError |
| Erros backend novos? | **Não** |
| Endpoints em erro? | Corrigido `demo-requests`; demais 4xx esperados |
| Assets/chunks perdidos? | **Não** |
| Regressão da limpeza? | **Não** |
| Script removido ainda usado? | **Não** |
| Auth/autorização? | Auth OK; UI admin leak Cliente **corrigido**; residual Gestor→admin chrome |
| Perda de performance? | TTFB páginas ~40–90ms; sem regressão observada |

---

## 11. Recomendação final

**Ambiente apto para produção.**  
A higienização preservou o funcionamento. As falhas encontradas eram pré-existentes (guard admin + tabela ausente) e foram corrigidas com reteste.

Próximos passos sugeridos:
1. Manter quarentena 7–14 dias e então apagar.
2. Endurecer UI: `allowedRoles: ['ADMIN']` em páginas admin-only (`users`, `settings`, `logs`, `planos`).
3. Avaliar migração para `output: standalone` ou remover a flag.
4. Rotacionar secrets (recomendação da auditoria de limpeza).
