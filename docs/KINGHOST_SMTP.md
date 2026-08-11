# KingHost SMTP — mensageria e lembretes (Precivox)

Envio transacional (confirmação de e-mail, reset de senha, resumo de lista, newsletter, demos) via `lib/email.ts`.

## Configuração

| Variável | Valor típico |
|----------|----------------|
| `SMTP_HOST` | `kinghost.smtpkl.com.br` |
| `SMTP_PORT` | `587` (STARTTLS) **ou** `465` (SSL) |
| `SMTP_SECURE` | `false` na 587 · `true` na 465 |
| `SMTP_USER` | usuário SMTP KingHost |
| `SMTP_PASS` | senha SMTP KingHost |
| `SMTP_FROM` | remetente autorizado (ex.: `noreply@precivox.com.br`) |

**Não use 587 e 465 ao mesmo tempo.** Escolha um modo:

- **Recomendado:** `SMTP_PORT=587` + `SMTP_SECURE=false` (STARTTLS / `requireTLS`)
- Alternativa: `SMTP_PORT=465` + `SMTP_SECURE=true` (SSL implícito)

Prioridade no código: se `SMTP_HOST` + user + pass estiverem definidos, **KingHost/SMTP ganha** de `SENDGRID_API_KEY`.

## Onde colocar

- Local: `.env.local` (nunca commitado)
- Produção: `.env.production` no servidor + `pm2 restart … --update-env`

## Teste

```bash
npx tsx scripts/test-transactional-email.ts seu-email@dominio.com
```

## Segurança

- Credenciais só em env files gitignored ou secrets do host
- Se a senha foi exposta em chat/ticket, rotacione no painel KingHost
