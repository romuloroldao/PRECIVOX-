import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularChurnRisk } from '@/lib/ml-leve/churn-scorer';
import { calcularElasticidadeUsuario } from '@/lib/ml-leve/elasticidade-usuario';
import { lerMlLeveSnapshot } from '@/lib/ml-leve/snapshot-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/ml-insights?mercadoId=
 * Retorna churn + elasticidade (batch se existir, senão calcula on-the-fly).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });

    const cached = lerMlLeveSnapshot(dbUser?.perfilPreci, mercadoId);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: {
          fonte: 'batch',
          churn: cached.churn,
          elasticidade: cached.elasticidade,
          atualizadoEm: cached.atualizadoEm,
        },
      });
    }

    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 60);
    const eventos = await EventCollector.getUserEvents(user.id, mercadoId, inicio, new Date());

    return NextResponse.json({
      success: true,
      data: {
        fonte: 'tempo_real',
        churn: calcularChurnRisk(eventos),
        elasticidade: calcularElasticidadeUsuario(eventos),
        atualizadoEm: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('[ml-insights]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
