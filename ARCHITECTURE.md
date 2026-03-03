# Contrato de Arquitetura — PRECIVOX

Este documento define as regras estruturais que **não podem ser relaxadas** sem decisão explícita de arquitetura. A adesão é imposta por código e infraestrutura, não apenas por processo.

---

## Regras obrigatórias

### RULE 1: Only Next (BFF) can call Express

A única entidade que pode chamar o backend Express (porta 3001) é o **Next.js atuando como BFF**. Nenhum cliente (browser, app móvel) fala diretamente com o Express. Nenhum outro serviço (worker, cron, microserviço futuro) deve falar direto com 3001 — deve usar o mesmo contrato: chamar o BFF ou, se precisar de chamada server-side ao Express, usar o helper `internalFetch` (ou equivalente em pacote compartilhado).

**Implicação:** Se amanhã surgir um segundo consumidor interno (ex.: worker, job), ele deve:
- Chamar rotas do Next (BFF) que por sua vez usam `internalFetch`, ou
- Usar um módulo equivalente a `internalFetch` (mesmo secret, mesmo contrato), nunca URL/porta hardcoded.

### RULE 2: Express only exposes /api/v1

O Express expõe **apenas** o prefixo `/api/v1`. Rotas legadas em `/api/*` (exceto `/api/health` e `/api/admin/*` para operação) retornam **410 Gone**. Não há segundo caminho arquitetural.

### RULE 3: 3001 is never publicly reachable

- O processo Express faz **bind em `127.0.0.1:3001`** (não em `0.0.0.0`).
- No **Docker**, a porta **3001 não deve ser publicada** no host. O backend deve estar apenas na rede interna do compose (ex.: mesmo network que o Next). Não use `ports: - "3001:3001"` em produção.
- **Firewall:** Em produção, 3001 não deve ser acessível externamente (bloqueio por firewall ou ausência de publicação de porta).

Assim, mesmo que alguém suba um Nginx alternativo fora do repositório, o isolamento real continua garantido: 3001 não está acessível de fora.

### RULE 4: internalFetch is the single gateway

Toda chamada server-side do Next (BFF) ao Express deve usar **apenas** `internalFetch(path, options)` do módulo `lib/internal-backend.ts`. Não é permitido:

- `fetch` com URL contendo 3001 ou montada a partir de `process.env.BACKEND_URL` / `process.env.BACKEND_INTERNAL_URL` fora do helper.
- Uso direto de `getInternalBackendUrl` ou `getInternalBackendHeaders` fora do próprio módulo (não exportados).

O helper aplica `x-internal-secret` e `Authorization` por último e **não permite sobrescrita** desses headers (a chave existir em `options.headers` já dispara erro, independente do valor).

---

## Docker — produção

Para garantir que 3001 nunca seja publicada:

- No **Dockerfile** do backend não se expõe a porta 3001 para o host (sem `EXPOSE 3001` ou com comentário explícito de que não deve ser mapeada).
- No **docker-compose** de produção, o serviço do backend **não** deve ter:

  ```yaml
  ports:
    - "3001:3001"   # ❌ não usar em produção
  ```

- O BFF (Next) e o backend devem estar na mesma rede interna; o Next chama o backend por nome do serviço (ex.: `http://backend:3001`) apenas de dentro da rede, nunca exposto no host.

---

## Governança

- **ESLint** proíbe uso direto de `process.env.BACKEND_INTERNAL_URL`, `process.env.BACKEND_URL` e `fetch` com literal contendo 3001 fora do helper (exceção: os próprios arquivos `internal-backend.ts`). Isso protege contra erro comum; não contra bypass intencional (ex.: string concatenada).
- **Ordem no Express:** `/api/v1`, `/api/health` e `/api/admin/*` são registrados **antes** do middleware que retorna 410 para o resto de `/api`. Qualquer rota nova em `/api` deve ser registrada antes desse middleware, senão receberá 410.

---

## Resumo

| Regra | Garantia |
|-------|----------|
| RULE 1 | Apenas BFF chama Express; outros serviços usam BFF ou contrato equivalente. |
| RULE 2 | Apenas `/api/v1` (e health/admin) no Express; resto 410. |
| RULE 3 | 3001 em 127.0.0.1; Docker não publica 3001; firewall bloqueia acesso externo. |
| RULE 4 | `internalFetch` é o único gateway; sem sobrescrever secret/Authorization. |

Isso reduz regressão futura e mantém um único caminho arquitetural.
