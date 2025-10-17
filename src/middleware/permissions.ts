// Middleware de Permissões Específicas para Mercados
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica se o gestor tem permissão para acessar um mercado específico
 */
export const canAccessMercado = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: mercadoId } = req.params;
    const user = req.user!;

    // Admin tem acesso total
    if (user.role === 'ADMIN') {
      return next();
    }

    // Gestor só pode acessar mercados que gerencia
    if (user.role === 'GESTOR') {
      const mercado = await prisma.mercado.findFirst({
        where: {
          id: mercadoId,
          gestorId: user.id,
        },
      });

      if (!mercado) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar este mercado',
        });
      }

      return next();
    }

    // Cliente não tem acesso a operações de escrita
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Clientes não podem modificar mercados',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao verificar permissões',
      message: 'Ocorreu um erro ao verificar suas permissões',
    });
  }
};

/**
 * Verifica se o usuário tem permissão para acessar uma unidade
 */
export const canAccessUnidade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: unidadeId } = req.params;
    const user = req.user!;

    // Admin tem acesso total
    if (user.role === 'ADMIN') {
      return next();
    }

    // Gestor só pode acessar unidades do seu mercado
    if (user.role === 'GESTOR') {
      const unidade = await prisma.unidade.findFirst({
        where: {
          id: unidadeId,
          mercado: {
            gestorId: user.id,
          },
        },
      });

      if (!unidade) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar esta unidade',
        });
      }

      return next();
    }

    // Cliente não tem acesso a operações de escrita
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Clientes não podem modificar unidades',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao verificar permissões',
      message: 'Ocorreu um erro ao verificar suas permissões',
    });
  }
};

/**
 * Verifica limites do plano antes de operações
 */
export const checkPlanLimits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: mercadoId } = req.params;

    const mercado = await prisma.mercado.findUnique({
      where: { id: mercadoId },
      include: {
        plano: true,
        unidades: true,
      },
    });

    if (!mercado) {
      return res.status(404).json({
        error: 'Mercado não encontrado',
      });
    }

    if (!mercado.plano) {
      return res.status(400).json({
        error: 'Sem plano associado',
        message: 'Este mercado não possui um plano de pagamento associado',
      });
    }

    // Verifica limite de unidades ao criar nova unidade
    if (req.method === 'POST' && req.path.includes('/unidades')) {
      if (mercado.unidades.length >= mercado.plano.limiteUnidades) {
        return res.status(400).json({
          error: 'Limite de unidades atingido',
          message: `Seu plano permite no máximo ${mercado.plano.limiteUnidades} unidades`,
        });
      }
    }

    // Adiciona informações do plano na request para uso posterior
    req.body._planoInfo = {
      limiteUploadMb: mercado.plano.limiteUploadMb,
      limiteUnidades: mercado.plano.limiteUnidades,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao verificar limites do plano',
      message: 'Ocorreu um erro ao verificar os limites do seu plano',
    });
  }
};

