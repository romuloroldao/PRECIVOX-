import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import {
  GEOFENCE_RAIO_METROS,
  GEOFENCE_RAIO_OPCOES,
  GEOFENCE_RAIO_MIN,
  GEOFENCE_RAIO_MAX,
  normalizarRaioGeofenceMetros,
  parseRaioGeofencePerfil,
} from '@/lib/modo-mercado-vivo';

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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });

    const raioMetros = parseRaioGeofencePerfil(dbUser?.perfilPreci);

    return NextResponse.json({
      success: true,
      data: {
        raioMetros,
        padrao: GEOFENCE_RAIO_METROS,
        min: GEOFENCE_RAIO_MIN,
        max: GEOFENCE_RAIO_MAX,
        opcoes: [...GEOFENCE_RAIO_OPCOES],
      },
    });
  } catch (e) {
    console.error('[modo-mercado-vivo/config GET]', e);
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
    const raioMetros = normalizarRaioGeofenceMetros(body.raioMetros);

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
        perfilPreci: {
          ...base,
          geofenceRaioMetros: raioMetros,
          atualizadoEm: new Date().toISOString(),
        },
        dataAtualizacao: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { raioMetros },
    });
  } catch (e) {
    console.error('[modo-mercado-vivo/config PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
