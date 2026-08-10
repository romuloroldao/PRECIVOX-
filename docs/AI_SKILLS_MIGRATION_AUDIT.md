# Auditoria — Migração do Ecossistema de Skills do Cursor

**Data:** 2026-08-10  
**Ambientes auditados:**

| Ambiente | Identidade | Papel |
|----------|------------|--------|
| Cloud Agent / Git workspace | `github.com/romuloroldao/PRECIVOX-` → `/workspace` | Projeto Precivox (cópia git) |
| VPS KingHost | `r14653s.vps-kinghost.net` (`189.126.111.149`) | Servidor de produção + Remote SSH histórico |
| Conta Cursor (visível neste runtime) | Cloud Agent + plugin Figma GLOBAL | Skills de conta/plugin acessíveis aqui |

**Backup pré-migração:**

- VPS: `/root/.agents-backup-2026-08-10`
- Repo: `docs/ai-skills/backup/2026-08-10/agents-skills-backup-2026-08-10.tgz`
- Registro: `docs/ai-skills/backup/2026-08-10/MIGRATION_REGISTRY.json`

---

## Resumo executivo

### Estado atual

O Precivox opera no **modelo antigo**: skills instaladas **por máquina/projeto**.

- No **workspace git** há **10 skills** em `.agents/skills/` (4 pacotes oficiais Vercel/skills.sh + 6 personas `project-team`).
- Na **VPS** há **54 skills** em `/root/.agents/skills/` (as mesmas 10 + 44 workflows Superpowers/Matt Pocock/escrita/etc.), mais skills de sistema Cursor (`~/.cursor/skills-cursor`), plugin Figma, e **1 skill local de projeto** (`nextjs-api-auth-pattern`).
- Neste **Cloud Agent**, `npx skills list -g` retorna **nenhuma skill global de usuário**. O que existe “na conta” visível aqui é o **plugin Figma (GLOBAL)** e a skill de sistema `migrate-to-builds`.

As 10 skills com o mesmo nome entre workspace e VPS são **byte-idênticas** (SHA-256 igual). Não há divergência de versão nesses nomes — há **lacuna de cobertura**: a VPS tem o ecossistema rico; o repo git tem só o núcleo.

### Estado desejado

```text
CURSOR ACCOUNT (global reutilizável)
        │
   Core / Quality / Workflow
        │
   PROJECT LAYER (só o específico)
        │
   Precivox: nextjs-api-auth-pattern + rules .mdc
```

Menos cópias, mais cobertura, manutenção centralizada — **sem** empurrar skills locais (auth Precivox, Obsidian path) para a conta.

---

## Inventário local

### A) Workspace git — `.agents/skills/` (10)

| Nome | Tipo | Origem | Versão | Escopo | Capacidades (resumo) | Genérico? |
|------|------|--------|--------|--------|----------------------|-----------|
| `find-skills` | Skill CLI | vercel-labs/skills | lock 2026-03-11 | Descoberta/instalação | `npx skills find/add` | Sim |
| `vercel-react-best-practices` | Rules pack | vercel-labs/agent-skills | 1.0.0 | React/Next perf | 58 rules / 8 categorias | Sim |
| `vercel-react-native-skills` | Rules pack | vercel-labs/agent-skills | 1.0.0 | RN/Expo | 36 rules | Sim (não usado no Precivox web) |
| `web-design-guidelines` | Audit skill | vercel-labs/agent-skills | 1.0.0 | UI guidelines | Fetch + review | Sim |
| `software-engineer` | Persona | project-team | 1.0.0 | Eng. geral | Princípios, patterns, linguagens | Sim |
| `system-architecture` | Persona | project-team | 1.0.0 | Arquitetura | Outline estilos/trade-offs | Sim (raso) |
| `debugging-expert` | Persona | project-team | 1.0.0 | Debug | Checklist 5 passos | Sim (raso) |
| `performance-optimizer` | Persona | project-team | 1.0.0 | Perf | Checklist genérico | Sim (raso) |
| `product-strategy` | Persona | project-team | 1.0.0 | Produto | Alinhamento negócio/UX/tech | Sim |
| `ux-expert` | Persona | project-team | 1.0.0 | UX | Frameworks UX, research, a11y | Sim |

Lock: `.agents/.skill-lock.json` (apenas as 4 oficiais).

### B) VPS — `/root/.agents/skills/` (54)

