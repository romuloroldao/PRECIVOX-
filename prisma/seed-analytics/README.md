# Seed Analítico Precivox v2

Ambiente de dados fictícios para testes de BI, IA, dashboards, motores analíticos e carga.

## Execução

```bash
# Carregar DATABASE_URL do .env.production
export $(grep -v '^#' .env.production | xargs)

npm run db:seed:analytics
```

## Rollback

```bash
npm run db:seed:analytics:rollback
npm run db:seed:analytics:rollback -- --dry-run
```

## Volume gerado (padrão)

| Entidade | Quantidade |
|----------|-----------|
| Mercados (tenants) | 12 |
| Unidades | 14 (5 flagship + 9 leves) |
| Gestores | 4 |
| Consumidores | 20 |
| Produtos (catálogo) | ~5.500 |
| Estoques | ~25.000+ |
| Vendas | ~200.000+ |
| Movimentações | ~3.000+ |
| User events | ~2.000+ |
| Métricas dashboard | ~1.000+ |

## Configuração

Ajuste volumes em `config.ts`:

- `produtosPorUnidadeFlagship`
- `diasHistoricoVendas`
- `vendasPorDia`
- `batchSize`

## Idempotência

Todos os IDs usam prefixo `seed-v2-`. Reexecução usa `skipDuplicates`.

## Credenciais

- Gestores: `*@precivox-seed.com` / `senha123`
- Consumidores: `consumidor1@precivox-seed.com` ... / `senha123`
