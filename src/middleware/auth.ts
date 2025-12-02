// Middleware de Autenticação JWT para PRECIVOX
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || JWT_SECRET;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
    nome: string;
  };
}

/**
 * Tenta decodificar token JWT do NextAuth a partir dos cookies
 */
async function tryNextAuthCookie(req: Request): Promise<any | null> {
  try {
    // NextAuth armazena o token no cookie next-auth.session-token
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    
    const sessionToken = req.cookies?.[cookieName];
    
    if (!sessionToken) {
      return null;
    }

    // Tentar decodificar o token do NextAuth
    try {
      const decoded = jwt.verify(sessionToken, NEXTAUTH_SECRET) as any;
      return decoded;
    } catch (e) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Middleware que verifica o token JWT
 * Suporta tanto Authorization header quanto cookies do NextAuth
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let decoded: any | null = null;

    // Tentar autenticação via header Authorization primeiro
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Tenta validar com JWT_SECRET (backend) e, em fallback, com NEXTAUTH_SECRET
      const secretsToTry = [JWT_SECRET, NEXTAUTH_SECRET];
      for (const secret of secretsToTry) {
        try {
          decoded = jwt.verify(token, secret) as any;
          break;
        } catch (e) {
          decoded = null;
        }
      }
    }

    // Se não conseguiu via header, tentar via cookies do NextAuth
    if (!decoded) {
      decoded = await tryNextAuthCookie(req);
    }

    // Se ainda não conseguiu autenticar, retornar erro
    if (!decoded) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'É necessário estar autenticado para acessar este recurso',
      });
    }

    // Normaliza campos esperados
    req.user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'CLIENTE',
      nome: decoded.nome || decoded.name || '',
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
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
