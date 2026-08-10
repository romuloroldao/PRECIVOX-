# Account Pack — Skills para a conta Cursor

Pacote curado a partir da auditoria 2026-08-10 (VPS `r14653s` + workspace Precivox).

## Estrutura

| Pasta | Uso |
|-------|-----|
| `global/` | Instalar na conta (`~/.agents/skills`) |
| `hybrid/` | Opcional; precisa bootstrap no repo |
| `local/` | Referência — instalar em `app/.cursor/skills` do projeto |
| `archive-candidates/` | Não instalar; histórico / nicho |
| `MANIFEST.json` | Inventário com hashes |
| `install-to-account.sh` | Instalador seguro (não sobrescreve existentes) |

## Comandos

```bash
bash docs/ai-skills/account-pack/install-to-account.sh dry-run
bash docs/ai-skills/account-pack/install-to-account.sh global
bash docs/ai-skills/account-pack/install-to-account.sh hybrid   # opcional
```

Ver também `docs/AI_SKILLS_MIGRATION_PLAN.md`.
