// Rotas para Gestão de Mercados
import { Router } from 'express';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';
import { canAccessMercado, checkPlanLimits } from '../middleware/permissions';
import multer from 'multer';
import path from 'path';
import { processarArquivoUpload, obterHistoricoImportacoes } from '../lib/uploadHandler';
import { prisma } from '../lib/prisma';

const router = Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Use CSV ou XLSX'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
});

// ============================================
// ROTAS DE MERCADOS
// ============================================

/**
 * GET /mercados/public
 * Lista mercados ativos (público - para página de busca)
 */
router.get('/public', async (req, res) => {
  try {
    // Debug logs (podem ser removidos depois)
    // console.log('Rota pública de mercados chamada');

    const { ativo } = req.query;

    const where: any = {};
    if (ativo === 'true') {
      where.ativo = true;
    }

    const mercados = await prisma.mercados.findMany({
      where,
      select: {
        id: true,
        nome: true,
        ativo: true,
        _count: {
          select: { unidades: true }
        }
      },
      orderBy: { nome: 'asc' }
    });

    res.json(mercados);
  } catch (error: any) {
    console.error('Erro ao buscar mercados públicos:', error);
    console.error('Stack:', error?.stack);
    res.status(500).json({
      error: 'Erro ao buscar mercados',
      message: error?.message || 'Ocorreu um erro ao buscar os mercados',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
});

/**
 * GET /mercados
 * Lista todos os mercados (com filtros para gestores)
 * Autenticação opcional - sem auth retorna todos os mercados ativos
 */
router.get('/', async (req: any, res) => {
  try {
    const { busca, ativo, planoId } = req.query;

    // Tentar obter usuário autenticado (opcional)
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'precivox-secret-2024');
        user = decoded;
      } catch (error) {
        // Token inválido, continuar sem autenticação
      }
    }

    let where: any = {};

    // Se não autenticado, mostrar apenas mercados ativos
    if (!user) {
      where.ativo = true;
    } else {
      // Gestor só vê seus mercados
      if (user.role === 'GESTOR') {
        where.gestorId = user.id;
      }

      // Cliente só vê mercados ativos
      if (user.role === 'CLIENTE') {
        where.ativo = true;
      }
    }

    // Filtros opcionais
    if (busca) {
      where.OR = [
        { nome: { contains: busca as string, mode: 'insensitive' } },
        { cnpj: { contains: busca as string } },
      ];
    }

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    if (planoId) {
      where.planoId = planoId as string;
    }

    const mercados = await prisma.mercados.findMany({
      where,
      include: {
        planos_de_pagamento: true,
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            unidades: true,
          },
        },
      },
      orderBy: { dataCriacao: 'desc' },
    });

    return res.json({ success: true, data: mercados });
  } catch (error: any) {
    console.error('❌ [MERCADOS] Erro ao listar mercados:', error);
    console.error('❌ [MERCADOS] Stack:', error?.stack);
    console.error('❌ [MERCADOS] Message:', error?.message);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar mercados',
      message: 'Ocorreu um erro ao buscar os mercados',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

/**
 * GET /mercados/:id
 * Obtém detalhes de um mercado específico
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user!;

    let where: any = { id };

    // Gestor só vê seus mercados
    if (role === 'GESTOR') {
      where.gestorId = userId;
    }

    const mercado = await prisma.mercados.findFirst({
      where,
      include: {
        planos_de_pagamento: true,
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        unidades: {
          include: {
            _count: {
              select: {
                estoques: true,
              },
            },
          },
        },
      },
    });

    if (!mercado) {
      return res.status(404).json({
        error: 'Mercado não encontrado',
        message: 'O mercado solicitado não foi encontrado ou você não tem permissão para acessá-lo',
      });
    }

    return res.json(mercado);
  } catch (error) {
    console.error('Erro ao buscar mercado:', error);
    return res.status(500).json({
      error: 'Erro ao buscar mercado',
      message: 'Ocorreu um erro ao buscar o mercado',
    });
  }
});

/**
 * POST /mercados
 * Cria um novo mercado (apenas Admin)
 */
router.post('/', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const {
      nome,
      cnpj,
      descricao,
      telefone,
      emailContato,
      horarioFuncionamento,
      planoId,
      gestorId,
    } = req.body;

    // Valida campos obrigatórios
    if (!nome || !cnpj) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        message: 'Nome e CNPJ são obrigatórios',
      });
    }

    // Verifica se CNPJ já existe
    const mercadoExistente = await prisma.mercados.findUnique({
      where: { cnpj },
    });

    if (mercadoExistente) {
      return res.status(400).json({
        error: 'CNPJ já cadastrado',
        message: 'Já existe um mercado com este CNPJ',
      });
    }

    // Verifica se gestor existe
    if (gestorId) {
      const gestor = await prisma.user.findUnique({
        where: { id: gestorId },
      });

      if (!gestor || gestor.role !== 'GESTOR') {
        return res.status(400).json({
          error: 'Gestor inválido',
          message: 'O gestor especificado não existe ou não tem permissão de gestor',
        });
      }
    }

    const mercado = await prisma.mercados.create({
      data: {
        nome,
        cnpj,
        descricao,
        telefone,
        emailContato,
        horarioFuncionamento,
        planoId,
        gestorId,
      },
      include: {
        planos_de_pagamento: true,
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(mercado);
  } catch (error) {
    console.error('Erro ao criar mercado:', error);
    return res.status(500).json({
      error: 'Erro ao criar mercado',
      message: 'Ocorreu um erro ao criar o mercado',
    });
  }
});

/**
 * PUT /mercados/:id
 * Atualiza um mercado (Admin ou Gestor do mercado)
 */
