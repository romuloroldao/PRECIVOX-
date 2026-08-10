# Plano de Migração — Skills Cursor

**Pré-requisito:** `docs/AI_SKILLS_MIGRATION_AUDIT.md`  
**Backup:** `docs/ai-skills/backup/2026-08-10/` + VPS `/root/.agents-backup-2026-08-10`  
**Pacote curado:** `docs/ai-skills/account-pack/`

---

## Princípios

1. Não apagar sem backup e sem SoT global confirmada.
2. Conta = reutilizável; projeto = específico Precivox.
3. Pacotes oficiais via `npx skills add -g` (não cópia estática quando houver registry).
4. Uma suíte de workflow: **Superpowers** como padrão; Matt Pocock como **híbrido opcional**.
5. Cloud Agents podem não herdar `~/.agents` da Desktop — manter no repo apenas o mínimo necessário até a conta estar populada em todos os runtimes.

---

## Tabela de ações

| Skill atual | Origem | Destino | Ação | Motivo |
|-------------|--------|---------|------|--------|
| `find-skills` | git+VPS | conta (registry) | migrar | oficial, reutilizável |
| `vercel-react-best-practices` | git+VPS | conta (registry) | migrar | oficial |
| `vercel-react-native-skills` | git+VPS | conta (registry) | migrar (opcional) | oficial; pouco uso no Precivox web |
| `web-design-guidelines` | git+VPS | conta (registry) | migrar | oficial |
| `software-engineer` | git+VPS | conta | migrar | persona genérica |
| `ux-expert` | git+VPS | conta | migrar | persona genérica |
| `product-strategy` | git+VPS | conta | migrar | persona genérica |
| `debugging-expert` | git+VPS | archive | consolidar → `systematic-debugging` | implementação rasa |
| `system-architecture` | git+VPS | archive | consolidar → `software-architecture` | outline vs operacional |
| `performance-optimizer` | git+VPS | archive | consolidar → vercel rules | cobertura inferior |
| `systematic-debugging` | VPS | conta | migrar | SoT debug |
| `software-architecture` | VPS | conta | migrar | SoT arquitetura prática |
| `using-superpowers` | VPS | conta | migrar | meta-skill suíte |
| `brainstorming` | VPS | conta | migrar | gate design |
| `writing-plans` | VPS | conta | migrar | planejamento |
| `executing-plans` | VPS | conta | migrar | execução |
| `test-driven-development` | VPS | conta | migrar | SoT TDD (Superpowers) |
| `tdd` | VPS | archive (ou hybrid Matt) | não dual-ativar | conflito com Superpowers TDD |
| `verification-before-completion` | VPS | conta | migrar | qualidade |
| `requesting-code-review` | VPS | conta | migrar | workflow |
| `receiving-code-review` | VPS | conta | migrar | workflow |
| `dispatching-parallel-agents` | VPS | conta | migrar | paralelismo |
| `subagent-driven-development` | VPS | conta | migrar | execução multi-agent |
| `finishing-a-development-branch` | VPS | conta | migrar | encerramento |
| `using-git-worktrees` | VPS | conta | migrar | isolamento |
| `write-a-skill` / `writing-skills` | VPS | conta | migrar | authoring |
| `grill-me`, `caveman`, `handoff`, `zoom-out` | VPS | conta | migrar | comunicação |
| `design-an-interface`, `prototype` | VPS | conta | migrar | design exploration |
| `to-prd`, `to-issues`, `ubiquitous-language` | VPS | conta | migrar | product/docs genéricos |
| suite escrita (`edit-article`, beats/fragments/shape) | VPS | conta | migrar | reutilizável |
| `setup-matt-pocock-skills` + diagnose/review/triage/… | VPS | hybrid | instalar só com bootstrap | depende do repo |
| `nextjs-api-auth-pattern` | VPS app | **projeto** `app/.cursor/skills/` | manter local | específica Precivox |
| `obsidian-vault` | VPS | local máquina | não migrar conta | path absoluto pessoal |
| `git-guardrails-claude-code` | VPS | archive | não promover Cursor | específico Claude Code |
| `migrate-to-shoehorn` | VPS | archive | nicho | só se stack usar shoehorn |
| Figma plugin skills | conta/plugin | conta | manter | já global via plugin |
| Cursor `skills-cursor/*` | produto | — | não tocar | builtins |

---

## Fases de execução

### Fase 0 — Backup (feito)

- [x] Tar VPS → repo `docs/ai-skills/backup/2026-08-10/`
- [x] Cópia `/root/.agents-backup-2026-08-10`
- [x] `MIGRATION_REGISTRY.json`

### Fase 1 — Documentação (feito neste PR)

- [x] Audit, Plan, Architecture, Consolidation docs
- [x] `account-pack/` curado + `install-to-account.sh`

### Fase 2 — Camada projeto

- [x] Sincronizar `nextjs-api-auth-pattern` → `app/.cursor/skills/`
- [x] Notices de depreciação nas personas ralas do projeto
- [ ] **Após** conta populada: remover do `.agents/skills/` as skills promovidas (manter lock só se ainda quiser project install)

### Fase 3 — Conta Cursor (ação do usuário / Desktop)

Neste Cloud Agent **não há** skills globais de usuário. Na máquina onde a conta está logada:

```bash
# 1) Pacotes oficiais
npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
npx skills add vercel-labs/agent-skills@vercel-react-native-skills -g -y
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y
npx skills add vercel-labs/skills@find-skills -g -y

# 2) Pack customizado (a partir do clone do repo)
bash docs/ai-skills/account-pack/install-to-account.sh global
# dry-run:
bash docs/ai-skills/account-pack/install-to-account.sh dry-run
```

Opcional Matt Pocock:

```bash
bash docs/ai-skills/account-pack/install-to-account.sh hybrid
# depois, no repo: usar setup-matt-pocock-skills uma vez
```

### Fase 4 — VPS (não destrutivo ainda)

1. Confirmar que Desktop/conta tem o pack global.
2. Em `/root/.agents/skills`, mover skills promovidas para quarentena (ex. `/root/.agents-quarantine-YYYYMMDD/`) — **não** `rm -rf`.
3. Manter `nextjs-api-auth-pattern` em `app/.cursor/skills`.
4. Atualizar este plano com data da limpeza.

### Fase 5 — Validação

Ver checklist em `docs/AI_SKILLS_ARCHITECTURE.md` § Validação.

---

## Critérios para remover cópia local

Só remover `X` de `.agents/skills/` quando:

1. Backup existe.
2. SoT global instalada (`npx skills list -g` mostra `X` ou substituta).
3. Capacidade coberta (teste de trigger em sessão nova).
4. Registro atualizado em `MIGRATION_REGISTRY.json`.
