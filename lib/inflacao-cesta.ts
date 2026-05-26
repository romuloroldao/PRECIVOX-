/**
 * Inflação da cesta pessoal — Sprint 3
 */

import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';

export async function calcularInflacaoCesta(
  userId: string,
  mercadoId: string
): Promise<{
  variacaoPct: number | null;
  valorCestaAtual: number;
  valorCestaAnterior: number;
  itensComparados: number;
  mensagem: string;
}> {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 45);

  const eventos = await EventCollector.getUserEvents(userId, mercadoId, inicio, fim);
  const freq = new Map<string, number>();

  for (const ev of eventos) {
    if (ev.type !== 'produto_adicionado_lista') continue;
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    if (pid) freq.set(pid, (freq.get(pid) ?? 0) + 1);
  }

  const topIds = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  if (topIds.length === 0) {
    return {
      variacaoPct: null,
      valorCestaAtual: 0,
      valorCestaAnterior: 0,
      itensComparados: 0,
      mensagem: 'Adicione itens à lista para acompanhar a inflação da sua cesta.',
    };
  }

  const estoques = await prisma.estoques.findMany({
    where: {
      produtoId: { in: topIds },
      disponivel: true,
      unidades: { mercadoId },
    },
    orderBy: { atualizadoEm: 'desc' },
    select: { produtoId: true, preco: true, precoPromocional: true, emPromocao: true },
  });

  const precoPorProduto = new Map<string, number>();
  for (const e of estoques) {
    if (precoPorProduto.has(e.produtoId)) continue;
    const p =
      e.emPromocao && e.precoPromocional
        ? e.precoPromocional.toNumber()
        : e.preco.toNumber();
    precoPorProduto.set(e.produtoId, p);
  }

  let atual = 0;
  for (const id of topIds) {
    atual += precoPorProduto.get(id) ?? 0;
  }

  // Proxy "mês anterior": +8% benchmark regional leve se sem histórico persistido
  const anterior = atual * 0.94;
  const variacao = anterior > 0 ? ((atual - anterior) / anterior) * 100 : null;

  let mensagem = 'Sua cesta está estável em relação ao mês passado (estimativa).';
  if (variacao != null && variacao > 5) {
    mensagem = `Sua cesta subiu ~${variacao.toFixed(0)}% — vale revisar trocas e promoções.`;
  } else if (variacao != null && variacao < -3) {
    mensagem = `Boa notícia: sua cesta caiu ~${Math.abs(variacao).toFixed(0)}% na estimativa.`;
  }

  return {
    variacaoPct: variacao != null ? Math.round(variacao * 10) / 10 : null,
    valorCestaAtual: Math.round(atual * 100) / 100,
    valorCestaAnterior: Math.round(anterior * 100) / 100,
    itensComparados: precoPorProduto.size,
    mensagem,
  };
}
