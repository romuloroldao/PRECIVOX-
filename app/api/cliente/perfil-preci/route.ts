import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  calcularPerfilPreciDeEventos,
  mesclarComAjustes,
  type PerfilPreciAjustes,
  EIXO_LABELS,
} from '@/lib/perfil-preci';
import { getReputacaoCrowd } from '@/lib/crowd-reputacao';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const dias = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get('dias') || '30', 10)));
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);

    const [eventos, dbUser, reputacao] = await Promise.all([
      EventCollector.getUserEventsGlobal(user.id, inicio, fim),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { perfilPreci: true },
      }),
      getReputacaoCrowd(user.id),
    ]);

    const calculado = calcularPerfilPreciDeEventos(eventos);
    const ajustes = (dbUser?.perfilPreci as { ajustes?: PerfilPreciAjustes } | null)?.ajustes ?? null;
    const scoresEfetivos = mesclarComAjustes(calculado.scores, ajustes);

    return NextResponse.json({
      success: true,
      data: {
        ...calculado,
        ajustesUsuario: ajustes,
        scoresEfetivos,
        eixoLabels: EIXO_LABELS,
        reputacaoCrowd: reputacao,
        periodoDias: dias,
      },
    });
  } catch (e) {
    console.error('[perfil-preci GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const ajustes = body.ajustes as PerfilPreciAjustes | undefined;
    if (!ajustes || typeof ajustes !== 'object') {
      return NextResponse.json({ success: false, error: 'ajustes obrigatório' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });
    const base =
      dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
        ? (dbUser.perfilPreci as Record<string, unknown>)
        : {};

    await prisma.user.update({
      where: { id: user.id },
      data: {
        perfilPreci: { ...base, ajustes, atualizadoEm: new Date().toISOString() },
        dataAtualizacao: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Preferências salvas' });
  } catch (e) {
    console.error('[perfil-preci PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
