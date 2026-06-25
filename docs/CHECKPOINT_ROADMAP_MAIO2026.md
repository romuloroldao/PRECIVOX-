# CHECKPOINT — Roadmap PRECIVOX (handoff para próximo agente)

> **Data do checkpoint:** 28/05/2026  
> **Branch ativa:** `feature/sprint-2-comportamento-crowd`  
> **Último commit relevante:** `7dade68d` (fix ChunkLoadError) · `f50e9928` (9.1 sync agendado)  
> **Produção:** `https://precivox.com.br` · PM2 em `/home/deploy/apps/precivox`  
> **Documento mestre:** [`ROADMAP_PRECIVOX.md`](./ROADMAP_PRECIVOX.md) (ainda não reflete 100% o que foi entregue — use **este** checkpoint como fonte de verdade operacional)

---

## 1. Para quem está pegando o trabalho

Você está continuando o PRECIVOX em uma fase avançada da **Fase 2 (PMF regional)**. A maior parte da **Fase 1** e dos **Épicos 7, 8 e 9.1** já foi implementada em código, commitada na branch acima e deployada (com ressalvas abaixo).

**Não pule a ordem do backlog sem alinhar com o usuário.** A sequência acordada foi:

1. Fechar Épico 7 → 8 (em ordem numérica) → 9.1 ✅  
2. **Próximo na ordem:** **9.3** (SLA + contrato dados) → depois 9.2, 10.x, 11.x  
3. Abrir **PR** da branch acumulada + checklist QA antes de merge em `main`

**Idioma:** respostas ao usuário em **português**.

---

## 2. Visão geral (o que é o PRECIVOX)

| Dimensão | Conteúdo |
|----------|----------|
| **Tese** | O PRECIVOX **oferta demanda** ao consumidor (não espera). Antecipa cesta, empurra economia real e ativa o mercado certo no momento certo. |
| **Categoria** | Infraestrutura de **decisão de consumo alimentar** — não é “só comparador de preços”. |
| **B2C** | Busca, lista inteligente, economia líquida, perfil PRECI, confirmação de compra, loops de retenção, experiência no mercado (geofence, scan, prova social, família). |
| **B2B** | Gestor com IA (GROOC, saúde catálogo, radar demanda, conversão), upload/sync de catálogo. |
| **Princípios técnicos** | MVP first · baixo custo · IA híbrida (regras + eventos; LLM só para explicar) · dados proprietários · **IA explicável** (nunca caixa-preta). |
| **Moat** | Grafo hiperlocal de preço + intenção + confirmações crowd + hábito pré-mercado. |

### Horizonte por fase (resumo)

```
FASE 0 — Fundação          │ Upload, busca, lista, eventos, IA gestor
FASE 1 — MVP visão (0–3m)  │ EL, truth layer, crowd, Perfil PRECI, confirmação compra, retenção
FASE 2 — PMF (3–9m)        │ Despensa, cesta semana, mercado ao vivo, sync parceiro, radar B2B  ← ESTAMOS AQUI
FASE 3 — Escala (9–18m)    │ ML leve, oferta agregada, embeddings nacionais, monetização
FASE 4 — Plataforma (18m+) │ PRECI Network, CPG, LATAM
```

---

## 3. Contexto da sessão recente (o que o usuário pediu)

Ordem executada nas últimas conversas:

| Ordem | Item | Status código | Status deploy |
|-------|------|---------------|---------------|
| — | PR + QA + deploy geral | Parcial | Deploy contínuo em `/home/deploy/apps/precivox` |
| 7.2 | Cesta da semana 1-tap | ✅ | ✅ |
| 7.3 | Modo Emergência | ✅ | ✅ |
| 7.4 | Espera que vale | ✅ | ✅ |
| 7.5 | Atacado vs varejo | ✅ | ✅ |
| 8.1 | Modo Mercado Ao Vivo + geofence configurável | ✅ | ✅ |
| 8.5 | Troca inteligente explicável | ✅ | ✅ |
| 8.3 | Prova social hiperlocal | ✅ | ✅ |
| 8.2 | Scan inteligente v2 (OCR + embedding) | ✅ | ✅ |
| 8.4 | Raio familiar | ✅ | ✅ |
| 9.1 | Sync agendado URL/SFTP | ✅ | ✅ |
| — | Fix ChunkLoadError pós-deploy | ✅ | ✅ (`7dade68d`) |
| **9.3** | SLA + contrato dados | ✅ | `lib/parceiro-sla.ts`, `ParceiroSlaCard` |
| **Próximo** | **9.2** API batch + PR/QA | 🔲 | — |

