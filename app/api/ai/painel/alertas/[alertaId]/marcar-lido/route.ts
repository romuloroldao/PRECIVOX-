// API Route: Marcar alerta como lido
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function PUT(
  request: NextRequest,
  { params }: { params: { alertaId: string } }
) {
  try {
    const auth = await requireApiSession(request);
    if (isAuthResponse(auth)) return auth;

    const alertaId = params.alertaId;
    const userRole = auth.role;
    const userId = auth.id;

    // Buscar alerta
    const alerta = await prisma.alertas_ia.findUnique({
      where: { id: alertaId },
      include: {
        mercados: true
      }
    });

    if (!alerta) {
      return NextResponse.json(
        { success: false, error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (userRole === 'GESTOR' && alerta.mercados.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Marcar como lido
    const alertaAtualizado = await prisma.alertas_ia.update({
      where: { id: alertaId },
      data: {
        lido: true,
        lidoEm: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: alertaAtualizado,
      message: 'Alerta marcado como lido'
    });
  } catch (error) {
    console.error('Erro ao marcar alerta como lido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao marcar alerta como lido' },
      { status: 500 }
    );
  }
}
