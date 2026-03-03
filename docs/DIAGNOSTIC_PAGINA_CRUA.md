# Diagnóstico: Página "crua" (sem CSS)

Depois de corrigir o auth, o backend está consistente. Para fechar se a página sem CSS é **Nginx**, **build/deploy** ou **runtime Next**, use estes passos.

---

## 🚦 Critério mínimo para seguir deploy (go/no-go)

**Só seguir deploy se as três respostas forem:**

| # | Condição | Esperado |
|---|----------|----------|
| 1 | _next/static (ou _next/...) | **200** |
| 2 | / (home) | **normal** (não crua) |
| 3 | Console | **sem erro JS relevante** (hidratação, parse, etc.) |

Se **todas** forem ok → Infra ok, build íntegro, runtime não está abortando, 500 anterior não quebra mais hidratação → **pode seguir deploy**.

---

## ⛔ Quando NÃO seguir deploy

**Não avançar** se ocorrer **qualquer um** destes:

- **_next** não 200 → infra/build inconsistente
- **/** também crua → problema global
- **Console** com erro de hidratação ou JSON parse → runtime ainda instável
- **Erro 500 persistente** em `/api/auth/session`

Nesses casos, deploy agora só leva o problema para produção.

---

## 🧭 Pergunta crítica antes do deploy

> **O sistema está estável e previsível neste momento ou ainda está reagindo de forma inconsistente?**

- Se **estável** (três respostas ok + comportamento consistente) → vale fazer o ciclo: restart → hard refresh → testar login em aba anônima → subir.
- Se **inconsistente** (às vezes crua, às vezes não; ou _next 200 mas página ainda quebrada) → **não subir**; tratar primeiro build/cache/runtime até ficar previsível.

“Corrigir tudo agora” só faz sentido se o sistema estiver estável o suficiente para validar as mudanças. Caso contrário, está-se otimizando ruído.

---

## ✅ Estratégia segura antes do deploy final

1. Reiniciar processo: `pm2 restart all` ou restart do container.
2. Hard refresh no navegador (Ctrl+Shift+R).
3. Testar login em **aba anônima** (sem cache/cookies antigos).
4. Verificar **_next** 200 na aba Network.
5. Testar **/** e **/login** — ambas devem carregar com CSS e sem erro no Console.

Se passou → sobe. Se não passou → corrigir antes.

---

## ✅ Estado atual (já garantido)

- `/api` → Next (3000)
- `/api/v1` só interno (Express 3001)
- `/api/auth/login` existe no BFF e responde JSON
- `location /_next/static` e `location /_next/` no Nginx
- Express não bloqueia login/register

Restam só **três classes de falha**: (1) _next não servido, (2) Next quebrando em runtime, (3) algo na página de login quebrando a render.

---

## 🧪 Teste no servidor (deploy/build)

Se no servidor `_next` não estiver sendo servido (build não gerado, pasta `.next` inconsistente, cache do Nginx):

```bash
# No servidor
curl -I "https://seudominio.com/_next/static/chunks/main-app.js"
# ou (nome do chunk varia)
curl -I "https://seudominio.com/_next/static/chunks/webpack.js"
```

- Se **não for 200** → problema é **deploy/build ou Nginx**, não código.
- Se for **200** → seguir testes no navegador.

---

## 🧪 Teste no navegador — fechar 80% das dúvidas

1. Abra **/** (home). A página fica **normal** ou **crua**?
2. Abra **/login**. A página fica **normal** ou **crua**?

- **Ambas cruas** → problema **global** (Next ou Nginx servindo _next).
- **Só /login crua** → problema na **página de login** ou em algo que ela importa/usa.
- **Ambas normais** → problema pode ser intermitente ou já resolvido (ex.: 500 do login).

---

## 📋 As três respostas que fecham o diagnóstico

Responda **apenas** com:

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | **_next/static** (ou qualquer `_next/...`) no Network está **200** ou **falhando**? | 200 / 404 / 500 / outro |
| 2 | **/** (home) fica **normal** ou **crua**? | normal / crua |
| 3 | O **Console** ainda mostra algum **erro JS** além do antigo 500? (ex.: Hydration failed, Unexpected token &lt;, Cannot read property…) | sim / não |

Com essas três respostas dá para concluir com precisão.

---

## 🔍 Detalhes úteis (se ainda houver dúvida)

### Login page e fetch automático

- `app/login/page.tsx` usa **useSession()** (NextAuth). Isso dispara chamada de sessão na montagem.
- Se **/api/auth/session** (ou o endpoint que o NextAuth usa) retornar **500 ou HTML de erro**, o front pode quebrar ao fazer `.json()` e a página pode ficar crua ou travar.
- **LoginForm** usa **signIn('credentials')** (NextAuth), não o `POST /api/auth/login` direto. O 500 que você viu pode ter sido do NextAuth (session ou callback), não necessariamente do nosso BFF.

### Teste em aba anônima

- Abra **/login** em **aba anônima**, **não interaja**.
- Se a página **já está crua antes** de qualquer POST → problema é **layout/global** ou carregamento de _next, não o submit do login.

### Erro no import da rota de login

- Se `app/api/auth/login/route.ts` **falhar no import** (Prisma, TokenManager, etc.), o Next pode retornar 500 **só para POST /api/auth/login**; outras rotas podem seguir normais.
- Para checar no servidor: `pm2 logs` ou `docker logs <container>` e ver se há stack trace ao acessar a rota.

---

## Resumo de conclusão

| _next/static | / (home) | Console | Conclusão |
|--------------|----------|---------|-----------|
| falha        | —        | —       | Nginx ou deploy/build |
| 200          | crua     | —       | Problema global (layout/Next) |
| 200          | normal   | erro    | Erro de runtime (ex.: hidratação) |
| 200          | normal   | não     | Provável que 500 do login era a causa; com auth corrigido, tende a normalizar |