Inclui as 10 acima (hashes idênticos) **mais** 44:

**Superpowers / workflow:** `using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `subagent-driven-development`, `finishing-a-development-branch`, `using-git-worktrees`, `writing-skills`

**Matt Pocock / engineering suite:** `setup-matt-pocock-skills`, `tdd`, `diagnose`, `review`, `triage`, `improve-codebase-architecture`, `request-refactor-plan`, `grill-with-docs`, `qa`, `to-prd`, `to-issues`, `ubiquitous-language`, `design-an-interface`, `prototype`, `teach`, `scaffold-exercises`

**Arquitetura comunitária:** `software-architecture`

**Comunicação / escrita:** `grill-me`, `caveman`, `handoff`, `zoom-out`, `edit-article`, `writing-beats`, `writing-fragments`, `writing-shape`, `write-a-skill`

**Máquina / tooling específico:** `obsidian-vault` (path Windows), `git-guardrails-claude-code`, `migrate-to-shoehorn`, `setup-pre-commit`

### C) VPS — skill de projeto

| Nome | Localização | Escopo |
|------|-------------|--------|
| `nextjs-api-auth-pattern` | `/root/app/.cursor/skills/` e espelho em `/home/deploy/apps/precivox/app/.cursor/skills/` | **LOCAL Precivox** (`withAdmin`/`withRole`) |

### D) VPS — Cursor built-in (`~/.cursor/skills-cursor/`)

Skills de produto Cursor (não são “skills do usuário”): `create-skill`, `create-rule`, `create-hook`, `create-subagent`, `automate`, `babysit`, `canvas`, `loop`, `onboard`, `sdk`, `shell`, `split-to-prs`, `statusline`, `migrate-to-skills`, `review`, `review-bugbot`, `review-security`, `update-cli-config`, `update-cursor-settings`.

Tratar como **infraestrutura Cursor**, não migrar/duplicar.

### E) Cloud Agent — plugin Figma (conta/marketplace GLOBAL)

12 skills Figma + 2 workflow-skills. Gerenciadas pelo plugin — **não** copiar para `.agents`.

### F) Cloud Agent — sistema

`/home/ubuntu/.cursor/skills-cursor/migrate-to-builds` — skill Cursor Cloud.

---

## Inventário da conta

| Fonte | Qtd | Observação |
|-------|-----|------------|
| Skills globais usuário (`npx skills list -g`) | **0** neste Cloud Agent | Conta ainda **não** centralizou o pack customizado neste runtime |
| Plugin Figma GLOBAL | 12 + 2 | Associado à conta/marketplace |
| Biblioteca rica na VPS (`/root/.agents`) | 54 | Na prática funciona como “biblioteca pessoal no servidor”, não como conta Cursor |
| Symlink `/root/.cursor/skills/software-architecture` | 1 | Ponte Cursor → `.agents` |

**Conclusão honesta:** a “conta Cursor” **ainda não é a fonte da verdade**. A fonte rica atual é a **VPS**. O objetivo da migração é promover o que for reutilizável da VPS → conta, e deixar no projeto só o específico.

---

## Comparação (matriz por capacidade)

| Capacidade | Local (git) | Conta (runtime) | VPS | Diferença | Melhor versão | Decisão |
|------------|-------------|-----------------|-----|-----------|---------------|---------|
| Descobrir skills | `find-skills` | — | idêntico | — | oficial vercel-labs | **C** → Global (registry) |
| React/Next perf | `vercel-react-best-practices` | — | idêntico | — | oficial | **C** → Global |
| RN/Expo | `vercel-react-native-skills` | — | idêntico | pouco uso no Precivox web | oficial | **C** → Global (opcional) |
| Web UI audit | `web-design-guidelines` | — | idêntico | — | oficial | **C** → Global |
| Persona eng. | `software-engineer` | — | idêntico | rasa vs workflows | persona + Superpowers | **C** → Global persona |
| Persona UX | `ux-expert` | — | idêntico | — | local/VPS | **C** → Global |
| Persona produto | `product-strategy` | — | idêntico | — | local/VPS | **C** → Global |
| Debug | `debugging-expert` | — | + `systematic-debugging` + `diagnose` | persona rasa vs processo profundo | **systematic-debugging** | **D** consolidar |
| Arquitetura | `system-architecture` | — | + `software-architecture` + `improve-codebase-architecture` | outline vs Clean/DDD | **software-architecture** | **D** consolidar |
| Performance | `performance-optimizer` | — | + vercel rules | genérico vs 58 rules | **vercel-*** | **D** |
| TDD | — | — | `tdd` **e** `test-driven-development` | Iron Laws conflitantes | **escolher 1** (Superpowers) | **D** |
| Planejamento | — | — | Superpowers chain | ausente no git | Superpowers | **A** → Global |
| Auth API Precivox | — (até sync) | — | `nextjs-api-auth-pattern` | só no servidor | VPS | **F** Local |
| Obsidian | — | — | `obsidian-vault` | path máquina | N/A | **F**/obsoleta global |
| Figma | — | plugin | plugin | gerenciado | plugin | **B** |

Legenda: A só local · B só conta · C duplicada · D mesma finalidade/impl diferente · E complementar · F específica projeto

---

## Duplicações

1. **Git ↔ VPS (10 nomes):** cópia idêntica — risco de drift futuro se alguém editar só um lado.
2. **Debug cluster:** `debugging-expert` ⊂ `systematic-debugging` (+ `diagnose` híbrido).
3. **Arch cluster:** `system-architecture` ⊂ `software-architecture` (+ deepening híbrido).
4. **TDD cluster:** `tdd` (Matt) vs `test-driven-development` (Superpowers) — **conflito**.
5. **Review cluster:** `review` (Matt) vs `requesting/receiving-code-review` (Superpowers) — complementares com overlap de trigger.
6. **Meta:** `write-a-skill` vs `writing-skills`; `find-skills` vs `using-superpowers` (discovery).

---

## Consolidações propostas

| Cluster | Manter como SoT | Arquivar / não promover |
|---------|-----------------|-------------------------|
| Debugging | `systematic-debugging` | `debugging-expert` (após global) |
| Arquitetura prática | `software-architecture` | `system-architecture` (outline) |
| TDD | `test-driven-development` (suite Superpowers) | `tdd` (Matt) — ou inverter se adotar Matt como SoT |
| Perf web | `vercel-react-best-practices` | `performance-optimizer` como persona |
| Planejamento | `brainstorming` → `writing-plans` → `executing-plans` | — |

**Não** é merge textual A+B+C. É escolha de SoT + promoção + depreciação documentada.

---

## Skills globais (candidatas à conta)

Ver `docs/ai-skills/account-pack/global/` (**32** skills curadas) + 4 pacotes oficiais via `npx skills add -g`.

## Skills locais

| Skill | Motivo |
|-------|--------|
| `nextjs-api-auth-pattern` | Wrappers e docs do Precivox |
| Rules `.cursor/rules/*.mdc` na VPS | Convenções do repo |
| `obsidian-vault` | Path de máquina pessoal — **não** promover |

## Skills híbridas

Matt Pocock suite + deepening: exigem `setup-matt-pocock-skills` e artefatos `CONTEXT.md` / `docs/adr/` / issue tracker. Pacote em `docs/ai-skills/account-pack/hybrid/`.

## Skills obsoletas / archive-candidates

`debugging-expert`, `system-architecture`, `performance-optimizer`, `tdd` (se Superpowers), `obsidian-vault` (global), `git-guardrails-claude-code` (Claude Code), `migrate-to-shoehorn` (nicho), `setup-pre-commit` (one-shot).

## Riscos

1. **Conta ainda vazia neste runtime** — instalar global exige ação na máquina Desktop/conta do usuário (`install-to-account.sh` ou Settings).
2. **Remover cópias locais cedo demais** → perda de capacidade em Cloud Agents sem pack global.
3. **Duas suítes TDD/review** ativas → comportamento oscilante.
4. **HARD-GATE do `brainstorming`** pode conflitar com pedidos “só implementa”.
5. **Skills híbridas** quebram sem bootstrap do repo.
6. **VPS continua com 54 skills** até limpeza manual pós-confirmação.

---

## Capacidades ANTES (inventário lógico)

Persona eng/UX/produto · debug raso · arch outline · perf genérico · React/Next rules · RN rules · web guidelines · find-skills · (VPS) Superpowers completo · Matt suite · auth Precivox · escrita · Figma plugin · Cursor builtins

## Nota metodológica

Comparação por **conteúdo/capacidade**, não só por nome. Hashes SHA-256 usados para equivalência exacta dos 10 overlaps.
