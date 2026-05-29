/**
 * Autenticação API parceiro (Épico 9.2)
 *
 * Configure em .env.production:
 * PARTNER_API_KEYS='{"mercadoId1":"chave-secreta-1","mercadoId2":"chave-2"}'
 */

import { prisma } from '@/lib/prisma';
import { contratoVigente, normalizarTier, parseContrato } from '@/lib/parceiro-sla';

export type PartnerAuthResult =
  | { ok: true; mercadoId: string }
  | { ok: false; status: number; error: string };

function parsePartnerKeys(): Record<string, string> {
  const raw = process.env.PARTNER_API_KEYS;
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function extrairBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

/** Valida chave do mapa PARTNER_API_KEYS para o mercado informado. */
export function validarChaveParceiro(mercadoId: string, token: string | null): boolean {
  if (!token || !mercadoId) return false;
  const keys = parsePartnerKeys();
  const esperada = keys[mercadoId];
  return Boolean(esperada && esperada === token);
}

/** Tier ≥ 2 + contrato vigente (batch JSON ou sync diário). */
export async function validarElegibilidadeParceiro(mercadoId: string): Promise<PartnerAuthResult> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { id: true, ativo: true, parceiroTier: true, parceiroSlaContrato: true },
  });

  if (!mercado || !mercado.ativo) {
    return { ok: false, status: 404, error: 'Mercado não encontrado ou inativo' };
  }

  const tier = normalizarTier(mercado.parceiroTier);
  if (tier < 2) {
    return {
      ok: false,
      status: 403,
      error: 'API batch disponível a partir do Tier 2 (Diário). Atualize o SLA no painel do gestor.',
    };
  }

  if (!contratoVigente(parseContrato(mercado.parceiroSlaContrato))) {
    return {
      ok: false,
      status: 403,
      error: 'Contrato de dados não aceito. O gestor deve aceitar o SLA em Produtos.',
    };
  }

  return { ok: true, mercadoId: mercado.id };
}

/** Tier 3 + contrato vigente — webhook incremental (9.4). */
export async function validarElegibilidadeWebhook(mercadoId: string): Promise<PartnerAuthResult> {
  const base = await validarElegibilidadeParceiro(mercadoId);
  if (!base.ok) return base;

  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroTier: true },
  });
  const tier = normalizarTier(mercado?.parceiroTier);
  if (tier < 3) {
    return {
      ok: false,
      status: 403,
      error: 'Webhook de preço disponível apenas no Tier 3 (API).',
    };
  }
  return base;
}