**Observação:** O `ROADMAP_PRECIVOX.md` na seção “Estado atual (baseline)” ainda lista várias coisas como 🔲 que **já existem** no código — atualizar esse bloco é tarefa de housekeeping, não bloqueia desenvolvimento.

---

## 4. Ambiente técnico e deploy

### Repositório e branch

- **Repo:** `romuloroldao/PRECIVOX-` (GitHub)
- **Branch de trabalho:** `feature/sprint-2-comportamento-crowd`
- **`gh` CLI:** não disponível no servidor — PR manual no GitHub
- **Commits:** usar `/usr/bin/git commit` (wrapper do Cursor injeta `--trailer` e quebra no Git 2.25)

### Produção

| Item | Valor |
|------|--------|
| **App path** | `/home/deploy/apps/precivox` |
| **Fluxo deploy** | `rsync` de `/root` → `/home/deploy/apps/precivox` (excluir `node_modules`, `.next`, `.git`, `.env*`) |
| **Build** | `set -a && source .env.production && set +a && npm install && npx prisma generate && npm run build` |
| **PM2** | `precivox-frontend` (Next 3000), `precivox-backend` (3001), `precivox-ai-scheduler` |
| **Restart** | `pm2 restart precivox-frontend precivox-ai-scheduler` |
| **Node** | `.nvmrc` → 18.20.8 recomendado |

### Banco / migrations

- Histórico de erro: `must be owner of table` ao rodar `prisma migrate deploy` com usuário da app.
- **Workaround usado:** SQL manual como `postgres`, depois `npx prisma migrate resolve --applied <nome>`.
- Migrations recentes aplicadas manualmente:
  - `user_perfil_preci` (perfilPreci JSON)
  - `estoque_truth_layer`
  - `sync_agendado` → coluna `mercados.sync_agendado JSONB`

### Variáveis úteis

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Em `.env.production` no deploy (não commitar) |
| `CRON_SECRET` | **Não configurado** em produção → `POST /api/cron/sync-agendado` retorna 503 (esperado). Sync automático roda via **scheduler PM2** (`*/30 * * * *`). |
| `JWT_SECRET` | Auth TokenManager (cliente/gestor/admin) |

### Problemas conhecidos em produção

1. **ChunkLoadError** após deploy: HTML novo + chunks antigos em cache (`immutable`). Mitigação em `app/layout.tsx` (`7dade68d`). Usuário pode precisar **Ctrl+Shift+R**.
2. **Arquivos deletados no working tree** (sessões antigas): sempre `git restore` antes de deploy se algo sumir.
3. **Build warnings** `ssh2` / `cpu-features` — não bloqueia build; SFTP é dynamic import em `lib/sync-agendado.ts`.

---

## 5. Mapa de entregas — FASE 1 (Épicos 1–6)

Legenda: **✅ entregue** · **🟡 parcial** · **🔲 não feito**

### Épico 1 — Economia Líquida™

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 1.1 | EL cálculo | ✅ | `lib/economia-liquida.ts`, `docs/SPEC_ECONOMIA_LIQUIDA.md`, `POST /api/economia-liquida/calcular` |
| 1.2 | EL na lista inteligente | ✅ | `lib/melhor-alternativa-preco.ts`, `ListaInteligentePanel`, chips em busca |
| 1.3 | EL no scan/foto | 🟡 | EL após match no scan (`lib/scan-inteligente.ts`); não é foto→EL v1 completo do roadmap |
| 1.4 | Config valor do tempo | 🟡 | Defaults em `EL_DEFAULTS`; ajuste usuário limitado |
| 1.5 | Copy “Fique aqui” / “Vale X min” | ✅ | `explicacao` em `calcularEconomiaLiquida` |

