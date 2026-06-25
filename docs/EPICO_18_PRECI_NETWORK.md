# Épico 18 — PRECI Network ✅ (MVP técnico)

MVP jun/2026 · **Fase 4**

## Objetivo

API externa de **intenção de compra alimentar agregada** (LGPD) para CPG, redes e parceiros do ecossistema PRECIVOX — sem expor dados individuais.

## Autenticação

```bash
# .env.production
PRECI_NETWORK_API_KEYS='{"cpg-demo":{"key":"sua-chave-secreta","scopes":["intent","categories"],"label":"Demo CPG"}}'
```

| Escopo | Rotas |
|--------|-------|
| `intent` | `GET /api/preci-network/v1/intent` |
| `categories` | `GET /api/preci-network/v1/categories` |

Header: `Authorization: Bearer <key>`

## APIs

| Método | Rota | Query | Descrição |
|--------|------|-------|-----------|
| GET | `/api/preci-network/v1/intent` | `mercadoId`, `dias?`, `regiaoModo?` | Resumo completo de intenção regional |
| GET | `/api/preci-network/v1/categories` | `mercadoId`, `dias?` | Apenas categorias agregadas |

### Exemplo

```bash
curl -H "Authorization: Bearer sua-chave-secreta" \
  "https://precivox.com.br/api/preci-network/v1/intent?mercadoId=<ID>&dias=14&regiaoModo=cep5"
```

### Resposta (shape)

```json
{
  "success": true,
  "clientId": "cpg-demo",
  "data": {
    "regiaoDescricao": "CEP 01310",
    "periodoDias": 14,
    "intentScoreMedio": 42,
    "consumidoresUnicosBucket": "25-49",
    "categorias": [{ "categoria": "Laticínios", "sinais": 87, "usuariosUnicosBucket": "10-24", "pressao": "ALTA", "tendencia": "alta" }],
    "topProdutos": [{ "chave": "ean:789...", "sinais": 34, "usuariosUnicosBucket": "5-9" }],
    "lgpd": "..."
  }
}
```

## Módulos

| Arquivo | Função |
|---------|--------|
| `lib/preci-network/types.ts` | Tipos da API |
| `lib/preci-network/auth.ts` | Bearer + escopos |
| `lib/preci-network/privacy.ts` | k-anonymity (≥5) + buckets |
| `lib/preci-network/intent-aggregator.ts` | Agregação regional |

## Regras LGPD

1. Nunca retorna `userId`, eventos crus ou timestamps por usuário
2. Buckets de usuários: `5-9`, `10-24`, `25-49`, etc.
3. Categoria/produto só publicado se `usuariosUnicos ≥ 5` **e** `sinais ≥ 5`
4. Região via `resolverRegiaoOferta` (reuso Épico 13)

## Testes

```bash
npm run test -- tests/unit/preci-network/preci-network.test.ts
```

## Próxima evolução

- Widget/SDK para apps parceiros
- Rate limiting + auditoria por `clientId`
- Integração PDV seletiva (Tier 3 escala)
- Playbook LATAM

Ver também: [`CHECKLIST_GO_LIVE.md`](./CHECKLIST_GO_LIVE.md)
