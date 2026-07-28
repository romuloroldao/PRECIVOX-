# PRD — PRECIVOX (contexto de produto para agentes de IA)

**Versão:** 1.0  
**Data:** 28/07/2026  
**Domínio canônico:** https://precivox.com.br  
**Público deste documento:** agentes de IA, engenharia e produto  
**Foco:** superfície **CLIENTE (B2C)** em detalhe; GESTOR/ADMIN e plataforma em contexto

---

## Problem Statement

Famílias e consumidores de bairro perdem tempo e dinheiro porque **comparar preços entre mercados é incompleto**: o preço mais barato na tela pode não valer a viagem; catálogos ficam desatualizados; a compra semanal é refeita do zero toda semana; e a decisão “onde comprar esta cesta” não considera deslocamento, tempo, hábitos da casa nem confiança no preço.

Pequenos e médios mercados, por outro lado, não têm a inteligência de demanda e precificação que grandes redes possuem — e o consumidor não tem um lugar que **oferte a demanda** (cesta provável, despensa, economia líquida) em vez de apenas listar preços.

O PRECIVOX precisa ser a **infraestrutura de decisão de consumo alimentar hiperlocal** — não um comparador de preços genérico.

---

## Solution

O PRECIVOX é uma plataforma de inteligência de consumo alimentar com três faces:

1. **CLIENTE (B2C):** app web mobile-first que ajuda a montar a compra, comparar com **Economia Líquida™**, confiar no preço (truth layer + crowd), comprar no corredor (Mercado Ao Vivo + scan) e aprender o hábito da casa (despensa, Perfil PRECI, Minha Casa).
2. **GESTOR (B2B):** operador de mercado com radar de demanda, saúde de catálogo, pricing assistido e insights GROOC alimentados pelo comportamento agregado dos clientes.
3. **ADMIN / plataforma:** usuários, mercados, planos SaaS, parceiros âncora e PRECI Network (intenção agregada LGPD).

**Tese de produto:** o PRECIVOX **oferta demanda ao consumidor** (não espera).  
**Categoria:** infraestrutura de decisão de consumo — **não** comparador de preços.  
**Princípios:** MVP first · baixo custo · IA híbrida (regras primeiro, LLM só explica) · dados proprietários · IA explicável.

**Atores:**

| Ator | Papel | Destino pós-login |
|------|--------|-------------------|
| `CLIENTE` | Consumidor final | `/cliente/home` |
| `GESTOR` | Operador do mercado | `/gestor/home` (pode acessar `/cliente/*` para demo/QA) |
| `ADMIN` | Operação da plataforma | `/admin/dashboard` |

**Nav principal do cliente (5 abas):** Início · Buscar · Listas · Despensa · Perfil.

---

## User Stories

### A. Conta, onboarding e shell

1. As a CLIENTE, I want to criar conta e confirmar e-mail, so that minha sessão seja segura e validada.
2. As a CLIENTE, I want to fazer login e cair direto na home, so that eu comece a comprar sem escolher persona.
3. As a CLIENTE, I want um checklist de primeiro uso (buscar, criar lista, localização, notificações), so that eu descubra o valor do produto em minutos.
4. As a CLIENTE, I want navegação inferior fixa no mobile com 5 destinos claros, so that eu não me perca entre features avançadas.
5. As a CLIENTE, I want progressive disclosure na home (seções colapsáveis), so that a tela não me sobrecarregue.
6. As a CLIENTE, I want uma única CTA principal “Começar compra”, so that o próximo passo seja óbvio.
7. As a CLIENTE, I want permitir notificações push, so that eu receba lembretes no dia de mercado e cesta provável.
8. As a CLIENTE, I want responder NPS contextual, so that o produto melhore a experiência do bairro.
9. As a GESTOR/ADMIN, I want acessar a área `/cliente/*` sem conta separada, so that eu possa demonstrar e validar a jornada B2C.

### B. Home e retenção

