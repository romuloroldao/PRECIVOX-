import { prisma } from '@/lib/prisma';
import { agregarDemandaRegional } from './agregador';
import { obterConfigOfertaAgregada } from './config';
import { chaveLogicaProduto, type ProdutoChaveInput } from './chave-produto';
import type { CestaOfertaAgregada, ItemCestaOfertaAgregada } from './types';

async function buscarMatchNoCatalogo(
  mercadoId: string,
  chave: string,
  demanda: { nome: string; categoria: string | null }
): Promise<{
  produtoId: string | null;
  produtoNome: string | null;
  estoqueId: string | null;
  preco: number | null;
  emEstoque: boolean;
  motivoMatch: ItemCestaOfertaAgregada['motivoMatch'];
}> {
  const baseWhere = {
    ativo: true,
    estoques: { some: { unidades: { mercadoId, ativa: true } } },
  };

  if (chave.startsWith('ean:')) {
    const ean = chave.slice(4);
    const p = await prisma.produtos.findFirst({
      where: { ...baseWhere, codigoBarras: { contains: ean } },
      select: { id: true, nome: true },
    });
    if (p) {
      const est = await prisma.estoques.findFirst({
        where: {
          produtoId: p.id,
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
        orderBy: { preco: 'asc' },
        select: { id: true, preco: true },
      });
      return {
        produtoId: p.id,
        produtoNome: p.nome,
        estoqueId: est?.id ?? null,
        preco: est?.preco?.toNumber() ?? null,
        emEstoque: Boolean(est),
        motivoMatch: 'ean',
      };
    }
  }

  if (chave.startsWith('ins:')) {
    const p = await prisma.produtos.findFirst({
      where: { ...baseWhere, chaveInsight: { contains: chave.slice(4) } },
      select: { id: true, nome: true },
    });
    if (p) {
      const est = await prisma.estoques.findFirst({
        where: {
          produtoId: p.id,
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
        orderBy: { preco: 'asc' },
        select: { id: true, preco: true },
      });
      return {
        produtoId: p.id,
        produtoNome: p.nome,
        estoqueId: est?.id ?? null,
        preco: est?.preco?.toNumber() ?? null,
        emEstoque: Boolean(est),
        motivoMatch: 'chave_insight',
      };
    }
  }

  if (chave.startsWith('insight:')) {
    const insight = chave.slice(8);
    const p = await prisma.produtos.findFirst({
      where: { ...baseWhere, chaveInsight: insight },
      select: { id: true, nome: true },
    });
    if (p) {
      const est = await prisma.estoques.findFirst({
        where: {
          produtoId: p.id,
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
        orderBy: { preco: 'asc' },
        select: { id: true, preco: true },
      });
      return {
        produtoId: p.id,
        produtoNome: p.nome,
        estoqueId: est?.id ?? null,
        preco: est?.preco?.toNumber() ?? null,
        emEstoque: Boolean(est),
        motivoMatch: 'chave_insight',
      };
    }
  }

  const porNome = await prisma.produtos.findMany({
    where: {
      ...baseWhere,
      nome: { contains: demanda.nome.split(' ')[0], mode: 'insensitive' },
    },
    take: 5,
    select: {
      id: true,
      nome: true,
      codigoBarras: true,
      marca: true,
      categoria: true,
      chaveInsight: true,
      nomeChave: true,
    },
  });

  for (const cand of porNome) {
    if (chaveLogicaProduto(cand as ProdutoChaveInput) === chave) {
      const est = await prisma.estoques.findFirst({
        where: {
          produtoId: cand.id,
          disponivel: true,
          quantidade: { gt: 0 },
          unidades: { mercadoId, ativa: true },
        },
        orderBy: { preco: 'asc' },
        select: { id: true, preco: true },
      });
      return {
        produtoId: cand.id,
        produtoNome: cand.nome,
        estoqueId: est?.id ?? null,
        preco: est?.preco?.toNumber() ?? null,
        emEstoque: Boolean(est),
        motivoMatch: 'nome_chave',
      };
    }
  }

  return {
    produtoId: null,
    produtoNome: null,
    estoqueId: null,
    preco: null,
    emEstoque: false,
    motivoMatch: 'sem_match',
  };
}

export async function montarCestaOfertaAgregada(mercadoId: string): Promise<CestaOfertaAgregada> {
  const config = await obterConfigOfertaAgregada(mercadoId);
  const agg = await agregarDemandaRegional({
    mercadoReferenciaId: mercadoId,
    regiaoModo: config.regiaoModo,
    diasJanela: config.diasJanela,
    limite: config.maxItensCesta + 8,
  });

  const top = agg.itens.slice(0, config.maxItensCesta);
  const itens: ItemCestaOfertaAgregada[] = [];

  for (const d of top) {
    if (d.chave.startsWith('busca:')) continue;
    const match = await buscarMatchNoCatalogo(mercadoId, d.chave, d);
    itens.push({
      chave: d.chave,
      nomeRegional: d.nome,
      categoria: d.categoria,
      demandaRegional: {
        usuariosUnicos: d.usuariosUnicos,
        sinais: d.sinais,
        pressao: d.pressao,
      },
      ...match,
    });
  }

  const comEstoque = itens.filter((i) => i.emEstoque).length;

  return {
    mercadoId,
    regiaoDescricao: agg.regiaoDescricao,
    mercadosNaRegiao: agg.mercadosNaRegiao,
    periodoDias: config.diasJanela,
    totalSinais: agg.totalSinais,
    consumidoresUnicos: agg.consumidoresUnicos,
    itens,
    explicacao: `Cesta agregada da região (${agg.regiaoDescricao}): ${agg.consumidoresUnicos} consumidor(es) geraram ${agg.totalSinais} sinais em ${config.diasJanela} dias. ${comEstoque} de ${itens.length} itens com estoque no seu mercado.`,
  };
}

export async function aceitarCestaOfertaAgregada(
  mercadoId: string,
  gestorId: string
): Promise<{ config: Awaited<ReturnType<typeof obterConfigOfertaAgregada>>; cesta: CestaOfertaAgregada }> {
  const cesta = await montarCestaOfertaAgregada(mercadoId);
  const { salvarConfigOfertaAgregada } = await import('./config');

  const config = await salvarConfigOfertaAgregada(mercadoId, {
    ativo: true,
    aceiteEm: new Date().toISOString(),
    ultimoAceite: {
      em: new Date().toISOString(),
      itens: cesta.itens.filter((i) => i.emEstoque).length,
      sinaisRegiao: cesta.totalSinais,
      gestorId,
    },
  });

  await prisma.acoes_gestor.create({
    data: {
      id: `oa-${mercadoId}-${Date.now()}`,
      mercadoId,
      userId: gestorId,
      tipo: 'oferta_agregada_aceita',
      descricao: `Aceitou cesta agregada regional (${cesta.itens.filter((i) => i.emEstoque).length} itens com estoque)`,
      resultadoEsperado: {
        regiao: cesta.regiaoDescricao,
        consumidoresUnicos: cesta.consumidoresUnicos,
        itens: cesta.itens.slice(0, 8).map((i) => ({
          nome: i.nomeRegional,
          produtoId: i.produtoId,
          sinais: i.demandaRegional.sinais,
        })),
      },
    },
  });

  return { config, cesta };
}
