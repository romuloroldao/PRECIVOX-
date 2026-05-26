/**
 * Economia Líquida™ — cálculo explicável (spec: docs/SPEC_ECONOMIA_LIQUIDA.md)
 */

export const EL_DEFAULTS = {
  valorHoraReais: 20,
  custoKmReais: 0.8,
  velocidadeKmh: 25,
  /** Economia líquida mínima para recomendar deslocamento */
  minimoRecomendarReais: 5,
} as const;

export type RecomendacaoEL = 'ficar' | 'ir' | 'indeterminado';

export interface ResultadoEconomiaLiquida {
  economiaBruta: number;
  custoDeslocamento: number;
  custoTempo: number;
  economiaLiquida: number;
  distanciaKm: number | null;
  tempoMinutos: number | null;
  recomendacao: RecomendacaoEL;
  explicacao: string;
  detalhes: {
    precoOrigem: number;
    precoDestino: number;
    valorHoraReais: number;
    custoKmReais: number;
    velocidadeKmh: number;
  };
}

export interface CalcularELInput {
  precoOrigem: number;
  precoDestino: number;
  distanciaKm?: number | null;
  valorHoraReais?: number;
  custoKmReais?: number;
  velocidadeKmh?: number;
  minimoRecomendarReais?: number;
}

/** Distância em km (Haversine) entre dois pontos WGS84 */
export function distanciaKmEntreCoords(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildExplicacao(
  r: Omit<ResultadoEconomiaLiquida, 'explicacao' | 'detalhes'>,
  minimo: number
): string {
  if (r.recomendacao === 'indeterminado') {
    return 'Sem distância confiável, não é possível calcular se vale o deslocamento. Compare os preços na região.';
  }
  if (r.recomendacao === 'ir') {
    return `Vale ir: economia líquida de R$ ${r.economiaLiquida.toFixed(2)} após deslocamento (~${r.tempoMinutos} min).`;
  }
  if (r.economiaLiquida < 0) {
    return `Não vale sair: a viagem custaria mais do que a economia no preço (líquido R$ ${r.economiaLiquida.toFixed(2)}).`;
  }
  return `Fique onde está: economia líquida abaixo de R$ ${minimo.toFixed(2)} (R$ ${r.economiaLiquida.toFixed(2)}).`;
}

/**
 * Calcula economia líquida para um item (ou cesta com preços agregados).
 */
export function calcularEconomiaLiquida(input: CalcularELInput): ResultadoEconomiaLiquida {
  const valorHora = input.valorHoraReais ?? EL_DEFAULTS.valorHoraReais;
  const custoKm = input.custoKmReais ?? EL_DEFAULTS.custoKmReais;
  const velocidade = input.velocidadeKmh ?? EL_DEFAULTS.velocidadeKmh;
  const minimo = input.minimoRecomendarReais ?? EL_DEFAULTS.minimoRecomendarReais;

  const economiaBruta = round2(input.precoOrigem - input.precoDestino);
  const distanciaKm =
    input.distanciaKm != null && !Number.isNaN(input.distanciaKm) ? input.distanciaKm : null;

  let custoDeslocamento = 0;
  let custoTempo = 0;
  let tempoMinutos: number | null = null;

  if (distanciaKm != null && distanciaKm >= 0) {
    custoDeslocamento = round2(2 * distanciaKm * custoKm);
    tempoMinutos = round2((distanciaKm / velocidade) * 60);
    custoTempo = round2((tempoMinutos / 60) * valorHora);
  }

  const economiaLiquida =
    distanciaKm != null ? round2(economiaBruta - custoDeslocamento - custoTempo) : economiaBruta;

  let recomendacao: RecomendacaoEL;
  if (distanciaKm == null) {
    recomendacao = 'indeterminado';
  } else if (economiaLiquida >= minimo) {
    recomendacao = 'ir';
  } else {
    recomendacao = 'ficar';
  }

  const base = {
    economiaBruta,
    custoDeslocamento,
    custoTempo,
    economiaLiquida,
    distanciaKm,
    tempoMinutos,
    recomendacao,
    detalhes: {
      precoOrigem: input.precoOrigem,
      precoDestino: input.precoDestino,
      valorHoraReais: valorHora,
      custoKmReais: custoKm,
      velocidadeKmh: velocidade,
    },
  };

  return {
    ...base,
    explicacao: buildExplicacao(base, minimo),
  };
}

export interface ItemCestaEL {
  precoOrigem: number;
  precoDestino: number;
  quantidade?: number;
}

/** Soma economia bruta por itens e aplica um único custo de deslocamento */
export function calcularEconomiaLiquidaCesta(
  itens: ItemCestaEL[],
  opts: Omit<CalcularELInput, 'precoOrigem' | 'precoDestino'> = {}
): ResultadoEconomiaLiquida {
  const precoOrigem = itens.reduce(
    (acc, i) => acc + i.precoOrigem * (i.quantidade ?? 1),
    0
  );
  const precoDestino = itens.reduce(
    (acc, i) => acc + i.precoDestino * (i.quantidade ?? 1),
    0
  );
  return calcularEconomiaLiquida({
    precoOrigem: round2(precoOrigem),
    precoDestino: round2(precoDestino),
    ...opts,
  });
}