10. As a CLIENTE, I want ver economia total e do mês, so that eu sinta valor acumulado.
11. As a CLIENTE, I want ver listas recentes, so that eu retome uma compra em andamento.
12. As a CLIENTE, I want ver streak de economia semanal, so that eu mantenha o hábito.
13. As a CLIENTE, I want um card de cesta provável (48–72h), so that o app me oferte a compra antes de eu pensar nela.
14. As a CLIENTE, I want modo emergência (“jantar hoje”, até 5 itens), so that eu resolva uma compra urgente sem montar lista completa.
15. As a CLIENTE, I want “espera que vale”, so that eu saiba se compro agora ou espero uma promo.
16. As a CLIENTE, I want comparar atacado vs varejo considerando volume da casa, so that eu escolha o formato certo.
17. As a CLIENTE, I want ver inflação da **minha** cesta, so that eu entenda o impacto no meu bolso — não o IPCA genérico.
18. As a CLIENTE, I want ver PRECI Index do bairro, so that eu saiba se minha região está cara ou barata na cesta-referência.
19. As a CLIENTE, I want compartilhar minha economia (card share), so that eu indique o app organicamente.
20. As a CLIENTE, I want histórico de trocas inteligentes aceitas, so that eu confie nas substituições futuras.
21. As a CLIENTE, I want prova social hiperlocal anônima, so that eu veja o que famílias do bairro estão comprando (k≥3).
22. As a CLIENTE, I want atalho para scan inteligente e Mercado Ao Vivo, so that eu use o app dentro do mercado.

### C. Busca e comparação (hub central)

23. As a CLIENTE, I want buscar produtos com autocomplete, so that eu ache itens rápido.
24. As a CLIENTE, I want ver preço por mercado/unidade com ranking híbrido (relevância + perfil + preço), so that os melhores resultados para mim venham primeiro.
25. As a CLIENTE, I want filtrar e ordenar (relevância, menor preço, nome) num sheet único, so that a UI não fique poluída.
26. As a CLIENTE, I want modo “comparar preços” entre mercados, so that eu veja ofertas lado a lado sem sair da busca.
27. As a CLIENTE, I want chips de Economia Líquida™ em cada oferta relevante, so that eu saiba se **vale ir** ou **ficar**.
28. As a CLIENTE, I want ver “Atualizado há X” e selo de confiança (truth layer), so that eu não desconfie de preço velho.
29. As a CLIENTE, I want ver selo do mercado (preço verificado / âncora / crowd), so that eu escolha lojas confiáveis.
30. As a CLIENTE, I want prova social no card do produto, so that a decisão seja reforçada pelo bairro.
31. As a CLIENTE, I want sugestão de troca inteligente explicável, so that eu possa substituir item sem perder qualidade percebida.
32. As a CLIENTE, I want ver oferta agregada da região, parceiro âncora e promo direcionada, so that eu descubra oportunidades regionais sem jargão técnico na frente.
33. As a CLIENTE, I want resolução SKU nacional cross-mercado, so that o mesmo produto seja comparado corretamente entre lojas.
34. As a CLIENTE, I want estado “sem resultado inteligente”, so that eu não fique em impasse quando a busca falha.
35. As a CLIENTE, I want adicionar item à lista ativa com quantidade, so that eu monte a cesta enquanto busco.
36. As a CLIENTE, I want abrir detalhe do produto (`/cliente/produto/[id]`), so that eu veja mais contexto antes de adicionar.

### D. Economia Líquida™ (EL)

37. As a CLIENTE, I want que a EL seja calculada como economia bruta − deslocamento − tempo, so that a recomendação reflita custo real.
38. As a CLIENTE, I want recomendações `ir` / `ficar` / `indeterminado` com copy clara, so that a decisão seja acionável.
39. As a CLIENTE, I want que sem distância conhecida a EL fique indeterminada (nunca inventar km), so that o sistema seja honesto.
40. As a CLIENTE, I want configurar valor da hora, custo/km, transporte e prioridade de deslocamento, so that a EL combine com minha vida.
41. As a CLIENTE, I want onboarding EL na primeira exposição (busca/scan), so that eu entenda o conceito sem ler um manual.
42. As a CLIENTE, I want refinamento EL pós-uso (toast), so that o cálculo melhore com feedback.
43. As a CLIENTE, I want EL na lista (consolidar mercado) e no scan (etiqueta vs alternativa), so that a mesma lógica apareça em toda a jornada.
44. As a CLIENTE, I want ver o detalhamento numérico da EL, so that a IA/sistema seja explicável.

