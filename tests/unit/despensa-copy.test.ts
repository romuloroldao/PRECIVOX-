/**
 * Copy preditiva da despensa — comportamento externo (Fase 3).
 */

import {
  copyDespensaPreditiva,
  deveSugerirIncluirNaCompra,
} from '@/lib/despensa-copy';

describe('copyDespensaPreditiva', () => {
  it('diz que provavelmente acabou quando status acabando', () => {
    const r = copyDespensaPreditiva({
      status: 'acabando',
      diasRestantes: 0,
      cicloDias: 14,
      nome: 'Leite',
    });
    expect(r.primaria).toBe('Provavelmente acabou.');
    expect(r.urgencia).toBe('alta');
    expect(deveSugerirIncluirNaCompra(r.urgencia)).toBe(true);
  });

  it('estima duração em 1–3 dias', () => {
    const r = copyDespensaPreditiva({
      status: 'atencao',
      diasRestantes: 3,
      cicloDias: 14,
      nome: 'Arroz',
    });
    expect(r.primaria).toBe('Deve durar mais ~3 dias.');
    expect(r.urgencia).toBe('media');
  });

  it('sugere compra amanhã com intent alto e 1 dia restante', () => {
    const r = copyDespensaPreditiva({
      status: 'atencao',
      diasRestantes: 1,
      cicloDias: 7,
      nome: 'Pão',
      intentScore: 70,
    });
    expect(r.primaria).toBe('Normalmente você compraria isso amanhã.');
    expect(r.urgencia).toBe('alta');
  });

  it('marca em dia quando ok', () => {
    const r = copyDespensaPreditiva({
      status: 'ok',
      diasRestantes: 10,
      cicloDias: 14,
      nome: 'Café',
    });
    expect(r.primaria).toBe('Em dia.');
    expect(r.urgencia).toBe('baixa');
    expect(deveSugerirIncluirNaCompra(r.urgencia)).toBe(false);
  });
});
