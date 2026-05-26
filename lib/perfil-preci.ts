/**
 * Perfil PRECI — 5 eixos comportamentais (0–100)
 * @see docs/ROADMAP_PRECIVOX.md
 */

import type { UserEvent } from '@/lib/ai/types';

export type EixoPreci =
  | 'planejador'
  | 'marca'
  | 'conveniencia'
  | 'explorador'
  | 'urgente';

export type PerfilPreciScores = Record<EixoPreci, number>;

export type PerfilPreciAjustes = Partial<PerfilPreciScores>;

export interface PerfilPreciResultado {
  scores: PerfilPreciScores;
  scoresEfetivos: PerfilPreciScores;
  ajustesUsuario: PerfilPreciAjustes | null;
  explicacoes: Record<EixoPreci, string>;
  confianca: number;
}

const EIXOS: EixoPreci[] = ['planejador', 'marca', 'conveniencia', 'explorador', 'urgente'];

export function calcularPerfilPreciDeEventos(eventos: UserEvent[]): Omit<PerfilPreciResultado, 'ajustesUsuario' | 'scoresEfetivos'> {
  const buscas = eventos.filter((e) => e.type === 'produto_buscado').length;
  const adds = eventos.filter((e) => e.type === 'produto_adicionado_lista').length;
  const subsAceitas = eventos.filter((e) => e.type === 'produto_substituicao_aceita').length;
  const subsOfertas = subsAceitas + 1;
  const rotasAceitas = eventos.filter(
    (e) => e.type === 'rota_consolidacao_lista' && (e.metadata as { acao?: string }).acao === 'aceita'
  ).length;
  const comprasConfirmadas = eventos.filter((e) =>
    ['compra_confirmada', 'compra_realizada'].includes(e.type)
  ).length;
  const comprasParciais = eventos.filter((e) => e.type === 'compra_parcial').length;

  const addsSemBusca = eventos.filter((e) => {
    if (e.type !== 'produto_adicionado_lista') return false;
    const pid = (e.metadata as { produtoId?: string }).produtoId;
    if (!pid) return true;
    return !eventos.some(
      (b) =>
        b.type === 'produto_buscado' &&
        new Date(b.timestamp) <= new Date(e.timestamp) &&
        (b.metadata as { searchQuery?: string }).searchQuery
    );
  }).length;

  const planejador = adds > 0 ? Math.min(100, Math.round((1 - addsSemBusca / adds) * 100)) : 50;
  const marca = Math.min(100, Math.round((subsAceitas / subsOfertas) * 100));
  const conveniencia = Math.min(100, Math.max(0, 50 + rotasAceitas * 15 - (rotasAceitas === 0 && adds > 3 ? 0 : 0)));
  const explorador = Math.min(100, Math.max(20, buscas * 8 + (rotasAceitas > 0 ? 20 : 0)));
  const urgente = comprasParciais > 0 ? 70 : comprasConfirmadas > 2 ? 30 : 45;

  const scores: PerfilPreciScores = {
    planejador,
    marca,
    conveniencia: Math.min(100, 40 + rotasAceitas * 20),
    explorador,
    urgente,
  };

  const explicacoes: Record<EixoPreci, string> = {
    planejador:
      planejador >= 60
        ? 'Você costuma buscar antes de adicionar à lista.'
        : 'Você adiciona itens com frequência sem busca prévia.',
    marca:
      marca >= 60
        ? 'Você aceita trocas de marca quando faz sentido.'
        : 'Você prefere manter as marcas que escolhe.',
    conveniencia:
      scores.conveniencia >= 60
        ? 'Você valoriza menos idas e rotas consolidadas.'
        : 'Você prioriza preço mesmo com mais de um mercado.',
    explorador:
      explorador >= 60
        ? 'Você explora bastante o catálogo e alternativas.'
        : 'Seu padrão é mais focado em itens habituais.',
    urgente:
      urgente >= 55
        ? 'Suas compras parecem mais reativas e frequentes.'
        : 'Você compra de forma mais planejada.',
  };

  return {
    scores,
    explicacoes,
    confianca: Math.min(100, eventos.length * 4),
  };
}

export function mesclarComAjustes(
  base: PerfilPreciScores,
  ajustes: PerfilPreciAjustes | null
): PerfilPreciScores {
  const out = { ...base };
  if (!ajustes) return out;
  for (const e of EIXOS) {
    if (ajustes[e] != null) {
      out[e] = Math.min(100, Math.max(0, Math.round(ajustes[e]!)));
    }
  }
  return out;
}

export const EIXO_LABELS: Record<EixoPreci, string> = {
  planejador: 'Planejador ↔ Impulsivo',
  marca: 'Marca ↔ Preço',
  conveniencia: 'Conveniência ↔ Economia',
  explorador: 'Explorador ↔ Habitual',
  urgente: 'Urgente ↔ Estratega',
};
