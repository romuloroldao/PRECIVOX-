# Fase 1 — Sprints (0–3 meses)

Complemento de [`ROADMAP_PRECIVOX.md`](./ROADMAP_PRECIVOX.md).  
**Cadência:** sprints de 2 semanas · 3 sprints principais + Sprint 0 (fundação técnica).

---

## Sprint 0 — Fundação técnica (semanas 1–2)

**Objetivo:** Desbloquear Economia Líquida, truth layer e eventos v2 sem UI pesada.

| Semana | Entregável | Issues |
|--------|------------|--------|
| **S0-W1** | Spec EL + módulo `lib/economia-liquida.ts` | `PREC-001` |
| **S0-W1** | Migration truth layer (`estoques.fonte`, `confianca`, `verificadoEm`) | `PREC-002` |
| **S0-W1** | `lib/estoque-truth.ts` + upload-smart grava metadados | `PREC-003` |
| **S0-W2** | Eventos v2 em `types`, API, `frontend-events` | `PREC-004` |
| **S0-W2** | Doc export parceiro (campos CSV) | `PREC-005` |

**DoD Sprint 0:** migration aplicada · testes manuais upload · eventos novos aceitos na API · spec EL revisada.

**Status implementação (código):** ver `docs/SPEC_ECONOMIA_LIQUIDA.md`, migration `20260526120000_estoque_truth_layer`.

---

## Sprint 1 — Confiança e economia visível (semanas 3–4)

**Status (código):** ✅ PREC-101 a PREC-106 implementados — truth badge, EL chip, `includeEconomia`, dashboard `CatalogoSaudeCard`, banner lista.

---

**Objetivo:** Consumidor vê preço confiável + primeira versão de Economia Líquida na busca/lista.

| Issue | Título | Prioridade | Estimativa |
|-------|--------|------------|------------|
| `PREC-101` | UI preço: “Atualizado há X” + badge confiança | P0 | 3d |
| `PREC-102` | Integrar EL em `ProductCard` / busca (1 mercado vs alternativa) | P0 | 4d |
| `PREC-103` | EL na lista inteligente (banner “vale ir”) | P0 | 3d |
| `PREC-104` | Config valor do tempo (perfil usuário, default regional) | P1 | 2d |
| `PREC-105` | API `GET /api/economia-liquida/calcular` | P0 | 2d |
| `PREC-106` | Dashboard gestor: último import + SKUs stale | P0 | 3d |

### Entregáveis semanais

| Semana | Entrega | Status |
|--------|---------|--------|
| **S1-W1** | Truth layer na UI da busca + dashboard saúde catálogo (gestor) | ✅ |
| **S1-W2** | EL em busca e lista + endpoint calcular + copy “Fique aqui” / “Vale X min” | ✅ |

**Métricas:** % cards com selo confiança · cliques em alternativa EL · gestores com import &lt; 7 dias.

---

## Sprint 2 — Comportamento e crowd (semanas 5–6)

**Objetivo:** Coletar sinais reais pós-compra e validar preços (Waze v1).

| Issue | Título | Prioridade | Estimativa |
|-------|--------|------------|------------|
| `PREC-201` | UI confirmar preço (3 taps) no produto | P0 | 3d |
| `PREC-202` | API agregar confirmações → atualiza `confianca` | P0 | 3d |
| `PREC-203` | Modal confirmação pós-compra (Sim/Parcial/Não) | P0 | 3d |
| `PREC-204` | Perfil PRECI v1 (5 eixos, cálculo + tela espelho) | P0 | 5d |
| `PREC-205` | Intent Score heurístico + job batch | P0 | 3d |
| `PREC-206` | Gamificação contribuidor (níveis simples) | P1 | 2d |

### Entregáveis semanais

| Semana | Entrega |
|--------|---------|
| **S2-W1** | Crowd confirmar preço + ajuste confiança no estoque |
| **S2-W2** | Confirmação compra + Perfil PRECI + Intent Score (backend) |

**Métricas:** confirmações preço/DAU · taxa confirmação compra · perfis com ≥1 eixo calibrado.

**Status (código):** ✅ ver [`ISSUES_SPRINT2.md`](./ISSUES_SPRINT2.md) · branch `feature/sprint-2-comportamento-crowd`

---

## Sprint 3 — Hábito e oferta de demanda (semanas 7–8)

**Objetivo:** Usuário abre o app **antes** do mercado; gestor vê intenção agregada.

| Issue | Título | Prioridade | Estimativa |
|-------|--------|------------|------------|
| `PREC-301` | Push “cesta provável” (48–72h) | P0 | 4d |
| `PREC-302` | Notificação dia de mercado inferido | P0 | 2d |
| `PREC-303` | Streak economia confirmada | P1 | 3d |
| `PREC-304` | Card share “Economizei R$ X” | P1 | 2d |
| `PREC-305` | Relatório semanal consumidor (oportunidades) | P1 | 3d |
| `PREC-306` | Radar demanda bairro v0 (gestor, agregado) | P0 | 4d |
| `PREC-307` | Inflação da sua cesta (home cliente) | P1 | 3d |

### Entregáveis semanais

| Semana | Entrega |
|--------|---------|
| **S3-W1** | Push cesta provável + notificação dia mercado + radar gestor v0 |
| **S3-W2** | Streak + card share + relatório semanal + inflação cesta (MVP) |

**Métricas:** D7 · % sessões 24h antes de `compra_confirmada` · gestores acessando radar.

---

## Release Fase 1 (fim sprint 3)

Checklist de release:

- [ ] Economia Líquida em busca + lista
- [ ] Truth layer visível (fonte, frescor, confiança)
- [ ] Crowd confirmar preço operacional
- [ ] Confirmação pós-compra
- [ ] Perfil PRECI + Intent + 1 push semanal
- [ ] Dashboard + radar demanda (gestor)
- [ ] Documentação parceiro Tier 1–3

---

## Dependências entre sprints

```
Sprint 0 ──► Sprint 1 (EL + truth UI)
     │
     └──► Sprint 2 (eventos v2 → crowd + compra + Perfil PRECI)
              │
              └──► Sprint 3 (Intent → push + hábito + radar B2B)
```

---

## Template de issue (GitHub/Jira)

```markdown
## Contexto
[Épico do ROADMAP]

## Entregável
- [ ] ...

## Critérios de aceite
1. ...
2. ...

## Métrica de sucesso
- ...

## Dependências
- PREC-xxx
```

---

*Revisar ao fechar cada sprint; mover P1 não concluído para o sprint seguinte sem bloquear P0.*
