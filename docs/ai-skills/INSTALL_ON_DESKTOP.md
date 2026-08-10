# Skills de Usuário na interface Customize → Skills

## Servidor (Remote SSH) — já aplicado

Em `r14653s` (`189.126.111.149`):

- **46 skills** em `/root/.cursor/skills/`
- **8 archive-candidates NÃO instaladas:**
  - `debugging-expert`
  - `system-architecture`
  - `performance-optimizer`
  - `tdd`
  - `obsidian-vault`
  - `git-guardrails-claude-code`
  - `migrate-to-shoehorn`
  - `setup-pre-commit`

Reinicie a janela remota / recarregue Customize → Skills se a lista User não atualizar.

## Desktop local (se a UI User ainda mostrar só as 12 antigas)

A lista **User** da Customize costuma ler `~/.cursor/skills` da **máquina local** (não só do SSH). Nesse caso:

```bash
# Opção A — script (a partir do clone do repo)
bash docs/ai-skills/install-to-cursor-user-skills.sh

# Opção B — tarball das 46 skills
mkdir -p ~/.cursor/skills
tar -xzf docs/ai-skills/cursor-user-skills-46.tgz -C ~/.cursor/
# (extrai a pasta skills/ para ~/.cursor/skills)
```

Depois: **Developer: Reload Window** ou reiniciar o Cursor.

## Exceção de projeto (não vai para User)

`app/.cursor/skills/nextjs-api-auth-pattern` — permanece só no Precivox.

---

## Se a UI User continua em 12

Leia `docs/ai-skills/WHY_USER_UI_STILL_12.md`.

Resumo: o terminal precisa ser o **local da Desktop**, não o SSH da VPS.
