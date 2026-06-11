import { prisma } from '@/lib/prisma';
import {
  OFERTA_AGREGADA_PADRAO,
  type OfertaAgregadaConfig,
  type RegiaoOfertaModo,
} from './types';

function parseConfig(raw: unknown): OfertaAgregadaConfig {
  if (!raw || typeof raw !== 'object') return { ...OFERTA_AGREGADA_PADRAO };
  const o = raw as Record<string, unknown>;
  const regiaoModo = o.regiaoModo as RegiaoOfertaModo;
  return {
    ativo: Boolean(o.ativo),
    regiaoModo: regiaoModo === 'cidade' || regiaoModo === 'poligono' ? regiaoModo : 'cep5',
    diasJanela: Math.min(30, Math.max(3, Number(o.diasJanela) || 7)),
    maxItensCesta: Math.min(24, Math.max(5, Number(o.maxItensCesta) || 12)),
    aceiteEm: typeof o.aceiteEm === 'string' ? o.aceiteEm : undefined,
    ultimoAceite:
      o.ultimoAceite && typeof o.ultimoAceite === 'object'
        ? (o.ultimoAceite as OfertaAgregadaConfig['ultimoAceite'])
        : undefined,
  };
}

export async function obterConfigOfertaAgregada(mercadoId: string): Promise<OfertaAgregadaConfig> {
  const m = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { ofertaAgregada: true },
  });
  return parseConfig(m?.ofertaAgregada);
}

export async function salvarConfigOfertaAgregada(
  mercadoId: string,
  patch: Partial<OfertaAgregadaConfig>
): Promise<OfertaAgregadaConfig> {
  const atual = await obterConfigOfertaAgregada(mercadoId);
  const merged: OfertaAgregadaConfig = {
    ...atual,
    ...patch,
    ultimoAceite: patch.ultimoAceite ?? atual.ultimoAceite,
  };
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: { ofertaAgregada: merged as object, dataAtualizacao: new Date() },
  });
  return merged;
}

export function configParaResposta(config: OfertaAgregadaConfig) {
  return {
    ...config,
    regiaoModoLabel:
      config.regiaoModo === 'cidade'
        ? 'Mesma cidade'
        : config.regiaoModo === 'poligono'
          ? 'Polígono do bairro'
          : 'CEP5 (bairro)',
  };
}
