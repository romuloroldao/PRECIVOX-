import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

/**
 * Busca produtos com filtros avançados
 */
router.get('/buscar', async (req, res) => {
  try {
    const {
      busca,
      categoria,
      marca,
      precoMin,
      precoMax,
      disponivel,
      emPromocao,
      mercado,
      cidade
    } = req.query;

    let where: any = {
      disponivel: disponivel === 'true' ? true : undefined,
      emPromocao: emPromocao === 'true' ? true : undefined,
    };

    // Filtro por preço
    if (precoMin || precoMax) {
      where.preco = {};
      if (precoMin) where.preco.gte = parseFloat(precoMin as string);
      if (precoMax) where.preco.lte = parseFloat(precoMax as string);
    }

    // Filtro por busca (nome, marca, código de barras)
    if (busca) {
      where.produto = {
        OR: [
          { nome: { contains: busca as string, mode: 'insensitive' } },
          { marca: { contains: busca as string, mode: 'insensitive' } },
          { codigoBarras: { contains: busca as string } },
        ]
      };
    }

    // Filtro por categoria
    if (categoria) {
      where.produto = {
        ...where.produto,
        categoria: categoria as string
      };
    }

    // Filtro por marca
    if (marca) {
      where.produto = {
        ...where.produto,
        marca: marca as string
      };
    }

    // Filtro por mercado
    if (mercado) {
      where.unidade = {
        mercadoId: mercado as string
      };
    }

    // Filtro por cidade
    if (cidade) {
      where.unidade = {
        ...where.unidade,
        cidade: cidade as string
      };
    }

    const produtos = await prisma.estoques.findMany({
      where,
      include: {
        produto: true,
        unidade: {
          include: {
            mercado: true
          }
        }
      },
      orderBy: [
        { emPromocao: 'desc' },
        { preco: 'asc' }
      ]
    });

    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      error: 'Erro ao buscar produtos',
      message: 'Ocorreu um erro ao buscar os produtos'
    });
  }
});

/**
 * Lista todas as categorias únicas
 */
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await prisma.produtos.findMany({
      where: {
        categoria: {
          not: null
        }
      },
      select: {
        categoria: true
      },
      distinct: ['categoria']
    });

    const categoriasUnicas = categorias
      .map(p => p.categoria)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .sort();

    res.json(categoriasUnicas);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      error: 'Erro ao buscar categorias',
      message: 'Ocorreu um erro ao buscar as categorias'
    });
  }
});

/**
 * Lista todas as marcas únicas
 */
router.get('/marcas', async (req, res) => {
  try {
    const marcas = await prisma.produtos.findMany({
      where: {
        marca: {
          not: null
        }
      },
      select: {
        marca: true
      },
      distinct: ['marca']
    });

    const marcasUnicas = marcas
      .map(p => p.marca)
      .filter((marca, index, arr) => arr.indexOf(marca) === index)
      .sort();

    res.json(marcasUnicas);
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    res.status(500).json({
      error: 'Erro ao buscar marcas',
      message: 'Ocorreu um erro ao buscar as marcas'
    });
  }
});

/**
 * Compara produtos entre diferentes mercados
 */
router.post('/comparar', async (req, res) => {
  try {
    const { produtoIds } = req.body;

    if (!produtoIds || !Array.isArray(produtoIds) || produtoIds.length === 0) {
      return res.status(400).json({
        error: 'IDs de produtos são obrigatórios',
        message: 'É necessário fornecer os IDs dos produtos para comparação'
      });
    }

    const produtos = await prisma.estoques.findMany({
      where: {
        id: {
          in: produtoIds
        }
      },
      include: {
        produto: true,
        unidade: {
          include: {
            mercado: true
          }
        }
      }
    });

    // Agrupa por produto
    const produtosAgrupados = produtos.reduce((acc, estoque) => {
      const produtoId = estoque.produto.id;
      if (!acc[produtoId]) {
        acc[produtoId] = {
          produto: estoque.produto,
          estoques: []
        };
      }
      acc[produtoId].estoques.push(estoque);
      return acc;
    }, {} as any);

    res.json(Object.values(produtosAgrupados));
  } catch (error) {
    console.error('Erro ao comparar produtos:', error);
    res.status(500).json({
      error: 'Erro ao comparar produtos',
      message: 'Ocorreu um erro ao comparar os produtos'
    });
  }
});