### Épico 2 — IA proprietária (PRECI)

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 2.1 | Eventos expandidos | ✅ | `lib/ai/types.ts` (`preco_confirmado`, `compra_confirmada`, etc.), `EventCollector`, `POST /api/events/track` |
| 2.2 | Intent Score | ✅ | `GET /api/cliente/intent-score`, home/perfil |
| 2.3 | Push cesta provável 48–72h | 🟡 | Lógica `lib/cesta-provavel.ts` + card; push FCM não validado end-to-end |
| 2.4 | Ranking híbrido | 🟡 | Busca por preço + EL + perfil; não há rank ML completo |
| 2.5 | LLM só explicação | 🟡 | GROOC B2B; B2C majoritariamente regras |

### Épico 3 — Truth layer

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 3.1 | Metadados estoque | ✅ | `estoques.fonte`, `confianca`, `verificadoEm`, `lib/estoque-truth.ts` |
| 3.2 | UI “Atualizado há X” | ✅ | `PrecoTruthBadge`, `ProductCard` |
| 3.3 | Tiers parceiro 1/2/3 | 🔲 | Doc parcial em `PARCEIRO_EXPORT_CATALOGO.md` |
| 3.4 | Alerta catálogo stale | ✅ | `lib/catalogo-saude.ts`, `GET /api/gestor/catalogo-saude`, `CatalogoSaudeCard` |

### Épico 4 — Crowd v1 (Waze preços)

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 4.1 | Confirmar preço 3 taps | ✅ | `PrecoCrowdActions`, `POST /api/produtos/preco-feedback`, `lib/preco-crowd-feedback.ts` |
| 4.2 | Peso reputação | 🟡 | `lib/crowd-reputacao.ts` |
| 4.3 | Gamificação contribuidor | ✅ | `ContribuidorBadge`, níveis em perfil |
| 4.4 | Badge mercado verificado | 🔲 | — |

### Épico 5 — Perfil PRECI

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 5.1 | Perfil 5 eixos | ✅ | `lib/perfil-preci.ts`, `GET/PATCH /api/cliente/perfil-preci` |
| 5.2 | UI espelho + edição | ✅ | `/cliente/perfil` |
| 5.3 | Confirmação pós-compra | ✅ | `CompraConfirmacaoPrompt`, eventos `compra_confirmada` / `compra_parcial` |
| 5.4 | Relatório semanal | ✅ | `lib/relatorio-semana-cliente.ts`, `RelatorioSemanaCard` |

### Épico 6 — Retenção v1

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 6.1 | Streak economia | ✅ | `lib/economia-streak.ts`, `EconomiaStreakCard` |
| 6.2 | Card share economia | ✅ | `ShareEconomiaCard` |
| 6.3 | Notificação dia de mercado | 🟡 | `NotificacaoPermissaoBanner` + FCM infra; inferência não 100% |
| 6.4 | Inflação da sua cesta | ✅ | `lib/inflacao-cesta.ts`, `InflacaoCestaCard` |

### Checklist release Fase 1 (roadmap original)

| Item | Status |
|------|--------|
| EL em busca + lista | ✅ |
| Truth layer visível | ✅ |
| Crowd confirmar preço | ✅ |
| Confirmação pós-compra | ✅ |
| Perfil PRECI + Intent + push/card cesta | 🟡 |
| Dashboard saúde catálogo gestor | ✅ |

---

## 6. Mapa de entregas — FASE 2 (Épicos 7–11) — FOCO ATUAL

### Épico 7 — Despensa e oferta ativa ✅ (código)

| # | Feature | Commit ref | Lib / API | UI |
|---|---------|------------|-----------|-----|
| 7.1 | Despensa digital | (base 7.2) | `lib/despensa-digital.ts` — inferência + `despensaManual` em `perfilPreci` | Usada por cesta-semana |
| 7.2 | Cesta da semana 1-tap | `f8f85392` | `lib/cesta-semana.ts`, `GET/POST /api/cliente/cesta-semana` | `CestaProvavelCard` + botão 1-tap |
| 7.3 | Modo Emergência | `8726370e` | `lib/modo-emergencia.ts`, `/api/cliente/modo-emergencia` | `ModoEmergenciaCard` |
| 7.4 | Espera que vale | `76eb19b4` | `lib/espera-que-vale.ts`, `/api/cliente/espera-que-vale` | `EsperaQueValeCard`, chip no `ProductCard` |
| 7.5 | Atacado vs varejo | `26054466` | `lib/atacado-varejo.ts`, `/api/cliente/atacado-varejo` | `AtacadoVarejoCard`, chip; mescla `raioFamiliar` no perfil |

