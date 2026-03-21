# Criar usuários de teste em produção (precivox.com.br)

Para usar **Admin**, **Gestor** e **Cliente** em https://precivox.com.br, crie os usuários uma vez via setup.

## 1. Configurar o segredo no servidor

No ambiente de produção (variáveis de ambiente do servidor, Vercel, etc.), defina:

```bash
SEED_SECRET=escolha_uma_senha_forte_e_secreta
```

Use uma senha que só você saiba; ela será usada apenas para autorizar a criação dos usuários.

## 2. Chamar o setup

### Opção A — Página no navegador

1. Acesse: **https://precivox.com.br/setup**
2. No campo, digite o mesmo valor de `SEED_SECRET`.
3. Clique em **Criar usuários**.

Se der certo, a página mostrará as credenciais.

### Opção B — URL direta (GET)

Abra no navegador (troque `SUA_SENHA` pelo valor de `SEED_SECRET`):

```
https://precivox.com.br/api/setup/seed-users?secret=SUA_SENHA
```

### Opção C — cURL (POST)

```bash
curl -X POST https://precivox.com.br/api/setup/seed-users \
  -H "Content-Type: application/json" \
  -d '{"secret":"SUA_SENHA"}'
```

## 3. Credenciais criadas

| Perfil  | E-mail               | Senha    |
|---------|----------------------|----------|
| Admin   | admin@precivox.com   | senha123 |
| Gestor  | gestor@precivox.com  | senha123 |
| Cliente | cliente@precivox.com | senha123 |

Todos com **e-mail verificado**, prontos para login.

## Segurança

- Não compartilhe o `SEED_SECRET`.
- Depois de criar os usuários, você pode remover ou alterar `SEED_SECRET` no servidor.
- A rota `/api/setup/seed-users` só executa se o segredo enviado for igual ao `SEED_SECRET`.
