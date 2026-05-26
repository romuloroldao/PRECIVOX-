/**
 * Cesta da semana — montagem 1-tap (Épico 7.2)
 * Combina cesta provável + itens urgentes da despensa digital.
 */

import { prisma } from '@/lib/prisma';
import { montarCestaProvavel } from '@/lib/cesta-provavel';
import {
  calcularDespensaDigital,
  parseDespensaManual,
  type DespensaItem,
} from '@/lib/despensa-digital';

export type ItemCestaSemanaPlanejado = {
  produtoId: string;
  nome: string;
  motivo: string;
  origem: 'despensa' | 'cesta' | 'ambos';
};

export type ItemListaCestaSemana = {
  id: string;
  produtoCatalogoId: string;
  estoqueId: string;
  nome: string;
  preco: number;
  precoPromocional?: number;
  emPromocao: boolean;
  quantidade: number;
  imagem?: string;
  categoria?: string;
  marca?: string;
  unidade: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    mercado: { id: string; nome: string };
  };
};

function motivoDespensa(item: DespensaItem): string {
  if (item.status === 'acabando') return 'Provavelmente acabando na despensa';
  if (item.status === 'atencao') return 'Repor em breve (despensa)';
  return 'Na sua despensa';
}

export async function planejarCestaSemana(
  userId: string,
  mercadoId: string,
  perfilPreci: unknown
): Promise<{
  itens: ItemCestaSemanaPlanejado[];
  resumo: string;
  totalPlanejado: number;
}> {
  const manual = parseDespensaManual(perfilPreci);

  const [cesta, despensa] = await Promise.all([
    montarCestaProvavel(userId, mercadoId, 12),
    calcularDespensaDigital(userId, mercadoId, manual),
  ]);

  const map = new Map<string, ItemCestaSemanaPlanejado>();

  for (const d of despensa.itens.filter((i) => i.status !== 'ok')) {
    map.set(d.produtoId, {
      produtoId: d.produtoId,
      nome: d.nome,
      motivo: motivoDespensa(d),
      origem: 'despensa',
    });
  }

  for (const c of cesta.itens) {
    const existente = map.get(c.produtoId);
    if (existente) {
      map.set(c.produtoId, {
        ...existente,
        motivo: `${existente.motivo} · ${c.motivo}`,
        origem: 'ambos',
      });
    } else {
      map.set(c.produtoId, {
        produtoId: c.produtoId,
        nome: c.nome,
        motivo: c.motivo,
        origem: 'cesta',
      });
    }
  }

  const itens = [...map.values()].slice(0, 20);
  const despensaCount = itens.filter((i) => i.origem === 'despensa' || i.origem === 'ambos').length;

  let resumo = `Sua cesta da semana tem ${itens.length} itens prontos para aprovar.`;
  if (despensaCount > 0) {
    resumo = `${itens.length} itens — ${despensaCount} da despensa precisam de reposição.`;
  }
  if (cesta.intentScore >= 65) {
    resumo += ' Momento ideal para fechar a compra.';
  }

  return { itens, resumo, totalPlanejado: itens.length };
}

export async function resolverItensListaCestaSemana(
  produtoIds: string[],
  mercadoId: string
): Promise<ItemListaCestaSemana[]> {
  if (produtoIds.length === 0) return [];

  const estoques = await prisma.estoques.findMany({
    where: {
      produtoId: { in: produtoIds },
      disponivel: true,
      unidades: { mercadoId, ativa: true },
    },
    include: {
      produtos: {
        select: {
          id: true,
          nome: true,
          categoria: true,
          marca: true,
          imagem: true,
        },
      },
      unidades: {
        select: {
          id: true,
          nome: true,
          endereco: true,
          cidade: true,
          estado: true,
          mercados: { select: { id: true, nome: true } },
        },
      },
    },
  });

  const melhorPorProduto = new Map<string, (typeof estoques)[0]>();

  for (const est of estoques) {
    const preco = Number(est.emPromocao && est.precoPromocional ? est.precoPromocional : est.preco);
    const atual = melhorPorProduto.get(est.produtoId);
    if (!atual) {
      melhorPorProduto.set(est.produtoId, est);
      continue;
    }
    const precoAtual = Number(
      atual.emPromocao && atual.precoPromocional ? atual.precoPromocional : atual.preco
    );
    if (preco < precoAtual) melhorPorProduto.set(est.produtoId, est);
  }

  const resultado: ItemListaCestaSemana[] = [];

  for (const pid of produtoIds) {
    const est = melhorPorProduto.get(pid);
    if (!est) continue;
    const p = est.produtos;
    const u = est.unidades;
    const m = u.mercados;

    resultado.push({
      id: est.id,
      produtoCatalogoId: p.id,
      estoqueId: est.id,
      nome: p.nome ?? 'Produto',
      preco: Number(est.preco),
      precoPromocional: est.precoPromocional ? Number(est.precoPromocional) : undefined,
      emPromocao: est.emPromocao,
      quantidade: 1,
      imagem: p.imagem ?? undefined,
      categoria: p.categoria ?? undefined,
      marca: p.marca ?? undefined,
      unidade: {
        id: u.id,
        nome: u.nome,
        endereco: u.endereco ?? '',
        cidade: u.cidade ?? '',
        estado: u.estado ?? '',
        mercado: { id: m.id, nome: m.nome },
      },
    });
  }

  return resultado;
}

export function nomeListaCestaSemana(): string {
  const d = new Date();
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  return `Cesta da semana · ${dia}/${mes}`;
}
