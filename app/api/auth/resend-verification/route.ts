import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const PREFIX = 'precivox_verify:';
const EXPIRES_HOURS = 24;

const schema = z.object({
  email: z.string().email('E-mail inválido'),
});

/**
 * POST /api/auth/resend-verification
 * Reenvia o e-mail de confirmação para o endereço informado.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    const emailNorm = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      select: { id: true, email: true, nome: true, emailVerified: true },
    });

    // Mesma resposta se não existir ou já verificado (não revelar estado)
    const successMessage = 'Se esse e-mail estiver cadastrado e ainda não confirmado, você receberá um novo link em instantes.';

    if (!user) {
      return NextResponse.json({ success: true, message: successMessage });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Este e-mail já está confirmado. Faça login normalmente.',
      });
    }

    const identifier = `${PREFIX}${user.email}`;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

    await prisma.verification_tokens.deleteMany({
      where: { identifier },
    });

    await prisma.verification_tokens.create({
      data: { identifier, token, expires },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const confirmLink = `${baseUrl}/confirmar-email?token=${encodeURIComponent(token)}`;

    await sendVerificationEmail({
      nome: user.nome || '',
      email: user.email,
      confirmLink,
    });

    return NextResponse.json({
      success: true,
      message: 'Enviamos um novo link de confirmação para o seu e-mail. Verifique a caixa de entrada e o spam.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'E-mail inválido' },
        { status: 400 }
      );
    }
    console.error('Erro em resend-verification:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao reenviar. Tente novamente.' },
      { status: 500 }
    );
  }
}
