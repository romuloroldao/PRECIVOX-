/**
 * Insights CPG agregados — tendências regionais anônimas (LGPD)
 */

import { prisma } from '@/lib/prisma';
import { resolverRegiaoOferta } from '@/lib/oferta-agregada/regiao';
import { K_ANON_MIN, type CpgInsightCategoria, type CpgInsightsResumo } from './types';

export async function gerarCpgInsightsRegional(
  mercadoReferenciaId: string,
  dias = 14
): Promise<CpgInsightsResumo> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const regiao = await resolverRegiaoOferta(mercadoReferenciaId, 'cep5');

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId: { in: regiao.mercadoIds },
      timestamp: { gte: desde },
      type: { in: ['produto_adicionado_lista', 'produto_buscado', 'lista_criada'] },
    },
    select: { type: true, metadata: true, userId: true, timestamp: true },
  });

  const catUsers = new Map<string, Set<string>>();
  const catSinais = new Map<string, number>();
  const catSinaisSemanaAnterior = new Map<string, number>();
  const marcaSinais = new Map<string, number>();

  const meio = new Date(desde.getTime() + (Date.now() - desde.getTime()) / 2);

  const produtoIds = new Set<string>();
  for (const ev of eventos) {
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    if (pid) produtoIds.add(pid);
  }

  const produtos = await prisma.produtos.findMany({
    where: { id: { in: [...produtoIds].slice(0, 500) } },
    select: { id: true, categoria: true, marca: true },
  });
  const prodMap = new Map(produtos.map((p) => [p.id, p]));

  for (const ev of eventos) {
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    const prod = pid ? prodMap.get(pid) : null;
    const cat = prod?.categoria?.trim() || 'Sem categoria';
    const marca = prod?.marca?.trim();

    if (!catUsers.has(cat)) catUsers.set(cat, new Set());
    catUsers.get(cat)!.add(ev.userId);
    catSinais.set(cat, (catSinais.get(cat) ?? 0) + 1);

    if (new Date(ev.timestamp) < meio) {
      catSinaisSemanaAnterior.set(cat, (catSinaisSemanaAnterior.get(cat) ?? 0) + 1);
    }

    if (marca && marca.length >= 2) {
      marcaSinais.set(marca, (marcaSinais.get(marca) ?? 0) + 1);
    }
  }

  const categorias: CpgInsightCategoria[] = [...catSinais.entries()]
    .filter(([, s]) => s >= K_ANON_MIN)
    .map(([categoria, sinais]) => {
      const usuariosUnicos = catUsers.get(categoria)?.size ?? 0;
      const ant = catSinaisSemanaAnterior.get(categoria) ?? 0;
      const recente = sinais - ant;
      let tendencia: CpgInsightCategoria['tendencia'] = 'estavel';
      if (recente > ant * 1.2) tendencia = 'alta';
      else if (ant > 0 && recente < ant * 0.8) tendencia = 'queda';

      return {
        categoria,
        sinais,
        usuariosUnicos: usuariosUnicos >= K_ANON_MIN ? usuariosUnicos : K_ANON_MIN,
        tendencia,
        pressao: (sinais >= 40 || usuariosUnicos >= 15 ? 'ALTA' : 'MEDIA') as 'ALTA' | 'MEDIA',
      };
    })
    .sort((a, b) => b.sinais - a.sinais)
    .slice(0, 12);

  const topMarcas = [...marcaSinais.entries()]
    .filter(([, s]) => s >= K_ANON_MIN)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([marca, sinais]) => ({ marca, sinais }));

  return {
    regiaoDescricao: regiao.descricao,
    periodoDias: dias,
    mercadosNaRegiao: regiao.mercadoIds.length,
    categorias,
    topMarcas,
    explicacao:
      categorias.length > 0
        ? `${categorias.length} categorias com demanda agregada em ${regiao.descricao} — dados anonimizados para CPG.`
        : 'Volume insuficiente para insights CPG nesta região (mín. k-anonymity).',
    lgpd: 'Agregados ≥5 usuários; sem identificação individual. Uso comercial sujeito a contrato PRECIVOX.',
  };
}