/**
 * Módulo de IA - Recomendações inteligentes
 */
router.get('/recomendacoes', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Busca histórico de compras do usuário (se existir)
    // Por enquanto, retorna produtos em promoção como recomendação
    const recomendacoes = await prisma.estoques.findMany({
      where: {
        emPromocao: true,
        disponivel: true
      },
      include: {
        produto: true,
        unidade: {
          include: {
            mercado: true
          }
        }
      },
      orderBy: {
        precoPromocional: 'asc'
      },
      take: 10
    });

    res.json({
      recomendacoes,
      tipo: 'promocoes',
      descricao: 'Produtos em promoção recomendados para você'
    });
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error);
    res.status(500).json({
      error: 'Erro ao buscar recomendações',
      message: 'Ocorreu um erro ao buscar as recomendações'
    });
  }
});

/**
 * Módulo de IA - Análise de preços
 */
router.get('/analise-precos/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    // Busca todos os estoques do produto
    const estoques = await prisma.estoques.findMany({
      where: {
        produtoId
      },
      include: {
        unidade: {
          include: {
            mercado: true
          }
        }
      }
    });

    if (estoques.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado',
        message: 'Nenhum estoque encontrado para este produto'
      });
    }

    // Análise estatística
    const precos = estoques.map(e => e.preco);
    const precoMin = Math.min(...precos);
    const precoMax = Math.max(...precos);
    const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length;
    const precoMediano = precos.sort((a, b) => a - b)[Math.floor(precos.length / 2)];

    // Encontra o menor preço
    const menorPreco = estoques.find(e => e.preco === precoMin);
    
    // Encontra promoções
    const promocoes = estoques.filter(e => e.emPromocao);

    res.json({
      produto: estoques[0].produto,
      analise: {
        precoMin,
        precoMax,
        precoMedio: parseFloat(precoMedio.toFixed(2)),
        precoMediano,
        totalMercados: estoques.length,
        menorPreco: {
          preco: precoMin,
          mercado: menorPreco?.unidade.mercado.nome,
          unidade: menorPreco?.unidade.nome,
          endereco: `${menorPreco?.unidade.endereco}, ${menorPreco?.unidade.cidade}`
        },
        promocoes: promocoes.length,
        economia: precoMax - precoMin
      },
      estoques: estoques.map(e => ({
        id: e.id,
        preco: e.preco,
        precoPromocional: e.precoPromocional,
        emPromocao: e.emPromocao,
        disponivel: e.disponivel,
        quantidade: e.quantidade,
        mercado: e.unidade.mercado.nome,
        unidade: e.unidade.nome,
        endereco: `${e.unidade.endereco}, ${e.unidade.cidade} - ${e.unidade.estado}`
      }))
    });
  } catch (error) {
    console.error('Erro ao analisar preços:', error);
    res.status(500).json({
      error: 'Erro ao analisar preços',
      message: 'Ocorreu um erro ao analisar os preços do produto'
    });
  }
});

/**
 * POST /api/produtos/upload-smart/:marketId - Upload inteligente com conversão automática
 */

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'json');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const uploadConverter = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato não suportado: ${ext}. Use CSV, XLSX, XLS, JSON ou XML.`));
    }
  }
});

router.post(
  '/upload-smart/:marketId',
  authenticate,
  uploadConverter.single('file'),
  async (req, res) => {
    try {
      const { marketId } = req.params;

      if (!marketId) {
        return res.status(400).json({
          success: false,
          error: 'Market ID ausente na rota.',
        });
      }

      console.log(`📁 Upload recebido para mercado: ${marketId}`);

      // Verificar se arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo não fornecido',
          message: 'É necessário enviar um arquivo no campo "file"',
        });
      }

      console.log(`📄 Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`);

      // Por enquanto, retornar sucesso sem processar o arquivo
      // TODO: Implementar processamento real do arquivo
      return res.json({
        success: true,
        message: 'Upload recebido com sucesso',
        data: {
          marketId,
          filename: req.file.originalname,
          size: req.file.size,
          message: 'Endpoint funcionando corretamente',
        },
      });
    } catch (error: any) {
      console.error('❌ Erro no upload inteligente:', error);

      // Remove arquivo em caso de erro
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
);

export default router;
