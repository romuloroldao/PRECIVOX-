/**
 * Webhook preço alterado — Épico 9.4 (Tier 3)
 */

import { createHmac, randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { truthFromWebhookPreco } from '@/lib/estoque-truth';
import { normalizarTier } from '@/lib/parceiro-sla';

export type ParceiroWebhookConfig = {
  url: string;
  secret: string;
  ativo: boolean;
  configuradoEm: string;
  ultimoDisparoEm?: string;
  ultimoDisparoStatus?: number;
  ultimoErro?: string;
};

export type PrecoAlteradoPayload = {
  estoqueId: string;
  produtoId: string;
  unidadeId: string;
  codigoBarras?: string | null;
  produtoNome?: string;
  preco: number;
  precoPromocional?: number | null;
  emPromocao: boolean;
  quantidade?: number;
  precoAnterior?: number;
};

export type WebhookOutboundBody = {
  event: 'preco.alterado' | 'webhook.teste';
  eventId: string;
  timestamp: string;
  mercadoId: string;
  origem: string;
  alteracoes: PrecoAlteradoPayload[];
};

export function parseWebhookConfig(raw: unknown): ParceiroWebhookConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as ParceiroWebhookConfig;
  if (!c.url?.trim() || !c.secret?.trim()) return null;
  return {
    url: c.url.trim(),
    secret: c.secret.trim(),
    ativo: c.ativo !== false,
    configuradoEm: c.configuradoEm ?? new Date().toISOString(),
    ultimoDisparoEm: c.ultimoDisparoEm,
    ultimoDisparoStatus: c.ultimoDisparoStatus,
    ultimoErro: c.ultimoErro,
  };
}

export function mascararWebhookConfig(c: ParceiroWebhookConfig | null): {
  configurado: boolean;
  url: string | null;
  ativo: boolean;
  ultimoDisparoEm?: string;
  ultimoDisparoStatus?: number;
  ultimoErro?: string;
} {
  if (!c) return { configurado: false, url: null, ativo: false };
  try {
    const u = new URL(c.url);
    return {
      configurado: true,
      url: `${u.protocol}//${u.host}${u.pathname.slice(0, 24)}…`,
      ativo: c.ativo,
      ultimoDisparoEm: c.ultimoDisparoEm,
      ultimoDisparoStatus: c.ultimoDisparoStatus,
      ultimoErro: c.ultimoErro,
    };
  } catch {
    return { configurado: true, url: '(URL inválida)', ativo: c.ativo };
  }
}

export function assinarPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export async function salvarWebhookParceiro(
  mercadoId: string,
  input: { url: string; secret: string; ativo?: boolean }
): Promise<ParceiroWebhookConfig> {
  const url = input.url.trim();
  if (!url.startsWith('https://')) {
    throw new Error('URL do webhook deve usar HTTPS');
  }
  new URL(url);

  const atual = parseWebhookConfig(
    (
      await prisma.mercados.findUnique({
        where: { id: mercadoId },
        select: { parceiroWebhook: true },
      })
    )?.parceiroWebhook
  );

  const config: ParceiroWebhookConfig = {
    url,
    secret: input.secret.trim() || atual?.secret || randomUUID(),
    ativo: input.ativo !== false,
    configuradoEm: atual?.configuradoEm ?? new Date().toISOString(),
    ultimoDisparoEm: atual?.ultimoDisparoEm,
    ultimoDisparoStatus: atual?.ultimoDisparoStatus,
    ultimoErro: atual?.ultimoErro,
  };

  await prisma.mercados.update({
    where: { id: mercadoId },
    data: { parceiroWebhook: config, dataAtualizacao: new Date() },
  });

  return config;
}

async function registrarDisparo(
  mercadoId: string,
  status: number,
  erro?: string
): Promise<void> {
  const m = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroWebhook: true },
  });
  const c = parseWebhookConfig(m?.parceiroWebhook);
  if (!c) return;

  await prisma.mercados.update({
    where: { id: mercadoId },
    data: {
      parceiroWebhook: {
        ...c,
        ultimoDisparoEm: new Date().toISOString(),
        ultimoDisparoStatus: status,
        ultimoErro: erro,
      },
    },
  });
}

