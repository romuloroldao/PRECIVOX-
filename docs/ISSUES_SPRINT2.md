# Issues — Sprint 2 (implementado)

Branch: `feature/sprint-2-comportamento-crowd`

| ID | Título | Status |
|----|--------|--------|
| PREC-201 | UI confirmar preço (`PrecoCrowdActions`) | ✅ |
| PREC-202 | API `POST /api/produtos/preco-feedback` → `confianca` | ✅ |
| PREC-203 | Modal `CompraConfirmacaoPrompt` | ✅ |
| PREC-204 | Perfil PRECI (`/cliente/perfil` + API) | ✅ |
| PREC-205 | Intent Score (`/api/cliente/intent-score`) | ✅ |
| PREC-206 | Gamificação (`ContribuidorBadge`, níveis crowd) | ✅ |

## Migrations

```bash
npx prisma migrate deploy
```

- `20260526120000_estoque_truth_layer`
- `20260527120000_user_perfil_preci`

## Testes rápidos

```bash
# Feedback preço (autenticado)
curl -X POST http://localhost:3000/api/produtos/preco-feedback \
  -H 'Content-Type: application/json' \
  -d '{"estoqueId":"...","tipo":"confirmado"}' --cookie '...'

# Perfil + intent
curl http://localhost:3000/api/cliente/perfil-preci --cookie '...'
curl http://localhost:3000/api/cliente/intent-score --cookie '...'
```

## Próximo: Sprint 3

Push cesta provável, streak economia, radar gestor.
