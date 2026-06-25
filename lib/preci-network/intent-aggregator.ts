/**
 * Agregador de intenção regional — PRECI Network
 */

import { prisma } from '@/lib/prisma';
import { INTENT_EVENT_PESOS } from '@/lib/ai/intent-score-engine';
import { resolverRegiaoOferta } from '@/lib/oferta-agregada/regiao';
import { chaveLogicaProduto } from '@/lib/oferta-agregada/chave-produto';
import type {
  PreciNetworkIntentCategoria,
  PreciNetworkIntentProduto,
  PreciNetworkIntentResumo,
} from './types';
import { PRECI_NETWORK_LGPD } from './types';
import { bucketUsuariosUnicos, passaKAnonymity } from './privacy';

const EVENTOS_INTENT = [
  'produto_adicionado_lista',
  'produto_buscado',
  'lista_criada',
  'produto_visualizado',
  'rota_consolidacao_lista',
  'checkin_mercado',
] as const;

export async function agregarIntentRegional(
  mercadoReferenciaId: string,
  dias = 14,
  regiaoModo: 'cep5' | 'cidade' = 'cep5'
): Promise<PreciNetworkIntentResumo> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const regiao = await resolverRegiaoOferta(mercadoReferenciaId, regiaoModo);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId: { in: regiao.mercadoIds },
      timestamp: { gte: desde },
      type: { in: [...EVENTOS_INTENT] },
    },
    select: { type: true, metadata: true, userId: true, timestamp: true },
  });

  const usuariosGlobais = new Set<string>();
  let totalSinais = 0;
  let intentRaw = 0;

  const catUsers = new Map<string, Set<string>>();
  const catSinais = new Map<string, number>();
  const catSinaisAnt = new Map<string, number>();
  const prodUsers = new Map<string, Set<string>>();
  const prodSinais = new Map<string, number>();

  const meio = new Date(desde.getTime() + (Date.now() - desde.getTime()) / 2);
  const produtoIds = new Set<string>();

  for (const ev of eventos) {
    usuariosGlobais.add(ev.userId);
    totalSinais++;
    const peso = INTENT_EVENT_PESOS[ev.type as keyof typeof INTENT_EVENT_PESOS] ?? 1;
    intentRaw += peso;

    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    if (pid) produtoIds.add(pid);
  }

  const produtos = await prisma.produtos.findMany({
    where: { id: { in: [...produtoIds].slice(0, 800) } },
    select: { id: true, nome: true, categoria: true, codigoBarras: true, skuNacional: true, chaveInsight: true },
  });
  const prodMap = new Map(produtos.map((p) => [p.id, p]));

  for (const ev of eventos) {
    const pid = (ev.metadata as { produtoId?: string }).produtoId;
    const prod = pid ? prodMap.get(pid) : null;
    const cat = prod?.categoria?.trim() || 'Sem categoria';

    if (!catUsers.has(cat)) catUsers.set(cat, new Set());
    catUsers.get(cat)!.add(ev.userId);
    catSinais.set(cat, (catSinais.get(cat) ?? 0) + 1);

    if (new Date(ev.timestamp) < meio) {
      catSinaisAnt.set(cat, (catSinaisAnt.get(cat) ?? 0) + 1);
    }

    if (prod) {
      const chave = chaveLogicaProduto(prod);
      if (!prodUsers.has(chave)) prodUsers.set(chave, new Set());
      prodUsers.get(chave)!.add(ev.userId);
      prodSinais.set(chave, (prodSinais.get(chave) ?? 0) + 1);
    }
  }

  const categorias: PreciNetworkIntentCategoria[] = [];
  for (const [categoria, sinais] of catSinais.entries()) {
    const usuariosUnicos = catUsers.get(categoria)?.size ?? 0;
    if (!passaKAnonymity(usuariosUnicos, sinais)) continue;
    const bucket = bucketUsuariosUnicos(usuariosUnicos);
    if (!bucket) continue;

    const ant = catSinaisAnt.get(categoria) ?? 0;
    const recente = sinais - ant;
    let tendencia: PreciNetworkIntentCategoria['tendencia'] = 'estavel';
    if (recente > ant * 1.2) tendencia = 'alta';
    else if (ant > 0 && recente < ant * 0.8) tendencia = 'queda';

    categorias.push({
      categoria,
      sinais,
      usuariosUnicosBucket: bucket,
      pressao: sinais >= 40 || usuariosUnicos >= 15 ? 'ALTA' : 'MEDIA',
      tendencia,
    });
  }
  categorias.sort((a, b) => b.sinais - a.sinais);

  const topProdutos: PreciNetworkIntentProduto[] = [];
  for (const [chave, sinais] of prodSinais.entries()) {
    const usuariosUnicos = prodUsers.get(chave)?.size ?? 0;
    if (!passaKAnonymity(usuariosUnicos, sinais)) continue;
    const bucket = bucketUsuariosUnicos(usuariosUnicos);
    if (!bucket) continue;
    topProdutos.push({ chave, sinais, usuariosUnicosBucket: bucket });
  }
  topProdutos.sort((a, b) => b.sinais - a.sinais);

  const globalBucket = bucketUsuariosUnicos(usuariosGlobais.size);
  const intentScoreMedio =
    usuariosGlobais.size > 0
      ? Math.min(100, Math.round(intentRaw / usuariosGlobais.size))
      : 0;

  return {
    regiaoDescricao: regiao.descricao,
    periodoDias: dias,
    mercadosNaRegiao: regiao.mercadoIds.length,
    intentScoreMedio,
    totalSinais,
    consumidoresUnicosBucket: globalBucket ?? '5-9',
    categorias: categorias.slice(0, 15),
    topProdutos: topProdutos.slice(0, 20),
    explicacao:
      categorias.length > 0
        ? `Intenção agregada em ${regiao.descricao} — ${categorias.length} categorias com demanda detectada.`
        : 'Volume insuficiente para publicar intenção agregada nesta região.',
    lgpd: PRECI_NETWORK_LGPD,
    geradoEm: new Date().toISOString(),
  };
}
