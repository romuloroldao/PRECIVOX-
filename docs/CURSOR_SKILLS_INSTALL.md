# Precivox — instalar as 46 skills do Cursor em um projeto novo

Guia único para disponibilizar o pack de skills Precivox em **qualquer máquina** ou **projeto novo**.

Fonte do pack (branch): `cursor/ai-skills-migration-5725` → pasta `cursor-skills-pack/skills/`  
Após merge na `main`, o mesmo pack fica acessível na raiz do repo.

---

## Onde as skills ficam

| Escopo | Caminho | Quando usar |
|--------|---------|-------------|
| **User / global** (recomendado) | `~/.cursor/skills/<nome>/` e `~/.agents/skills/<nome>/` | Todos os projetos nesta máquina / conta Cursor |
| **Projeto** | `<repo>/.cursor/skills/<nome>/` ou `<repo>/.agents/skills/<nome>/` | Só este repositório |

Cada skill = pasta com pelo menos `SKILL.md`.

Depois de instalar: no Cursor, `Cmd/Ctrl+Shift+P` → **Developer: Reload Window**.

---

## Instalação rápida (global — todos os projetos)

### Opção A — script do repo Precivox

```bash
git clone https://github.com/romuloroldao/PRECIVOX-.git
cd PRECIVOX-
git fetch origin
git checkout cursor/ai-skills-migration-5725   # ou main, após o merge do pack

chmod +x ./install-cursor-skills.sh
./install-cursor-skills.sh
```

### Opção B — Skills CLI (global)

Com o pack no disco:

```bash
npx skills add ./cursor-skills-pack --all -g -y -a cursor
```

Ou direto do GitHub (quando o pack estiver na branch/default acessível):

```bash
npx skills add romuloroldao/PRECIVOX- --all -g -y -a cursor
```

Espelhar manualmente para a UI Customize → Skills → User (se o CLI só gravou em `~/.agents/skills`):

```bash
mkdir -p ~/.cursor/skills
cp -a ~/.agents/skills/* ~/.cursor/skills/
```

### Opção C — cópia manual (global)

```bash
# a partir da raiz do PRECIVOX- com o pack presente
mkdir -p ~/.cursor/skills ~/.agents/skills
cp -a cursor-skills-pack/skills/* ~/.cursor/skills/
cp -a cursor-skills-pack/skills/* ~/.agents/skills/
```

---

## Instalação só neste projeto novo

No repositório do projeto novo:

```bash
# 1) Baixe o pack (exemplo via sparse / clone temporário)
git clone --depth 1 -b cursor/ai-skills-migration-5725 \
  https://github.com/romuloroldao/PRECIVOX-.git /tmp/precivox-skills

# 2) Copie para o projeto
mkdir -p .cursor/skills .agents/skills
cp -a /tmp/precivox-skills/cursor-skills-pack/skills/* .cursor/skills/
cp -a /tmp/precivox-skills/cursor-skills-pack/skills/* .agents/skills/

# 3) (opcional) limpe o clone temporário
rm -rf /tmp/precivox-skills
```

Via CLI no projeto (sem `-g`):

```bash
npx skills add /caminho/para/cursor-skills-pack --all -y -a cursor
```

---

## Checklist pós-instalação

1. Reload Window no Cursor  
2. Customize → Skills → User (global) ou lista do projeto  
3. Contagem esperada: **46** pastas  

```bash
find ~/.cursor/skills -mindepth 1 -maxdepth 1 -type d | wc -l
# ou, no projeto:
find .cursor/skills -mindepth 1 -maxdepth 1 -type d | wc -l
```

4. Teste pedindo algo que dispare uma skill, ex.: *“use systematic-debugging neste erro”* ou *“encontre skills de React”*.

---

## Catálogo completo (46)

### Workflow / Superpowers

| Skill | Para que serve |
|-------|----------------|
| `using-superpowers` | Meta-skill: como descobrir e invocar skills no início da conversa |
| `brainstorming` | Explorar intenção, requisitos e design **antes** de criar features |
| `writing-plans` | Plano de implementação multi-step a partir de spec/requisitos |
| `executing-plans` | Executar um plano escrito com checkpoints de review |
| `subagent-driven-development` | Executar planos com tarefas independentes via subagentes |
| `dispatching-parallel-agents` | Paralelizar 2+ tarefas independentes |
| `using-git-worktrees` | Isolar feature work com worktrees |
| `finishing-a-development-branch` | Encerrar branch: opções estruturadas de integração |
| `verification-before-completion` | Verificar (testes/comandos) antes de declarar “pronto” / PR |
| `test-driven-development` | TDD antes de implementar feature ou fix |
| `systematic-debugging` | Debug disciplinado antes de propor correções |
| `requesting-code-review` | Pedir review após features ou antes de merge |
| `receiving-code-review` | Receber feedback de review com rigor técnico |