### E. Lista inteligente

45. As a CLIENTE, I want criar, listar, duplicar e arquivar listas, so that eu organize compras recorrentes.
46. As a CLIENTE, I want uma lista ativa com itens, quantidades e totais, so that eu veja o custo estimado da cesta.
47. As a CLIENTE, I want painel de lista (drawer/bottom sheet) acessível da busca, so that eu não perca o fluxo de compra.
48. As a CLIENTE, I want desfazer remoção de item, so that erros de toque não me frustrem.
49. As a CLIENTE, I want sugestões inline e basket completion (“quem leva X também leva Y”), so that eu complete a cesta.
50. As a CLIENTE, I want análise IA da lista com fontes/explicação, so that eu entenda oportunidades de economia.
51. As a CLIENTE, I want proposta de rota / consolidação multi-mercado, so that eu saiba se vale um ou vários mercados.
52. As a CLIENTE, I want rota otimizada (geo nearest-neighbor), so that o caminho entre lojas seja prático.
53. As a CLIENTE, I want CTA claro “Ir às compras / Finalizar” vs ações secundárias no menu, so that a hierarquia mobile seja óbvia.
54. As a CLIENTE, I want listas locais (offline/rápidas) mescladas com listas do servidor, so that eu não perca trabalho se a sessão falhar.
55. As a CLIENTE, I want abrir o detalhe de uma lista salva, so that eu edite uma compra específica. *(hoje: rota `/cliente/listas/[id]` referenciada mas ainda ausente — gap conhecido)*

### F. Despensa, cesta e hábitos

56. As a CLIENTE, I want uma despensa digital por mercado com itens inferidos e manuais, so that eu saiba o que está acabando em casa.
57. As a CLIENTE, I want status ok / atenção / acabando, so that eu priorize reposição.
58. As a CLIENTE, I want montar a **cesta da semana** em 1 tap (despensa + cesta provável), so that a compra semanal comece pronta.
59. As a CLIENTE, I want confirmar compra (total/parcial/não) após a visita, so that o sistema aprenda meu ciclo real (PDV virtual).
60. As a CLIENTE, I want que a confirmação atualize intent, perfil, despensa e streak, so that cada compra melhore a próxima.

### G. Perfil PRECI e personalização

61. As a CLIENTE, I want um Perfil PRECI com 5 eixos (planejador, marca, conveniência, explorador, urgente), so that o app me “espelhe” de forma explicável.
62. As a CLIENTE, I want editar eixos e preferências, so that eu corrija o espelho quando estiver errado.
63. As a CLIENTE, I want ver Intent Score (0–100, janela ~72h), so that eu entenda quão próxima está minha próxima ida ao mercado.
64. As a CLIENTE, I want relatório semanal gentil de oportunidades, so that eu revise a semana sem culpa.
65. As a CLIENTE, I want insights ML leve (elasticidade/basket) em linguagem simples, so that eu tire proveito sem jargão.
66. As a CLIENTE, I want ver reputação de contribuidor crowd, so that eu me sinta parte da rede de confiança de preços.
67. As a CLIENTE, I want link para Minha Casa a partir do perfil, so that a família compartilhe o mesmo contexto.

### H. Truth layer e Waze de preços (crowd)

68. As a CLIENTE, I want metadados de fonte/confiança/verificadoEm em cada preço, so that eu saiba de onde veio o dado.
69. As a CLIENTE, I want confirmar preço em poucos toques (confirmado / mais caro / mais barato), so that eu ajude o bairro e melhore o dado.
70. As a CLIENTE, I want confirmar preço via foto de etiqueta (crowd v2 + OCR), so that a evidência seja forte.
71. As a CLIENTE, I want que minha reputação pese nas confirmações, so that abuso tenha menos impacto. *(reputação por usuário: parcial/pós-lançamento em parte do roadmap)*
72. As a CLIENTE, I want ver reputação crowd do mercado, so that eu prefira lojas com preço bem verificado.
73. As a CLIENTE, I want badge “preço verificado” no mercado, so that confiança seja visível na busca.

### I. Scan inteligente

