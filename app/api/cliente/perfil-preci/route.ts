import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { EventCollector } from '@/lib/ai/event-collector';
import {
  calcularPerfilPreciDeEventos,
  mesclarComAjustes,
  type PerfilPreciAjustes,
  EIXO_LABELS,
} from '@/lib/perfil-preci';
import { getReputacaoCrowd } from '@/lib/crowd-reputacao';
import {
  elConfigEfetivo,
  parseElConfigFromPerfil,
  validarElConfigInput,
  type ElConfigUsuario,
} from '@/lib/el-config-usuario';
import { EL_DEFAULTS } from '@/lib/economia-liquida';

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
    const elConfigSalvo = parseElConfigFromPerfil(dbUser?.perfilPreci);
    const elConfig = elConfigEfetivo(elConfigSalvo);
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
        elConfig,
        elDefaults: {
          valorHoraReais: EL_DEFAULTS.valorHoraReais,
          custoKmReais: EL_DEFAULTS.custoKmReais,
        },
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
    const elConfigRaw = body.elConfig as Partial<ElConfigUsuario> | undefined;

    const temAjustes =
      ajustes &&
      typeof ajustes === 'object' &&
      Object.keys(ajustes).length > 0;
    const temElConfig = Boolean(elConfigRaw);

    if (!temAjustes && !temElConfig) {
      return NextResponse.json(
        { success: false, error: 'Informe ajustes e/ou elConfig' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });
    const base =
      dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
        ? (dbUser.perfilPreci as Record<string, unknown>)
        : {};

    const elValidado = elConfigRaw ? validarElConfigInput(elConfigRaw) : null;
    if (elConfigRaw && !elValidado) {
      return NextResponse.json({ success: false, error: 'elConfig inválido' }, { status: 400 });
    }

    if (elValidado) {
      base.elConfig = { ...elValidado, atualizadoEm: new Date().toISOString() };
    }
    if (temAjustes) {
      const prev = (base.ajustes as PerfilPreciAjustes | undefined) ?? {};
      base.ajustes = { ...prev, ...ajustes };
    }
    base.atualizadoEm = new Date().toISOString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        perfilPreci: base as Prisma.InputJsonValue,
        dataAtualizacao: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Preferências salvas' });
  } catch (e) {
    console.error('[perfil-preci PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
