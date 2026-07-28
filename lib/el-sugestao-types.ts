/**
 * Tipos e helpers para eventos de resposta à Economia Líquida.
 */

import type { RecomendacaoEL } from '@/lib/economia-liquida';

export type ElSugestaoAcao = 'visualizada' | 'ignora' | 'aceita' | 'clica_alternativa';

export type ElSugestaoMetadata = {
  acao: ElSugestaoAcao;
  recomendacao: RecomendacaoEL;
  economiaLiquida: number;
  distanciaKm?: number | null;
  produtoId?: string;
  estoqueId?: string;
  mercadoOrigemId?: string;
  mercadoDestinoNome?: string;
};

/** Ao adicionar produto do mercado atual, inferimos aceite ou rejeição da sugestão EL. */
export function inferirAcaoElAoAdicionar(recomendacao: RecomendacaoEL): ElSugestaoAcao | null {
  if (recomendacao === 'ir') return 'ignora';
  if (recomendacao === 'ficar') return 'aceita';
  return null;
}

export function chaveImpressaoEl(estoqueId: string): string {
  return `precivox_el_imp_${estoqueId}`;
}

export function impressaoElJaRegistrada(estoqueId: string): boolean {
  if (typeof sessionStorage === 'undefined') return true;
  return sessionStorage.getItem(chaveImpressaoEl(estoqueId)) === '1';
}

export function marcarImpressaoEl(estoqueId: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(chaveImpressaoEl(estoqueId), '1');
}
