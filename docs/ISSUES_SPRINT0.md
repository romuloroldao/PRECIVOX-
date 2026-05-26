# Issues — Sprint 0 (implementado)

| ID | Título | Status |
|----|--------|--------|
| PREC-001 | Spec EL + `lib/economia-liquida.ts` + API calcular | ✅ |
| PREC-002 | Migration truth layer em `estoques` | ✅ schema + SQL |
| PREC-003 | `lib/estoque-truth.ts` + upload-smart | ✅ |
| PREC-004 | Eventos v2 (types, API, frontend-events) | ✅ |
| PREC-005 | Doc export parceiro | ✅ `PARCEIRO_EXPORT_CATALOGO.md` |

## Aplicar migration em produção

```bash
npx prisma migrate deploy
# ou, em dev:
npx prisma db push
```

## Teste rápido EL

```bash
curl -s -X POST http://localhost:3000/api/economia-liquida/calcular \
  -H 'Content-Type: application/json' \
  -d '{"precoOrigem":24,"precoDestino":18.5,"distanciaKm":2}' | jq
```

## Teste evento v2

```bash
curl -s -X POST http://localhost:3000/api/events/track \
  -H 'Content-Type: application/json' \
  -d '{"type":"compra_confirmada","userId":"u1","mercadoId":"m1","metadata":{"listaId":"l1"}}'
```
