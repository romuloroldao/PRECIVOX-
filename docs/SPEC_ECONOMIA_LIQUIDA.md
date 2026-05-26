# Spec — Economia Líquida™ (EL)

**Versão:** 1.0 (Sprint 0)  
**Módulo:** `lib/economia-liquida.ts`

---

## Definição

**Economia Líquida** é a economia **real** após custos de deslocamento e tempo:

```
EL = economia_bruta - custo_deslocamento - custo_tempo
```

Onde:

| Variável | Fórmula | Default |
|----------|---------|---------|
| `economia_bruta` | `preco_origem - preco_destino` (por item ou cesta) | — |
| `custo_deslocamento` | `2 × distância_km × custo_km` (ida e volta) | `custo_km = R$ 0,80` |
| `custo_tempo` | `(distância_km / velocidade_kmh) × 60 × (valor_hora / 60)` | `velocidade = 25 km/h` urbano · `valor_hora = R$ 20` |

Se `distância_km` for desconhecida (`null`), **não calcular EL numérica** — retornar recomendação `indeterminado`.

---

## Recomendações (copy)

| Condição | `recomendacao` | Mensagem sugerida |
|----------|----------------|-------------------|
| `EL < 0` | `ficar` | Não vale a viagem — economia líquida negativa |
| `0 ≤ EL < 5` | `ficar` | Diferença pequena; ficar é mais prático |
| `EL ≥ 5` e `distância` conhecida | `ir` | Vale ir — economiza R$ {EL} (≈ {minutos} min) |
| `distância` null | `indeterminado` | Compare preços; ative localização para ver se vale ir |

Limiar `5` (R$) é configurável via `EL_MINIMO_RECOMENDAR`.

---

## Inputs da API interna

```typescript
calcularEconomiaLiquida({
  precoOrigem: number;
  precoDestino: number;
  distanciaKm?: number | null;
  valorHoraReais?: number;  // default 20
  custoKmReais?: number;    // default 0.8
  velocidadeKmh?: number;   // default 25
}): ResultadoEconomiaLiquida
```

```typescript
calcularEconomiaLiquidaCesta({
  itens: Array<{ precoOrigem: number; precoDestino: number; quantidade?: number }>;
  distanciaKm?: number | null;
  ...
}): ResultadoEconomiaLiquida
```

---

## Distância

- **Fase 1:** Haversine entre coordenadas de unidades (`unidades.latitude`, `unidades.longitude`).
- **Origem do usuário:** opcional (futuro: geolocation browser); se ausente, usar só distância entre unidades/mercados.

Função: `distanciaKmEntreCoords(lat1, lon1, lat2, lon2)`.

---

## Integração UI (Sprint 1)

| Superfície | Comportamento |
|------------|---------------|
| Busca / card | Se há unidade alternativa mais barata + coords → chip EL |
| Lista inteligente | Banner no topo se consolidar mercado economiza EL ≥ limiar |
| Detalhe produto | Bloco “Na sua região” + EL vs mercado atual (check-in futuro) |

---

## Princípios

1. **Sempre explicável** — retornar `detalhes` com cada componente numérico.
2. **Nunca inventar distância** — sem coords, `indeterminado`.
3. **Heurística primeiro** — sem LLM para o cálculo.
4. **Personalização progressiva** — `valorHora` do Perfil PRECI (Sprint 2+).

---

## Eventos relacionados (Sprint 0+)

- `rota_consolidacao_lista` — usuário aceitou trocar mercado na lista
- Futuro: `economia_liquida_exibida`, `economia_liquida_aceita`

---

## Exemplo

- Preço aqui: R$ 24,00 · outro mercado: R$ 18,50 → bruta R$ 5,50  
- Distância: 2 km → deslocamento `2 × 2 × 0,8 = R$ 3,20`  
- Tempo: ~4,8 min → `4,8/60 × 20 ≈ R$ 1,60`  
- **EL ≈ R$ 0,70** → recomendação `ficar` (&lt; R$ 5)

---

*Implementação: `lib/economia-liquida.ts`*
