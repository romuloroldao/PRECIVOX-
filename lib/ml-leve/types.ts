/**
 * Épico 12 — ML leve (heurísticas + batch, sem modelo pesado)
 * Snapshot persistido em `User.perfilPreci.mlLevePorMercado` (legado: `mlLeve`)
 */

export type ChurnNivel = 'baixo' | 'medio' | 'alto';

export type MlLeveChurn = {
  score: number;
  nivel: ChurnNivel;
  diasSemAtividade: number;
  explicacao: string;
};

export type MlLeveElasticidade = {
  coeficiente: number;
  rotulo: 'sensivel' | 'moderado' | 'pouco_sensivel';
  explicacao: string;
};

export type MlLeveSnapshot = {
  atualizadoEm: string;
  mercadoId: string;
  churn: MlLeveChurn;
  elasticidade: MlLeveElasticidade;
};

export type ItemBasketCompletion = {
  produtoId: string;
  nome: string;
  confianca: number;
  motivo: string;
};

export type MlLeveResumoMercado = {
  usuariosAnalisados: number;
  churnAlto: number;
  churnMedio: number;
  elasticidadeMedia: number;
  explicacao: string;
  acoesSugeridas: string[];
};
