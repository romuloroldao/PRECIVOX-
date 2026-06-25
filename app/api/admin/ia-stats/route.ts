import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAdmin(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const [totalAnalises, alertasAtivos, mercadosComIA, ultimaAnalise] = await Promise.all([
      prisma.analises_ia.count(),
      prisma.alertas_ia.count({ where: { lido: false } }),
      prisma.analises_ia
        .findMany({ select: { mercadoId: true }, distinct: ['mercadoId'] })
        .then((rows) => rows.length),
      prisma.analises_ia.findFirst({
        orderBy: { criadoEm: 'desc' },
        select: { criadoEm: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalAnalises,
        alertasAtivos,
        mercadosComIA,
        ultimaAnalise: ultimaAnalise?.criadoEm?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('[API /admin/ia-stats] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar estatísticas de IA' },
      { status: 500 },
    );
  }
}
