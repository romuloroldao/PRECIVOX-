import { Request, Response, NextFunction } from 'express';
import { validateAccessToken } from '../auth/validate-access-token';
import { prisma } from '@shared/prisma';
const ENABLE_TOKEN_VERSION = process.env.ENABLE_TOKEN_VERSION === 'true';

/** Super Admin Global: bypass de role para acesso total */
const SUPER_ADMIN_EMAIL = 'romulo.roldao@gmail.com';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    sub?: string;
    email: string;
    role: 'ADMIN' | 'GESTOR' | 'CLIENTE' | 'USUARIO';
    nome: string;
    exp?: number;
    tokenVersion?: number;
  };
}

/**
 * Middleware que verifica o token JWT (Authorization: Bearer)
 */
async function isTokenVersionValid(userId: string, tokenVersion: number): Promise<boolean> {
  if (!ENABLE_TOKEN_VERSION) return true;
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  if (!dbUser) return false;
  return (dbUser.tokenVersion ?? 0) === (tokenVersion ?? 0);
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'É necessário estar autenticado para acessar este recurso',
      });
    }

    const decoded = validateAccessToken(token);
    const email = decoded.email || '';
    req.user = {
      id: decoded.id || decoded.sub,
      sub: decoded.sub,
      email,
      role: email === SUPER_ADMIN_EMAIL ? 'ADMIN' : (decoded.role || 'CLIENTE'),
      nome: decoded.nome || '',
      exp: decoded.exp,
      tokenVersion: decoded.tokenVersion,
    };

    const validVersion = await isTokenVersionValid(req.user.id, req.user.tokenVersion ?? 0);
    if (!validVersion) {
      return res.status(401).json({
        error: 'Token revogado',
        message: 'Sua sessao foi invalidada. Faca login novamente.',
      });
    }
    next();
  } catch (error) {
    if ((error as any)?.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Seu token expirou. Por favor, faça login novamente',
      });
    }
    return res.status(500).json({
      error: 'Erro de autenticação',
      message: 'Ocorreu um erro ao verificar suas credenciais',
    });
  }
};

/**
 * Middleware de autenticação opcional
 * Tenta identificar o usuário, mas não bloqueia se não houver token
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let decoded: ReturnType<typeof validateAccessToken> | null = null;
    if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('undefined') && !authHeader.includes('null')) {
      const token = authHeader.substring(7);
      try {
        decoded = validateAccessToken(token);
      } catch {
        decoded = null;
      }
    }

    if (decoded) {
      const email = decoded.email || '';
      req.user = {
        id: decoded.id || decoded.sub,
        sub: decoded.sub,
        email,
        role: email === SUPER_ADMIN_EMAIL ? 'ADMIN' : (decoded.role || 'CLIENTE'),
        nome: decoded.nome || '',
        exp: decoded.exp,
        tokenVersion: decoded.tokenVersion,
      };
      const validVersion = await isTokenVersionValid(req.user.id, req.user.tokenVersion ?? 0);
      if (!validVersion) req.user = undefined;
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware que verifica se o usuário tem permissão baseada em role
 */
export const authorizeRole = (...allowedRoles: Array<'ADMIN' | 'GESTOR' | 'CLIENTE'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado',
      });
    }

    const normalizedRole = req.user.role === 'USUARIO' ? 'CLIENTE' : req.user.role;
    if (req.user.email !== SUPER_ADMIN_EMAIL && !allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: `Você não tem permissão para acessar este recurso. Permissões necessárias: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