### Épico 8 — Experiência em contexto ✅ (código)

| # | Feature | Commit ref | Lib / API | UI / rotas |
|---|---------|------------|-----------|------------|
| 8.1 | Modo Mercado Ao Vivo | `f4bc5853`, `15ef045e` | `lib/modo-mercado-vivo.ts`, `/api/cliente/modo-mercado-vivo`, `/itens`, `/config` | `/cliente/mercado-vivo`, `MercadoVivoBanner`, `GeofenceRaioSelector` (100–800 m) |
| 8.2 | Scan inteligente v2 | `7e58f88d` | `lib/scan-inteligente.ts`, `lib/scan-embedding.ts`, `lib/scan-ocr-client.ts` (tesseract), `/api/cliente/scan-inteligente` | `/cliente/scan`, `ScanInteligenteEntry` (home, busca, corredor) |
| 8.3 | Prova social hiperlocal | `2193ed5f` | `lib/prova-social-hiperlocal.ts`, `/api/cliente/prova-social`, batch em `/api/produtos/buscar?includeProvaSocial=true` | `ProvaSocialMercadoCard`, inline no `ProductCard` |
| 8.4 | Raio familiar | `52ad9c55` | `lib/raio-familiar.ts`, `/api/cliente/raio-familiar` | `/cliente/familia`, `RaioFamiliarCard`, `RaioFamiliarListaSync` em `providers.tsx` |
| 8.5 | Troca inteligente | `ebb5f9d2` | `lib/troca-inteligente.ts`, `/api/cliente/substitutos`, `/troca-inteligente/historico` | `TrocaHistoricoCard`, troca no `ProductCard` |

**Detalhes 8.2:** OCR no browser (Tesseract `por`); match servidor: EAN → `codigoBarras`, senão embedding TF+Jaccard (`SCAN_MIN_SCORE=0.38`).

**Detalhes 8.4:** Até 6 membros; config em `mercados` não — fica em `perfilPreci.raioFamiliarCircle` (admin) + `raioFamiliarMembership` (membros); lista compartilhada com debounce 2,5s.

### Épico 9 — Parceiro e sincronização

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 9.1 | **Sync agendado** | ✅ | `lib/sync-agendado.ts`, `GET/PUT /api/gestor/sync-agendado`, `POST .../executar`, `POST /api/cron/sync-agendado`, `SyncAgendadoCard`, job `AIJobs.runCatalogSync` cada 30 min |
| 9.2 | API batch `POST /partner/v1/estoques` | 🔲 | — |
| 9.3 | **SLA + contrato dados Tier 1–3** | ✅ | `lib/parceiro-sla.ts`, `GET/PATCH /api/gestor/parceiro-sla`, `PARCEIRO_SLA_CONTRATO.md` |
| 9.4 | Webhook preço alterado | 🔲 | — |

**Detalhes 9.1:**

- Fontes: **URL** (axios, máx 50 MB) ou **SFTP** (`ssh2-sftp-client`)
- Intervalos: `6h` | `12h` | `24h` | `semanal`
- Config: `mercados.sync_agendado` (JSONB)
- Reusa `processarUpload()` → mesmos CSV/XLSX/JSON que upload manual
- Doc: `docs/PARCEIRO_EXPORT_CATALOGO.md` (seção Sync agendado)

### Épico 10 — B2B gestor

| # | Feature | Status | Onde está |
|---|---------|--------|-----------|
| 10.1 | Radar demanda bairro | 🟡 | `lib/radar-demanda.ts`, `/api/gestor/radar-demanda` (sprint 3); validar UX gestor |
| 10.2 | Pricing assistido 1-tap | 🔲 | — |
| 10.3 | Alerta ruptura preditiva | 🔲 | — |
| 10.4 | Benchmark preço regional | 🔲 | — |
| 10.5 | Resumo semana GROOC | 🟡 | `/api/gestor/ia/resumo-semana/[mercadoId]` |

