import {
  elOnboardingCompleto,
  listaTemElVisivel,
  produtoExibeEl,
} from '@/lib/el-onboarding';

describe('el-onboarding', () => {
  it('produtoExibeEl detecta recomendacao ir', () => {
    expect(
      produtoExibeEl({
        melhorAlternativa: {
          economiaLiquida: { recomendacao: 'ir', economiaLiquida: 12 },
        },
      })
    ).toBe(true);
  });

  it('produtoExibeEl ignora sem alternativa', () => {
    expect(produtoExibeEl({})).toBe(false);
  });

  it('listaTemElVisivel', () => {
    expect(
      listaTemElVisivel([
        { melhorAlternativa: null },
        {
          melhorAlternativa: {
            economiaLiquida: { recomendacao: 'ficar', economiaLiquida: -2 },
          },
        },
      ])
    ).toBe(true);
  });

  it('elOnboardingCompleto com preferencias salvas', () => {
    expect(
      elOnboardingCompleto({
        elConfig: {
          preferencias: { prioridade: 'equilibrio', transporte: 'carro', pressa: 'normal' },
          valorHoraReais: 24,
          custoKmReais: 0.9,
        },
      })
    ).toBe(true);
  });

  it('elOnboardingCompleto legado com numeros', () => {
    expect(
      elOnboardingCompleto({
        elConfig: { valorHoraReais: 30, custoKmReais: 1 },
      })
    ).toBe(true);
  });

  it('elOnboardingCompleto pendente sem config', () => {
    expect(elOnboardingCompleto({})).toBe(false);
  });

  it('elOnboardingCompleto com flag explicita', () => {
    expect(
      elOnboardingCompleto({
        elConfig: { onboardingCompleto: true, valorHoraReais: 24, custoKmReais: 0.9 },
      })
    ).toBe(true);
  });
});
