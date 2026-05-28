/**
 * Sync agendado de catálogo — URL/SFTP → processarUpload (Épico 9.1)
 */

import axios from 'axios';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { processarUpload, type ResultadoUpload } from '@/lib/upload-handler';

export type SyncFonteTipo = 'url' | 'sftp';
export type SyncIntervalo = '6h' | '12h' | '24h' | 'semanal';

export type SyncAgendadoConfig = {
  ativo: boolean;
  unidadeId: string;
  tipo: SyncFonteTipo;
  url?: string;
  urlHeaders?: Record<string, string>;
  sftp?: {
    host: string;
    port: number;
    username: string;
    remotePath: string;
  };
  /** Enviado só no PATCH; nunca retornado em GET */
  sftpPassword?: string;
  intervalo: SyncIntervalo;
  ultimaExecucao?: string;
  ultimoStatus?: 'sucesso' | 'falha' | 'executando';
  ultimaMensagem?: string;
  ultimoLogImportacaoId?: string;
  ultimoResumo?: {
    sucesso: number;
    erros: number;
    duplicados: number;
    totalLinhas: number;
  };
};

const INTERVALO_MS: Record<SyncIntervalo, number> = {
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  semanal: 7 * 24 * 60 * 60 * 1000,
};

const MAX_BYTES = 50 * 1024 * 1024;

export function parseSyncAgendado(raw: unknown): SyncAgendadoConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as SyncAgendadoConfig;
  if (!c.unidadeId || !c.tipo) return null;
  return c;
}

export function configParaResposta(c: SyncAgendadoConfig): Omit<SyncAgendadoConfig, 'sftpPassword'> & {
  temSenhaSftp: boolean;
} {
  const { sftpPassword: _p, ...rest } = c;
  return {
    ...rest,
    temSenhaSftp: Boolean(c.sftpPassword),
  };
}

export function deveExecutarSync(config: SyncAgendadoConfig, agora = Date.now()): boolean {
  if (!config.ativo) return false;
  if (!config.ultimaExecucao) return true;
  const ms = INTERVALO_MS[config.intervalo] ?? INTERVALO_MS['24h'];
  return agora - new Date(config.ultimaExecucao).getTime() >= ms;
}

function nomeArquivoFromUrl(url: string, contentType?: string): string {
  try {
    const base = path.basename(new URL(url).pathname);
    if (base && base.includes('.')) return base;
  } catch {
    /* ignore */
  }
  if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) return 'catalogo.xlsx';
  if (contentType?.includes('json')) return 'catalogo.json';
  return 'catalogo.csv';
}

export async function baixarArquivoUrl(
  url: string,
  headers?: Record<string, string>
): Promise<{ buffer: Buffer; fileName: string }> {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 120_000,
    maxContentLength: MAX_BYTES,
    maxBodyLength: MAX_BYTES,
    headers: {
      'User-Agent': 'PRECIVOX-Sync/1.0',
      ...headers,
    },
    validateStatus: (s) => s >= 200 && s < 300,
  });

  const buffer = Buffer.from(res.data);
  if (buffer.length === 0) throw new Error('Arquivo vazio na URL');
  if (buffer.length > MAX_BYTES) throw new Error('Arquivo excede 50 MB');

  const ct = String(res.headers['content-type'] ?? '');
  const fileName = nomeArquivoFromUrl(url, ct);
  return { buffer, fileName };
}

export async function baixarArquivoSftp(
  config: SyncAgendadoConfig
): Promise<{ buffer: Buffer; fileName: string }> {
  if (!config.sftp || !config.sftpPassword) {
    throw new Error('SFTP: host e senha são obrigatórios');
  }

  const SftpClient = (await import('ssh2-sftp-client')).default;
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host: config.sftp.host,
      port: config.sftp.port || 22,
      username: config.sftp.username,
      password: config.sftpPassword,
      readyTimeout: 30_000,
    });
    const remotePath = config.sftp.remotePath;
    const stat = await sftp.stat(remotePath);
    if (stat.size > MAX_BYTES) throw new Error('Arquivo SFTP excede 50 MB');
    const buffer = (await sftp.get(remotePath)) as Buffer;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new Error('Arquivo SFTP vazio');
    }
    return { buffer, fileName: path.basename(remotePath) || 'catalogo.csv' };
  } finally {
    await sftp.end().catch(() => {});
  }
}

async function salvarConfig(mercadoId: string, config: SyncAgendadoConfig) {
  await prisma.mercados.update({
    where: { id: mercadoId },
    data: {
      syncAgendado: config as Prisma.InputJsonValue,
      dataAtualizacao: new Date(),
    },
  });
}

export async function obterConfigSync(mercadoId: string): Promise<SyncAgendadoConfig | null> {
  const m = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { syncAgendado: true },
  });
  return parseSyncAgendado(m?.syncAgendado);
}

