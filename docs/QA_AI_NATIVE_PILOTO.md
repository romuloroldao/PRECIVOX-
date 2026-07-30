# QA piloto — jornada AI-Native

**PR:** https://github.com/romuloroldao/PRECIVOX-/pull/9 (merged em `main`)  
**Flag:** `NEXT_PUBLIC_AI_NATIVE_SHELL` (build) ou cookie `AI_NATIVE_SHELL` (QA: `1` liga / `0` desliga sem rebuild)  
**Regra:** produção **on** desde 28/07/2026 (decisão explícita). Cookie `AI_NATIVE_SHELL=0` ainda permite rollback local de QA.

**Última execução automatizada:** 30/07/2026 — `node scripts/qa-ai-native-piloto.mjs` + dump Playwright (`cliente@precivox.com`).  
**BUILD_ID observado:** `MC4baK4J4226AIsWAgVls`

## Status infra (28/07/2026)
- [x] `main` publicado; deploy com shell on
- [x] `.env.production` com `NEXT_PUBLIC_AI_NATIVE_SHELL=true`
- [x] Smoke apps + hardening OK; hub intent responde 401 sem auth
- [x] Rotas `/cliente/casa`, `/cliente/compra`, `/cliente/mais` HTTP 200

## Pré-requisitos (QA manual com shell novo)
- [x] Login cliente válido (`cliente@precivox.com` / `senha123`)
- [x] Shell on por default (nav Casa · Compra · Despensa · Mais)
- [x] Backend com `INTERNAL_API_SECRET` / `JWT_SECRET` (gateway IA)
- [x] `GROQ_API_KEY` presente em produção

## Shell e navegação
- [x] Bottom nav: **Casa · Compra · (FAB) · Despensa · Mais**
- [x] FAB Scanner: link `/cliente/scan` presente (aria-label Escanear); oculto em `/cliente/scan`
- [x] Com cookie `AI_NATIVE_SHELL=0`: nav legada **Início · Buscar · Listas · Despensa · Perfil**
- [x] `/cliente/home` com flag on → redirect `/cliente/casa`

## Casa / Agora
- [x] Título/CTA: revisar compra sugerida
- [x] Hub: placeholder “O que a casa precisa?”
- [x] Chip “Compra da semana” → Compra (`?montar=1`)
- [ ] Mic (Chrome): ditado → mesma navegação do texto — **manual (hardware)**
- [ ] Foto: OCR/EAN → scanner ou busca conforme conteúdo — **manual (câmera)**
- [x] Evento `casa_aberta` em `/api/events/track`

## Compra
- [x] Lista Inteligente full-bleed (7 itens no piloto)
- [x] “Montar compra da semana” / deep-link popula itens
- [x] `?montar=1` limpa a query — **corrigido 30/07** (antes ficava grudado se lista já tinha itens)
- [x] Bloco análise IA — dentro de **Rota e dicas** (colapsável; copy `UX.lista.rotaIa`)
- [ ] Confirmação de compra → `compra_confirmada` — **prompt só após ~90s com itens; validar manualmente**
- [ ] Evento `compra_rascunho_montado` — **parcial:** só dispara no POST montar; com lista já cheia + `?montar=1` não re-dispara (esperado após fix de limpeza)

## Despensa / Mais / Perfil
- [x] Despensa: copy preditiva (“Em dia.” / ciclo) — OK
- [x] CTA “Incluir na compra” — só para urgência média/alta (itens EM DIA corretamente ocultam CTA)
- [x] Mais → Preferências/perfil sem jargão de IA (LLM/prompt)
- [x] “Por que sugerimos assim?” expansível na Casa
- [x] Minha Casa (`/cliente/familia`): UI criar/entrar presente

## Economia Líquida
- [ ] Chip EL na busca/scan — **não evidenciado** no listing genérico do piloto (revalidar em card/scan com oferta)
- [ ] Toast de refinamento após respostas EL — **não exercitado**

## Critérios de saída do piloto
- [ ] Funil Casa → rascunho → confirmação ≥ baseline (ver `lib/ai-native-funnel.ts`) — falta passo confirmação manual
- [x] Zero regressão crítica de nav: cookie `=0` restaura nav legada
- [x] Flag default on em produção
- [ ] Remover nav legada (Fase 9 restante)

## Como reexecutar
```bash
node scripts/qa-ai-native-piloto.mjs
# opcional: QA_BASE_URL=https://precivox.com.br QA_EMAIL=... QA_PASSWORD=...
```

---

*Atualizado 30/07/2026 — 1ª bateria QA automatizada + fix `?montar=1`.*
