/**
 * Coleta de EL por preferências comportamentais (sem pedir R$/h ou R$/km).
 */

import { calcularEconomiaLiquida } from '@/lib/economia-liquida';
import {
  EL_CONFIG_LIMITS,
  elConfigEfetivo,
  labelFaixaValorHora,
  parseElConfigFromPerfil,
  validarElConfigInput,
  type ElConfigUsuario,
} from '@/lib/el-config-usuario';

export type ElPrioridadeDeslocamento = 'economizar' | 'equilibrio' | 'comodidade';
export type ElMeioTransporte = 'a_pe' | 'onibus' | 'carro' | 'app';
export type ElPressaCompra = 'tranquilo' | 'normal' | 'corrido';

export type ElPreferenciasUsuario = {
  prioridade: ElPrioridadeDeslocamento;
  transporte: ElMeioTransporte;
  pressa: ElPressaCompra;
};

export const EL_PRIORIDADE_OPCOES: {
  id: ElPrioridadeDeslocamento;
  titulo: string;
  descricao: string;
}[] = [
  {
    id: 'economizar',
    titulo: 'Economizo quando dá',
    descricao: 'Se o preço compensar, vou a outro mercado sem problema.',
  },
  {
    id: 'equilibrio',
    titulo: 'Depende do dia',
    descricao: 'Comparo preço e distância — nem sempre vale o desvio.',
  },
  {
    id: 'comodidade',
    titulo: 'Evito deslocamento',
    descricao: 'Só mudo de loja se a economia for bem grande.',
  },
];

export const EL_TRANSPORTE_OPCOES: {
  id: ElMeioTransporte;
  titulo: string;
  descricao: string;
}[] = [
  { id: 'a_pe', titulo: 'A pé ou bike', descricao: 'Mercado perto de casa, sem carro.' },
  { id: 'onibus', titulo: 'Ônibus / metrô', descricao: 'Costumo ir de transporte público.' },
  { id: 'carro', titulo: 'Carro próprio', descricao: 'Vou de carro ou moto própria.' },
  { id: 'app', titulo: 'App / táxi', descricao: 'Uber, 99 ou similar quando vou comprar.' },
];

export const EL_PRESSA_OPCOES: {
  id: ElPressaCompra;
  titulo: string;
  descricao: string;
}[] = [
  { id: 'tranquilo', titulo: 'Tenho tempo', descricao: 'Posso dar uma volta se valer a pena.' },
  { id: 'normal', titulo: 'Rotina normal', descricao: 'Uma ida rápida, sem pressa especial.' },
  { id: 'corrido', titulo: 'Estou com pressa', descricao: 'Quero resolver logo a lista.' },
];

const VALOR_HORA_BASE: Record<ElPrioridadeDeslocamento, number> = {
  economizar: 14,
  equilibrio: 24,
  comodidade: 42,
};

const CUSTO_KM_BASE: Record<ElMeioTransporte, number> = {
  a_pe: 0.35,
  onibus: 0.55,
  carro: 0.9,
  app: 1.35,
};

const AJUSTE_PRESSA: Record<ElPressaCompra, number> = {
  tranquilo: -4,
  normal: 0,
  corrido: 10,
};

export const EL_PREFERENCIAS_PADRAO: ElPreferenciasUsuario = {
  prioridade: 'equilibrio',
  transporte: 'carro',
  pressa: 'normal',
};

export function preferenciasParaElConfig(pref: ElPreferenciasUsuario): ElConfigUsuario {
  const valorHoraReais =
    VALOR_HORA_BASE[pref.prioridade] + AJUSTE_PRESSA[pref.pressa];
  return elConfigEfetivo({
    valorHoraReais,
    custoKmReais: CUSTO_KM_BASE[pref.transporte],
  });
}

/** Infere preferências a partir dos números salvos (usuários legados). */
export function inferirPreferenciasDeConfig(
  cfg: ElConfigUsuario,
  hint?: { scoreConveniencia?: number }
): ElPreferenciasUsuario {
  const v = cfg.valorHoraReais;
  let prioridade: ElPrioridadeDeslocamento = 'equilibrio';
  if (v <= 18) prioridade = 'economizar';
  else if (v >= 34) prioridade = 'comodidade';

  if (hint?.scoreConveniencia != null) {
    if (hint.scoreConveniencia >= 65) prioridade = 'economizar';
    else if (hint.scoreConveniencia <= 35) prioridade = 'comodidade';
  }

  const k = cfg.custoKmReais;
  let transporte: ElMeioTransporte = 'carro';
  if (k <= 0.45) transporte = 'a_pe';
  else if (k <= 0.65) transporte = 'onibus';
  else if (k >= 1.1) transporte = 'app';

  let pressa: ElPressaCompra = 'normal';
  if (v <= 16) pressa = 'tranquilo';
  else if (v >= 32) pressa = 'corrido';

  return { prioridade, transporte, pressa };
}

