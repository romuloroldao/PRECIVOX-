/**
 * ARCH-FREEZE-01: TokenManager core - 100% runtime-agnóstico.
 * R1: Nenhuma importação de server-only, next/headers, next-auth.
 * Super Admin bypass: romulo.roldao@gmail.com aplicado antes da validação de role.
 */

import crypto from 'crypto';
import { prisma } from '@shared/prisma';
import { generateToken, validateAccessToken, extractTokenFromHeader } from '@shared/jwt';
import type { SessionUser, Role, TokenPair, IssueTokenContext } from './types';

/** Super Admin Global: bypass de role no nível central (ARCH-FREEZE-01) */
const SUPER_ADMIN_EMAIL = 'romulo.roldao@gmail.com';

function applySuperAdmin(user: SessionUser): SessionUser {
  if (user.email === SUPER_ADMIN_EMAIL) {
    return { ...user, role: 'ADMIN' as Role };
  }
  return user;
}

function normalizeRole(role: string): Role {
  if (role === 'CLIENTE') return 'USUARIO';
  return role as Role;
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async issueTokenPair(user: SessionUser, ctx?: IssueTokenContext): Promise<TokenPair> {
    const normalizedRole = normalizeRole(user.role);
    const normalizedTokenVersion = user.tokenVersion ?? 0;
    const accessToken = await generateToken(
      {
        sub: user.id,
        id: user.id,
        email: user.email,
        role: normalizedRole as any,
        nome: user.nome || null,
        tokenVersion: normalizedTokenVersion,
      },
      this.ACCESS_TOKEN_EXPIRES_IN
    );
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_IN_DAYS);

    await prisma.refreshToken.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt,
        revoked: false,
        userAgent: ctx?.userAgent ?? undefined,
        ipAddress: ctx?.ip ?? undefined,
      },
    });

    return { accessToken, refreshToken, expiresAt };
  }

  static async validateAccessToken(token: string): Promise<SessionUser | null> {
    try {
      const payload = await validateAccessToken(token);
      if (!payload) return null;
      const user = applySuperAdmin({
        id: payload.sub || payload.id,
        email: payload.email,
        role: normalizeRole(payload.role),
        nome: payload.nome || null,
        tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0,
      });
      return user;
    } catch {
      return null;
    }
  }

  static async rotateRefreshToken(refreshToken: string, ctx?: IssueTokenContext): Promise<TokenPair | null> {
    try {
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await prisma.refreshToken.findFirst({
        where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
        include: { user: true },
      });
      if (!storedToken) return null;
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      const user: SessionUser = applySuperAdmin({
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: normalizeRole(storedToken.user.role),
        nome: storedToken.user.nome,
        tokenVersion: (storedToken.user as any).tokenVersion ?? 0,
      });
      return await this.issueTokenPair(user, ctx);
    } catch (error) {
      console.error('[TokenManager] Erro ao rotacionar refresh token:', error);
      return null;
    }
  }

  static async revokeUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  /** Export para adaptadores: extrair token do header */
  static extractTokenFromHeader = extractTokenFromHeader;
}

export type { SessionUser, Role, TokenPair, IssueTokenContext };
