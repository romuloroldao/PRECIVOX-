import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import {
  configParaResposta,
  obterConfigSync,
  salvarConfigSync,
  type SyncAgendadoConfig,
  type SyncFonteTipo,
  type SyncIntervalo,
} from '@/lib/sync-agendado';

export const dynamic = 'force-dynamic';

async function autorizarMercado(
  user: { id: string; role: string },
  mercadoId: string
): Promise<boolean> {
  const mercado = await prisma.mercados.findUnique({
    where: { id: mercadoId },
    select: { gestorId: true },
  });
  if (!mercado) return false;
  if (user.role === 'ADMIN') return true;
  return user.role === 'GESTOR' && mercado.gestorId === user.id;
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const config = await obterConfigSync(mercadoId);
    const unidades = await prisma.unidades.findMany({
      where: { mercadoId, ativa: true },
      select: { id: true, nome: true },
    });

    const logs = await prisma.logs_importacao.findMany({
      where: { mercadoId, nomeArquivo: { startsWith: 'sync-' } },
      orderBy: { dataInicio: 'desc' },
      take: 5,
      select: {
        id: true,
        nomeArquivo: true,
        status: true,
        linhasSucesso: true,
        linhasErro: true,
        dataInicio: true,
        dataFim: true,
        mensagemErro: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        config: config ? configParaResposta(config) : null,
        unidades,
        logs,
        intervalos: ['6h', '12h', '24h', 'semanal'] as SyncIntervalo[],
        tipos: ['url', 'sftp'] as SyncFonteTipo[],
      },
    });
  } catch (e) {
    console.error('[sync-agendado GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (!['ADMIN', 'GESTOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const mercadoId = String(body.mercadoId ?? '');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }
    if (!(await autorizarMercado(user, mercadoId))) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const input: Partial<SyncAgendadoConfig> & { unidadeId: string; tipo: SyncFonteTipo } = {
      ativo: Boolean(body.ativo),
      unidadeId: String(body.unidadeId),
      tipo: body.tipo === 'sftp' ? 'sftp' : 'url',
      url: body.url ? String(body.url) : undefined,
      urlHeaders:
        body.urlHeaders && typeof body.urlHeaders === 'object'
          ? (body.urlHeaders as Record<string, string>)
          : undefined,
      intervalo: (['6h', '12h', '24h', 'semanal'].includes(body.intervalo)
        ? body.intervalo
        : '24h') as SyncIntervalo,
      sftp:
        body.sftp && typeof body.sftp === 'object'
          ? {
              host: String(body.sftp.host ?? ''),
              port: parseInt(String(body.sftp.port ?? '22'), 10) || 22,
              username: String(body.sftp.username ?? ''),
              remotePath: String(body.sftp.remotePath ?? ''),
            }
          : undefined,
      sftpPassword: body.sftpPassword ? String(body.sftpPassword) : undefined,
    };

    const config = await salvarConfigSync(mercadoId, input);
    return NextResponse.json({
      success: true,
      data: { config: configParaResposta(config) },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao salvar';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