74. As a CLIENTE, I want fotografar etiqueta ou ler código de barras no mercado, so that o app ache o produto no catálogo.
75. As a CLIENTE, I want match por EAN + embedding textual, so that etiquetas ruins ainda encontrem candidatos.
76. As a CLIENTE, I want ver EL da etiqueta vs melhor alternativa, so that eu decida na prateleira.
77. As a CLIENTE, I want adicionar o item escaneado à lista, so that o scan alimente a compra.
78. As a CLIENTE, I want confirmar a etiqueta no crowd após o scan, so that o preço do corredor entre na truth layer.

### J. Mercado Ao Vivo (modo corredor)

79. As a CLIENTE, I want geofence detectando que estou no mercado, so that o app entre em modo corredor automaticamente.
80. As a CLIENTE, I want configurar o raio do geofence, so that a detecção combine com minha precisão de GPS.
81. As a CLIENTE, I want sincronizar a lista ativa ordenada por corredor, so that eu marque itens enquanto ando na loja.
82. As a CLIENTE, I want confirmar compra parcial/total no fim, so that o ciclo feche sem PDV real.
83. As a CLIENTE, I want atalho de scan dentro do modo vivo, so that eu resolva itens sem código na lista.
84. As a CLIENTE, I want banner “você está no mercado X” com selo, so that o contexto in-store fique explícito.

### K. Minha Casa (raio familiar)

85. As a CLIENTE, I want criar uma casa compartilhada com código de convite, so that a família use a mesma lista.
86. As a CLIENTE, I want entrar numa casa com código, so that novos membros entrem sem conta especial.
87. As a CLIENTE, I want ver membros e papéis (admin), so that a gestão doméstica fique clara.
88. As a CLIENTE, I want sincronizar lista compartilhada, so that o que um adiciona o outro vê.
89. As a CLIENTE, I want preferências de volume familiar (impacta atacado/cesta), so that a casa compre no tamanho certo.
90. As a CLIENTE, I want transferir admin e sair da casa, so that o ciclo de vida doméstico seja completo.
91. As a CLIENTE, I want um banner sugerindo criar casa quando a lista cresce, so that o recurso seja descoberto no momento certo.

### L. Alertas, gamificação, referral e secundários

92. As a CLIENTE, I want alertas de preço, so that eu saiba quando um item alvo cair. *(UI existe; backend ainda mock — gap)*
93. As a CLIENTE, I want página dedicada de comparação multi-mercado. *(UI mock; modo comparativo real vive na busca)*
94. As a CLIENTE, I want relatórios de economia históricos. *(página mock; relatório semanal real via card/API)*
95. As a CLIENTE, I want indicação (referral) com código, so that o crescimento seja orgânico. *(UI parcial; tracking parcial)*
96. As a CLIENTE, I want badges/conquistas de gamificação, so that a contribuição e o hábito sejam recompensados.
97. As a CLIENTE, I want registrar economia de uma compra, so that streaks e stats avancem.

### M. Eventos, privacidade e plataforma (visão do cliente)

98. As a CLIENTE, I want que minhas ações (busca, EL vista, compra confirmada, crowd) virem eventos, so that personalização e B2B usem dados agregados — não minha identidade exposta.
99. As a CLIENTE, I want copy simples (sem jargão de engenharia na UI), so that “oferta agregada” e “âncora” virem linguagem humana.
100. As a CLIENTE, I want o app funcionar bem em mobile-first (áreas de toque, bottom sheets, bottom nav), so that a compra no dia a dia seja confortável.

### N. Gestor / Admin (contexto mínimo para o agente)

101. As a GESTOR, I want upload/sync de catálogo com SLA por tier, so that o cliente veja preços frescos.
102. As a GESTOR, I want radar de demanda e heatmap de intenção do bairro, so that eu opere estoque/preço com sinal do CLIENTE.
103. As a GESTOR, I want saúde do catálogo e alertas stale, so that eu não perca selo/confiança no app do consumidor.
104. As a ADMIN, I want gerir usuários, mercados, planos SaaS e parceiros âncora, so that o piloto regional escale.

---

## Implementation Decisions

### Posicionamento e arquitetura de produto

