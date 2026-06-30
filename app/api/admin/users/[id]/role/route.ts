import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/token-manager';
import { z } from 'zod';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

const updateRoleSchema = z.object({
  role: z.enum(['CLIENTE', 'GESTOR', 'ADMIN']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiSession(request, { roles: ['ADMIN'] });
  if (isAuthResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        role,
        // Invalida JWTs emitidos antes da troca de role
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });

    await TokenManager.revokeUserTokens(params.id);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
