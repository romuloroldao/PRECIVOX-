import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

const PREFIX = 'precivox_reset:';
const EXPIRES_HOURS = 1;

const schema = z.object({
  email: z.string().email('E-mail inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    const emailNorm = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      select: { id: true, email: true, nome: true },
    });

    // Sempre retornar mesma mensagem para não revelar se o e-mail existe
    const successMessage = 'Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';

    if (!user) {
      return NextResponse.json({ success: true, message: successMessage });
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
    const resetLink = `${baseUrl}/resetar-senha?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail({
      email: user.email,
      nome: user.nome,
      resetLink,
    });

    return NextResponse.json({ success: true, message: successMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'E-mail inválido' },
        { status: 400 }
      );
    }
    console.error('Erro em forgot-password:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar. Tente novamente.' },
      { status: 500 }
    );
  }
}