- PRECIVOX **oferta demanda**; não se posiciona como comparador puro.
- IA híbrida: **decisão por regras/heurísticas**; LLM (GROOC) **explica**, não decide preço/EL.
- Três papéis (`CLIENTE`, `GESTOR`, `ADMIN`) com shells separados; área cliente acessível aos três roles para demo/QA.
- Arquitetura técnica vigente: Next.js BFF (porta 3000) é o único gateway público; Express `/api/v1` só via `internalFetch` em loopback (RULE 1–4 em `ARCHITECTURE.md`).
- Domínio de produção: `https://precivox.com.br`.

### Superfície CLIENTE (módulos lógicos)

| Módulo | Responsabilidade |
|--------|------------------|
| Shell cliente | Layout, bottom nav, geofence watcher, NPS, onboarding EL |
| Home | CTA compra, cards de retenção e progressive disclosure |
| Busca | Hub de compra: ranking, comparativo, chips, lista lateral |
| Economia Líquida | Cálculo explicável + config usuário + onboarding/refinamento |
| Lista inteligente | Estado ativo, IA de lista, rota, substitutos, merge local/remoto |
| Despensa / cestas | Inferência de estoque doméstico, cesta provável, cesta da semana, emergência |
| Perfil PRECI | 5 eixos, intent score, prefs EL, relatório, ML leve B2C |
| Truth + crowd | Confiança de preço, feedback, OCR etiqueta, selos |
| Scan | OCR/EAN/embedding → match → EL → lista/crowd |
| Mercado Ao Vivo | Geofence → sessão corredor → checklist → confirmação |
| Minha Casa | Conta familiar, convite, lista compartilhada, volume |
| Eventos | Collector comportamental alimentando intent/perfil/B2B agregado |

### Contratos de comportamento (domínio)

**Economia Líquida™**

```
EL = economia_bruta - custo_deslocamento - custo_tempo
```

- Defaults: `custo_km = R$ 0,80`, `velocidade = 25 km/h`, `valor_hora = R$ 20`
- Sem `distanciaKm` → `recomendacao = indeterminado` (nunca inventar distância)
- Limiar típico para `ir`: EL ≥ R$ 5 (configurável)
- Sempre retornar `detalhes` numéricos explicáveis

**Perfil PRECI — 5 eixos:** planejador, marca, conveniência, explorador, urgente.

**Intent Score:** 0–100 com decay temporal (~72h), alimentado por eventos (`compra_confirmada`, buscas, etc.).

**Truth layer:** preços carregam `fonte`, `confianca`, `verificadoEm`; UI mostra frescor + selo.

**Crowd:** ações `confirmado` / `mais_caro` / `mais_barato`; crowd v2 inclui foto de etiqueta.

**Prova social hiperlocal:** agregados anônimos com k-anonimato (k≥3).

### APIs B2C (seams externos preferenciais)

Contratos estáveis para agentes e testes (não paths internos de implementação):

- Perfil / intent / EL: `perfil-preci`, `intent-score`, `el-refinamento`, `economia-liquida/calcular`
- Hábitos: `despensa`, `cesta-provavel`, `cesta-semana`, `modo-emergencia`, `espera-que-vale`, `atacado-varejo`, `inflacao-cesta`, `economia-streak`, `relatorio-semana`
- Compra: `produtos/buscar`, `lists/*`, `sugestoes-lista`, `basket-completion`, `substitutos`, `rota-proposta`, `rota-otimizada`
- In-store: `scan-inteligente`, `modo-mercado-vivo` (+ itens/config), crowd etiqueta
- Casa: `raio-familiar`
- Contexto regional: `prova-social`, `preci-index`, `oferta-agregada`, `parceiros-ancora`, `promo-direcionada`, `sku-nacional`
- Tracking: `events/track`, savings, gamification, NPS

### UX / design decisions (jornada cliente)

- Mobile-first; bottom nav; bottom sheets; progressive disclosure.
- Copy centralizada em linguagem simples (evitar jargão na UI primária).
- Home: **uma** ação principal.
- Busca: filtros/ordenação unificados; cards com hierarquia (preço/loja/adicionar na frente; badges atrás).
- Lista: CTA primário de compra; ações destrutivas/secundárias no menu; desfazer remoção.

### Maturidade conhecida (importante para agentes)

