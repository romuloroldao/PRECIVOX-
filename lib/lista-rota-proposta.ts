import type { ItemLista } from '@/app/context/ListaContext';

/** Resposta da API — itens prontos para `aplicarTrocaRota` no cliente. */
export type MovimentoRotaProposta = {
  removerLineId: string;
  nomeAnterior: string;
  nomeNovo: string;
  precoAnterior: number;
  precoNovo: number;
  itemLista: ItemLista;
};

export type PropostaRotaResumo = {
  mercadosAntes: number;
  mercadosDepois: number;
  deltaTotal: number;
  anchorNome: string;
  sateliteNome: string;
};

export type PropostaRotaOtimizacao = {
  movimentos: MovimentoRotaProposta[];
  resumo: PropostaRotaResumo;
};
