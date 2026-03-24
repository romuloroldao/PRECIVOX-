# Site canônico: https://precivox.com.br

Tudo que o Next.js expõe (páginas, `/api/*`, auth) deve ser acessado pelo **domínio público** com HTTPS.

## Variáveis obrigatórias no servidor (`.env.production`)

| Variável | Valor esperado |
|----------|----------------|
| `NEXTAUTH_URL` | `https://precivox.com.br` |
| `NEXT_PUBLIC_URL` | `https://precivox.com.br` |

- **Não** use `http://` em produção.
- Se `NEXTAUTH_URL` for só `www` ou só `apex` misturado com o que o usuário digita na barra, cookies de sessão podem falhar. O cookie de sessão usa `domain: .precivox.com.br` (válido para `precivox.com.br` e `www.precivox.com.br`), mas o **URL canônico** dos links e e-mails deve ser **um só** — recomendado: **apex** (`https://precivox.com.br`).

## Nginx (exemplo)

- `proxy_pass` para o processo Next (`127.0.0.1:3000` ou socket).
- Cabeçalhos: `Host`, `X-Forwarded-Proto https`, `X-Forwarded-For`.
- Opcional: redirect 301 de `https://www.precivox.com.br` → `https://precivox.com.br` (ou o inverso), para SEO e um único destino.

## Deploy

Após `git pull` na pasta do app:

```bash
./deploy-prod.sh
```

Confirme que o PM2 carrega `.env.production` (o `ecosystem.config.js` faz merge; valores do arquivo têm prioridade sobre defaults).

## Checklist rápido

- [ ] `curl -sI https://precivox.com.br` → `200` ou `307/308` esperado
- [ ] Login em `/login` mantém sessão ao navegar
- [ ] Links de e-mail (confirmação, senha) abrem em `https://precivox.com.br/...`
