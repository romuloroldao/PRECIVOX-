# Reativar produtos que têm estoque (sumiram da busca)

A busca do cliente (`/cliente/busca`) lista apenas produtos com **`ativo = true`** e **pelo menos uma linha em `estoques`**.

Se você importou planilhas no passado e os itens ficaram **inativos** no cadastro, eles não aparecem. Novos uploads já reativam automaticamente (`lib/upload-handler.ts`).

## Opção 1 — Script recomendado (Prisma)

No servidor (ou localmente com o mesmo `DATABASE_URL` de produção):

```bash
# Ver quantos seriam afetados e alguns exemplos (sem alterar o banco)
npx tsx scripts/reativar-produtos-com-estoque.ts --dry-run

# Aplicar: ativo=true para produtos inativos que ainda têm estoque
npx tsx scripts/reativar-produtos-com-estoque.ts
```

Com variável explícita:

```bash
DATABASE_URL="postgresql://usuario:senha@host:5432/banco" npx tsx scripts/reativar-produtos-com-estoque.ts --dry-run
```

Script npm (após adicionar em `package.json`):

```bash
npm run db:reativar-produtos -- --dry-run
npm run db:reativar-produtos
```

## Opção 2 — SQL manual (PostgreSQL)

Use só se preferir rodar no `psql`. Confira os nomes das colunas com `\d produtos` no seu banco.

```sql
-- Pré-visualização
SELECT p.id, p.nome, p.ativo
FROM produtos p
WHERE p.ativo = false
  AND EXISTS (SELECT 1 FROM estoques e WHERE e."produtoId" = p.id)
LIMIT 20;

-- Atualização (revise antes de COMMIT em transação real)
BEGIN;
UPDATE produtos p
SET ativo = true, "dataAtualizacao" = NOW()
WHERE p.ativo = false
  AND EXISTS (SELECT 1 FROM estoques e WHERE e."produtoId" = p.id);
-- Verifique o número de linhas afetadas, depois:
COMMIT;
```

## Depois

- Faça deploy da aplicação se ainda não tiver a correção do upload.
- Opcional: novo upload da planilha no mercado para garantir preços/quantidades atualizados.
