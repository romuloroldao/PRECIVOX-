import { prisma } from '@/lib/prisma';
import { chaveLogicaProduto, labelProdutoLogico, type ProdutoChaveInput } from './chave-produto';
import { resolverRegiaoOferta } from './regiao';
import type { DemandaRegionalItem, RegiaoOfertaModo } from './types';

type Acumulador = {
  chave: string;
  nome: string;
  categoria: string | null;
  usuarios: Set<string>;
  sinais: number;
};

const TIPOS_SINAL = [
  'produto_adicionado_lista',
  'compra_confirmada',
  'compra_realizada',
  'produto_buscado',
] as const;

/**
 * Agrega intenção de compra na região (anônima) por produto lógico.
 */
export async function agregarDemandaRegional(opts: {
  mercadoReferenciaId: string;
  regiaoModo: RegiaoOfertaModo;
  diasJanela: number;
  limite?: number;
}): Promise<{
  itens: DemandaRegionalItem[];
  regiaoDescricao: string;
  mercadosNaRegiao: number;
  totalSinais: number;
  consumidoresUnicos: number;
}> {
  const { mercadoIds, descricao } = await resolverRegiaoOferta(
    opts.mercadoReferenciaId,
    opts.regiaoModo
  );

  const desde = new Date();
  desde.setDate(desde.getDate() - opts.diasJanela);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId: { in: mercadoIds },
      timestamp: { gte: desde },
      type: { in: [...TIPOS_SINAL] },
    },
    select: { userId: true, type: true, metadata: true },
    take: 15000,
  });

  const produtoIds = new Set<string>();
  for (const ev of eventos) {
    const pid = (ev.metadata as { produtoId?: string })?.produtoId;
    if (pid) produtoIds.add(pid);
  }

  const produtosDb = produtoIds.size
    ? await prisma.produtos.findMany({
        where: { id: { in: [...produtoIds] } },
        select: {
          id: true,
          nome: true,
          codigoBarras: true,
          marca: true,
          categoria: true,
          chaveInsight: true,
          nomeChave: true,
        },
      })
    : [];

  const produtoPorId = new Map(produtosDb.map((p) => [p.id, p]));
  const acum = new Map<string, Acumulador>();
  const consumidores = new Set<string>();

  for (const ev of eventos) {
    consumidores.add(ev.userId);
    const meta = ev.metadata as { produtoId?: string; searchQuery?: string };
    let chave: string | null = null;
    let nome = meta.searchQuery?.slice(0, 80) ?? 'Busca';
    let categoria: string | null = null;

    if (meta.produtoId) {
      const p = produtoPorId.get(meta.produtoId);
      if (p) {
        chave = chaveLogicaProduto(p as ProdutoChaveInput);
        nome = labelProdutoLogico(p as ProdutoChaveInput);
        categoria = p.categoria;
      }
    } else if (ev.type === 'produto_buscado' && meta.searchQuery) {
      chave = `busca:${meta.searchQuery.toLowerCase().trim().slice(0, 64)}`;
    }

    if (!chave) continue;

    const peso =
      ev.type === 'produto_adicionado_lista'
        ? 3
        : ev.type === 'compra_confirmada' || ev.type === 'compra_realizada'
          ? 4
          : 1;

    if (!acum.has(chave)) {
      acum.set(chave, { chave, nome, categoria, usuarios: new Set(), sinais: 0 });
    }
    const row = acum.get(chave)!;
    row.usuarios.add(ev.userId);
    row.sinais += peso;
    if (meta.produtoId && produtoPorId.has(meta.produtoId)) {
      row.nome = labelProdutoLogico(produtoPorId.get(meta.produtoId)! as ProdutoChaveInput);
      row.categoria = produtoPorId.get(meta.produtoId)!.categoria;
    }
  }

  const limite = opts.limite ?? 20;
  const itens: DemandaRegionalItem[] = [...acum.values()]
    .map((a) => ({
      chave: a.chave,
      nome: a.nome,
      categoria: a.categoria,
      usuariosUnicos: a.usuarios.size,
      sinais: a.sinais,
      pressao: a.usuarios.size >= 4 || a.sinais >= 10 ? ('ALTA' as const) : ('MEDIA' as const),
    }))
    .sort((a, b) => b.sinais - a.sinais || b.usuariosUnicos - a.usuariosUnicos)
    .slice(0, limite);

  return {
    itens,
    regiaoDescricao: descricao,
    mercadosNaRegiao: mercadoIds.length,
    totalSinais: eventos.length,
    consumidoresUnicos: consumidores.size,
  };
}
