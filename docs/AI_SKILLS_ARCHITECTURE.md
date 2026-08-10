# Arquitetura Final — Skills & Agents Cursor (Precivox)

## Modelo

```text
                 CURSOR ACCOUNT
                       │
              ┌────────┴────────┐
              │                 │
        GLOBAL SKILLS      PLUGINS / BUILTINS
        (account-pack +    (Figma, skills-cursor)
         npx -g registry)
              │                 │
              └────────┬────────┘
                       │
                 PROJECT LAYER
                       │
              Precivox (este repo)
                       │
        ┌──────────────┼──────────────┐
        │              │              │
 app/.cursor/skills  .cursor/rules  .agents/skills
 (local only)        (repo rules)   (transição → esvaziar)
```

## Camadas

### 1. GLOBAL / ACCOUNT

**Core:** `using-superpowers`, `find-skills`, `write-a-skill`, `writing-skills`  
**Quality:** `systematic-debugging`, `verification-before-completion`, `test-driven-development`, `vercel-react-best-practices`, `web-design-guidelines`, `software-architecture`  
**Workflow:** `brainstorming` → `writing-plans` → `executing-plans` / `subagent-driven-development`, reviews, worktrees, finishing branch  
**Personas:** `software-engineer`, `ux-expert`, `product-strategy`  
**Comms/Writing:** `grill-me`, `caveman`, `handoff`, `zoom-out`, suite de artigo  

Instalação: `docs/ai-skills/account-pack/install-to-account.sh` + `npx skills add -g …`

### 2. HYBRID (opcional)

Suite Matt Pocock em `docs/ai-skills/account-pack/hybrid/` — só após `setup-matt-pocock-skills` no repo.  
**Não** ativar `tdd` Matt em paralelo com `test-driven-development` Superpowers.

### 3. PROJECT (Precivox)

| Artefato | Função |
|----------|--------|
| `app/.cursor/skills/nextjs-api-auth-pattern` | Auth API (`withAdmin` / `withRole` / pipeline) |
| `.cursor/rules/*.mdc` (quando versionados) | Convenções do repo |
| `.agents/skills/*` | **Transição** — cópias a remover após conta |

### 4. NÃO versionar / NÃO promover

- `obsidian-vault` (path pessoal)
- Cursor builtins (`skills-cursor`)
- Cópias do plugin Figma

## Fonte da verdade por cluster

| Cluster | SoT |
|---------|-----|
| Debug | `systematic-debugging` |
| Arquitetura de código | `software-architecture` |
| TDD | `test-driven-development` |
| Perf React/Next | `vercel-react-best-practices` |
| UX audit UI | `web-design-guidelines` |
| UX estratégia | `ux-expert` |
| Auth Precivox | `nextjs-api-auth-pattern` |
| Meta skills | `using-superpowers` + `find-skills` |

## Evitar duplicação futura

1. Novas skills genéricas → criar/instalar **na conta**, não em `.agents` do projeto.
2. Skills que citam paths/APIs do Precivox → `app/.cursor/skills/` ou rules.
3. Antes de adicionar skill com nome parecido, comparar **capacidade** (ver audit).
4. Preferir `npx skills add` de pacotes oficiais a forks locais.
5. Manter `account-pack/MANIFEST.json` como inventário curado.

## Validação (checklist)

- [ ] `npx skills list -g` mostra pack global na Desktop
- [ ] Sessão nova resolve debug via `systematic-debugging` (não só persona)
- [ ] API routes ainda disparam `nextjs-api-auth-pattern`
- [ ] Nenhuma skill global com path `/root/...` ou `/mnt/d/...`
- [ ] `tdd` e `test-driven-development` não coexistem ativos
- [ ] Backup intacto em `_migration_backup/`

## Estado do servidor (VPS)

**Atualizado 2026-08-10:** skills operacionais **removidas** de `/root/.agents/skills` (0 skills).  
Quarentena: `/root/.agents-quarantine-server-removal-*`  
Exceção de projeto: `app/.cursor/skills/nextjs-api-auth-pattern`

## Conta Cursor

Instalar no **Desktop** (máquina onde você usa o Cursor logado):

ver `docs/ai-skills/INSTALL_ON_DESKTOP.md`

Cloud Agents efêmeros podem ter `~/.agents` próprio; isso **não substitui** a instalação na sua Desktop.
