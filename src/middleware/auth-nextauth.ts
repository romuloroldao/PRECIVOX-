// Middleware adicional para suportar autenticação via cookies do NextAuth
import { Request, Response, NextFunction } from 'express';
import { getToken } from 'next-auth/jwt';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'seu-secret-super-seguro';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
    nome: string;
  };
}

/**
 * Middleware que verifica autenticação via NextAuth cookies
 * Usado como fallback quando não há header Authorization
 */
export const authenticateNextAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Se já foi autenticado pelo middleware JWT padrão, pular
    if (req.user) {
      return next();
    }

    // Tentar obter token do NextAuth via cookies
    const token = await getToken({ 
      req: req as any, 
      secret: NEXTAUTH_SECRET 
    });

    if (!token) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'É necessário estar autenticado para acessar este recurso',
      });
    }

    // Normalizar dados do usuário
    req.user = {
      id: token.id as string || token.sub as string,
      email: token.email as string,
      role: (token.role as 'ADMIN' | 'GESTOR' | 'CLIENTE') || 'CLIENTE',
      nome: token.name as string || '',
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação NextAuth:', error);
    return res.status(500).json({
      error: 'Erro de autenticação',
      message: 'Ocorreu um erro ao verificar suas credenciais',
    });
  }
};
