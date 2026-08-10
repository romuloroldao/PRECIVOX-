# Instalar skills na conta Cursor (Desktop)

O servidor VPS **já não tem** skills operacionais em `/root/.agents/skills`.

A fonte da verdade passa a ser a **sua máquina onde o Cursor Desktop está logado** (`~/.agents/skills` / skills globais da conta).

## 1. No seu computador (Cursor Desktop)

No clone do repositório Precivox:

```bash
bash docs/ai-skills/account-pack/install-to-account.sh global

npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y
npx skills add vercel-labs/skills@find-skills -g -y
# opcional:
npx skills add vercel-labs/agent-skills@vercel-react-native-skills -g -y
```

Conferir:

```bash
npx skills list -g
```

Reinicie o Cursor (ou abra nova janela de Agent) para as skills aparecerem.

## 2. O que permanece no projeto

Apenas:

`app/.cursor/skills/nextjs-api-auth-pattern`

(específica do Precivox — auth `withAdmin` / `withRole`)

## 3. Servidor

- Skills removidas → quarentena `/root/.agents-quarantine-server-removal-*`
- Backup completo → `/root/.agents-backup-2026-08-10`
- Deploy **não** sincroniza `.agents` (já excluído no rsync)

## 4. Remote SSH

Com skills só na conta/Desktop, o Agent no Remote deve usar as skills da sua conta Cursor — não reinstale o pack em `/root/.agents` na VPS.
