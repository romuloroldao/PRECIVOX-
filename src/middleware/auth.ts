// Middleware de Autenticação JWT para PRECIVOX
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
    nome: string;
  };
}

/**
 * Middleware que verifica o token JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'É necessário estar autenticado para acessar este recurso',
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
      nome: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'O token fornecido não é válido',
      });
    }

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

