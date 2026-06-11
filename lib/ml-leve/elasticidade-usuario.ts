import type { UserEvent } from '@/lib/ai/types';
import type { MlLeveElasticidade } from './types';

const PADRAO = -1.2;

/**
 * Sensibilidade a preço do usuário (coeficiente negativo, mais negativo = mais sensível).
 */
export function calcularElasticidadeUsuario(eventos: UserEvent[]): MlLeveElasticidade {
  if (!eventos.length) {
    return {
      coeficiente: PADRAO,
      rotulo: 'moderado',
      explicacao: 'Poucos sinais — usando elasticidade regional padrão (-1,2).',
    };
  }

  let sinaisSensivel = 0;
  let sinaisInelastico = 0;

  for (const ev of eventos) {
    const meta = ev.metadata as Record<string, unknown>;
    if (ev.type === 'promocao_visualizada') sinaisSensivel += 2;
    if (ev.type === 'produto_substituicao_aceita') {
      if (meta.motivo === 'mais_barato' || meta.economiaLiquida) sinaisSensivel += 3;
      else sinaisSensivel += 1;
    }
    if (ev.type === 'produto_buscado' && meta.ordenacao === 'preco_asc') sinaisSensivel += 2;
    if (ev.type === 'produto_adicionado_lista' && meta.emPromocao === true) sinaisSensivel += 1;
    if (ev.type === 'preco_confirmado') sinaisInelastico += 1;
    if (ev.type === 'compra_confirmada' && meta.valorTotal && Number(meta.valorTotal) > 200) {
      sinaisInelastico += 1;
    }
  }

  let coeficiente = PADRAO;
  if (sinaisSensivel > sinaisInelastico + 2) {
    coeficiente = -2.0 - Math.min(0.5, sinaisSensivel * 0.05);
  } else if (sinaisInelastico > sinaisSensivel + 3) {
    coeficiente = -0.6;
  } else if (sinaisSensivel > 0) {
    coeficiente = -1.5;
  }

  coeficiente = Math.max(-2.8, Math.min(-0.4, coeficiente));

  const rotulo =
    coeficiente <= -1.7 ? 'sensivel' : coeficiente >= -0.9 ? 'pouco_sensivel' : 'moderado';

  const explicacao =
    rotulo === 'sensivel'
      ? 'Você reage bastante a promoções e trocas mais baratas — priorizamos ofertas e EL.'
      : rotulo === 'pouco_sensivel'
        ? 'Seu padrão indica menor sensibilidade a pequenas variações de preço.'
        : 'Sensibilidade média a preço, equilibrando economia e conveniência.';

  return {
    coeficiente: Math.round(coeficiente * 100) / 100,
    rotulo,
    explicacao,
  };
}
