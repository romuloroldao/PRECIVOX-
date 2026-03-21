import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const PREFIX = 'precivox_reset:';

const schema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = schema.parse(body);

    const rawToken = token.trim();
    const record = await prisma.verification_tokens.findUnique({
      where: { token: rawToken },
    });

    if (!record || !record.identifier.startsWith(PREFIX) || record.expires < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Link inválido ou expirado. Solicite um novo.' },
        { status: 400 }
      );
    }

    const email = record.identifier.replace(PREFIX, '');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await prisma.verification_tokens.delete({ where: { token: rawToken } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Link inválido ou expirado.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { senhaHash: hashedPassword, dataAtualizacao: new Date() },
      }),
      prisma.verification_tokens.delete({ where: { token: rawToken } }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso. Faça login com a nova senha.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }
    console.error('Erro em reset-password:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar. Tente novamente.' },
      { status: 500 }
    );
  }
}
