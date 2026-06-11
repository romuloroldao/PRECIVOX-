# Épico 13 — Oferta agregada (Fase 3)

> Mercado **aceita** atender a **cesta agregada da região** — demanda consolidada e anônima de consumidores do bairro.

## Entregas

| # | Feature | Onde |
|---|---------|------|
| 13.1 | **Config + opt-in gestor** | `mercados.oferta_agregada` (JSON), `lib/oferta-agregada/config.ts` |
| 13.2 | **Agregador regional** | `lib/oferta-agregada/agregador.ts`, `regiao.ts` |
| 13.3 | **Cesta proposta** | `lib/oferta-agregada/cesta-mercado.ts` (match catálogo local) |
| 13.4 | **UI gestor** | `OfertaAgregadaGestorCard`, `/api/gestor/oferta-agregada` |
| 13.5 | **UI cliente** | `OfertaAgregadaRegiaoChip`, `/api/cliente/oferta-agregada` |
| 13.6 | **Aceite + auditoria** | `POST .../aceitar`, `acoes_gestor` tipo `oferta_agregada_aceita` |

## Região

| Modo | Descrição |
|------|-----------|
| `cep5` (padrão) | Unidades no mesmo CEP5 |
| `cidade` | Mesma cidade/UF |
| `poligono` | Polígono do bairro (PRECI Graph) |

## Agregação

- Fontes: `user_events` (lista, compra, busca) nos mercados da região
- Chave lógica: EAN → `chaveInsight` → nome normalizado (`lib/oferta-agregada/chave-produto.ts`)
- LGPD: contagens agregadas, sem identificar consumidores

## APIs

```bash
# Gestor — config + cesta
GET /api/gestor/oferta-agregada?mercadoId=
PATCH /api/gestor/oferta-agregada  { "ativo": true, "regiaoModo": "cep5" }

# Aceitar cesta (ativa opt-in + registra ação)
POST /api/gestor/oferta-agregada/aceitar  { "mercadoId": "..." }

# Cliente — badge quando mercado aceita
GET /api/cliente/oferta-agregada?mercadoId=
```

## Migration

```bash
npx prisma migrate deploy
# SQL: prisma/migrations/20260601180000_mercado_oferta_agregada/
```

## Próximo épico

**14 — Crowd v2** (OCR etiqueta, reputação, anti-fraude).
