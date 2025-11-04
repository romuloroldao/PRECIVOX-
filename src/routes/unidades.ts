import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Lista todas as cidades únicas (público - para página de busca)
 * DEVE VIR ANTES DE /:mercadoId para não ser capturada como parâmetro
 */
router.get('/cidades', async (req, res) => {
  try {
    const cidades = await prisma.unidades.findMany({
      where: {
        ativa: true
      },
      select: {
        cidade: true
      },
      distinct: ['cidade']
    });

    const cidadesUnicas = cidades
      .map(u => u.cidade)
      .filter((cidade, index, arr) => arr.indexOf(cidade) === index)
      .sort();

    res.json(cidadesUnicas);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({
      error: 'Erro ao buscar cidades',
      message: 'Ocorreu um erro ao buscar as cidades'
    });
  }
});

/**
 * Lista todas as unidades de um mercado
 */
router.get('/:mercadoId', authenticate, async (req, res) => {
  try {
    const { mercadoId } = req.params;
    const { role, userId } = (req as any).user;

    // Verifica se o mercado existe
    const mercado = await prisma.mercado.findFirst({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return res.status(404).json({
        error: 'Mercado não encontrado',
        message: 'O mercado especificado não existe'
      });
    }

    // Gestor só pode ver unidades do seu mercado
    if (role === 'GESTOR') {
      const mercado = await prisma.mercado.findFirst({
        where: {
          id: mercadoId,
          gestorId: userId
        }
      });

      if (!mercado) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar este mercado'
        });
      }
    }

    const unidades = await prisma.unidades.findMany({
      where: { mercadoId },
      include: {
        _count: {
          select: { estoques: true }
        }
      },
      orderBy: { dataCriacao: 'desc' }
    });

    res.json(unidades);
  } catch (error) {
    console.error('Erro ao listar unidades:', error);
    res.status(500).json({
      error: 'Erro ao listar unidades',
      message: 'Ocorreu um erro ao buscar as unidades'
    });
  }
});

/**
 * Busca uma unidade específica
 */
router.get('/unidade/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = (req as any).user;

    const unidade = await prisma.unidades.findUnique({
      where: { id },
      include: {
        mercado: {
          include: {
            gestor: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { estoques: true }
        }
      }
    });

    if (!unidade) {
      return res.status(404).json({
        error: 'Unidade não encontrada',
        message: 'A unidade especificada não existe'
      });
    }

    // Gestor só pode ver unidades do seu mercado
    if (role === 'GESTOR' && unidade.mercado.gestorId !== userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta unidade'
      });
    }

    res.json(unidade);
  } catch (error) {
    console.error('Erro ao buscar unidade:', error);
    res.status(500).json({
      error: 'Erro ao buscar unidade',
      message: 'Ocorreu um erro ao buscar a unidade'
    });
  }
});

/**
 * Cria uma nova unidade para um mercado
 */
router.post('/:mercadoId', authenticate, authorizeRole('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { mercadoId } = req.params;
    const { role, userId } = (req as any).user;
    const {
      nome,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      bairro
    } = req.body;

    // Validações
    if (!nome || !endereco || !cidade || !estado) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'Nome, endereço, cidade e estado são obrigatórios'
      });
    }

    // Verifica se o mercado existe
    const mercado = await prisma.mercado.findUnique({
      where: { id: mercadoId },
      include: { plano: true }
    });

    if (!mercado) {
      return res.status(404).json({
        error: 'Mercado não encontrado',
        message: 'O mercado especificado não existe'
      });
    }

    // Verifica limite de unidades do plano
    if (mercado.plano) {
      const unidadesExistentes = await prisma.unidades.count({
        where: { mercadoId }
      });

      if (unidadesExistentes >= mercado.plano.limiteUnidades) {
        return res.status(400).json({
          error: 'Limite de unidades atingido',
          message: `O plano permite apenas ${mercado.plano.limiteUnidades} unidades`
        });
      }
    }

    // Gestor só pode criar unidades no seu mercado
    if (role === 'GESTOR') {
      const mercado = await prisma.mercado.findFirst({
        where: {
          id: mercadoId,
          gestorId: userId
        }
      });

      if (!mercado) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para criar unidades neste mercado'
        });
      }
    }

    const unidade = await prisma.unidades.create({
      data: {
        nome,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        bairro,
        mercadoId
      },
      include: {
        mercado: {
          include: {
            gestor: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(unidade);
  } catch (error) {
    console.error('Erro ao criar unidade:', error);
    res.status(500).json({
      error: 'Erro ao criar unidade',
      message: 'Ocorreu um erro ao criar a unidade'
    });
  }
});

/**
 * Atualiza uma unidade
 */
router.put('/:id', authenticate, authorizeRole('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = (req as any).user;
    const {
      nome,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      bairro,
      ativa
    } = req.body;

    // Verifica se a unidade existe
    const unidadeExistente = await prisma.unidades.findUnique({
      where: { id },
      include: { mercado: true }
    });

    if (!unidadeExistente) {
      return res.status(404).json({
        error: 'Unidade não encontrada',
        message: 'A unidade especificada não existe'
      });
    }

    // Gestor só pode editar unidades do seu mercado
    if (role === 'GESTOR' && unidadeExistente.mercado.gestorId !== userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para editar esta unidade'
      });
    }

    const unidade = await prisma.unidades.update({
      where: { id },
      data: {
        nome,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        bairro,
        ativa
      },
      include: {
        mercado: {
          include: {
            gestor: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json(unidade);
  } catch (error) {
    console.error('Erro ao atualizar unidade:', error);
    res.status(500).json({
      error: 'Erro ao atualizar unidade',
      message: 'Ocorreu um erro ao atualizar a unidade'
    });
  }
});

/**
 * Remove uma unidade
 */
router.delete('/:id', authenticate, authorizeRole('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = (req as any).user;

    // Verifica se a unidade existe
    const unidade = await prisma.unidades.findUnique({
      where: { id },
      include: { mercado: true }
    });

    if (!unidade) {
      return res.status(404).json({
        error: 'Unidade não encontrada',
        message: 'A unidade especificada não existe'
      });
    }

    // Gestor só pode excluir unidades do seu mercado
    if (role === 'GESTOR' && unidade.mercado.gestorId !== userId) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para excluir esta unidade'
      });
    }

    await prisma.unidades.delete({
      where: { id }
    });

    res.json({ message: 'Unidade excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir unidade:', error);
    res.status(500).json({
      error: 'Erro ao excluir unidade',
      message: 'Ocorreu um erro ao excluir a unidade'
    });
  }
});

/**
 * Lista estoque de uma unidade
 */
router.get('/:unidadeId/estoque', async (req, res) => {
  try {
    const { unidadeId } = req.params;
    const { categoria, disponivel, busca } = req.query;

    let where: any = { unidadeId };

    if (categoria) {
      where.produto = {
        categoria: categoria as string
      };
    }

    if (disponivel === 'true') {
      where.disponivel = true;
    }

    if (busca) {
      where.produto = {
        ...where.produto,
        OR: [
          { nome: { contains: busca as string, mode: 'insensitive' } },
          { codigoBarras: { contains: busca as string } },
          { marca: { contains: busca as string, mode: 'insensitive' } }
        ]
      };
    }

    const estoques = await prisma.estoque.findMany({
      where,
      include: {
        produto: true
      },
      orderBy: { preco: 'asc' }
    });

    res.json(estoques);
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    res.status(500).json({
      error: 'Erro ao listar estoque',
      message: 'Ocorreu um erro ao buscar o estoque'
    });
  }
});

export default router;