export function parseElPreferenciasFromPerfil(perfilPreci: unknown): ElPreferenciasUsuario | null {
  if (!perfilPreci || typeof perfilPreci !== 'object') return null;
  const raw = (perfilPreci as { elConfig?: { preferencias?: ElPreferenciasUsuario } }).elConfig
    ?.preferencias;
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.prioridade || !raw.transporte || !raw.pressa) return null;
  return {
    prioridade: raw.prioridade,
    transporte: raw.transporte,
    pressa: raw.pressa,
  };
}

export function validarElPreferencias(
  input: Partial<ElPreferenciasUsuario> | null | undefined
): ElPreferenciasUsuario | null {
  if (!input?.prioridade || !input.transporte || !input.pressa) return null;
  const ids = {
    prioridade: EL_PRIORIDADE_OPCOES.some((o) => o.id === input.prioridade),
    transporte: EL_TRANSPORTE_OPCOES.some((o) => o.id === input.transporte),
    pressa: EL_PRESSA_OPCOES.some((o) => o.id === input.pressa),
  };
  if (!ids.prioridade || !ids.transporte || !ids.pressa) return null;
  return input as ElPreferenciasUsuario;
}

export type ElConfigPersistido = ElConfigUsuario & {
  preferencias: ElPreferenciasUsuario;
  atualizadoEm: string;
  onboardingCompleto?: boolean;
};

/** Preferências explícitas ou inferidas de números legados / Perfil PRECI. */
export function resolverElPreferenciasFromPerfil(
  perfilPreci: unknown,
  hint?: { scoreConveniencia?: number }
): ElPreferenciasUsuario {
  const salvas = parseElPreferenciasFromPerfil(perfilPreci);
  if (salvas) return salvas;

  const cfg = parseElConfigFromPerfil(perfilPreci);
  if (cfg) return inferirPreferenciasDeConfig(cfg, hint);

  if (hint?.scoreConveniencia != null) {
    return inferirPreferenciasDeConfig(preferenciasParaElConfig(EL_PREFERENCIAS_PADRAO), hint);
  }
  return EL_PREFERENCIAS_PADRAO;
}

/** Monta payload JSON para `perfilPreci.elConfig`. */
export function montarElConfigPersistido(
  preferencias: ElPreferenciasUsuario,
  numeros: ElConfigUsuario,
  opts?: { atualizadoEm?: string; onboardingCompleto?: boolean }
): ElConfigPersistido {
  const payload: ElConfigPersistido = {
    ...elConfigEfetivo(numeros),
    preferencias,
    atualizadoEm: opts?.atualizadoEm ?? new Date().toISOString(),
  };
  if (opts?.onboardingCompleto) payload.onboardingCompleto = true;
  return payload;
}

/** Resolve preferências + números a partir do body do PATCH. */
export function resolverElConfigPatchInput(
  input: {
    preferencias?: Partial<ElPreferenciasUsuario>;
    elConfig?: Partial<ElConfigUsuario>;
  },
  hint?: { scoreConveniencia?: number }
): { preferencias: ElPreferenciasUsuario; numeros: ElConfigUsuario } | null {
  const prefValidadas = validarElPreferencias(input.preferencias);
  const numerosValidados = validarElConfigInput(input.elConfig);

  if (prefValidadas && numerosValidados) {
    return { preferencias: prefValidadas, numeros: numerosValidados };
  }
  if (prefValidadas) {
    return { preferencias: prefValidadas, numeros: preferenciasParaElConfig(prefValidadas) };
  }
  if (numerosValidados) {
    return {
      preferencias: inferirPreferenciasDeConfig(numerosValidados, hint),
      numeros: numerosValidados,
    };
  }
  return null;
}

/** Texto curto para o usuário entender o efeito das escolhas. */
export function resumoElPreferencias(pref: ElPreferenciasUsuario, cfg: ElConfigUsuario): string {
  return `${labelFaixaValorHora(cfg.valorHoraReais)} · deslocamento estimado como ${EL_TRANSPORTE_OPCOES.find((o) => o.id === pref.transporte)?.titulo ?? 'carro'}.`;
}

/** Exemplo fixo: economia de R$15 a 3 km (ida e volta no modelo EL). */
export function exemploValeDeslocamento(cfg: ElConfigUsuario): {
  vale: boolean;
  texto: string;
} {
  const r = calcularEconomiaLiquida({
    precoOrigem: 100,
    precoDestino: 85,
    distanciaKm: 3,
    valorHoraReais: cfg.valorHoraReais,
    custoKmReais: cfg.custoKmReais,
  });
  if (r.recomendacao === 'ir') {
    return {
      vale: true,
      texto: `Exemplo: economizar R$ 15 indo a ~3 km tende a valer a pena (líquido ~R$ ${r.economiaLiquida.toFixed(0)}).`,
    };
  }
  return {
    vale: false,
    texto: `Exemplo: economizar R$ 15 a ~3 km provavelmente não compensa o deslocamento para você.`,
  };
}

export { EL_CONFIG_LIMITS } from '@/lib/el-config-usuario';