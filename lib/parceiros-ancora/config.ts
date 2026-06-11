import { prisma } from '@/lib/prisma';
import type { RegiaoOfertaModo } from '@/lib/oferta-agregada/types';
import {
  PARCEIRO_ANCORA_PADRAO,
  type ParceiroAncoraConfig,
  type ParceiroAncoraTipo,
} from './types';

function parseTipo(valor: unknown): ParceiroAncoraTipo {
  if (valor === 'atacado' || valor === 'atacarejo') return valor;
  return 'rede';
}

function parseRegiaoModo(valor: unknown): RegiaoOfertaModo {
  if (valor === 'cidade' || valor === 'poligono') return valor;
  return 'cep5';
}

export function parseParceiroAncoraConfig(raw: unknown): ParceiroAncoraConfig {
  if (!raw || typeof raw !== 'object') return { ...PARCEIRO_ANCORA_PADRAO };
  const o = raw as Record<string, unknown>;
  return {
    ativo: Boolean(o.ativo),
    tipo: parseTipo(o.tipo),
    regiaoModo: parseRegiaoModo(o.regiaoModo),
    prioridade: Math.min(5, Math.max(1, Number(o.prioridade) || 3)),
    rotulo: typeof o.rotulo === 'string' ? o.rotulo.slice(0, 80) : undefined,
    designadoEm: typeof o.designadoEm === 'string' ? o.designadoEm : undefined,
    designadoPorUserId:
      typeof o.designadoPorUserId === 'string' ? o.designadoPorUserId : undefined,
  };
}

export async function obterConfigParceiroAncora(mercadoId: string): Promise<ParceiroAncoraConfig> {
  const m = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroAncora: true },
  });
  return parseParceiroAncoraConfig(m?.parceiroAncora);
}

export async function salvarConfigParceiroAncora(
  mercadoId: string,
  patch: Partial<ParceiroAncoraConfig>
): Promise<ParceiroAncoraConfig> {
  const atual = await obterConfigParceiroAncora(mercadoId);
  const merged: ParceiroAncoraConfig = {
    ...atual,
    ...patch,
    designadoEm: patch.designadoEm ?? atual.designadoEm,
    designadoPorUserId: patch.designadoPorUserId ?? atual.designadoPorUserId,
  };
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: { parceiroAncora: merged as object, dataAtualizacao: new Date() },
  });
  return merged;
}

export function configParaResposta(config: ParceiroAncoraConfig) {
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
