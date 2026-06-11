/**
 * Testes unitários — Épico 12 ML leve
 */

import type { UserEvent } from '@/lib/ai/types';
import { calcularChurnRisk } from '@/lib/ml-leve/churn-scorer';
import { calcularElasticidadeUsuario } from '@/lib/ml-leve/elasticidade-usuario';
import {
  buildCoocorrenciaFromCestas,
  extrairCestasDeEventos,
  sugerirPorCoocorrencia,
} from '@/lib/ml-leve/coocorrencia';
import { gravarMlLeveSnapshot, lerMlLeveSnapshot } from '@/lib/ml-leve/snapshot-store';

function ev(partial: Partial<UserEvent> & Pick<UserEvent, 'type'>): UserEvent {
  return {
    id: partial.id ?? 'e1',
    userId: partial.userId ?? 'u1',
    mercadoId: partial.mercadoId ?? 'm1',
    timestamp: partial.timestamp ?? new Date(),
    metadata: partial.metadata ?? {},
    type: partial.type,
  };
}

describe('ML leve — churn', () => {
  it('marca inativo sem eventos', () => {
    const r = calcularChurnRisk([]);
    expect(r.nivel).toBe('alto');
    expect(r.score).toBeGreaterThanOrEqual(65);
  });

  it('reduz risco com atividade recente', () => {
    const ref = new Date('2026-06-01T12:00:00Z');
    const eventos = Array.from({ length: 6 }, (_, i) =>
      ev({
        type: 'produto_adicionado_lista',
        timestamp: new Date(ref.getTime() - i * 3600000),
        metadata: { produtoId: `p${i}` },
      })
    );
    const r = calcularChurnRisk(eventos, ref);
    expect(r.nivel).toBe('baixo');
  });
});

describe('ML leve — elasticidade', () => {
  it('detecta usuário sensível a promoções', () => {
    const eventos = [
      ev({ type: 'promocao_visualizada' }),
      ev({ type: 'promocao_visualizada' }),
      ev({ type: 'produto_buscado', metadata: { ordenacao: 'preco_asc' } }),
      ev({
        type: 'produto_substituicao_aceita',
        metadata: { motivo: 'mais_barato', economiaLiquida: 5 },
      }),
    ];
    const r = calcularElasticidadeUsuario(eventos);
    expect(r.rotulo).toBe('sensivel');
    expect(r.coeficiente).toBeLessThanOrEqual(-1.7);
  });
});

describe('ML leve — co-ocorrência', () => {
  it('sugere produtos que aparecem juntos na cesta', () => {
    const map = buildCoocorrenciaFromCestas([
      ['a', 'b', 'c'],
      ['a', 'b'],
    ]);
    const sugs = sugerirPorCoocorrencia(map, new Set(['a']), 3);
    expect(sugs[0]?.produtoId).toBe('b');
  });

  it('extrai cestas de eventos de lista', () => {
    const base = new Date('2026-06-01T10:00:00Z').getTime();
    const eventos = [
      ev({ type: 'produto_adicionado_lista', timestamp: new Date(base), metadata: { produtoId: 'x' } }),
      ev({
        type: 'produto_adicionado_lista',
        timestamp: new Date(base + 60000),
        metadata: { produtoId: 'y' },
      }),
    ];
    const cestas = extrairCestasDeEventos(eventos);
    expect(cestas).toHaveLength(1);
    expect(cestas[0]).toEqual(['x', 'y']);
  });
});

describe('ML leve — snapshot por mercado', () => {
  it('persiste e lê múltiplos mercados', () => {
    const snapA = {
      atualizadoEm: '2026-06-01T00:00:00Z',
      mercadoId: 'm-a',
      churn: { score: 10, nivel: 'baixo' as const, diasSemAtividade: 1, explicacao: 'ok' },
      elasticidade: {
        coeficiente: -1.2,
        rotulo: 'moderado' as const,
        explicacao: 'mod',
      },
    };
    const snapB = { ...snapA, mercadoId: 'm-b', churn: { ...snapA.churn, score: 80, nivel: 'alto' as const } };

    let perfil = gravarMlLeveSnapshot({}, snapA);
    perfil = gravarMlLeveSnapshot(perfil, snapB);

    expect(lerMlLeveSnapshot(perfil, 'm-a')?.churn.score).toBe(10);
    expect(lerMlLeveSnapshot(perfil, 'm-b')?.churn.nivel).toBe('alto');
  });

  it('migra snapshot legado mlLeve', () => {
    const legado = {
      mlLeve: {
        atualizadoEm: '2026-06-01T00:00:00Z',
        mercadoId: 'm-leg',
        churn: { score: 40, nivel: 'medio' as const, diasSemAtividade: 5, explicacao: 'leg' },
        elasticidade: {
          coeficiente: -1.5,
          rotulo: 'moderado' as const,
          explicacao: 'leg',
        },
      },
    };
    expect(lerMlLeveSnapshot(legado, 'm-leg')?.churn.nivel).toBe('medio');
  });
});
