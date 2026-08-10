# Sincronizar skills Precivox → conta/máquina Cursor

## Objetivo

Ter as **46 skills** do servidor Precivox no escopo **user/global**, para usar em **qualquer projeto** nesta máquina (e replicar em outras com o mesmo comando).

## Instalar (uma vez por máquina)

No clone deste repositório:

```bash
./install-cursor-skills.sh
```

Isso instala em:
- `~/.agents/skills` (global)
- `~/.cursor/skills` (global / UI Customize)

Depois: **Developer: Reload Window** no Cursor.

## Replicar em outro PC / outro projeto

1. Clone o repo (ou baixe só `cursor-skills-pack/` + `install-cursor-skills.sh`)
2. Rode `./install-cursor-skills.sh`
3. Reload Window

Não é necessário copiar skills para dentro de cada projeto.

## O que não entra no pack (8)

`debugging-expert`, `system-architecture`, `performance-optimizer`, `tdd`, `obsidian-vault`, `git-guardrails-claude-code`, `migrate-to-shoehorn`, `setup-pre-commit`

## Skill só do Precivox (fica no projeto)

`app/.cursor/skills/nextjs-api-auth-pattern`
