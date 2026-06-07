# Notas — npm audit (jun/2026)

Após `npm audit fix` (sem `--force`): **42 → 16** vulnerabilidades.

## Sem correção automática

| Pacote | Severidade | Notas |
|--------|------------|-------|
| `xlsx` | high | Prototype pollution / ReDoS — sem fix no registry atual. Avaliar migração para `exceljs` ou `sheetjs-ce` em upload/export. |
| Outras transitivas | moderate/high | Requer `npm audit fix --force` (breaking) — revisar changelog antes. |

## Comando

```bash
npm audit
npm audit fix          # seguro
npm audit fix --force  # só após revisão manual
```
