/**
 * Épico 13 — Oferta agregada (cesta regional que o mercado pode aceitar)
 */

export type RegiaoOfertaModo = 'cep5' | 'cidade' | 'poligono';

export type OfertaAgregadaConfig = {
  ativo: boolean;
  regiaoModo: RegiaoOfertaModo;
  diasJanela: number;
  maxItensCesta: number;
  aceiteEm?: string;
  ultimoAceite?: {
    em: string;
    itens: number;
    sinaisRegiao: number;
    gestorId: string;
  };
};

export type DemandaRegionalItem = {
  chave: string;
  nome: string;
  categoria: string | null;
  usuariosUnicos: number;
  sinais: number;
  pressao: 'ALTA' | 'MEDIA';
};

export type ItemCestaOfertaAgregada = {
  chave: string;
  nomeRegional: string;
  categoria: string | null;
  demandaRegional: {
    usuariosUnicos: number;
    sinais: number;
    pressao: 'ALTA' | 'MEDIA';
  };
  produtoId: string | null;
  produtoNome: string | null;
  estoqueId: string | null;
  preco: number | null;
  emEstoque: boolean;
  motivoMatch: 'chave_insight' | 'ean' | 'nome_chave' | 'sem_match';
};

export type CestaOfertaAgregada = {
  mercadoId: string;
  regiaoDescricao: string;
  mercadosNaRegiao: number;
  periodoDias: number;
  totalSinais: number;
  consumidoresUnicos: number;
  itens: ItemCestaOfertaAgregada[];
  explicacao: string;
};

export const OFERTA_AGREGADA_PADRAO: OfertaAgregadaConfig = {
  ativo: false,
  regiaoModo: 'cep5',
  diasJanela: 7,
  maxItensCesta: 12,
};
