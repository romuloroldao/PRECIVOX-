# QA piloto — jornada AI-Native

**Branch:** `feat/redesign-jornada-cliente` · **PR:** https://github.com/romuloroldao/PRECIVOX-/pull/9  
**Flag:** `NEXT_PUBLIC_AI_NATIVE_SHELL` (build) ou cookie `AI_NATIVE_SHELL=1` (QA sem rebuild)  
**Regra:** produção permanece **off** até 1 ciclo de piloto estável.

## Pré-requisitos
- [ ] Login cliente válido
- [ ] Flag on no ambiente de teste + restart do Next
- [ ] Backend com `INTERNAL_API_SECRET` / `JWT_SECRET` (gateway IA)
- [ ] Opcional: `GROQ_API_KEY` (sem chave = análise de lista em modo básico/mock)

## Shell e navegação
- [ ] Bottom nav: **Casa · Compra · (FAB) · Despensa · Mais**
- [ ] FAB Scanner abre `/cliente/scan` em 1 toque; oculto na própria página scan
- [ ] Com flag **off**: nav legada (Início · Buscar · Listas · Despensa · Perfil)
- [ ] `/cliente/home` com flag on → redirect `/cliente/casa`

## Casa / Agora
- [ ] Título/CTA: revisar compra sugerida
- [ ] Hub: placeholder “O que a casa precisa?”
- [ ] Chip “Compra da semana” → Compra com rascunho
- [ ] Mic (Chrome): ditado → mesma navegação do texto
- [ ] Foto: OCR/EAN → scanner ou busca conforme conteúdo
- [ ] Evento `casa_aberta` em `/api/events/track` (Network)

## Compra
- [ ] Lista Inteligente full-bleed
- [ ] “Montar compra da semana” popula itens; dispara `compra_rascunho_montado`
- [ ] `?montar=1` monta e limpa a query
- [ ] Bloco análise IA (insights / modo básico sem Groq)
- [ ] Confirmação de compra (prompt/mercado vivo) → `compra_confirmada`

## Despensa / Mais / Perfil
- [ ] Despensa: copy preditiva + incluir na compra (1 tap)
- [ ] Mais → Preferências da casa (`/cliente/perfil`) sem jargão de IA
- [ ] “Por que sugerimos assim?” expansível
- [ ] Minha Casa (`/cliente/familia`): criar / entrar / transferir admin

## Economia Líquida
- [ ] Chip EL na busca/scan; onboarding na 1ª exposição
- [ ] Toast de refinamento após respostas EL (se elegível)

## Critérios de saída do piloto
- [ ] Funil Casa → rascunho → confirmação ≥ baseline (ver `lib/ai-native-funnel.ts`)
- [ ] Zero regressão crítica com flag off
- [ ] Decisão: ligar flag default on em staging → depois prod
- [ ] Só então: remover nav legada (Fase 9 restante)

---

*Criado 28/07/2026.*