| Área | Estado |
|------|--------|
| Busca, EL, lista, despensa, perfil, scan, mercado vivo, casa, crowd/truth | Produção utilizável |
| `/cliente/listas/[id]` (detalhe/edição profunda) | **Gap** — referenciada, rota ausente |
| `/cliente/alertas`, `/cliente/comparar`, `/cliente/relatorios`, `/cliente/referral` | UI **mock** ou parcial |
| Crowd reputação ponderada por usuário | Parcial / pós-lançamento no roadmap |
| LLM explicativo B2C | Evoluir; B2B GROOC com fontes já existe |
| Piloto comercial | Fase 4 go-live; catálogo âncora precisa reimport fresco |

### Integração B2B → experiência do cliente

- Upload/sync/API parceiro + SLA Tier 1–3 alimentam frescor do preço.
- Parceiros âncora e oferta agregada aparecem como contexto regional na busca.
- Radar/heatmap do gestor consomem intenção agregada do comportamento CLIENTE.
- Planos SaaS (Essencial/Pro/Enterprise) habilitam módulos do gestor que melhoram o catálogo visto pelo cliente.

---

## Testing Decisions

### O que torna um bom teste

- Testar **comportamento externo observável** (resposta de API, recomendação EL, texto/estado de UI), **não** detalhes internos de implementação.
- Preferir o **seam mais alto** possível.
- Não assertar paths de arquivos, nomes de funções privadas ou estrutura de componentes.

### Seams aprovadas (ordem de preferência)

1. **APIs B2C** — `/api/cliente/*`, `/api/produtos/buscar`, crowd, EL calcular, lists, events.
2. **Cálculos de domínio puros** — Economia Líquida, Perfil PRECI, Intent Score (entrada → saída determinística).
3. **Jornadas de página** — home → busca → lista → confirmação; scan; mercado vivo; Minha Casa.
4. **Persistência observável** — listas salvas, despensa, perfil, eventos que alteram intent/EL.

### Módulos prioritários para teste

- Economia Líquida (casos: EL negativa → ficar; sem distância → indeterminado; cesta multi-item).
- Busca + ranking/comparativo (resultado contém preço, truth, EL quando coords existem).
- Lista inteligente (adicionar quantidade, consolidação, desfazer).
- Confirmação de compra → efeito em intent/despensa/streak.
- Crowd feedback → mudança observável de confiança/frescor.
- Geofence/mercado vivo (detectar unidade → checklist → confirmação) com localização mockável.
- Raio familiar (criar/entrar/sync lista).

### Prior art

- Spec EL: `docs/SPEC_ECONOMIA_LIQUIDA.md`
- QA go-live cliente: `docs/CHECKLIST_GO_LIVE.md` §5
- Testes existentes em `tests/` (usar padrões de asserção do repo)
- Sprints históricos: `docs/ISSUES_SPRINT*.md`, `docs/FASE1_SPRINTS.md`

---

## Out of Scope

- Gateway de pagamento / contrato comercial SaaS (fora do sistema no go-live atual).
- Integração PDV em tempo real em escala (visão Fase 4).
- Widget/SDK PRECI Network para apps terceiros (pós-MVP técnico).
- Expansão LATAM / multi-país.
- Substituir a área GESTOR/ADMIN por este PRD (aqui entram só como contexto).
- Implementar agora os gaps mock (`alertas`, `comparar` página, `relatorios` página, `referral` completo) — documentados, não escopo implícito de “já pronto”.
- Reputação crowd ponderada completa e LLM B2C explicativo pleno (itens P1 pós-lançamento).
- Alterar o contrato de arquitetura RULE 1–4 (BFF único).

---

## Further Notes

### Glossário (usar estes termos com agentes)

