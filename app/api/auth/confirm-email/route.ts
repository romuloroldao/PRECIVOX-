import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';

const PREFIX = 'precivox_verify:';

/**
 * POST /api/auth/confirm-email
 * Body: { token: string }
 * Valida o token, marca emailVerified no usuário e remove o token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token é obrigatório' },
        { status: 400 }
      );
    }

    const record = await prisma.verification_tokens.findUnique({
      where: { token },
    });

    if (!record || !record.identifier.startsWith(PREFIX) || record.expires < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Link inválido ou expirado. Solicite um novo no login.' },
        { status: 400 }
      );
    }

    const email = record.identifier.replace(PREFIX, '');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await prisma.verification_tokens.delete({ where: { token } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Conta não encontrada.' },
        { status: 400 }
      );
    }

    const alreadyVerified = user.emailVerified != null;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), dataAtualizacao: new Date() },
      }),
      prisma.verification_tokens.delete({ where: { token } }),
    ]);

    // E-mail de boas-vindas apenas na primeira confirmação. Não bloqueia a resposta.
    if (!alreadyVerified) {
      sendWelcomeEmail({ nome: user.nome || '', email: user.email }).catch((err) => {
        console.error('[confirm-email] Falha ao enviar boas-vindas:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'E-mail confirmado com sucesso. Você já pode fazer login.',
    });
  } catch (error) {
    console.error('Erro em confirm-email:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao confirmar. Tente novamente.' },
      { status: 500 }
    );
  }
}
