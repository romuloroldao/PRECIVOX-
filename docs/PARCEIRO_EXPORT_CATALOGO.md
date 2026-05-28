# Export de catálogo — Mercado parceiro (Tier 1)

Alinhado ao `upload-smart` e `lib/upload-handler.ts`.

## Formatos aceitos

CSV · XLSX · JSON (até 50 MB)

## Colunas (mínimo obrigatório)

| Coluna | Aliases aceitos | Obrigatório | Exemplo |
|--------|-----------------|-------------|---------|
| nome | `product`, `produto`, `nome do produto` | Sim | Arroz Branco 5kg |
| preco | `price`, `valor`, `preco_unitario` | Sim | 24.90 |
| quantidade | `estoque`, `stock`, `qtd` | Não (default 0) | 120 |

## Colunas recomendadas

| Coluna | Aliases | Exemplo |
|--------|---------|---------|
| codigo_barras | `ean`, `barcode` | 7891234567890 |
| categoria | `category` | Alimentos |
| marca | `brand` | Camil |
| preco_promocional | `promo_price` | 21.90 |
| em_promocao | `promocao` | true |

## Após o upload (truth layer)

- `fonte` = `UPLOAD_GESTOR`
- `confianca` = 70 (primeira carga) ou 75 (reimportação)
- `verificado_em` = data do processamento

## Cadência sugerida (SLA Tier 1)

- Atualização **semanal** ou quando houver promoção relevante
- Reimportar a **mesma unidade** selecionada no painel

## Sync agendado (Épico 9.1)

No painel **Gestor → Produtos**, configure:

- **URL** do CSV/XLSX/JSON (até 50 MB) ou **SFTP** (host, usuário, caminho)
- **Unidade** de destino e **intervalo** (6h, 12h, 24h, semanal)
- O job roda a cada 30 min no `precivox-ai-scheduler` e chama `processarUpload`

Disparo manual: botão **Executar agora**. Cron HTTP opcional: `POST /api/cron/sync-agendado` com `Authorization: Bearer $CRON_SECRET`.

## Tier 2+ (roadmap)

- API `POST /api/partner/v1/estoques/batch` — mesmo schema JSON
