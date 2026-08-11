# SendGrid — DNS e produção (precivox.com.br)

> **Atual (mensageria/lembretes):** o Precivox usa **KingHost SMTP** (`kinghost.smtpkl.com.br`). Ver `docs/KINGHOST_SMTP.md`.  
> Este documento permanece para autenticação de domínio SendGrid / fallback se `SMTP_HOST` não estiver definido.

DNS gerenciado na **KingHost** (`dns1.kinghost.com.br`).

## 1. Registros DNS (SendGrid Domain Authentication)

No painel KingHost → DNS de `precivox.com.br`, adicione:

| Tipo | Host / Nome | Valor / Aponta para |
|------|-------------|---------------------|
| CNAME | `url6005` | `sendgrid.net` |
| CNAME | `109742655` | `sendgrid.net` |
| CNAME | `em3098` | `u109742655.wl156.sendgrid.net` |
| CNAME | `s1._domainkey` | `s1.domainkey.u109742655.wl156.sendgrid.net` |
| CNAME | `s2._domainkey` | `s2.domainkey.u109742655.wl156.sendgrid.net` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

> No KingHost, o campo **Host** costuma ser só o subdomínio (ex.: `em3098`), não o FQDN completo.

Propagação: 15 min – 48 h. Verifique no SendGrid em **Settings → Sender Authentication**.

## 2. API Key (SendGrid)

1. SendGrid → **Settings → API Keys** → Create API Key  
2. Permissão: **Restricted** → Mail Send → Full Access (ou Full Access para teste)  
3. Copie a chave (`SG....`) — só aparece uma vez  

## 3. Variáveis no servidor

```bash
SENDGRID_API_KEY=SG.sua_chave_aqui
SMTP_FROM=noreply@precivox.com.br
```

Aplicar em produção:

```bash
SENDGRID_API_KEY=SG.xxxx bash scripts/setup-sendgrid-production.sh
```

Ou edite manualmente `/home/deploy/apps/precivox/.env.production` e reinicie:

```bash
pm2 restart precivox-frontend --update-env
```

## 4. Testar envio

```bash
cd /root
npx tsx scripts/test-transactional-email.ts seu@email.com
```

## 5. Verificar DNS (opcional)

```bash
dig +short CNAME em3098.precivox.com.br
dig +short CNAME s1._domainkey.precivox.com.br
dig +short TXT _dmarc.precivox.com.br
```

Quando propagado, os comandos retornam os valores da tabela acima.

## 6. Fluxos cobertos

- Cadastro → e-mail de confirmação (`/confirmar-email`)
- Reenviar confirmação (banner no login)
- Esqueci minha senha → link em `/resetar-senha`
