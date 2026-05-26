import { NextRequest, NextResponse } from 'next/server';
import {
  calcularEconomiaLiquida,
  calcularEconomiaLiquidaCesta,
  distanciaKmEntreCoords,
} from '@/lib/economia-liquida';

/**
 * POST /api/economia-liquida/calcular
 * Cálculo explicável de Economia Líquida (Sprint 0 — base para Sprint 1 UI).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      precoOrigem,
      precoDestino,
      distanciaKm,
      origemLat,
      origemLon,
      destinoLat,
      destinoLon,
      valorHoraReais,
      custoKmReais,
      itens,
    } = body as {
      precoOrigem?: number;
      precoDestino?: number;
      distanciaKm?: number;
      origemLat?: number;
      origemLon?: number;
      destinoLat?: number;
      destinoLon?: number;
      valorHoraReais?: number;
      custoKmReais?: number;
      itens?: Array<{ precoOrigem: number; precoDestino: number; quantidade?: number }>;
    };

    let distancia: number | null =
      typeof distanciaKm === 'number' && !Number.isNaN(distanciaKm) ? distanciaKm : null;

    if (
      distancia == null &&
      [origemLat, origemLon, destinoLat, destinoLon].every(v => typeof v === 'number')
    ) {
      distancia = distanciaKmEntreCoords(
        origemLat!,
        origemLon!,
        destinoLat!,
        destinoLon!
      );
    }

    const opts = {
      distanciaKm: distancia,
      valorHoraReais,
      custoKmReais,
    };

    if (Array.isArray(itens) && itens.length > 0) {
      const resultado = calcularEconomiaLiquidaCesta(itens, opts);
      return NextResponse.json({ success: true, data: resultado });
    }

    if (typeof precoOrigem !== 'number' || typeof precoDestino !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Informe precoOrigem e precoDestino, ou itens[]' },
        { status: 400 }
      );
    }

    const resultado = calcularEconomiaLiquida({
      precoOrigem,
      precoDestino,
      ...opts,
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (e) {
    console.error('[economia-liquida/calcular]', e);
    return NextResponse.json({ success: false, error: 'Erro ao calcular' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
