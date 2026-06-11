import { parseMonetizacao } from '@/lib/monetizacao/config';
import {
  SAAS_TIER_FEATURES,
  SAAS_TIER_LABEL,
  MONETIZACAO_PADRAO,
} from '@/lib/monetizacao/types';
import { segmentoLabel } from '@/lib/monetizacao/promo-direcionada';

describe('Monetização — tipos e config', () => {
  it('parseia monetizacao vazia', () => {
    expect(parseMonetizacao(null)).toEqual(MONETIZACAO_PADRAO);
  });

  it('preserva promos no parse', () => {
    const m = parseMonetizacao({
      promosDirecionadas: [
        {
          id: 'p1',
          ativo: true,
          titulo: 'Teste',
          descontoPct: 10,
          segmento: 'intent_alta',
          validoAte: '2026-12-31',
          criadoEm: '2026-06-01',
        },
      ],
    });
    expect(m.promosDirecionadas).toHaveLength(1);
    expect(m.promosDirecionadas[0].titulo).toBe('Teste');
  });

  it('tiers SaaS têm features ordenadas', () => {
    expect(SAAS_TIER_FEATURES.essencial.length).toBeLessThan(
      SAAS_TIER_FEATURES.pro.length
    );
    expect(SAAS_TIER_FEATURES.pro.length).toBeLessThan(
      SAAS_TIER_FEATURES.enterprise.length
    );
    expect(SAAS_TIER_LABEL.enterprise).toBe('Enterprise');
  });

  it('rotula segmentos de promo', () => {
    expect(segmentoLabel('intent_alta')).toBe('Alta intenção');
    expect(segmentoLabel('churn_risco')).toBe('Risco de churn');
  });
});
