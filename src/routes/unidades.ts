// Rotas para Gestão de Unidades
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';
import { canAccessUnidade, checkPlanLimits } from '../middleware/permissions';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /mercados/:id/unidades
 * Lista todas as unidades de um mercado
 */
router.get('/mercados/:id/unidades', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: mercadoId } = req.params;
    const { role, id: userId } = req.user!;
    const { ativa } = req.query;

    let where: any = { mercadoId };

    // Gestor só vê unidades do seu mercado
    if (role === 'GESTOR') {
      const mercado = await prisma.mercado.findFirst({
        where: {
          id: mercadoId,
          gestorId: userId,
        },
      });

      if (!mercado) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar as unidades deste mercado',
        });
      }
    }

    if (ativa !== undefined) {
      where.ativa = ativa === 'true';
    }

    const unidades = await prisma.unidade.findMany({
      where,
      include: {
        _count: {
          select: {
            estoques: true,
          },
        },
      },
      orderBy: { dataCriacao: 'desc' },
    });

    return res.json(unidades);
  } catch (error) {
    console.error('Erro ao listar unidades:', error);
    return res.status(500).json({
      error: 'Erro ao listar unidades',
      message: 'Ocorreu um erro ao buscar as unidades',
    });
  }
});

/**
 * GET /unidades/:id
 * Obtém detalhes de uma unidade específica
 */
router.get('/unidades/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user!;

    const unidade = await prisma.unidade.findUnique({
      where: { id },
      include: {
        mercado: {
          include: {
            gestor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            estoques: true,
          },
        },
      },
    });

    if (!unidade) {
      return res.status(404).json({
        error: 'Unidade não encontrada',
      });
    }

    // Verifica permissões
    if (role === 'GESTOR' && unidade.mercado.gestorId !== userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta unidade',
      });
    }

    return res.json(unidade);
  } catch (error) {
    console.error('Erro ao buscar unidade:', error);
    return res.status(500).json({
      error: 'Erro ao buscar unidade',
      message: 'Ocorreu um erro ao buscar a unidade',
    });
  }
});

/**
 * POST /mercados/:id/unidades
 * Cria uma nova unidade para um mercado
 */
router.post(
  '/mercados/:id/unidades',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  checkPlanLimits,
  async (req: AuthRequest, res) => {
    try {
      const { id: mercadoId } = req.params;
      const { role, id: userId } = req.user!;
      const {
        nome,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        telefone,
        horarioFuncionamento,
        latitude,
        longitude,
      } = req.body;

      // Valida campos obrigatórios
      if (!nome) {
        return res.status(400).json({
          error: 'Nome é obrigatório',
        });
      }

      // Gestor só pode criar unidades no seu mercado
      if (role === 'GESTOR') {
        const mercado = await prisma.mercado.findFirst({
          where: {
            id: mercadoId,
            gestorId: userId,
          },
        });

        if (!mercado) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: 'Você não tem permissão para criar unidades neste mercado',
          });
        }
      }

      const unidade = await prisma.unidade.create({
        data: {
          mercadoId,
          nome,
          endereco,
          bairro,
          cidade,
          estado,
          cep,
          telefone,
          horarioFuncionamento,
          latitude,
          longitude,
        },
        include: {
          mercado: true,
        },
      });

      return res.status(201).json(unidade);
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      return res.status(500).json({
        error: 'Erro ao criar unidade',
        message: 'Ocorreu um erro ao criar a unidade',
      });
    }
  }
);

/**
 * PUT /unidades/:id
 * Atualiza uma unidade
 */
router.put(
  '/unidades/:id',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessUnidade,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const {
        nome,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        telefone,
        horarioFuncionamento,
        latitude,
        longitude,
        ativa,
      } = req.body;

      const unidade = await prisma.unidade.update({
        where: { id },
        data: {
          nome,
          endereco,
          bairro,
          cidade,
          estado,
          cep,
          telefone,
          horarioFuncionamento,
          latitude,
          longitude,
          ativa,
        },
        include: {
          mercado: true,
        },
      });

      return res.json(unidade);
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      return res.status(500).json({
        error: 'Erro ao atualizar unidade',
        message: 'Ocorreu um erro ao atualizar a unidade',
      });
    }
  }
);

/**
 * DELETE /unidades/:id
 * Exclui uma unidade
 */
router.delete(
  '/unidades/:id',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessUnidade,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      await prisma.unidade.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      return res.status(500).json({
        error: 'Erro ao excluir unidade',
        message: 'Ocorreu um erro ao excluir a unidade',
      });
    }
  }
);

/**
 * GET /unidades/:id/estoque
 * Lista estoque de uma unidade
 */
router.get('/unidades/:id/estoque', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: unidadeId } = req.params;
    const { categoria, disponivel, busca } = req.query;

    let where: any = { unidadeId };

    if (categoria) {
      where.produto = {
        categoria: categoria as string,
      };
    }

    if (disponivel !== undefined) {
      where.disponivel = disponivel === 'true';
    }

    if (busca) {
      where.produto = {
        ...where.produto,
        OR: [
          { nome: { contains: busca as string, mode: 'insensitive' } },
          { codigoBarras: { contains: busca as string } },
          { marca: { contains: busca as string, mode: 'insensitive' } },
        ],
      };
    }

    const estoques = await prisma.estoque.findMany({
      where,
      include: {
        produto: true,
      },
      orderBy: {
        produto: {
          nome: 'asc',
        },
      },
    });

    return res.json(estoques);
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    return res.status(500).json({
      error: 'Erro ao listar estoque',
      message: 'Ocorreu um erro ao buscar o estoque',
    });
  }
});

export default router;