### Épico 11 — PRECI Graph

| # | Feature | Status | Notas |
|---|---------|--------|-------|
| 11.1 | Agregação CEP5/polígono | 🟡 | `nome_chave`, `chave_insight`, `regiao-preco-unidades.ts` |
| 11.2 | Heatmap intenção | 🔲 | — |
| 11.3 | Rota multi-mercado EL | 🟡 | `lib/lista-rota-proposta.ts`, `lista-rota-ia.ts` |
| 11.4 | PRECI Index | 🔲 | — |

---

## 7. Superfície de produto (rotas principais)

### Cliente (B2C)

| Rota | Função |
|------|--------|
| `/cliente/home` | Hub: economia, cards épico 7–8, mercado vivo, família |
| `/cliente/busca` | Busca + lista lateral + EL + prova social + scan entry |
| `/cliente/mercado-vivo` | Modo corredor (geofence) |
| `/cliente/scan` | Scan etiqueta OCR |
| `/cliente/familia` | Raio familiar |
| `/cliente/perfil` | Perfil PRECI + intent |

### Gestor (B2B)

| Rota | Função |
|------|--------|
| `/gestor/produtos` | Upload + **Sync agendado** + saúde catálogo |
| `/gestor/ia/*` | Dashboards IA |

### APIs cliente (lista para smoke test)

```
/api/cliente/perfil-preci
/api/cliente/intent-score
/api/cliente/cesta-provavel
/api/cliente/cesta-semana
/api/cliente/modo-emergencia
/api/cliente/espera-que-vale
/api/cliente/atacado-varejo
/api/cliente/modo-mercado-vivo (+ /config, /itens)
/api/cliente/scan-inteligente
/api/cliente/prova-social
/api/cliente/raio-familiar
/api/cliente/substitutos
/api/cliente/troca-inteligente/historico
/api/cliente/economia-streak
/api/cliente/inflacao-cesta
/api/cliente/relatorio-semana
```

Todas exigem sessão válida → **401** sem cookie é esperado.

---

## 8. Padrões de implementação (seguir no próximo trabalho)

1. **Auth cliente:** `TokenManager.validateSession` nas rotas `/api/cliente/*`
2. **Auth gestor:** `requireAuth` + checar `mercado.gestorId` para GESTOR
3. **perfilPreci PATCH:** sempre mesclar JSON (`{ ...base, ...patch }`) — nunca sobrescrever `despensaManual`, `geofenceRaioMetros`, `raioFamiliar*`
4. **Listas:** `ListaContext` (localStorage) + sync opcional (raio familiar)
5. **Eventos:** `EventCollector.recordEvent` para comportamento IA
6. **Upload/sync catálogo:** única fonte de verdade de ingestão → `lib/upload-handler.ts` → `processarUpload`
7. **Commits:** `/usr/bin/git commit -m "..."`  
8. **Deploy:** rsync → build em `/home/deploy/apps/precivox` → pm2 restart frontend (+ scheduler se cron job mudou)
9. **Escopo mínimo:** não refatorar épicos anteriores ao implementar 9.3

---

## 9. O que falta fazer (priorizado)

### P0 — imediato (ordem acordada)

| # | Tarefa | Notas |
|---|--------|-------|
| 1 | **PR da branch** | Muito conteúdo acumulado; checklist QA abaixo |
| 2 | **9.2** API batch parceiro | Mesmo schema upload |
| 3 | **QA manual** pós-merge candidato | Home, busca, mercado-vivo, scan, família, gestor sync |

### P1 — logo após 9.3

| # | Tarefa |
|---|--------|
| 4 | **9.2** API `POST /partner/v1/estoques` (mesmo schema upload) |
| 5 | **10.1** Radar demanda — endurecer UI gestor |
| 6 | **10.2** Pricing assistido |
| 7 | Atualizar **`ROADMAP_PRECIVOX.md`** baseline + marcar épico 7–9.1 ✅ |

### P2 / backlog

