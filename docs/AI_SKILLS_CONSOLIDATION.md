# Consolidação — O que mudou no ecossistema de Skills

**Data:** 2026-08-10

## Resumo numérico

| Métrica | Valor |
|---------|------:|
| Skills locais no git (antes) | 10 |
| Skills na VPS `/root/.agents` | 54 |
| Skills globais conta neste Cloud Agent | 0 |
| Plugin Figma (conta/marketplace) | 12 + 2 |
| Overlaps git↔VPS idênticos | 10 |
| Consolidações de SoT definidas | 4 clusters |
| Skills no `account-pack/global` | 32 |
| Skills no `account-pack/hybrid` | 10 |
| Skills locais projeto sincronizadas | 1 (`nextjs-api-auth-pattern`) |
| Archive-candidates | 8 |
| Skills **apagadas** | **0** (só backup + staging + notices) |
| Skills **novas** criadas do zero | 0 (curadoria/reorganização; SoT já existiam) |

---

## Consolidadas (fonte da verdade escolhida)

| Antes (redundante) | Incorporada / substituída por | Motivo |
|--------------------|-------------------------------|--------|
| `debugging-expert` | `systematic-debugging` | Processo Iron Law + 4 fases vs checklist curto |
| `system-architecture` | `software-architecture` | Clean/DDD/library-first vs outline |
| `performance-optimizer` | `vercel-react-best-practices` (+ RN) | 58 rules priorizadas vs persona genérica |
| `tdd` (Matt) | `test-driven-development` (Superpowers) | Evitar duas Iron Laws; alinha à cadeia Superpowers |

Registro formal: `docs/ai-skills/backup/2026-08-10/MIGRATION_REGISTRY.json`

---

## Promovidas para globais (staging em `account-pack/global`)

Inclui Superpowers core, `software-architecture`, personas reutilizáveis (`software-engineer`, `ux-expert`, `product-strategy`), comunicação/escrita, e meta-skills.  
Instalação: `bash docs/ai-skills/account-pack/install-to-account.sh global`

Pacotes oficiais (preferir registry, não cópia):

- `vercel-react-best-practices`
- `vercel-react-native-skills`
- `web-design-guidelines`
- `find-skills`

---

## Permaneceram locais

- `nextjs-api-auth-pattern` → agora também no git em `app/.cursor/skills/` (antes só VPS)
- Rules de auth/deploy do projeto (quando presentes)

---

## Híbridas (staging em `account-pack/hybrid`)

`setup-matt-pocock-skills`, `diagnose`, `review`, `triage`, `improve-codebase-architecture`, `request-refactor-plan`, `grill-with-docs`, `qa`, `teach`, `scaffold-exercises`

Usar só com bootstrap por repositório.

---

## Arquivadas / não promover (candidatas)

Ver `account-pack/archive-candidates/`: `obsidian-vault`, `git-guardrails-claude-code`, `migrate-to-shoehorn`, `setup-pre-commit`, personas ralas pós-substituição, `tdd` se Superpowers for SoT.

**Nenhuma foi deletada** da VPS nem do projeto nesta fase.

---

## Novas skills

Nenhuma skill “nova” inventada. O valor está em:

1. Curadoria e classificação GLOBAL/HYBRID/LOCAL
2. Pacote instalável + script
3. SoT explícita por cluster
4. Sync da skill local Precivox para o git
5. Documentação de arquitetura e plano de remoção futura

---

## Capacidades ANTES → DEPOIS

### Antes

Cobertura fragmentada: git com núcleo; VPS com suíte completa; conta vazia neste runtime; skill auth só no servidor.

### Depois (neste PR)

- Inventário completo + comparação por capacidade
- Backup imutável
- Conta **preparada** via `account-pack` (instalação pendente na Desktop)
- Projeto ganha `nextjs-api-auth-pattern` versionado
- Deprecação sinalizada nas personas ralas
- Conflitos TDD/debug/arch documentados com SoT

### Diferenças / perdas

**Nenhuma capacidade removida.** Remoção física das cópias locais fica **bloqueada** até Fase 3–4 do plano (conta instalada + validação).

---

## Riscos remanescentes

1. Conta Desktop ainda precisa rodar o install.
2. VPS ainda carrega 54 skills (drift possível até quarentena).
3. Cloud Agents sem `~/.agents` global continuam dependendo do que está no repo.
4. Escolher Matt **e** Superpowers TDD ao mesmo tempo reintroduz conflito.

---

## Próximo passo operacional

```bash
bash docs/ai-skills/account-pack/install-to-account.sh dry-run
bash docs/ai-skills/account-pack/install-to-account.sh global
npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y
npx skills add vercel-labs/skills@find-skills -g -y
```

Depois validar e só então quarentenar cópias na VPS.
