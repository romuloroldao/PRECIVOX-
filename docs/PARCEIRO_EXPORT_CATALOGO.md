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

## Tiers e SLA (9.3)

| Tier | Cadência | Sync | Doc |
|------|----------|------|-----|
| 1 Manual | Semanal | Upload + sync `semanal`/`24h` | Este arquivo |
| 2 Diário | ≤ 24h | URL/SFTP | [`PARCEIRO_SLA_CONTRATO.md`](./PARCEIRO_SLA_CONTRATO.md) |
| 3 API | ≤ 6h (futuro) | API batch + webhook | SLA + roadmap 9.2/9.4 |

Gestor aceita contrato e escolhe tier em **Produtos → SLA e contrato de dados**.

## API batch (Épico 9.2) — Tier 2+

**Endpoint:** `POST /api/partner/v1/estoques`

**Headers:**
- `Authorization: Bearer <chave-do-mercado>`
- `Content-Type: application/json`

**Body:**
```json
{
  "mercadoId": "uuid-do-mercado",
  "unidadeId": "uuid-da-unidade",
  "itens": [
    {
      "nome": "Arroz Branco 5kg",
      "preco": 24.9,
      "quantidade": 120,
      "codigo_barras": "7891234567890",
      "categoria": "Alimentos",
      "marca": "Camil",
      "preco_promocional": 21.9,
      "em_promocao": true
    }
  ]
}
```

Aliases aceitos: `produtos[]` ou `items[]` em vez de `itens[]`.

**Requisitos:**
- Mercado com **Tier ≥ 2** e contrato SLA aceito no painel gestor
- Chave configurada no servidor: `PARTNER_API_KEYS='{"<mercadoId>":"<secret>"}'`

**Resposta:** mesmo formato do upload-smart (`sucesso`, `erros`, `duplicados`, até 20 `detalhesErros`).

**Truth layer:** `fonte=API_PARCEIRO`, `confianca=85`.
