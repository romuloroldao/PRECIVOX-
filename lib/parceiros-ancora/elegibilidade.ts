import { getCatalogoSaude } from '@/lib/catalogo-saude';
import {
  contratoVigente,
  normalizarTier,
  parseContrato,
  TIER_DEFINICOES,
} from '@/lib/parceiro-sla';
import { prisma } from '@/lib/prisma';

export type ElegibilidadeParceiroAncora = {
  elegivel: boolean;
  tier: number;
  motivos: string[];
};

export async function avaliarElegibilidadeParceiroAncora(
  mercadoId: string
): Promise<ElegibilidadeParceiroAncora> {
  const motivos: string[] = [];

  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: {
      id: true,
      ativo: true,
      parceiroTier: true,
      parceiroSlaContrato: true,
    },
  });

  if (!mercado?.ativo) {
    return { elegivel: false, tier: 1, motivos: ['Mercado inativo ou inexistente'] };
  }

  const tier = normalizarTier(mercado.parceiroTier);
  if (tier < 2) {
    motivos.push('Tier mínimo 2 (Parceiro PRECIVOX) — aceite contrato e sync diário');
  }

  if (!contratoVigente(parseContrato(mercado.parceiroSlaContrato))) {
    motivos.push('Contrato de dados não aceito ou desatualizado');
  }

  const saude = await getCatalogoSaude(mercadoId);
  if (saude.totalSkus === 0) {
    motivos.push('Catálogo vazio — importe produtos antes de ser âncora');
  } else if (saude.pctStale > 15) {
    motivos.push(`Catálogo desatualizado (${saude.pctStale}% stale > 15%)`);
  }

  const unidades = await prisma.unidades.count({
    where: { mercadoId, ativa: true },
  });
  if (unidades === 0) {
    motivos.push('Nenhuma unidade ativa cadastrada');
  }

  return {
    elegivel: motivos.length === 0,
    tier,
    motivos,
  };
}

export function tierLabel(tier: number): string {
  const info = TIER_DEFINICOES[normalizarTier(tier)];
  return info.nome;
}