| Termo | Significado |
|-------|-------------|
| Economia Líquida™ (EL) | Economia real após deslocamento e tempo |
| Perfil PRECI | Espelho comportamental em 5 eixos |
| Intent Score | Probabilidade de compra nas próximas ~72h |
| Truth layer | Camada de confiança/frescor do preço |
| Crowd | Confirmação comunitária de preços |
| Minha Casa / Raio familiar | Conta compartilhada da família |
| Despensa digital | Estoque doméstico inferido + manual |
| Cesta provável | Itens que o usuário provavelmente comprará |
| Cesta da semana | Montagem 1-tap da compra semanal |
| Modo emergência | Compra urgente curta (até 5 itens) |
| Mercado Ao Vivo / modo corredor | Experiência in-store com geofence |
| Lista inteligente | Lista ativa com IA (rota, substitutos, análise) |
| Troca inteligente | Substituição explicável |
| Prova social hiperlocal | Sinal anônimo do bairro (k≥3) |
| PRECI Index | Índice da cesta-referência do bairro |
| Parceiro âncora | Mercado destaque da região piloto |
| SKU nacional | Identidade unificada cross-mercado |
| Unidade | Loja física |
| Mercado | Rede/operador (tenant) |

### Métricas norte

GMV de intenção influenciada × economia líquida entregue × densidade do grafo de confirmações.

### Documentos irmãos

| Doc | Uso |
|-----|-----|
| `docs/ROADMAP_PRECIVOX.md` | Fases, épicos, status |
| `docs/SPEC_ECONOMIA_LIQUIDA.md` | Fórmula e regras EL |
| `docs/PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md` | **IA de informação AI-Native** (reorganiza UX; não altera domínio) |
| `docs/CONTEXTO_ATUALIZADO_LLM.md` | Arquitetura BFF/auth para LLMs |
| `ARCHITECTURE.md` | RULE 1–4 |
| `docs/CHECKLIST_GO_LIVE.md` | QA piloto |
| `docs/EPICO_14_CROWD_V2.md` … `EPICO_18_*` | Épicos de escala |
| `lib/ux-copy.ts` / `lib/ux-copy-casa.ts` | Copy oficial B2C |

### Instruções para agentes de IA

1. Trate o **CLIENTE** como persona principal deste PRD; não reescreva o produto como “comparador de preços”.
2. Ao implementar UI cliente, preserve progressive disclosure e copy simples.
3. Qualquer feature de preço deve respeitar truth layer e EL explicável.
4. Não invente distância/coordenadas para forçar EL.
5. Gaps mock e rota `/cliente/listas/[id]` ausente devem ser tratados como dívida conhecida, não como comportamento “já ok”.
6. Respeite RULE 1–4: cliente nunca fala direto com Express `:3001`.
7. Para mudanças de **navegação / shell / Hub PRECI / multimodal**, siga [`PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md`](./PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md): intent-first, Casa no centro, domínio intacto, migração por fases.
8. **Princípio-mestre UX:** o usuário nunca deve sentir que está “usando IA”; deve sentir que o app sabe o que a casa precisa, exige menos esforço e ajuda a decidir. IA é capacidade, não protagonista da interface.

---

## Adendo — Information Architecture AI-Native (jul/2026)

Este PRD define **o que o produto faz** (domínio, regras, user stories).  
A **organização da experiência** B2C evolui conforme a proposta AI-Native:

| Antes (páginas) | Depois (intenção + ciclo) |
|-----------------|---------------------------|
| Início · Buscar · Listas · Despensa · Perfil | Casa · Compra · FAB Scanner · Despensa · Mais + Hub PRECI |
| Centro = Busca/Lista | Centro = **Minha Casa** + ciclo alimentar contínuo |
| Perfil PRECI = tela | Perfil PRECI = cérebro silencioso (memory layer) |
| Despensa = inventário | Despensa = memória operacional preditiva |
| Busca = aba | Busca = capability (destino visual do Hub) |

**Não altera:** Economia Líquida™, Lista Inteligente, Minha Casa, Perfil PRECI, Despensa, Mercado Ao Vivo, Scanner, Truth Layer, Intent Score, Cesta Provável — apenas **como** o usuário chega até eles.

**Documento completo:** [`docs/PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md`](./PROPOSTA_AI_NATIVE_SHOPPING_JOURNEY.md)  
(inclui auditoria, jornadas, Hub, taxonomia de intents, `StructuredResponse`, roadmap Fases 0–9, checklist Zero Friction).

**Feature flag de shell:** `AI_NATIVE_SHELL` (default off até Fase 1+ estável).

---

*PRD sintetizado a partir do código e docs do repositório PRECIVOX (baseline jul/2026). Adendo AI-Native: 28/07/2026.*
