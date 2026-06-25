import {
  preferenciasParaElConfig,
  inferirPreferenciasDeConfig,
  exemploValeDeslocamento,
  EL_PREFERENCIAS_PADRAO,
} from '@/lib/el-config-preferencias';

describe('el-config-preferencias', () => {
  it('economizar gera valor hora menor que comodidade', () => {
    const eco = preferenciasParaElConfig({
      ...EL_PREFERENCIAS_PADRAO,
      prioridade: 'economizar',
    });
    const com = preferenciasParaElConfig({
      ...EL_PREFERENCIAS_PADRAO,
      prioridade: 'comodidade',
    });
    expect(eco.valorHoraReais).toBeLessThan(com.valorHoraReais);
  });

  it('app tem custo km maior que a pé', () => {
    const pe = preferenciasParaElConfig({
      ...EL_PREFERENCIAS_PADRAO,
      transporte: 'a_pe',
    });
    const app = preferenciasParaElConfig({
      ...EL_PREFERENCIAS_PADRAO,
      transporte: 'app',
    });
    expect(app.custoKmReais).toBeGreaterThan(pe.custoKmReais);
  });

  it('inferência reversa aproxima buckets', () => {
    const cfg = preferenciasParaElConfig(EL_PREFERENCIAS_PADRAO);
    const inf = inferirPreferenciasDeConfig(cfg);
    expect(inf.prioridade).toBe('equilibrio');
    expect(inf.transporte).toBe('carro');
  });

  it('exemplo retorna texto', () => {
    const cfg = preferenciasParaElConfig(EL_PREFERENCIAS_PADRAO);
    const ex = exemploValeDeslocamento(cfg);
    expect(ex.texto.length).toBeGreaterThan(10);
  });
});
