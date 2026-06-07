import {
  ordenarPorRankingHibrido,
  scoreRankingHibrido,
} from '@/lib/ranking-busca-hibrido';

describe('ranking-busca-hibrido', () => {
  it('prefere preço menor com confiança similar', () => {
    const barato = { precoEfetivo: 5, truth: { confianca: 70 }, disponivel: true };
    const caro = { precoEfetivo: 15, truth: { confianca: 72 }, disponivel: true };
    expect(scoreRankingHibrido(barato, null)).toBeGreaterThan(scoreRankingHibrido(caro, null));
  });

  it('boost planejador aumenta peso da confiança', () => {
    const item = { precoEfetivo: 10, truth: { confianca: 90 }, disponivel: true };
    const scores = {
      planejador: 90,
      marca: 50,
      conveniencia: 50,
      explorador: 50,
      urgente: 50,
    };
    expect(scoreRankingHibrido(item, scores)).toBeGreaterThan(scoreRankingHibrido(item, null));
  });

  it('ordena lista por score decrescente', () => {
    const itens = ordenarPorRankingHibrido(
      [
        { precoEfetivo: 20, truth: { confianca: 60 } },
        { precoEfetivo: 8, truth: { confianca: 80 } },
      ],
      null
    );
    expect(itens[0]?.precoEfetivo).toBe(8);
  });
});
