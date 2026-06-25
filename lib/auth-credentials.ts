/**
 * Validação de credenciais (e-mail + senha) via Prisma.
 * Espelha a lógica do CredentialsProvider em lib/auth.ts — autoridade de identidade
 * no BFF até a migração completa para Express.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { autoUnlockBadgesServer } from '@/lib/gamification-server';
import { checkAndUpdateStreak } from '@/lib/streak-server';

export type CredentialsUser = {
  id: string;
  email: string;
  nome: string | null;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
  imagem: string | null;
  tokenVersion: number;
};

export type CredentialsResult =
  | { ok: true; user: CredentialsUser }
  | { ok: false; code: 'INVALID_CREDENTIALS'; error: string }
  | { ok: false; code: 'EMAIL_NOT_VERIFIED'; error: string; email: string };

export async function validateCredentials(
  email: string,
  password: string
): Promise<CredentialsResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const usuario = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      nome: true,
      role: true,
      imagem: true,
      senhaHash: true,
      emailVerified: true,
      tokenVersion: true,
    },
  });

  if (!usuario || !usuario.senhaHash) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      error: 'E-mail ou senha incorretos. Verifique os dados e tente novamente.',
    };
  }

  const senhaValida = await bcrypt.compare(password, usuario.senhaHash);
  if (!senhaValida) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      error: 'E-mail ou senha incorretos. Verifique os dados e tente novamente.',
    };
  }

  // CLIENTE precisa confirmar e-mail; GESTOR/ADMIN podem entrar sem confirmação
  if (!usuario.emailVerified && usuario.role === 'CLIENTE') {
    return {
      ok: false,
      code: 'EMAIL_NOT_VERIFIED',
      error: 'Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e o spam.',
      email: usuario.email,
    };
  }

  await prisma.user.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date(), dataAtualizacao: new Date() },
  });

  try {
    const streakResult = await checkAndUpdateStreak(usuario.id);
    if (streakResult.shouldUnlockBadge) {
      await autoUnlockBadgesServer(usuario.id, 'daily_login');
    }
  } catch (err) {
    console.error('[auth-credentials] streak/gamification:', err);
  }

  return {
    ok: true,
    user: {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      imagem: usuario.imagem,
      tokenVersion: usuario.tokenVersion ?? 0,
    },
  };
}
