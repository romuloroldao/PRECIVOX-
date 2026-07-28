import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { autoUnlockBadgesServer } from '@/lib/gamification-server';
import { invalidate } from '@/lib/redis';
import { sendVerificationEmail, getBaseUrl } from '@/lib/email';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  aceiteTermos: z.boolean().refine((v) => v === true, 'Aceite dos termos é obrigatório'),
  aceiteNewsletter: z.boolean().optional().default(false),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.senha, 12);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome: validatedData.nome,
        email: validatedData.email,
        senhaHash: hashedPassword,
        role: 'CLIENTE', // Novo usuário sempre começa como CLIENTE
        dataAtualizacao: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        imagem: true,
      },
    });

    // Opt-in de newsletter no cadastro (best-effort, não bloqueia o registro)
    if (validatedData.aceiteNewsletter) {
      try {
        await prisma.newsletterSubscriber.upsert({
          where: { email: newUser.email },
          create: {
            email: newUser.email,
            nome: newUser.nome,
            origem: 'signup',
            status: 'active',
          },
          update: { status: 'active', unsubscribedAt: null },
        });
      } catch (err) {
        console.error('[register] falha ao inscrever na newsletter:', err);
      }
    }

    // Processar referral se código fornecido
    let referralReward = null;
    if (validatedData.referralCode) {
      try {
        // Verificar se código é válido
        const referral = await prisma.referral.findUnique({
          where: { code: validatedData.referralCode },
        });

        if (referral && referral.status === 'pending' && referral.referrerId !== newUser.id) {
          // Atualizar referral como completado
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              refereeId: newUser.id,
              status: 'completed',
              completedAt: new Date(),
            },
          });

          // Recompensar referrer
          await autoUnlockBadgesServer(referral.referrerId, 'referral_made');
          await invalidate(`badges:${referral.referrerId}`);

          // Recompensar referee (novo usuário)
          // Badge será desbloqueado automaticamente quando sistema de pontos for implementado
          await invalidate(`badges:${newUser.id}`);

          referralReward = {
            referrerRewarded: true,
            refereeRewarded: true,
            message: 'Você ganhou 50 pontos por usar um código de referral!',
          };
        }
      } catch (error) {
        console.error('Error processing referral:', error);
        // Não bloquear registro se referral falhar
      }
    }

    // Token de confirmação de e-mail (24h)
    const verifyPrefix = 'precivox_verify:';
    const verifyIdentifier = `${verifyPrefix}${newUser.email}`;
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const confirmLink = `${getBaseUrl()}/confirmar-email?token=${encodeURIComponent(verifyToken)}`;

    await prisma.verification_tokens.deleteMany({ where: { identifier: verifyIdentifier } });
    await prisma.verification_tokens.create({
      data: { identifier: verifyIdentifier, token: verifyToken, expires: verifyExpires },
    });

    const emailResult = await sendVerificationEmail({
      nome: newUser.nome || '',
      email: newUser.email,
      confirmLink,
    });

    if (!emailResult.ok) {
      console.error('[register] Falha ao enviar e-mail de confirmação:', emailResult);
    }

    return NextResponse.json({
      success: true,
      emailSent: emailResult.ok,
      ...(emailResult.ok
        ? {}
        : {
            warning:
              'Conta criada, mas não conseguimos enviar o e-mail agora. Use "Reenviar e-mail" na tela de login.',
          }),
      data: {
        usuario: newUser,
        redirectUrl: '/cliente/casa',
        referralReward,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar cadastro. Tente novamente.' },
      { status: 500 }
    );
  }
}
