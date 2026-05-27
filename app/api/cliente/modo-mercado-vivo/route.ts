import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { detectarMercadoVivo, GEOFENCE_RAIO_METROS } from '@/lib/modo-mercado-vivo';

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

    const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '');
    const lon = parseFloat(req.nextUrl.searchParams.get('lon') || '');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { success: false, error: 'lat e lon obrigatórios' },
        { status: 400 }
      );
    }

    const deteccao = await detectarMercadoVivo(lat, lon);
    if (!deteccao) {
      return NextResponse.json({
        success: true,
        data: {
          dentro: false,
          raioMetros: GEOFENCE_RAIO_METROS,
          mensagem: 'Nenhuma loja PRECIVOX próxima. Aproxime-se do mercado para ativar o modo corredor.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...deteccao,
        raioMetros: GEOFENCE_RAIO_METROS,
        mensagem: `Você está a ~${deteccao.distanciaMetros} m de ${deteccao.unidadeNome}.`,
      },
    });
  } catch (e) {
    console.error('[modo-mercado-vivo GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const lat = parseFloat(body.lat);
    const lon = parseFloat(body.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ success: false, error: 'lat e lon obrigatórios' }, { status: 400 });
    }

    let deteccao = await detectarMercadoVivo(lat, lon);
    const mercadoIdManual = body.mercadoId as string | undefined;

    if (!deteccao && mercadoIdManual) {
      const unidade = await prisma.unidades.findFirst({
        where: { mercadoId: mercadoIdManual, ativa: true },
        include: { mercados: { select: { id: true, nome: true } } },
      });
      if (unidade) {
        deteccao = {
          dentro: false,
          distanciaMetros: -1,
          mercadoId: unidade.mercadoId,
          mercadoNome: unidade.mercados.nome,
          unidadeId: unidade.id,
          unidadeNome: unidade.nome,
          endereco: unidade.endereco,
          cidade: unidade.cidade,
        };
      }
    }

    if (!deteccao) {
      return NextResponse.json(
        { success: false, error: 'Fora da área do mercado ou mercado não encontrado' },
        { status: 422 }
      );
    }

    try {
      await EventCollector.recordEvent(user.id, deteccao.mercadoId, 'checkin_mercado', {
        unidadeId: deteccao.unidadeId,
        lat,
        lon,
        modo: 'mercado_vivo',
        distanciaMetros: deteccao.distanciaMetros,
      });
    } catch {
      /* não bloquear */
    }

    return NextResponse.json({
      success: true,
      data: {
        ...deteccao,
        checkinEm: new Date().toISOString(),
        redirectUrl: '/cliente/mercado-vivo',
      },
    });
  } catch (e) {
    console.error('[modo-mercado-vivo POST]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
