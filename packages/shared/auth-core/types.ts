/**
 * ARCH-FREEZE-01: Tipos de autenticação runtime-agnósticos.
 * Nenhuma dependência de Next.js, Express ou server-only.
 */

export type Role = 'ADMIN' | 'GESTOR' | 'USUARIO' | 'IA_AGENT';

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  nome?: string | null;
  tokenVersion?: number;
};

export interface IAAgentContext {
  agentId: string;
  agentType: string;
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface IssueTokenContext {
  userAgent?: string | null;
  ip?: string | null;
}
