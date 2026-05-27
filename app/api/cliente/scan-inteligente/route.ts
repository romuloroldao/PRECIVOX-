import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import { buscarMatchesScan } from '@/lib/scan-inteligente';
import { detectarMercadoVivo, normalizarRaioGeofenceMetros } from '@/lib/modo-mercado-vivo';

export const dynamic = 'force-dynamic';

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
    const textoOcr = String(body.textoOcr ?? body.texto ?? '').trim();
    if (textoOcr.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Texto OCR muito curto' },
        { status: 400 }
      );
    }

    let mercadoId = body.mercadoId ? String(body.mercadoId) : '';
    if (!mercadoId) {
      const lat = parseFloat(String(body.lat ?? ''));
      const lon = parseFloat(String(body.lon ?? ''));
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const raio = normalizarRaioGeofenceMetros(body.raioMetros);
        const det = await detectarMercadoVivo(lat, lon, raio);
        if (det?.mercadoId) mercadoId = det.mercadoId;
      }
    }

    if (!mercadoId) {
      const perfil = await prisma.user.findUnique({
        where: { id: user.id },
        select: { perfilPreci: true },
      });
      const p = perfil?.perfilPreci as { mercadoPreferidoId?: string } | null;
      if (p?.mercadoPreferidoId) mercadoId = p.mercadoPreferidoId;
    }

    if (!mercadoId) {
      return NextResponse.json(
        { success: false, error: 'Informe o mercado ou ative a localização' },
        { status: 400 }
      );
    }

    const precoEtiqueta =
      body.precoEtiqueta != null ? parseFloat(String(body.precoEtiqueta)) : null;

    const resultado = await buscarMatchesScan({
      textoOcr,
      mercadoId,
      precoEtiqueta: Number.isFinite(precoEtiqueta!) ? precoEtiqueta : null,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        mercadoId,
        ...resultado,
      },
    });
  } catch (e) {
    console.error('[scan-inteligente]', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar scan' },
      { status: 500 }
    );
  }
}