export async function dispararWebhookPrecoAlterado(
  mercadoId: string,
  alteracoes: PrecoAlteradoPayload[],
  origem: string
): Promise<{ enviado: boolean; status?: number }> {
  if (alteracoes.length === 0) return { enviado: false };

  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroTier: true, parceiroWebhook: true },
  });

  if (!mercado || normalizarTier(mercado.parceiroTier) < 3) {
    return { enviado: false };
  }

  const config = parseWebhookConfig(mercado.parceiroWebhook);
  if (!config?.ativo) return { enviado: false };

  const body: WebhookOutboundBody = {
    event: 'preco.alterado',
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    mercadoId,
    origem,
    alteracoes,
  };

  const raw = JSON.stringify(body);
  const signature = assinarPayload(config.secret, raw);

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Precivox-Event': body.event,
        'X-Precivox-Signature': `sha256=${signature}`,
        'X-Precivox-Delivery': body.eventId,
      },
      body: raw,
      signal: AbortSignal.timeout(12_000),
    });

    await registrarDisparo(mercadoId, res.status, res.ok ? undefined : `HTTP ${res.status}`);
    return { enviado: res.ok, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro de rede';
    await registrarDisparo(mercadoId, 0, msg);
    console.error('[webhook-preco outbound]', mercadoId, msg);
    return { enviado: false, status: 0 };
  }
}

export function notificarWebhookPrecoAlterado(
  mercadoId: string,
  alteracoes: PrecoAlteradoPayload[],
  origem: string
): void {
  if (['partner_api', 'webhook_inbound'].includes(origem)) return;
  void dispararWebhookPrecoAlterado(mercadoId, alteracoes, origem).catch((e) =>
    console.error('[webhook-preco notify]', e)
  );
}

export async function enviarWebhookTeste(
  mercadoId: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { parceiroWebhook: true, parceiroTier: true },
  });

  if (normalizarTier(mercado?.parceiroTier) < 3) {
    return { ok: false, error: 'Webhook disponível apenas no Tier 3' };
  }

  const config = parseWebhookConfig(mercado?.parceiroWebhook);
  if (!config) return { ok: false, error: 'Configure URL e secret do webhook' };

  const body: WebhookOutboundBody = {
    event: 'webhook.teste',
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    mercadoId,
    origem: 'precivox_teste',
    alteracoes: [],
  };

  const raw = JSON.stringify(body);
  const signature = assinarPayload(config.secret, raw);

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Precivox-Event': body.event,
        'X-Precivox-Signature': `sha256=${signature}`,
        'X-Precivox-Delivery': body.eventId,
      },
      body: raw,
      signal: AbortSignal.timeout(12_000),
    });
    await registrarDisparo(mercadoId, res.status, res.ok ? undefined : `HTTP ${res.status}`);
    return { ok: res.ok, status: res.status, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro de rede';
    await registrarDisparo(mercadoId, 0, msg);
    return { ok: false, error: msg };
  }
}

export type InboundPrecoItem = {
  estoqueId?: string;
  codigoBarras?: string;
  preco: number;
  precoPromocional?: number | null;
  emPromocao?: boolean;
  quantidade?: number;
};

export async function aplicarPrecosInboundWebhook(input: {
  mercadoId: string;
  unidadeId: string;
  alteracoes: InboundPrecoItem[];
}): Promise<{ aplicados: number; erros: string[] }> {
  const unidade = await prisma.unidades.findFirst({
    where: { id: input.unidadeId, mercadoId: input.mercadoId, ativa: true },
    select: { id: true },
  });
  if (!unidade) {
    throw new Error('Unidade inválida para este mercado');
  }

  const truth = truthFromWebhookPreco();
  const erros: string[] = [];
  let aplicados = 0;

  for (const item of input.alteracoes) {
    try {
      if (item.preco == null || item.preco < 0) {
        erros.push('Preço inválido');
        continue;
      }

      let estoque = item.estoqueId
        ? await prisma.estoques.findFirst({
            where: { id: item.estoqueId, unidadeId: input.unidadeId },
            include: { produtos: { select: { id: true, nome: true, codigoBarras: true } } },
          })
        : null;

      if (!estoque && item.codigoBarras) {
        estoque = await prisma.estoques.findFirst({
          where: {
            unidadeId: input.unidadeId,
            produtos: { codigoBarras: item.codigoBarras.trim() },
          },
          include: { produtos: { select: { id: true, nome: true, codigoBarras: true } } },
        });
      }

      if (!estoque) {
        erros.push(
          item.estoqueId
            ? `Estoque ${item.estoqueId} não encontrado`
            : `EAN ${item.codigoBarras ?? '?'} não encontrado`
        );
        continue;
      }

      await prisma.estoques.update({
        where: { id: estoque.id },
        data: {
          preco: item.preco,
          precoPromocional: item.precoPromocional ?? null,
          emPromocao: item.emPromocao ?? false,
          ...(item.quantidade != null
            ? { quantidade: item.quantidade, disponivel: item.quantidade > 0 }
            : {}),
          atualizadoEm: new Date(),
          fonte: truth.fonte,
          confianca: truth.confianca,
          verificadoEm: truth.verificadoEm,
        },
      });

      aplicados++;
    } catch (e) {
      erros.push(e instanceof Error ? e.message : 'Erro ao aplicar item');
    }
  }

  return { aplicados, erros };
}
