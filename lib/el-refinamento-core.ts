/**
 * Lógica pura de refinamento EL — seguro para testes e client imports.
 */

import type { UserEvent } from '@/lib/ai/types';
import {
  preferenciasParaElConfig,
  type ElPreferenciasUsuario,
} from '@/lib/el-config-preferencias';
import type { ElConfigUsuario } from '@/lib/el-config-usuario';
import type { ElSugestaoMetadata } from '@/lib/el-sugestao-types';

export type ElRefinamentoPendente = {
  mensagem: string;
  preferenciasAnteriores: ElPreferenciasUsuario;
  numerosAnteriores: ElConfigUsuario;
  em: string;
};

const MIN_EVENTOS = 8;
const MIN_SINAIS = 5;
const DELTA_MIN_PCT = 0.15;

const ORDEM_PRIORIDADE = ['economizar', 'equilibrio', 'comodidade'] as const;

export function ajustarPrioridadeEl(
  atual: ElPreferenciasUsuario['prioridade'],
  direcao: 'mais_comodidade' | 'mais_economia'
): ElPreferenciasUsuario['prioridade'] {
  const idx = ORDEM_PRIORIDADE.indexOf(atual);
  if (direcao === 'mais_comodidade') return ORDEM_PRIORIDADE[Math.min(2, idx + 1)];
  return ORDEM_PRIORIDADE[Math.max(0, idx - 1)];
}

function isElSugestaoEvento(ev: UserEvent): ev is UserEvent & { metadata: ElSugestaoMetadata } {
  if (ev.type !== 'el_sugestao_resposta') return false;
  const m = ev.metadata as Partial<ElSugestaoMetadata>;
  return Boolean(m?.acao && m?.recomendacao != null && m?.economiaLiquida != null);
}

export function analisarSinaisEl(eventos: UserEvent[]) {
  const el = eventos.filter(isElSugestaoEvento);
  let ignoraValeIr = 0;
  let aceitaFicar = 0;
  let clicaAlternativa = 0;

  for (const ev of el) {
    const { acao, recomendacao, economiaLiquida } = ev.metadata;
    if (acao === 'visualizada') continue;
    if (acao === 'clica_alternativa') {
      clicaAlternativa += 1;
      continue;
    }
    if (acao === 'ignora' && recomendacao === 'ir' && economiaLiquida >= 3) {
      ignoraValeIr += 1;
    }
    if (acao === 'aceita' && recomendacao === 'ficar') {
      aceitaFicar += 1;
    }
    if (acao === 'aceita' && recomendacao === 'ir') {
      clicaAlternativa += 1;
    }
  }

  return { total: el.length, ignoraValeIr, aceitaFicar, clicaAlternativa };
}

export function calcularRefinamentoEl(
  preferenciasAtuais: ElPreferenciasUsuario,
  cfgAtual: ElConfigUsuario,
  eventos: UserEvent[]
): {
  preferencias: ElPreferenciasUsuario;
  numeros: ElConfigUsuario;
  mensagem: string;
} | null {
  const sinais = analisarSinaisEl(eventos);
  if (sinais.total < MIN_EVENTOS) return null;

  let direcao: 'mais_comodidade' | 'mais_economia' | null = null;
  let mensagem = '';

  if (sinais.ignoraValeIr >= MIN_SINAIS && sinais.ignoraValeIr > sinais.clicaAlternativa + 1) {
    direcao = 'mais_comodidade';
    mensagem =
      'Percebemos que você prefere ficar no mercado atual. Ajustamos as recomendações para sugerir menos trocas de loja.';
  } else if (sinais.clicaAlternativa >= 3 && sinais.clicaAlternativa > sinais.ignoraValeIr) {
    direcao = 'mais_economia';
    mensagem =
      'Você costuma ir quando a economia compensa. Ajustamos para sugerir mais oportunidades de economia.';
  } else if (sinais.aceitaFicar >= MIN_SINAIS && sinais.ignoraValeIr < 2) {
    direcao = 'mais_comodidade';
    mensagem =
      'Suas escolhas indicam que conveniência pesa mais. Refinamos suas recomendações de deslocamento.';
  }

  if (!direcao) return null;

  const prioridadeNova = ajustarPrioridadeEl(preferenciasAtuais.prioridade, direcao);
  if (prioridadeNova === preferenciasAtuais.prioridade) return null;

  const preferencias: ElPreferenciasUsuario = { ...preferenciasAtuais, prioridade: prioridadeNova };
  const numeros = preferenciasParaElConfig(preferencias);

  const delta =
    Math.abs(numeros.valorHoraReais - cfgAtual.valorHoraReais) / Math.max(cfgAtual.valorHoraReais, 1);
  if (delta < DELTA_MIN_PCT) return null;

  return { preferencias, numeros, mensagem };
}

export function parseElRefinamentoPendente(perfilPreci: unknown): ElRefinamentoPendente | null {
  if (!perfilPreci || typeof perfilPreci !== 'object') return null;
  const raw = (perfilPreci as { elConfig?: { refinamentoPendente?: ElRefinamentoPendente } }).elConfig
    ?.refinamentoPendente;
  if (!raw?.mensagem || !raw.preferenciasAnteriores || !raw.numerosAnteriores) return null;
  return raw;
}
