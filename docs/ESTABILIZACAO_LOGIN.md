# ESTABILIZAÇÃO — LOGIN (PRODUÇÃO)

## Status Estrutural

O layout do `/login` foi revisado e validado estruturalmente.

### Estrutura confirmada

- `globals.css` importado no `app/layout.tsx`
- Nenhum ancestral com `h-full`, `min-h-screen` ou `absolute`
- Único `min-h-screen` está no container raiz do Login
- Layout 50/50 via flex (`lg:w-1/2`)
- Painel direito sem `h-full`, `inset-0` ou `100vh`
- SVG com:
  - `height: 200px` (inline)
  - `position: absolute`
  - `bottom: 0`
  - `preserveAspectRatio="none"`
- Container do SVG com `relative` + `overflow-hidden`

## Conclusão

O layout está estruturalmente correto e independente de altura percentual ou herança de viewport.

**Se houver distorção visual, a causa não é mais estrutural.**

## Possíveis causas remanescentes

- Build inconsistente do Next
- Cache antigo de `.next`
- CSS não carregando corretamente em produção
- Proxy servindo assets antigos

## Procedimento oficial de estabilização

Ordem obrigatória:

```bash
# 1. Aplicar migrations
npx prisma migrate deploy

# 2. Rebuild limpo do frontend
rm -rf .next
npm run build

# 3. Restart do processo
pm2 restart precivox-frontend
```

Depois:

- Hard refresh no navegador (`Ctrl + Shift + R`)
- DevTools → Network → verificar `_next/static/css/*.css`: status 200, tamanho coerente
- Testar breakpoints: Desktop (≥1440px), Tablet (~1024px), Mobile (< lg)

## Estado final esperado

Após migrations + rebuild limpo:

- Login estável
- CSS consistente
- Server Actions resolvidas
- Sem distorção de layout
- Sem CLS causado por SVG

## Observação arquitetural

O projeto encontra-se em fase de **consolidação de build e ambiente** (não mais correção estrutural de layout). Auth, Backend e IA já estabilizados. Banco + rebuild são os últimos pontos críticos.