router.put('/:id', authenticate, canAccessMercado, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      telefone,
      emailContato,
      horarioFuncionamento,
      logo,
      ativo,
    } = req.body;

    const mercado = await prisma.mercados.update({
      where: { id },
      data: {
        nome,
        descricao,
        telefone,
        emailContato,
        horarioFuncionamento,
        logo,
        ativo,
      },
      include: {
        planos_de_pagamento: true,
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return res.json(mercado);
  } catch (error) {
    console.error('Erro ao atualizar mercado:', error);
    return res.status(500).json({
      error: 'Erro ao atualizar mercado',
      message: 'Ocorreu um erro ao atualizar o mercado',
    });
  }
});

/**
 * PUT /mercados/:id/plano
 * Associa ou atualiza plano do mercado (apenas Admin)
 */
router.put('/:id/plano', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { planoId } = req.body;

    if (!planoId) {
      return res.status(400).json({
        error: 'Plano não especificado',
        message: 'É necessário informar o ID do plano',
      });
    }

    // Verifica se plano existe
    const plano = await prisma.planoPagamento.findUnique({
      where: { id: planoId },
    });

    if (!plano || !plano.ativo) {
      return res.status(400).json({
        error: 'Plano inválido',
        message: 'O plano especificado não existe ou está inativo',
      });
    }

    const mercado = await prisma.mercados.update({
      where: { id },
      data: { planoId },
      include: {
        planos_de_pagamento: true,
      },
    });

    return res.json(mercado);
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return res.status(500).json({
      error: 'Erro ao atualizar plano',
      message: 'Ocorreu um erro ao associar o plano',
    });
  }
});

/**
 * PUT /mercados/:id/gestor
 * Associa ou atualiza gestor do mercado (apenas Admin)
 */
router.put('/:id/gestor', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { gestorId } = req.body;

    if (!gestorId) {
      return res.status(400).json({
        error: 'Gestor não especificado',
        message: 'É necessário informar o ID do gestor',
      });
    }

    // Verifica se gestor existe
    const gestor = await prisma.user.findUnique({
      where: { id: gestorId },
    });

    if (!gestor || gestor.role !== 'GESTOR') {
      return res.status(400).json({
        error: 'Gestor inválido',
        message: 'O gestor especificado não existe ou não tem permissão de gestor',
      });
    }

    const mercado = await prisma.mercados.update({
      where: { id },
      data: { gestorId },
      include: {
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return res.json(mercado);
  } catch (error) {
    console.error('Erro ao atualizar gestor:', error);
    return res.status(500).json({
      error: 'Erro ao atualizar gestor',
      message: 'Ocorreu um erro ao associar o gestor',
    });
  }
});

/**
 * DELETE /mercados/:id
 * Exclui um mercado (apenas Admin)
 */
router.delete('/:id', authenticate, authorizeRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.mercados.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir mercado:', error);
    return res.status(500).json({
      error: 'Erro ao excluir mercado',
      message: 'Ocorreu um erro ao excluir o mercado',
    });
  }
});

/**
 * POST /mercados/:id/upload
 * Upload de base de dados do mercado (Admin ou Gestor)
 */
router.post(
  '/:id/upload',
  authenticate,
  canAccessMercado,
  checkPlanLimits,
  upload.single('arquivo'),
  async (req: AuthRequest, res) => {
    try {
      const { id: mercadoId } = req.params;
      const { unidadeId } = req.body;

      if (!req.file) {
        return res.status(400).json({
          error: 'Arquivo não enviado',
          message: 'É necessário enviar um arquivo CSV ou XLSX',
        });
      }

      if (!unidadeId) {
        return res.status(400).json({
          error: 'Unidade não especificada',
          message: 'É necessário informar a unidade para associar os produtos',
        });
      }

      // Verifica se unidade pertence ao mercado
      const unidade = await prisma.unidade.findFirst({
        where: {
          id: unidadeId,
          mercadoId,
        },
      });

      if (!unidade) {
        return res.status(400).json({
          error: 'Unidade inválida',
          message: 'A unidade especificada não pertence a este mercado',
        });
      }

      // Verifica limite de upload do plano
      const planoInfo = req.body._planoInfo;
      const fileSizeMb = req.file.size / (1024 * 1024);

      if (planoInfo && fileSizeMb > planoInfo.limiteUploadMb) {
        return res.status(400).json({
          error: 'Arquivo muito grande',
          message: `Seu plano permite uploads de até ${planoInfo.limiteUploadMb}MB. Arquivo enviado: ${fileSizeMb.toFixed(2)}MB`,
        });
      }

      // Processa o arquivo
      const resultado = await processarArquivoUpload(
        req.file.path,
        req.file.originalname,
        mercadoId,
        unidadeId,
        req.file.size
      );

      return res.json({
        message: 'Upload processado com sucesso',
        resultado,
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      return res.status(500).json({
        error: 'Erro ao processar upload',
        message: error.message || 'Ocorreu um erro ao processar o arquivo',
      });
    }
  }
);

/**
 * GET /mercados/:id/importacoes
 * Obtém histórico de importações
 */
router.get('/:id/importacoes', authenticate, canAccessMercado, async (req: AuthRequest, res) => {
  try {
    const { id: mercadoId } = req.params;

    const importacoes = await obterHistoricoImportacoes(mercadoId);

    return res.json(importacoes);
  } catch (error) {
    console.error('Erro ao buscar importações:', error);
    return res.status(500).json({
      error: 'Erro ao buscar importações',
      message: 'Ocorreu um erro ao buscar o histórico de importações',
    });
  }
});

export default router;

