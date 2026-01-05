/**
 * TokenManager - Gerenciamento Centralizado de Tokens
 * 
 * Arquitetura:
 * - Access Token: JWT curto (15 minutos) - stateless
 * - Refresh Token: Hash armazenado no banco - stateful
 * - Rotação de refresh token a cada uso
 * - Revogação suportada
 * 
 * IMPORTANTE: Workers podem usar tokens sem depender de sessão web
 */

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { generateToken, verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import crypto from 'crypto';

export type SessionUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
  nome?: string | null;
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class TokenManager {
  // Duração dos tokens
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutos
  private static readonly REFRESH_TOKEN_EXPIRES_IN_DAYS = 30; // 30 dias

  /**
   * Gera hash seguro para refresh token
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Gera refresh token aleatório
   */
  private static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Emite par de tokens (Access + Refresh)
   */
  static async issueTokenPair(user: SessionUser): Promise<TokenPair> {
    // 1. Gerar Access Token (JWT curto - 15 minutos)
    const accessToken = await generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        nome: user.nome || null,
      },
      this.ACCESS_TOKEN_EXPIRES_IN
    );

    // 2. Gerar Refresh Token (aleatório)
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);

    // 3. Calcular expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_IN_DAYS);

    // 4. Armazenar refresh token no banco
    await prisma.refreshToken.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt,
        revoked: false,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Valida Access Token (JWT)
   */
  static async validateAccessToken(token: string): Promise<SessionUser | null> {
    try {
      const payload = await verifyToken(token);
      if (!payload) {
        return null;
      }

      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        nome: payload.nome || null,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Valida Refresh Token e retorna novo par de tokens (rotação)
   */
  static async rotateRefreshToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      const tokenHash = this.hashToken(refreshToken);

      // Buscar refresh token no banco
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!storedToken) {
        return null;
      }

      // Revogar token antigo
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });

      // Gerar novo par de tokens
      const user: SessionUser = {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role as 'ADMIN' | 'GESTOR' | 'CLIENTE',
        nome: storedToken.user.nome,
      };

      return await this.issueTokenPair(user);
    } catch (error) {
      console.error('[TokenManager] Erro ao rotacionar refresh token:', error);
      return null;
    }
  }

  /**
   * Revoga todos os refresh tokens de um usuário
   */
  static async revokeUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Valida sessão atual (compatível com NextAuth e tokens próprios)
   * 
   * Ordem de verificação:
   * 1. Access Token no header Authorization
   * 2. Access Token no cookie precivox-access-token
   * 3. Session token do NextAuth (para compatibilidade)
   */
  static async validateSession(request?: {
    headers?: Headers | { get: (name: string) => string | null };
    cookies?: { get: (name: string) => { value: string } | undefined };
  }): Promise<SessionUser | null> {
    try {
      // 1. Tentar ler Access Token do header Authorization
      if (request?.headers) {
        let authHeader: string | null = null;
        
        try {
          if (request.headers instanceof Headers) {
            authHeader = request.headers.get('authorization');
          } else {
            // Tentar como objeto com método get
            const headers = request.headers as any;
            if (headers && typeof headers.get === 'function') {
              authHeader = headers.get('authorization');
            }
          }
        } catch (error) {
          // Ignorar erro e continuar
        }
          
        if (authHeader) {
          const token = extractTokenFromHeader(authHeader);
          if (token) {
            const user = await this.validateAccessToken(token);
            if (user) {
              return user;
            }
          }
        }
      }

      // 2. Tentar ler Access Token do cookie
      const cookieStore = cookies();
      const accessTokenCookie = cookieStore.get('precivox-access-token')?.value;
      if (accessTokenCookie) {
        const user = await this.validateAccessToken(accessTokenCookie);
        if (user) {
          return user;
        }
      }

      // 3. Fallback: Tentar ler session token do NextAuth (compatibilidade)
      const nextAuthToken = cookieStore.get(
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token'
      )?.value;

      if (nextAuthToken) {
        const session = await prisma.sessions.findUnique({
          where: { sessionToken: nextAuthToken },
          include: { user: true },
        });

        if (session && session.expires > new Date()) {
          return {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role as 'ADMIN' | 'GESTOR' | 'CLIENTE',
            nome: session.user.nome,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[TokenManager] Erro ao validar sessão:', error);
      return null;
    }
  }

  /**
   * Valida se usuário tem role específico
   */
  static async validateRole(
    requiredRole: 'ADMIN' | 'GESTOR' | 'CLIENTE',
    request?: Parameters<typeof this.validateSession>[0]
  ): Promise<SessionUser | null> {
    const user = await this.validateSession(request);

    if (!user || user.role !== requiredRole) {
      return null;
    }

    return user;
  }

  /**
   * Valida se usuário tem um dos roles permitidos
   */
  static async validateRoles(
    allowedRoles: ('ADMIN' | 'GESTOR' | 'CLIENTE')[],
    request?: Parameters<typeof this.validateSession>[0]
  ): Promise<SessionUser | null> {
    const user = await this.validateSession(request);

    if (!user || !allowedRoles.includes(user.role)) {
      return null;
    }

    return user;
  }
}
