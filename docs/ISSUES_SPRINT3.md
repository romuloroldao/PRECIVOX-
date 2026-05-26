# Issues — Sprint 3 (implementado)

Branch: `feature/sprint-2-comportamento-crowd`

| ID | Título | Status |
|----|--------|--------|
| PREC-301 | Cesta provável + notificação browser | ✅ |
| PREC-302 | Dia de mercado inferido (horários pico) | ✅ |
| PREC-303 | Streak economia (`/api/cliente/economia-streak`) | ✅ |
| PREC-304 | Card share economia | ✅ |
| PREC-305 | Relatório semanal (`/api/cliente/relatorio-semana`) | ✅ |
| PREC-306 | Radar demanda gestor | ✅ |
| PREC-307 | Inflação da cesta (home) | ✅ |

## APIs

- `GET /api/cliente/cesta-provavel?mercadoId=`
- `GET /api/cliente/inflacao-cesta?mercadoId=`
- `GET /api/cliente/relatorio-semana?mercadoId=`
- `GET|POST /api/cliente/economia-streak`
- `GET /api/gestor/radar-demanda`

## UI

- Home cliente: cesta, inflação, streak, share, permissão notificações
- Perfil: relatório semanal
- Gestor home + IA: radar demanda
