// API Route: Marcar alerta como lido
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { alertaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const alertaId = params.alertaId;
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

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






