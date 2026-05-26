/**
 * Relatório semanal gentil — oportunidades de economia
 */

import { EventCollector } from '@/lib/ai/event-collector';
import { calcularInflacaoCesta } from '@/lib/inflacao-cesta';
import { montarCestaProvavel } from '@/lib/cesta-provavel';

export type OportunidadeSemanal = {
  tipo: 'inflacao' | 'cesta' | 'lista' | 'troca';
  titulo: string;
  descricao: string;
  impactoEstimado?: string;
};

export async function gerarRelatorioSemanaCliente(
  userId: string,
  mercadoId: string
): Promise<{ oportunidades: OportunidadeSemanal[]; resumo: string }> {
  const oportunidades: OportunidadeSemanal[] = [];

  const [inflacao, cesta] = await Promise.all([
    calcularInflacaoCesta(userId, mercadoId),
    montarCestaProvavel(userId, mercadoId, 5),
  ]);

  if (inflacao.variacaoPct != null && inflacao.variacaoPct > 4) {
    oportunidades.push({
      tipo: 'inflacao',
      titulo: 'Cesta mais cara que o habitual',
      descricao: inflacao.mensagem,
      impactoEstimado: `~${inflacao.variacaoPct}%`,
    });
  }

  if (cesta.itens.length > 0) {
    oportunidades.push({
      tipo: 'cesta',
      titulo: 'Cesta provável da semana',
      descricao: `${cesta.itens.length} itens que você costuma comprar — revise antes de ir ao mercado.`,
    });
  }

  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 7);
  const ev = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const subs = ev.filter((e) => e.type === 'produto_substituicao_aceita').length;
  if (subs === 0 && ev.filter((e) => e.type === 'produto_adicionado_lista').length > 8) {
    oportunidades.push({
      tipo: 'troca',
      titulo: 'Trocas que você ainda não testou',
      descricao: 'Experimentar marcas equivalentes pode reduzir a conta sem mudar a rotina.',
    });
  }

  const removidos = ev.filter((e) => e.type === 'remocao_lista_confirmada').length;
  if (removidos >= 2) {
    oportunidades.push({
      tipo: 'lista',
      titulo: 'Lista com desistências',
      descricao: 'Você removeu itens após adicionar — vale revisar preços ou substitutos antes da próxima ida.',
    });
  }

  const resumo =
    oportunidades.length > 0
      ? `Encontramos ${oportunidades.length} oportunidade(s) para economizar esta semana.`
      : 'Semana estável — continue confirmando compras para melhorar suas previsões.';

  return { oportunidades, resumo };
}
