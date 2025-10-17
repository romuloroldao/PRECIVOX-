// Rotas para Gestão de Planos de Pagamento
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /planos
 * Lista todos os planos
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { ativo } = req.query;

    let where: any = {};

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    // Cliente e Gestor veem apenas planos ativos
    if (req.user!.role !== 'ADMIN') {
      where.ativo = true;
    }

    const planos = await prisma.planoPagamento.findMany({
      where,
      orderBy: { valor: 'asc' },
    });

    return res.json(planos);
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    return res.status(500).json({
      error: 'Erro ao listar planos',
      message: 'Ocorreu um erro ao buscar os planos',
    });
  }
});

/**
 * POST /planos
 * Cria um novo plano (apenas Admin)
 */
router.post('/', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const {
      nome,
      descricao,
      valor,
      duracao,
      limiteUnidades,
      limiteUploadMb,
      limiteUsuarios,
    } = req.body;

    if (!nome || !valor || !duracao) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        message: 'Nome, valor e duração são obrigatórios',
      });
    }

    const plano = await prisma.planoPagamento.create({
      data: {
        nome,
        descricao,
        valor,
        duracao,
        limiteUnidades: limiteUnidades || 1,
        limiteUploadMb: limiteUploadMb || 10,
        limiteUsuarios: limiteUsuarios || 5,
      },
    });

    return res.status(201).json(plano);
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return res.status(500).json({
      error: 'Erro ao criar plano',
      message: 'Ocorreu um erro ao criar o plano',
    });
  }
});

/**
 * PUT /planos/:id
 * Atualiza um plano (apenas Admin)
 */
router.put('/:id', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      valor,
      duracao,
      limiteUnidades,
      limiteUploadMb,
      limiteUsuarios,
      ativo,
    } = req.body;

    const plano = await prisma.planoPagamento.update({
      where: { id },
      data: {
        nome,
        descricao,
        valor,
        duracao,
        limiteUnidades,
        limiteUploadMb,
        limiteUsuarios,
        ativo,
      },
    });

    return res.json(plano);
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return res.status(500).json({
      error: 'Erro ao atualizar plano',
      message: 'Ocorreu um erro ao atualizar o plano',
    });
  }
});

/**
 * DELETE /planos/:id
 * Exclui um plano (apenas Admin)
 */
router.delete('/:id', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verifica se há mercados usando este plano
    const mercadosComPlano = await prisma.mercado.count({
      where: { planoId: id },
    });

    if (mercadosComPlano > 0) {
      return res.status(400).json({
        error: 'Plano em uso',
        message: `Este plano está sendo usado por ${mercadosComPlano} mercado(s) e não pode ser excluído`,
      });
    }

    await prisma.planoPagamento.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    return res.status(500).json({
      error: 'Erro ao excluir plano',
      message: 'Ocorreu um erro ao excluir o plano',
    });
  }
});

export default router;

