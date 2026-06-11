import {
  PARCEIRO_ANCORA_PADRAO,
  ANCORA_META_MAX,
  ANCORA_META_MIN,
  TIPO_ANCORA_LABEL,
  type ParceiroAncoraTipo,
} from '@/lib/parceiros-ancora/types';
import { parseParceiroAncoraConfig } from '@/lib/parceiros-ancora/config';

describe('Parceiros âncora — config', () => {
  it('parseia defaults quando JSON ausente', () => {
    const c = parseParceiroAncoraConfig(null);
    expect(c).toEqual(PARCEIRO_ANCORA_PADRAO);
    expect(c.ativo).toBe(false);
    expect(c.regiaoModo).toBe('cep5');
  });

  it('normaliza tipo e prioridade', () => {
    const c = parseParceiroAncoraConfig({
      ativo: true,
      tipo: 'atacado',
      prioridade: 99,
      regiaoModo: 'cidade',
    });
    expect(c.tipo).toBe('atacado');
    expect(c.prioridade).toBe(5);
    expect(c.regiaoModo).toBe('cidade');
  });

  it('rotula tipos de âncora', () => {
    const tipos: ParceiroAncoraTipo[] = ['rede', 'atacado', 'atacarejo'];
    for (const t of tipos) {
      expect(TIPO_ANCORA_LABEL[t]).toBeTruthy();
    }
  });

  it('meta regional 3–5 parceiros', () => {
    expect(ANCORA_META_MIN).toBe(3);
    expect(ANCORA_META_MAX).toBe(5);
  });
});
