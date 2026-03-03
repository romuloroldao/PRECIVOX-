# Checklist de deploy — go/no-go (dois gates)

**Regra:** Só sobe se **Gate 1** e **Gate 2** passarem. Qualquer falha = não deploy.  
Deploy não é ferramenta de debugging nem experimento.

---

## GATE 1 — Estrutural (infra / build / runtime)

Valida: build íntegro, assets servidos, runtime inicial sem erro fatal.  
**Não** valida: fluxo de login, sessão, logout, edge cases, env de produção.

Responda **SIM** para **todos**:

| # | Verificação | SIM / NÃO |
|---|----------------|-----------|
| 1 | `_next/static/...` → **200** no Network | |
| 2 | **/** renderiza normal (layout/CSS) | |
| 3 | **/login** renderiza normal | |
| 4 | **Console** sem erro JS (hidratação, parse, etc.) | |
| 5 | Sem **500** automático em `/api/auth/session` (ao abrir /login) | |

Se **qualquer um** falhar → **não** seguir para Gate 2; estabilizar build/Nginx/runtime primeiro.

---

## GATE 2 — Funcional crítico (auth completo)

Valida: comportamento real de auth, não só carregamento.  
Só rodar depois de Gate 1 aprovado.

**Antes de cada teste abaixo:** abra **aba anônima**, **DevTools aberto** (aba Network). Ao fazer login (válido ou inválido), confirme que **nenhuma request retorna HTML quando deveria retornar JSON** (ex.: 500 em API que devolve página de erro em HTML; front faz `.json()` e quebra). Se alguma request de API retornar HTML → falha no Gate 2.

### 1. Login válido

- Fazer login com **usuário real** (credenciais corretas).
- **Esperado:** redireciona corretamente, sem 500 no Network, sem erro no Console.  
- **Passou?** SIM / NÃO

### 2. Login inválido

- Tentar login com **credenciais erradas**.
- **Esperado:** retorna erro tratado (mensagem ao usuário), **sem 500**, layout não quebra, Console limpo.  
- **Passou?** SIM / NÃO

### 3. Persistência de sessão

- Após login bem-sucedido, dar **F5** (refresh).
- **Esperado:** continua autenticado, não dispara erro de sessão.  
- **Passou?** SIM / NÃO

### 4. Logout

- Clicar em **Logout**.
- **Esperado:** sessão removida, sem 500, redireciona corretamente.  
- **Passou?** SIM / NÃO

### 5. Rota protegida

- **Autenticado:** acessar rota que exige auth → deve funcionar.
- **Deslogado:** acessar a mesma rota → deve bloquear/redirecionar.
- **Esperado:** comportamento previsível nos dois casos.  
- **Passou?** SIM / NÃO

---

## Decisão final

| Resultado | Ação |
|-----------|------|
| **Gate 1** com algum NÃO | Não subir. Corrigir infra/build/runtime. |
| **Gate 2** com algum NÃO ou inconsistente | Não subir. Corrigir auth/fluxo até estável. |
| **Ambos** passaram de forma **consistente** | Pode subir. |

Se algum teste falhar, for intermitente ou depender de “talvez cache” → não subir.

---

## Comandos no servidor (antes de testar)

```bash
pm2 restart all
rm -rf .next
npm run build
pm2 restart all
```

No navegador: **hard refresh** (Ctrl+Shift+R) e teste em **aba anônima** quando fizer sentido.

---

## Resposta objetiva pós-teste

Depois de rodar os dois gates:

- **Passou tudo (Gate 1 + Gate 2) de forma consistente?** → Sim → sobe.  
- **Falhou em qual etapa?** → Não sobe; corrigir até passar.
