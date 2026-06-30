# Estratégia de Baseline de Migrations — Precivox

> Objetivo: provisionar um ambiente novo **exclusivamente** com `prisma migrate deploy`,
> eliminando o fallback `db push` / `--accept-data-loss` que hoje mascara um histórico
> de migrations incompleto.

## ✅ Status: EXECUTADO E VERIFICADO

A baseline já foi promovida e validada:

- `prisma/migrations/00000000000000_init_baseline/migration.sql` — baseline oficial (consolidada).
- `prisma/migrations_archive/` — 26 migrations legadas arquivadas **fora** do path do Prisma.
- **Verificações realizadas:**
  1. `migrate diff` (banco vazio + baseline) vs `schema.prisma` → **diff vazio** (baseline == schema).
  2. `prisma migrate deploy` em Postgres **vazio** → cria schema completo, status "up to date".
  3. `prisma migrate deploy` + `npm run db:seed:demo` → ambiente de demo completo ponta-a-ponta.
  4. `precivox_dev` (criado via `db push`) → `migrate resolve --applied` aplicado, status limpo.
  5. `setup.sh` e `.github/workflows/e2e.yml` → fallback `db push` removido (Fase 4).

> Nota: o arquivamento foi para `prisma/migrations_archive/` (e **não** `prisma/migrations/_archive/`),
> porque o Prisma escaneia subpastas de `migrations/` e quebra com uma pasta sem `migration.sql`.

---

## Contexto histórico (diagnóstico original)

## Diagnóstico (causa raiz)

O histórico em `prisma/migrations/` é **incremental sobre um schema criado via `db push`**,
não uma cadeia fechada que parte de um banco vazio. Evidências:

- **3 migrations sem prefixo de timestamp**: `add_advanced_features/`, `add_nextauth_support/`,
  `add_refresh_tokens/`. Como o Prisma aplica em ordem lexicográfica do nome da pasta, essas três
  rodam **antes** de todas as `2025*`/`2026*`.
- **1 arquivo órfão**: `add_user_events.sql` está solto dentro de `migrations/` (não é uma pasta
  com `migration.sql`) → o Prisma **ignora**. Foi substituído por `20260529120000_user_events/`.
- **Sem migration de baseline**: nenhuma migration cria as tabelas core (`mercados`, `produtos`,
  `estoques`, `unidades`, `listas_compras`, `badges`, `auth_audit_logs`, `demo_requests`, ...).
  Várias migrations fazem `ALTER TABLE "produtos"` assumindo que a tabela já existe.
- **Tabelas fantasma**: `add_advanced_features` cria `push_subscriptions`, `ab_tests`,
  `ab_test_results`, `ab_test_assignments` que **não existem no `schema.prisma`** (drift).
- Por isso `setup.sh` usa `migrate deploy || db push` e o CI e2e usa `db push --accept-data-loss`.

**Consequência:** `prisma migrate deploy` em um Postgres vazio **falha**.

## Artefato gerado

Foi gerado um **candidato de baseline** a partir do `schema.prisma` atual (sem tocar no DB):

```
prisma/baseline-candidate/migration.sql   # 875 linhas — DDL completo (enums, tabelas, índices, FKs)
```

Comando usado (não requer conexão com banco):

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/baseline-candidate/migration.sql
```

## Plano de migração (passo a passo)

### Fase 1 — Construir a baseline

1. **Validar o schema contra produção** (em staging/prod, schema-only):
   ```bash
   npx prisma db pull            # confirmar que schema.prisma reflete o DB real
   # (diff vazio = schema confiável para gerar a baseline)
   ```
2. **Promover o candidato a migration oficial**:
   ```bash
   mkdir -p prisma/migrations/00000000000000_init_baseline
   cp prisma/baseline-candidate/migration.sql \
      prisma/migrations/00000000000000_init_baseline/migration.sql
   ```
   O prefixo `00000000000000` garante que a baseline ordene **antes** de qualquer migration futura.
3. **Arquivar o histórico legado** (sair do path do Prisma):
   ```bash
   mkdir -p prisma/migrations/_archive
   git mv prisma/migrations/add_advanced_features      prisma/migrations/_archive/
   git mv prisma/migrations/add_nextauth_support       prisma/migrations/_archive/
   git mv prisma/migrations/add_refresh_tokens         prisma/migrations/_archive/
   git mv prisma/migrations/add_user_events.sql        prisma/migrations/_archive/
   # As 22 migrations timestamped também passam a estar consolidadas na baseline:
   #   git mv prisma/migrations/2025*  prisma/migrations/_archive/
   #   git mv prisma/migrations/2026*  prisma/migrations/_archive/
   ```
   > Manter `_archive/` versionado preserva o histórico para auditoria, sem que o Prisma o aplique.
4. **Remover as tabelas fantasma** da baseline (ou criar migration de cleanup): a baseline gerada
   já parte do `schema.prisma`, então `push_subscriptions`/`ab_tests*` **não** aparecem — confirmar.

### Fase 2 — Bancos já existentes (produção/staging)

Não reexecutar o DDL; apenas **marcar a baseline como aplicada**:

```bash
npx prisma migrate resolve --applied 00000000000000_init_baseline
npx prisma migrate status      # deve indicar "Database schema is up to date"
```

### Fase 3 — Ambientes novos (CI, dev, demo)

Bootstrap 100% determinístico, **sem `db push`**:

```bash
npx prisma migrate deploy      # aplica 00000000000000_init_baseline
npm run db:seed                # usuários base (ADMIN/GESTOR/CLIENTE)
npm run db:seed:analytics      # dados ricos para demo (opcional)
```

### Fase 4 — Remover os fallbacks de `db push`

- `setup.sh`: trocar `migrate deploy || db push` por `migrate deploy` (falha = erro real, não fallback).
- `.github/workflows/e2e.yml`: trocar `prisma db push --accept-data-loss` por `prisma migrate deploy`.
- `docs/ISSUES_SPRINT0.md` / `docs/PR5_DROP_NEXTAUTH_TABLES.md`: atualizar instruções de dev.

## Alinhamento schema ↔ índices (fazer junto da baseline)

A baseline gerada já inclui os índices declarados no `schema.prisma`. Antes de congelá-la, adicione
ao `schema.prisma` os índices que hoje só existem no SQL das migrations (drift) e os índices de FK
ausentes — ver seção "Banco de Dados" do relatório de auditoria (`mercadoId`, `gestorId`,
`categoria`, `ativo`, `disponivel`, `itens_lista.listaId`, etc.). Assim o `db pull` da Fase 1 bate
com o schema e a baseline nasce já indexada.

## Critério de pronto

- [x] `prisma migrate deploy` em Postgres vazio cria o schema completo sem erro.
- [x] `prisma migrate status` limpo após `migrate resolve` (validado em `precivox_dev`).
- [x] CI e2e roda sem `db push`.
- [x] `schema.prisma` sem drift contra o banco (diff vazio).

## Aplicar em produção/staging existente

Em um banco já provisionado via `db push` (sem `_prisma_migrations`), **não** reexecute o DDL:

```bash
npx prisma migrate resolve --applied 00000000000000_init_baseline
npx prisma migrate status   # "Database schema is up to date!"
```

Pré-requisito: confirmar diff vazio antes (`prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script`).