| # | Tarefa |
|---|--------|
| 8 | 9.4 Webhook preço |
| 9 | 11.x PRECI Graph completo |
| 10 | 3.3 Tiers parceiro formal + selo mercado 4.4 |
| 11 | Configurar `CRON_SECRET` se quiser cron HTTP externo além do scheduler |
| 12 | 7.1 UI despensa dedicada (hoje inferida via cesta-semana) |

---

## 10. Checklist QA sugerido (antes do PR)

### Cliente logado

- [ ] Home carrega cards sem ChunkLoadError (hard refresh se necessário)
- [ ] Busca: produtos, lazy load, chips EL / espera / atacado / prova social
- [ ] Lista: adicionar/remover; prompt confirmação compra
- [ ] Cesta da semana 1-tap
- [ ] Modo emergência
- [ ] Mercado ao vivo: geofence + checklist corredor
- [ ] Scan: foto → match → adicionar lista
- [ ] Família: criar raio, código convite, sync lista (2 dispositivos se possível)
- [ ] Perfil PRECI: sliders + salvar

### Gestor logado

- [ ] Upload manual ainda funciona
- [ ] Sync agendado: salvar URL, executar agora, ver log `sync-*` em importações
- [ ] Saúde do catálogo

### APIs (curl com sessão ou 401 esperado)

- [ ] `GET /api/cliente/raio-familiar` → 401 sem auth
- [ ] `GET /api/gestor/sync-agendado?mercadoId=...` → 401/200 conforme auth

---

## 11. Smoke tests rápidos (servidor)

```bash
# Sem auth (esperado 401)
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3000/api/cliente/scan-inteligente"
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3000/api/gestor/sync-agendado?mercadoId=x"

# Páginas
curl -s -o /dev/null -w "%{http_code}\n" "https://precivox.com.br/cliente/busca"
curl -s -o /dev/null -w "%{http_code}\n" "https://precivox.com.br/cliente/scan"
curl -s -o /dev/null -w "%{http_code}\n" "https://precivox.com.br/cliente/familia"

# Cron (503 se CRON_SECRET ausente)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://127.0.0.1:3000/api/cron/sync-agendado"
```

---

## 12. Histórico de commits recentes (branch)

```
7dade68d fix: recuperação ChunkLoadError com cache bust após deploy
f50e9928 feat(gestor): sync agendado URL/SFTP (9.1)
52ad9c55 feat(cliente): raio familiar (8.4)
7e58f88d feat(cliente): scan inteligente v2 (8.2)
2193ed5f feat(cliente): prova social hiperlocal (8.3)
ebb5f9d2 feat(8.5): troca inteligente explicável
15ef045e feat(8.1): geofence configurável
f4bc5853 feat(8.1): modo mercado ao vivo
26054466 feat(7.5): atacado vs varejo
76eb19b4 feat(7.4): espera que vale
8726370e feat(7.3): modo emergência
f8f85392 feat(7.2): cesta da semana
f73fccd0 feat(sprint 0-2): EL, truth, crowd, Perfil PRECI
```

---

## 13. Documentos de referência

| Documento | Uso |
|-----------|-----|
| [`ROADMAP_PRECIVOX.md`](./ROADMAP_PRECIVOX.md) | Visão longo prazo (atualizar baseline) |
| [`ISSUES_SPRINT0.md`](./ISSUES_SPRINT0.md) | Sprint 0 fechado |
| [`SPEC_ECONOMIA_LIQUIDA.md`](./SPEC_ECONOMIA_LIQUIDA.md) | Fórmula EL |
| [`PARCEIRO_EXPORT_CATALOGO.md`](./PARCEIRO_EXPORT_CATALOGO.md) | Schema CSV + sync 9.1 |
| [`DEPLOY.md`](./DEPLOY.md) | Deploy geral |
| **Este arquivo** | Handoff operacional maio/2026 |

---

## 14. Mensagem sugerida para o usuário ao retomar

> “Épico 7 e 8 estão implementados na branch `feature/sprint-2-comportamento-crowd`, com 9.1 (sync agendado) em produção. Próximo na ordem: **9.3 SLA/contrato de dados**, depois PR + QA. Quer que eu comece pelo 9.3?”

---

*Checkpoint gerado para continuidade entre agentes. Revisar após merge do PR ou conclusão do 9.3.*