### Produto, UX e engenharia (personas)

| Skill | Para que serve |
|-------|----------------|
| `software-engineer` | Design, build e manutenção de sistemas de software |
| `software-architecture` | Arquitetura focada em qualidade |
| `product-strategy` | Alinhar necessidade do usuário, negócio e tecnologia |
| `ux-expert` | UX, usabilidade, pesquisa, conversão, acessibilidade |
| `web-design-guidelines` | Auditoria de UI contra Web Interface Guidelines |
| `vercel-react-best-practices` | Performance React/Next.js (Vercel) |
| `vercel-react-native-skills` | Performance e padrões React Native / Expo |

### Design de interface e exploração

| Skill | Para que serve |
|-------|----------------|
| `design-an-interface` | Várias opções radicalmente diferentes de API/interface |
| `prototype` | Protótipo descartável (terminal ou UI) antes de comprometer |
| `grill-me` | Entrevista rigorosa até alinhar plano/design |
| `grill-with-docs` | Grill + atualizar CONTEXT.md / ADRs |
| `zoom-out` | Visão ampliada / contexto de um trecho de código |
| `caveman` | Modo de comunicação ultra-comprimido (~75% menos tokens) |
| `handoff` | Compactar conversa em documento de handoff |

### Issues, PRD e domínio

| Skill | Para que serve |
|-------|----------------|
| `to-prd` | Transformar contexto da conversa em PRD |
| `to-issues` | Quebrar plano/PRD em issues (fatias verticais) |
| `triage` | Triagem de issues por papéis/estados |
| `qa` | QA conversacional → abrir issues no GitHub |
| `ubiquitous-language` | Glossário DDD / linguagem ubíqua |
| `improve-codebase-architecture` | Oportunidades de deepening com CONTEXT.md / ADRs |
| `request-refactor-plan` | Plano de refactor em commits pequenos + issue |
| `review` | Review Standards + Spec desde um ponto fixo (commit/branch) |
| `diagnose` | Loop: reproduce → minimise → hypothesise → instrument → fix |
| `teach` | Ensinar um conceito/skill no workspace |
| `scaffold-exercises` | Scaffold de exercícios (seções, soluções, explainers) |
| `setup-matt-pocock-skills` | Bootstrap AGENTS.md + docs/agents para skills Matt Pocock |

### Escrita

| Skill | Para que serve |
|-------|----------------|
| `edit-article` | Editar/melhorar artigos |
| `writing-beats` | Artigo como jornada de beats (escolha interativa) |
| `writing-fragments` | Minerar fragmentos de escrita em um doc |
| `writing-shape` | Dar forma a material bruto até virar artigo |
| `write-a-skill` | Criar novas agent skills com estrutura correta |
| `writing-skills` | Criar/editar/verificar skills antes de deploy |
| `find-skills` | Descobrir e instalar skills do ecossistema |

---

## Lista plana (copiar/colar)

```
brainstorming
caveman
design-an-interface
diagnose
dispatching-parallel-agents
edit-article
executing-plans
find-skills
finishing-a-development-branch
grill-me
grill-with-docs
handoff
improve-codebase-architecture
product-strategy
prototype
qa
receiving-code-review
request-refactor-plan
requesting-code-review
review
scaffold-exercises
setup-matt-pocock-skills
software-architecture
software-engineer
subagent-driven-development
systematic-debugging
teach
test-driven-development
to-issues
to-prd
triage
ubiquitous-language
using-git-worktrees
using-superpowers
ux-expert
vercel-react-best-practices
vercel-react-native-skills
verification-before-completion
web-design-guidelines
write-a-skill
writing-beats
writing-fragments
writing-plans
writing-shape
writing-skills
zoom-out
```

---

## Instalar uma skill só

```bash
# global
cp -a cursor-skills-pack/skills/systematic-debugging ~/.cursor/skills/

# projeto
cp -a cursor-skills-pack/skills/systematic-debugging .cursor/skills/
```

Ou:

```bash
npx skills add ./cursor-skills-pack/skills/systematic-debugging -g -y -a cursor
```

---

## Remover / reinstalar

```bash
# global — remove pack Precivox (cuidado: apaga todas as user skills nesses dirs)
# Prefira remover pasta por pasta se tiver skills de outras fontes.
rm -rf ~/.cursor/skills/<nome-da-skill>
rm -rf ~/.agents/skills/<nome-da-skill>

# reinstalar tudo
./install-cursor-skills.sh
```

---

## Notas

- Skills **não** sincronizam sozinhas entre Desktop e Cloud Agent: instale em cada runtime.
- Não altere `~/.cursor/skills-cursor/` (builtins do Cursor).
- Archive-candidates (ex.: `debugging-expert`, `git-guardrails-claude-code`) **não** entram neste pack de 46.
- Detalhes da migração: `docs/AI_SKILLS_MIGRATION_PLAN.md` (branch de migração).