export async function salvarConfigSync(
  mercadoId: string,
  input: Partial<SyncAgendadoConfig> & { unidadeId: string; tipo: SyncFonteTipo }
): Promise<SyncAgendadoConfig> {
  const atual = (await obterConfigSync(mercadoId)) ?? {
    ativo: false,
    unidadeId: input.unidadeId,
    tipo: input.tipo,
    intervalo: '24h' as SyncIntervalo,
  };

  const merged: SyncAgendadoConfig = {
    ...atual,
    ...input,
    unidadeId: input.unidadeId,
    tipo: input.tipo,
    intervalo: input.intervalo ?? atual.intervalo ?? '24h',
  };

  if (input.sftpPassword) {
    merged.sftpPassword = input.sftpPassword;
  } else if (atual.sftpPassword) {
    merged.sftpPassword = atual.sftpPassword;
  }

  if (merged.tipo === 'url' && !merged.url?.trim()) {
    throw new Error('URL do catálogo é obrigatória');
  }
  if (merged.tipo === 'sftp') {
    if (!merged.sftp?.host || !merged.sftp?.remotePath) {
      throw new Error('Host e caminho SFTP são obrigatórios');
    }
    if (!merged.sftpPassword) {
      throw new Error('Senha SFTP é obrigatória na primeira configuração');
    }
  }

  const unidade = await prisma.unidades.findFirst({
    where: { id: merged.unidadeId, mercadoId, ativa: true },
  });
  if (!unidade) throw new Error('Unidade inválida para este mercado');

  await salvarConfig(mercadoId, merged);
  return merged;
}

export async function executarSyncMercado(
  mercadoId: string,
  forcar = false
): Promise<{ ok: boolean; resultado?: ResultadoUpload; mensagem: string }> {
  const config = await obterConfigSync(mercadoId);
  if (!config) {
    return { ok: false, mensagem: 'Sync não configurado' };
  }
  if (!config.ativo && !forcar) {
    return { ok: false, mensagem: 'Sync desativado' };
  }
  if (!forcar && !deveExecutarSync(config)) {
    return { ok: false, mensagem: 'Ainda não é hora da próxima execução' };
  }

  const executando: SyncAgendadoConfig = {
    ...config,
    ultimoStatus: 'executando',
    ultimaMensagem: 'Baixando catálogo…',
    ultimaExecucao: new Date().toISOString(),
  };
  await salvarConfig(mercadoId, executando);

  try {
    let buffer: Buffer;
    let fileName: string;

    if (config.tipo === 'url') {
      if (!config.url) throw new Error('URL não configurada');
      const baixado = await baixarArquivoUrl(config.url, config.urlHeaders);
      buffer = baixado.buffer;
      fileName = baixado.fileName;
    } else {
      const baixado = await baixarArquivoSftp(config);
      buffer = baixado.buffer;
      fileName = baixado.fileName;
    }

    const resultado = await processarUpload(
      buffer,
      `sync-${fileName}`,
      buffer.length,
      mercadoId,
      config.unidadeId
    );

    const statusFinal =
      resultado.erros === resultado.totalLinhas && resultado.sucesso === 0 ? 'falha' : 'sucesso';

    const mensagem = `${resultado.sucesso} ok, ${resultado.erros} erros, ${resultado.duplicados} atualizados`;

    await salvarConfig(mercadoId, {
      ...config,
      ultimoStatus: statusFinal,
      ultimaMensagem: mensagem,
      ultimaExecucao: new Date().toISOString(),
      ultimoResumo: {
        sucesso: resultado.sucesso,
        erros: resultado.erros,
        duplicados: resultado.duplicados,
        totalLinhas: resultado.totalLinhas,
      },
    });

    return { ok: statusFinal === 'sucesso', resultado, mensagem };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro no sync';
    await salvarConfig(mercadoId, {
      ...config,
      ultimoStatus: 'falha',
      ultimaMensagem: mensagem,
      ultimaExecucao: new Date().toISOString(),
    });
    return { ok: false, mensagem };
  }
}

export async function executarSyncsDevidos(): Promise<{
  executados: number;
  ignorados: number;
  falhas: number;
}> {
  const mercados = await prisma.mercados.findMany({
    where: { ativo: true },
    select: { id: true, syncAgendado: true },
  });

  let executados = 0;
  let ignorados = 0;
  let falhas = 0;

  for (const m of mercados) {
    const config = parseSyncAgendado(m.syncAgendado);
    if (!config) {
      ignorados++;
      continue;
    }
    if (!config.ativo) {
      ignorados++;
      continue;
    }
    if (!deveExecutarSync(config)) {
      ignorados++;
      continue;
    }

    const res = await executarSyncMercado(m.id, false);
    if (res.mensagem === 'Ainda não é hora da próxima execução') {
      ignorados++;
      continue;
    }
    if (res.ok) executados++;
    else falhas++;
  }

  return { executados, ignorados, falhas };
}
