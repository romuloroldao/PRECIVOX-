import {
  buildChaveProdutoParaInsights,
  normalizeNomeProdutoChave,
} from '@/lib/produtos-nome-normalize';

/** Campos persistidos em `produtos` para agregação SQL e preço por item lógico. */
export function computeCamposChaveProduto(input: {
  nome: string;
  codigoBarras?: string | null;
  marca?: string | null;
  categoria?: string | null;
}): { nomeChave: string; chaveInsight: string } {
  return {
    nomeChave: normalizeNomeProdutoChave(input.nome),
    chaveInsight: buildChaveProdutoParaInsights(input),
  };
}
