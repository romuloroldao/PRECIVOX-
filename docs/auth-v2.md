# Auth Flow — Precivox

## Visão Geral

O sistema usa JWT com invalidação por tokenVersion.

## Edge Middleware

- Verifica assinatura JWT
- Verifica expiração
- Não acessa banco
- Encaminha requisição ao backend

## Backend Middleware

Arquivo: src/auth/validate-access-token.ts

- Valida assinatura
- Se ENABLE_TOKEN_VERSION=true:
  - Busca usuário no banco
  - Compara tokenVersion
  - 401 se mismatch

## Logout Flow

- Incrementa user.tokenVersion
- Revoga refresh tokens
- Tokens antigos tornam-se inválidos

## JWT Payload

{
  sub,
  id,
  tokenVersion
}

## Segurança

- Não usamos blacklist
- Revogação é O(1) por usuário
- CI impede uso indevido de jwt.verify

