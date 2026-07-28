# Exclusão definitiva pós-quarentena — 2026-07-14

## Removido
- `/archive/2026-07-14-cleanup/` (~5.6G) — legado var/www, poluição IDE do DEST, .next backups jun/30, dumps duplicados, scripts órfãos, logs legados
- Imagens Docker não usadas pelo PM2: hello-world, precivox-frontend-staging, precivox-backend, nginx:alpine, node:18-alpine

## Preservado
- Produção: `/root`, `/home/deploy/apps/precivox`
- Backups diários: `/var/backups/precivox`
- Dump histórico: `/root/backups/precivox_pre_pr5_*.dump`
- Rollback build atual: `.next.backup.20260714150922`
- Relatórios em `/root/docs/`

## Espaço
- Antes: 31GiB
- Depois: 25GiB
- Liberado: 5.8GiB

## Saúde pós-exclusão
- PM2 online; homepage e health verificados nesta execução.
