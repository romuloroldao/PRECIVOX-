# Imagens Inteligentes de Produtos — Precivox

## Visão geral

Sistema que associa automaticamente imagens reais aos produtos do catálogo, com armazenamento persistente e reutilização em todas as consultas futuras. A busca do usuário **nunca** dispara busca externa de imagens.

## Decisões técnicas

### Fonte automática: Open Food Facts (OFF)

- **Por quê:** gratuito, licença aberta (ODbL), feito para produtos de mercado, dados por EAN.
- **Fluxo:** `codigoBarras` (EAN) → API OFF → fallback por nome → download → processamento → storage.
- **Não encontrado:** status `INVALIDA` após 3 tentativas; UI exibe placeholder.
- **Atribuição:** dados do OFF sob licença ODbL; link para `world.openfoodfacts.org` armazenado em `autoFonteUrl`.

### Storage: disco local content-addressed

- **Diretório:** `IMAGE_STORAGE_DIR` (default `public/uploads/produtos`).
- **Nomenclatura:** `<sha256>.webp` (full) e `<sha256>_thumb.webp` (thumbnail).
- **Dedupe:** mesmo hash = mesmo arquivo; não há duplicatas de bytes.
- **URLs:** `IMAGE_PUBLIC_BASE_URL` (default `/uploads/produtos/...`).
- **CDN:** Nginx serve com `Cache-Control: immutable, max-age=31536000`.

### Read path denormalizado

Para manter a busca rápida (sem JOIN):

| Campo | Tabela | Uso |
|-------|--------|-----|
| `imagem` | `produtos` | URL full efetiva (manual > auto) |
| `imagemThumb` | `produtos` | URL thumbnail |
| `imagemStatus` | `produtos` | `PENDENTE`, `AUTOMATICA`, `MANUAL`, `INVALIDA` |

Metadados completos em `produto_imagens` (1:1 com `produtos`).

### Prioridade manual

Imagem com status `MANUAL` sempre sobrepõe a automática. Admin pode restaurar, reprocessar ou remover.

## Arquitetura

```
Upload catálogo → produto PENDENTE
Scheduler (*/5 min) → runProductImageBackfill → OFF → sharp → storage → denormaliza produtos
Busca usuário → lê produtos.imagem/imagemThumb (sem JOIN, sem OFF)
Admin → upload manual / restaurar / reprocessar
```

## Variáveis de ambiente

```env
IMAGE_STORAGE_DIR=public/uploads/produtos
IMAGE_PUBLIC_BASE_URL=/uploads/produtos
OFF_USER_AGENT=Precivox/1.0 (contact@precivox.com.br)
IMAGE_BACKFILL_BATCH_SIZE=20
REDIS_URL=...  # cache de lookups OFF (opcional)
```

## Operação

### Enfileirar catálogo existente

```bash
npm run db:backfill:produto-imagens
npm run db:backfill:produto-imagens:process
# ou tudo de uma vez:
npx tsx scripts/backfill-produto-imagens.ts --all
```

### Scheduler (produção)

Job registrado em `core/ai/jobs/scheduler.ts` — processo PM2 `precivox-ai-scheduler`, cron `*/5 * * * *`.

### Admin

`/admin/produtos/imagens` — listagem, substituir, restaurar automática, remover, reprocessar.

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/produtos/imagens` | Lista com filtros |
| GET | `/api/admin/produtos/[id]/imagem` | Metadados |
| POST | `/api/admin/produtos/[id]/imagem` | Upload manual (multipart) |
| DELETE | `/api/admin/produtos/[id]/imagem` | Remove e reenfileira |
| POST | `/api/admin/produtos/[id]/imagem/restaurar` | Restaura automática |
| POST | `/api/admin/produtos/[id]/imagem/reprocessar` | Rebusca no OFF |

## Frontend

- `components/ui/ProductImage.tsx` — lazy loading, skeleton, fallback, `object-contain`.
- Integrado em `ProductCard`, `ProductList`, `ListaItemRow`.

## Migração

```bash
npx prisma migrate deploy
```

Migração: `20260625193000_produto_imagens`.
