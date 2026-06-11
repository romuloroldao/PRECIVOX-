import { chaveLogicaProduto } from '@/lib/oferta-agregada/chave-produto';

describe('Oferta agregada — chave lógica', () => {
  it('prioriza EAN para agregar entre mercados', () => {
    const a = chaveLogicaProduto({
      id: '1',
      nome: 'Arroz Tipo 1',
      codigoBarras: '7891234567890',
      marca: 'Tio João',
      categoria: 'Mercearia',
    });
    const b = chaveLogicaProduto({
      id: '2',
      nome: 'Arroz 5kg outro nome',
      codigoBarras: '7891234567890',
      marca: 'Outra',
      categoria: 'Mercearia',
    });
    expect(a).toBe(b);
    expect(a.startsWith('ean:')).toBe(true);
  });

  it('usa chaveInsight quando não há EAN', () => {
    const k = chaveLogicaProduto({
      id: '1',
      nome: 'Leite integral',
      chaveInsight: 'leite|integral|marca-x',
    });
    expect(k).toBe('insight:leite|integral|marca-x');
  });
});
