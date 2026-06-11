import { getCatalogoSaude } from '@/lib/catalogo-saude';
import { resolverRegiaoOferta } from '@/lib/oferta-agregada/regiao';
import type { RegiaoOfertaModo } from '@/lib/oferta-agregada/types';
import { obterSeloMercadoConsumidor } from '@/lib/mercado-selo-consumidor';
import { normalizarTier } from '@/lib/parceiro-sla';
import { prisma } from '@/lib/prisma';
import {
  obterConfigParceiroAncora,
  parseParceiroAncoraConfig,
  salvarConfigParceiroAncora,
} from './config';
import { avaliarElegibilidadeParceiroAncora } from './elegibilidade';
import {
  ANCORA_META_MAX,
  ANCORA_META_MIN,
  TIPO_ANCORA_LABEL,
  type ParceiroAncoraConfig,
  type ParceiroAncoraResumo,
  type ParceiroAncoraTipo,
  type RegiaoParceirosAncora,
} from './types';

async function resumoParceiroAncora(
  mercadoId: string,
  configRaw: unknown
): Promise<ParceiroAncoraResumo | null> {
  const config = parseParceiroAncoraConfig(configRaw);
  if (!config.ativo) return null;

  const [mercado, saude, selo] = await Promise.all([
    prisma.mercados.findUnique({
      where: { id: mercadoId, ativo: true },
      select: { id: true, nome: true, parceiroTier: true },
    }),
    getCatalogoSaude(mercadoId),
    obterSeloMercadoConsumidor(mercadoId),
  ]);

  if (!mercado) return null;

  return {
    mercadoId: mercado.id,
    nome: mercado.nome,
    tipo: config.tipo,
    tipoLabel: TIPO_ANCORA_LABEL[config.tipo],
    tier: normalizarTier(mercado.parceiroTier),
    prioridade: config.prioridade,
    rotulo: config.rotulo ?? null,
    selo: selo.seloCurto,
    skusAtivos: saude.totalSkus,
    pctStale: saude.pctStale,
  };
}

export async function listarParceirosAncoraRegiao(
  mercadoReferenciaId: string,
  modo?: RegiaoOfertaModo
): Promise<RegiaoParceirosAncora> {
  const refConfig = parseParceiroAncoraConfig(
    (
      await prisma.mercados.findUnique({
        where: { id: mercadoReferenciaId },
        select: { parceiroAncora: true },
      })
    )?.parceiroAncora
  );
  const regiaoModo = modo ?? refConfig.regiaoModo ?? 'cep5';
  const regiao = await resolverRegiaoOferta(mercadoReferenciaId, regiaoModo);

  const rows = await prisma.mercados.findMany({
    where: {
      id: { in: regiao.mercadoIds },
      ativo: true,
    },
    select: { id: true, parceiroAncora: true },
  });

  const parceiros: ParceiroAncoraResumo[] = [];
  for (const row of rows) {
    const resumo = await resumoParceiroAncora(row.id, row.parceiroAncora);
    if (resumo) parceiros.push(resumo);
  }

  parceiros.sort((a, b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome));

  return {
    regiaoDescricao: regiao.descricao,
    regiaoModo,
    mercadosNaRegiao: regiao.mercadoIds.length,
    ancoraCount: parceiros.length,
    metaMin: ANCORA_META_MIN,
    metaMax: ANCORA_META_MAX,
    regiaoCompleta: parceiros.length >= ANCORA_META_MIN && parceiros.length <= ANCORA_META_MAX,
    parceiros: parceiros.slice(0, ANCORA_META_MAX),
  };
}

export async function contarAncorasAtivasRegiao(
  mercadoReferenciaId: string,
  regiaoModo: RegiaoOfertaModo,
  excluirMercadoId?: string
): Promise<number> {
  const regiao = await listarParceirosAncoraRegiao(mercadoReferenciaId, regiaoModo);
  if (!excluirMercadoId) return regiao.ancoraCount;
  return regiao.parceiros.filter((p) => p.mercadoId !== excluirMercadoId).length;
}

/** Mercado âncora preferido na região (menor prioridade numérica). */
export async function obterAncoraPreferidaRegiao(
  mercadoReferenciaId: string,
  modo?: RegiaoOfertaModo
): Promise<{ mercadoId: string; nome: string } | null> {
  const regiao = await listarParceirosAncoraRegiao(mercadoReferenciaId, modo);
  const top = regiao.parceiros[0];
  if (!top) return null;
  return { mercadoId: top.mercadoId, nome: top.nome };
}

export async function designarParceiroAncora(
  mercadoId: string,
  patch: {
    ativo: boolean;
    tipo?: ParceiroAncoraTipo;
    regiaoModo?: RegiaoOfertaModo;
    prioridade?: number;
    rotulo?: string;
  },
  userId: string
): Promise<{ ok: true; config: ParceiroAncoraConfig } | { ok: false; error: string }> {
  if (patch.ativo) {
    const eleg = await avaliarElegibilidadeParceiroAncora(mercadoId);
    if (!eleg.elegivel) {
      return { ok: false, error: eleg.motivos.join('; ') };
    }

    const atual = await obterConfigParceiroAncora(mercadoId);
    const regiaoModo = patch.regiaoModo ?? atual.regiaoModo ?? 'cep5';
    const count = await contarAncorasAtivasRegiao(mercadoId, regiaoModo, mercadoId);
    if (count >= ANCORA_META_MAX) {
      return {
        ok: false,
        error: `Região piloto já tem ${ANCORA_META_MAX} parceiros âncora (máximo)`,
      };
    }
  }

  const config = await salvarConfigParceiroAncora(mercadoId, {
    ativo: patch.ativo,
    tipo: patch.tipo,
    regiaoModo: patch.regiaoModo,
    prioridade: patch.prioridade,
    rotulo: patch.rotulo,
    designadoEm: patch.ativo ? new Date().toISOString() : undefined,
    designadoPorUserId: patch.ativo ? userId : undefined,
  });

  return { ok: true, config };
}
