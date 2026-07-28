# Checklist Go-Live Comercial — PRECIVOX

> **Quando usar:** antes de abrir o produto com parceiros reais e cobrança SaaS.  
> **Pré-requisito:** Épicos 16–17 (infra técnica) ✅ · backfill SKU nacional ✅  
> **Última revisão:** 18/06/2026

---

## 1. Ops e dados

- [x] Backfill SKU nacional concluído (`npm run db:backfill:sku-nacional`)
- [x] Migrations aplicadas em produção (`npx prisma migrate deploy` — 21/21)
- [x] Ownership PostgreSQL corrigido (`precivox_app` owner de schema/tabelas)
- [x] Build + PM2 restart sem erros (deploy 18/06/2026)
- [ ] `PARTNER_API_KEYS` configurado para parceiros Tier 2+
- [ ] `PRECI_NETWORK_API_KEYS` configurado para clientes CPG (se aplicável)
- [ ] `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` para push retenção
- [x] Smoke test rotas admin (dashboard, users, mercados, IA, GROOC)

**Scripts ops:**
```bash
sudo bash scripts/fix-db-ownership.sh      # ownership + migrate deploy
npm run db:setup:go-live                   # planos SaaS + âncoras piloto
```

---

## 2. Parceiros âncora (Épico 16)

Infra pronta — **5 âncoras designadas** em 18/06/2026 via `npm run db:setup:go-live`:

| # | Mercado | Tipo | Plano |
|---|---------|------|-------|
| 1 | Empório Select Premium | rede | Enterprise |
| 2 | Atacadão Econômico Brasil | atacarejo | Pro |
| 3 | SuperMax Atacado | atacarejo | Pro |
| 4 | Mercadinho do Bairro | rede | Pro |
| 5 | Popular Preços Baixos | atacarejo | — |

Checklist:
- [x] 3–5 redes/atacados por região piloto designados
- [ ] Elegibilidade plena: catálogo ≤ 15% stale (Empório **100% stale** — reimport urgente)
- [x] Badge âncora visível na busca (`GET /api/public/parceiros-ancora`)
- [x] Rotas preferem âncora (`lista-rota-proposta.ts`)

Designar manualmente (admin):
```bash
curl -X PATCH -H "Cookie: ..." -H "Content-Type: application/json" \
  -d '{"mercadoId":"<ID>","ativo":true,"tipo":"atacarejo","prioridade":1,"regiaoModo":"cep5"}' \
  https://precivox.com.br/api/admin/parceiros-ancora
```

---

## 3. Monetização SaaS (Épico 17)

- [x] Planos `Essencial` / `Pro` / `Enterprise` criados (`go-live-plano-*`)
- [x] Mercados piloto vinculados ao plano correto
- [x] Feature gates validados no gestor piloto (Empório = Pro, 7 módulos)
- [ ] Contrato comercial assinado (fora do sistema)
- [ ] Gateway de pagamento integrado (fase comercial — fora do MVP técnico)

---

## 4. PRECI Network (Épico 18)

- [ ] `PRECI_NETWORK_API_KEYS` em `.env.production`
- [ ] Teste API intent: `GET /api/preci-network/v1/intent?mercadoId=...`
- [ ] Contrato LGPD com cliente CPG externo
- [ ] Rate limit / auditoria de consumo (evolução pós-MVP)

---

## 5. QA final pré-lançamento (18/06/2026 — piloto)

**Gestor piloto:** `ricardo.almeida@precivox-seed.com` / `senha123` → Empório Select Premium

### Cliente (`cliente@precivox.com`)
- [x] Home — cards economia, listas, scan
- [x] Busca — 27 mercados, comparar ofertas
- [x] Scan + EL — UI carrega (OCR + match catálogo)
- [ ] Push cesta (48–72h) — requer opt-in VAPID
- [x] Perfil PRECI — `/cliente/perfil` (fix chunk recovery + loading cliente, 30/06/2026)

### Cliente AI-Native (piloto — flag on só via cookie/staging)
Ver checklist detalhado: [`QA_AI_NATIVE_PILOTO.md`](./QA_AI_NATIVE_PILOTO.md)

- [x] Código em produção (28/07/2026) com `NEXT_PUBLIC_AI_NATIVE_SHELL=false`
- [ ] QA manual com cookie `AI_NATIVE_SHELL=1` (nav Casa/Compra/Scanner/Mais)
- [ ] Hub texto / voz / foto → superfície correta
- [x] Flag off: nav legada é o default em produção
- [ ] Funil eventos: `casa_aberta` → `compra_rascunho_montado` → `compra_confirmada`
- [x] **Não** ligar flag env em produção até 1 ciclo estável

### Gestor (Empório Select)
- [x] Upload + sync + saúde catálogo (card visível; catálogo stale)
- [x] SLA Tier — contrato aceito (Tier 3 no piloto premium)
- [x] Painel monetização SaaS — Plano Pro, promo direcionada, CTA Enterprise
- [x] GROOC com fontes visíveis — resumo semana + dashboard IA

---

## 6. Deploy

```bash
npm run deploy:sync   # build /root → rsync → PM2 restart
```

---

*Atualizado 28/07/2026 — inclui QA AI-Native; revisar após go-live regional.*
