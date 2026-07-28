import {
  preferenciasParaElConfig,
  inferirPreferenciasDeConfig,
  exemploValeDeslocamento,
  EL_PREFERENCIAS_PADRAO,
  resolverElPreferenciasFromPerfil,
  resolverElConfigPatchInput,
  montarElConfigPersistido,
  validarElPreferencias,
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

  it('resolver legado infere preferências dos números', () => {
    const pref = resolverElPreferenciasFromPerfil({
      elConfig: { valorHoraReais: 14, custoKmReais: 0.35 },
    });
    expect(pref.prioridade).toBe('economizar');
    expect(pref.transporte).toBe('a_pe');
  });

  it('resolver usa preferencias salvas quando existem', () => {
    const pref = resolverElPreferenciasFromPerfil({
      elConfig: {
        valorHoraReais: 24,
        custoKmReais: 0.9,
        preferencias: { prioridade: 'comodidade', transporte: 'app', pressa: 'corrido' },
      },
    });
    expect(pref.prioridade).toBe('comodidade');
    expect(pref.transporte).toBe('app');
  });

  it('PATCH com preferencias gera numeros', () => {
    const res = resolverElConfigPatchInput({
      preferencias: { prioridade: 'economizar', transporte: 'onibus', pressa: 'tranquilo' },
    });
    expect(res?.numeros.valorHoraReais).toBe(10);
    expect(res?.numeros.custoKmReais).toBe(0.55);
  });

  it('PATCH legado só elConfig infere preferencias', () => {
    const res = resolverElConfigPatchInput({ elConfig: { valorHoraReais: 42, custoKmReais: 1.35 } });
    expect(res?.preferencias.prioridade).toBe('comodidade');
    expect(res?.preferencias.transporte).toBe('app');
  });

  it('montarElConfigPersistido inclui preferencias', () => {
    const cfg = preferenciasParaElConfig(EL_PREFERENCIAS_PADRAO);
    const persisted = montarElConfigPersistido(EL_PREFERENCIAS_PADRAO, cfg, {
      atualizadoEm: '2026-01-01T00:00:00Z',
      onboardingCompleto: true,
    });
    expect(persisted.preferencias.prioridade).toBe('equilibrio');
    expect(persisted.atualizadoEm).toBe('2026-01-01T00:00:00Z');
    expect(persisted.onboardingCompleto).toBe(true);
  });

  it('validarElPreferencias rejeita ids inválidos', () => {
    expect(
      validarElPreferencias({ prioridade: 'x' as 'economizar', transporte: 'carro', pressa: 'normal' })
    ).toBeNull();
  });
});
