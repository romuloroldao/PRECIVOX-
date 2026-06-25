# PR-5 — Remoção tabelas NextAuth legado

## O que faz

1. Copia vínculos OAuth de `accounts` → `social_identities` (Google, Facebook, Apple)
2. Remove `sessions` e `accounts`

## Aplicar

```bash
npx prisma migrate deploy
```

Em CI/dev vazio, `prisma db push` já reflete o schema sem essas tabelas.

## Rollback

Não há rollback automático. Restaurar de backup se necessário em produção.

## Mantido

- `verification_tokens` — confirmação de e-mail e reset de senha (não é sessão NextAuth)
