import {
  analisarSinaisEl,
  ajustarPrioridadeEl,
  calcularRefinamentoEl,
} from '@/lib/el-refinamento-core';
import { EL_PREFERENCIAS_PADRAO, preferenciasParaElConfig } from '@/lib/el-config-preferencias';
import type { UserEvent } from '@/lib/ai/types';

function evEl(acao: string, recomendacao: string, economiaLiquida: number): UserEvent {
  return {
    id: '1',
    userId: 'u1',
    mercadoId: 'm1',
    type: 'el_sugestao_resposta',
    timestamp: new Date(),
    metadata: { acao, recomendacao, economiaLiquida },
  };
}

describe('el-refinamento', () => {
  it('ajustarPrioridadeEl move em direção comodidade', () => {
    expect(ajustarPrioridadeEl('equilibrio', 'mais_comodidade')).toBe('comodidade');
    expect(ajustarPrioridadeEl('economizar', 'mais_economia')).toBe('economizar');
  });

  it('analisarSinaisEl conta ignoras de vale ir', () => {
    const eventos = [
      ...Array.from({ length: 6 }, () => evEl('ignora', 'ir', 12)),
      evEl('visualizada', 'ir', 12),
    ];
    const s = analisarSinaisEl(eventos);
    expect(s.ignoraValeIr).toBe(6);
    expect(s.total).toBe(7);
  });

  it('calcularRefinamentoEl sugere mais comodidade após muitos ignoras', () => {
    const cfg = preferenciasParaElConfig(EL_PREFERENCIAS_PADRAO);
    const eventos = [
      ...Array.from({ length: 8 }, () => evEl('visualizada', 'ir', 10)),
      ...Array.from({ length: 6 }, () => evEl('ignora', 'ir', 15)),
    ];
    const res = calcularRefinamentoEl(EL_PREFERENCIAS_PADRAO, cfg, eventos);
    expect(res?.preferencias.prioridade).toBe('comodidade');
    expect(res?.mensagem).toContain('mercado atual');
  });

  it('calcularRefinamentoEl retorna null com poucos eventos', () => {
    const cfg = preferenciasParaElConfig(EL_PREFERENCIAS_PADRAO);
    expect(calcularRefinamentoEl(EL_PREFERENCIAS_PADRAO, cfg, [evEl('ignora', 'ir', 10)])).toBeNull();
  });
});
