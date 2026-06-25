// Middleware de Autenticação JWT para PRECIVOX
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt-secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
    nome: string;
  };
}

function accessTokenCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-precivox-access-token'
    : 'precivox-access-token';
}

function tryAccessTokenCookie(req: Request): string | null {
  const cookieName = accessTokenCookieName();
  const token = req.cookies?.[cookieName];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * Middleware que verifica o token JWT (Authorization header ou cookie precivox-access-token)
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let decoded: jwt.JwtPayload | null = null;
    const jwtSecret = getJwtSecret();

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      } catch {
        decoded = null;
      }
    }

    if (!decoded) {
      const cookieToken = tryAccessTokenCookie(req);
      if (cookieToken) {
        try {
          decoded = jwt.verify(cookieToken, jwtSecret) as jwt.JwtPayload;
        } catch {
          decoded = null;
        }
      }
    }

    if (!decoded) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'É necessário estar autenticado para acessar este recurso',
      });
    }

    req.user = {
      id: (decoded.id as string) || (decoded.sub as string),
      email: decoded.email as string,
      role: (decoded.role as 'ADMIN' | 'GESTOR' | 'CLIENTE') || 'CLIENTE',
      nome: (decoded.nome as string) || (decoded.name as string) || '',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
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

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: `Você não tem permissão para acessar este recurso. Permissões necessárias: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Gera um token JWT para um usuário
 */
export const generateToken = (user: {
  id: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
  nome: string;
}) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};
