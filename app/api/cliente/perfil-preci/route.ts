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
import { elConfigEfetivo, parseElConfigFromPerfil } from '@/lib/el-config-usuario';
import {
  montarElConfigPersistido,
  resolverElConfigPatchInput,
  resolverElPreferenciasFromPerfil,
  validarElPreferencias,
} from '@/lib/el-config-preferencias';
import { elOnboardingCompleto } from '@/lib/el-onboarding';
import { parseElRefinamentoPendente } from '@/lib/el-refinamento-core';
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
    const scoresEfetivos = mesclarComAjustes(calculado.scores, ajustes);
    const elConfig = elConfigEfetivo(elConfigSalvo);
    const elPreferencias = resolverElPreferenciasFromPerfil(dbUser?.perfilPreci, {
      scoreConveniencia: scoresEfetivos.conveniencia,
    });

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
        elPreferencias,
        elOnboardingCompleto: elOnboardingCompleto(dbUser?.perfilPreci),
        elRefinamentoPendente: parseElRefinamentoPendente(dbUser?.perfilPreci),
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
    const elConfigRaw = body.elConfig as
      | { valorHoraReais?: number; custoKmReais?: number }
      | undefined;
    const preferenciasRaw = body.preferencias;
    const onboardingCompleto = body.onboardingCompleto === true;

    const temAjustes =
      ajustes &&
      typeof ajustes === 'object' &&
      Object.keys(ajustes).length > 0;
    const temElPayload = Boolean(elConfigRaw || preferenciasRaw);

    if (!temAjustes && !temElPayload) {
      return NextResponse.json(
        { success: false, error: 'Informe ajustes e/ou preferencias/elConfig' },
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

    if (temElPayload) {
      const elResolvido = resolverElConfigPatchInput({
        preferencias: preferenciasRaw,
        elConfig: elConfigRaw,
      });
      if (!elResolvido) {
        return NextResponse.json(
          { success: false, error: 'preferencias ou elConfig inválido' },
          { status: 400 }
        );
      }
      const prevEl = base.elConfig as { onboardingCompleto?: boolean } | undefined;
      const marcarOnboarding =
        onboardingCompleto ||
        Boolean(validarElPreferencias(preferenciasRaw)) ||
        Boolean(prevEl?.onboardingCompleto);

      base.elConfig = montarElConfigPersistido(elResolvido.preferencias, elResolvido.numeros, {
        onboardingCompleto: marcarOnboarding || undefined,
      });
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
