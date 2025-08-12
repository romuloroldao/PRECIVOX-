// routes/products.js - Rotas para gerenciamento de produtos e upload de JSONs
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { query, transaction } from '../config/database.js';
import { 
  authenticate, 
  requireMarketAccess,
  optionalAuth
} from '../middleware/auth.js';
import {
  validateUuidParam,
  sanitizeInput
} from '../middleware/validation.js';
import productImageAI from '../services/imageAI.js';

const router = express.Router();

// Aplicar sanitização em todas as rotas
router.use(sanitizeInput);

// ===================================
// 🎯 ROTAS CRUD BÁSICAS DE PRODUTOS
// ===================================

// ✅ LISTAR TODOS OS PRODUTOS
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, categoria, mercado, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.status = \'active\' AND p.data_source = \'json_upload\'';
    const params = [];
    let paramCount = 0;
    
    if (categoria) {
      whereClause += ` AND p.categoria = $${++paramCount}`;
      params.push(categoria);
    }
    
    if (mercado) {
      // Verificar se é UUID ou string - aceitar ambos
      if (mercado.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        whereClause += ` AND p.market_id = $${++paramCount}`;
        params.push(mercado);
      } else {
        // Para strings como 'market-001', buscar por um campo alternativo ou ignorar
        whereClause += ` AND (p.market_id IS NULL OR p.market_id::text LIKE $${++paramCount})`;
        params.push(`%${mercado}%`);
      }
    }
    
    if (search) {
      whereClause += ` AND (p.nome ILIKE $${++paramCount} OR p.marca ILIKE $${++paramCount})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount++;
    }
    
    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const selectQuery = `
      SELECT 
        p.*,
        m.name as mercado_nome,
        m.address_street as mercado_endereco
      FROM products p
      LEFT JOIN markets m ON p.market_id = m.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    const result = await query(selectQuery, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ CRIAR NOVO PRODUTO
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      nome,
      categoria,
      subcategoria,
      preco,
      mercado_id,
      marca,
      codigo_barras,
      peso,
      descricao,
      estoque,
      promocao = false,
      desconto = 0
    } = req.body;
    
    // Validações básicas
    if (!nome || !categoria || !preco || !mercado_id || !marca) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: nome, categoria, preco, mercado_id, marca'
      });
    }
    
    // Verificar se usuário pode criar produtos para este mercado
    const user = req.user;
    if (user.role === 'gestor' && user.market_id !== mercado_id) {
      return res.status(403).json({
        success: false,
        error: 'Você só pode criar produtos para seu próprio mercado'
      });
    }
    
    const insertQuery = `
      INSERT INTO products (
        nome, categoria, subcategoria, preco, market_id, marca,
        codigo_barras, peso, descricao, estoque, promocao, desconto,
        status, avaliacao, visualizacoes, data_source, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        'active', 0, 0, 'manual_entry', NOW(), NOW()
      ) RETURNING *
    `;
    
    const result = await query(insertQuery, [
      nome, categoria, subcategoria, parseFloat(preco), mercado_id, marca,
      codigo_barras, peso, descricao, parseInt(estoque) || 0, promocao, parseFloat(desconto) || 0
    ]);
    
    const produto = result.rows[0];
    
    // ✅ GERAR IMAGEM AUTOMATICAMENTE VIA IA
    try {
      const imagemIA = await productImageAI.generateProductImage(nome, categoria, marca, subcategoria);
      
      // Atualizar produto com a imagem gerada
      await query(
        'UPDATE products SET imagem = $1, imagem_metadata = $2 WHERE id = $3',
        [imagemIA.url, JSON.stringify(imagemIA), produto.id]
      );
      
      // Adicionar dados da imagem ao produto retornado
      produto.imagem = imagemIA.url;
      produto.imagem_metadata = imagemIA;
      
      console.log(`✅ Imagem IA gerada para produto: ${nome} -> ${imagemIA.source}`);
    } catch (error) {
      console.error('⚠️ Erro ao gerar imagem IA:', error);
      // Continuar sem a imagem - não é erro crítico
    }
    
    res.status(201).json({
      success: true,
      data: produto,
      message: 'Produto criado com sucesso',
      imageGenerated: produto.imagem ? true : false
    });
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ ATUALIZAR PRODUTO
router.put('/:id', authenticate, validateUuidParam, async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    const user = req.user;
    
    // Verificar se produto existe
    const existingProduct = await query('SELECT * FROM products WHERE id = $1', [productId]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }
    
    const product = existingProduct.rows[0];
    
    // Verificar permissões
    if (user.role === 'gestor' && user.market_id !== product.market_id) {
      return res.status(403).json({
        success: false,
        error: 'Você só pode editar produtos do seu próprio mercado'
      });
    }
    
    // Campos que podem ser atualizados
    const allowedFields = ['nome', 'categoria', 'subcategoria', 'preco', 'marca', 'codigo_barras', 'peso', 'descricao', 'estoque', 'promocao', 'desconto', 'ativo'];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = $${++paramCount}`);
        updateValues.push(updateData[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo válido para atualização'
      });
    }
    
    updateFields.push(`updated_at = $${++paramCount}`);
    updateValues.push(new Date());
    updateValues.push(productId);
    
    const updateQuery = `
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Produto atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ EXCLUIR PRODUTO (soft delete)
router.delete('/:id', authenticate, validateUuidParam, async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.user;
    
    // Verificar se produto existe
    const existingProduct = await query('SELECT * FROM products WHERE id = $1', [productId]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }
    
    const product = existingProduct.rows[0];
    
    // Verificar permissões
    if (user.role === 'gestor' && user.market_id !== product.market_id) {
      return res.status(403).json({
        success: false,
        error: 'Você só pode excluir produtos do seu próprio mercado'
      });
    }
    
    // Soft delete
    await query('UPDATE products SET status = \'inactive\', updated_at = NOW() WHERE id = $1', [productId]);
    
    res.json({
      success: true,
      message: 'Produto excluído com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao excluir produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ REGENERAR IMAGEM VIA IA
router.post('/:id/generate-image', authenticate, validateUuidParam, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Buscar produto
    const productResult = await query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }
    
    const product = productResult.rows[0];
    const user = req.user;
    
    // Verificar permissões
    if (user.role === 'gestor' && user.market_id !== product.market_id) {
      return res.status(403).json({
        success: false,
        error: 'Você só pode gerar imagens para produtos do seu mercado'
      });
    }
    
    // Gerar nova imagem via IA
    const imagemIA = await productImageAI.generateProductImage(
      product.nome, 
      product.categoria, 
      product.marca, 
      product.subcategoria
    );
    
    // Atualizar produto
    await query(
      'UPDATE products SET imagem = $1, imagem_metadata = $2, updated_at = NOW() WHERE id = $3',
      [imagemIA.url, JSON.stringify(imagemIA), productId]
    );
    
    res.json({
      success: true,
      data: {
        id: productId,
        imagem: imagemIA.url,
        metadata: imagemIA
      },
      message: 'Imagem regenerada com sucesso via IA'
    });
  } catch (error) {
    console.error('❌ Erro ao regenerar imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ ESTATÍSTICAS DO SISTEMA DE IA DE IMAGENS
router.get('/ai/stats', authenticate, async (req, res) => {
  try {
    const stats = productImageAI.getCacheStats();
    
    res.json({
      success: true,
      data: {
        cache: stats,
        generated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas'
    });
  }
});

// Configurar multer para upload de arquivos JSON
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'json');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos JSON são permitidos'), false);
    }
  }
});

// =====================================================
// ROTAS PÚBLICAS (com autenticação opcional)
// =====================================================

// GET /api/products/search - Buscar produtos (público)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      q: searchTerm,
      market,
      categoria,
      preco_min,
      preco_max,
      promocao,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.id,
        p.nome,
        p.categoria,
        p.subcategoria,
        p.preco,
        p.loja,
        p.promocao,
        p.desconto,
        p.avaliacao,
        p.imagem_url,
        p.codigo_barras,
        p.marca,
        p.estoque,
        m.name as market_name,
        m.slug as market_slug,
        m.address_city,
        m.verified as market_verified,
        CASE 
          WHEN $1 IS NOT NULL THEN
            ts_rank_cd(p.search_vector, plainto_tsquery('portuguese', $1))
          ELSE 0.0
        END as relevance_score
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' 
      AND m.status = 'active'
      AND m.verified = true
    `;

    const values = [searchTerm];
    let paramCount = 1;

    // Filtro por termo de busca
    if (searchTerm) {
      paramCount++;
      sql += ` AND p.search_vector @@ plainto_tsquery('portuguese', $${paramCount})`;
      values.push(searchTerm);
    }

    // Filtro por mercado
    if (market) {
      paramCount++;
      sql += ` AND (m.slug = $${paramCount} OR m.id = $${paramCount})`;
      values.push(market);
    }

    // Filtro por categoria
    if (categoria) {
      paramCount++;
      sql += ` AND p.categoria = $${paramCount}`;
      values.push(categoria);
    }

    // Filtro por preço mínimo
    if (preco_min) {
      paramCount++;
      sql += ` AND p.preco >= $${paramCount}`;
      values.push(parseFloat(preco_min));
    }

    // Filtro por preço máximo
    if (preco_max) {
      paramCount++;
      sql += ` AND p.preco <= $${paramCount}`;
      values.push(parseFloat(preco_max));
    }

    // Filtro por promoção
    if (promocao === 'true') {
      sql += ` AND p.promocao = true`;
    }

    // Ordenação
    sql += ` ORDER BY `;
    if (searchTerm) {
      sql += `relevance_score DESC, `;
    }
    sql += `p.promocao DESC, p.preco ASC`;

    // Paginação
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(parseInt(limit));

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await query(sql, values);

    // Contar total de resultados
    let countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' 
      AND m.status = 'active'
      AND m.verified = true
    `;

    const countValues = [];
    let countParamCount = 0;

    if (searchTerm) {
      countParamCount++;
      countSql += ` AND p.search_vector @@ plainto_tsquery('portuguese', $${countParamCount})`;
      countValues.push(searchTerm);
    }

    if (market) {
      countParamCount++;
      countSql += ` AND (m.slug = $${countParamCount} OR m.id = $${countParamCount})`;
      countValues.push(market);
    }

    if (categoria) {
      countParamCount++;
      countSql += ` AND p.categoria = $${countParamCount}`;
      countValues.push(categoria);
    }

    if (preco_min) {
      countParamCount++;
      countSql += ` AND p.preco >= $${countParamCount}`;
      countValues.push(parseFloat(preco_min));
    }

    if (preco_max) {
      countParamCount++;
      countSql += ` AND p.preco <= $${countParamCount}`;
      countValues.push(parseFloat(preco_max));
    }

    if (promocao === 'true') {
      countSql += ` AND p.promocao = true`;
    }

    const countResult = await query(countSql, countValues);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        products: result.rows.map(product => ({
          ...product,
          preco_promocional: product.promocao 
            ? (product.preco * (1 - product.desconto / 100)).toFixed(2)
            : null
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/categories - Listar categorias (público)
router.get('/categories', optionalAuth, async (req, res) => {
  try {
    const { market } = req.query;

    let sql = `
      SELECT 
        pc.categoria,
        pc.subcategoria,
        pc.product_count,
        pc.avg_price,
        pc.min_price,
        pc.max_price,
        m.name as market_name,
        m.slug as market_slug
      FROM product_categories pc
      JOIN markets m ON pc.market_id = m.id
      WHERE pc.is_active = true 
      AND m.status = 'active'
      AND m.verified = true
    `;

    const values = [];
    let paramCount = 0;

    if (market) {
      paramCount++;
      sql += ` AND (m.slug = $${paramCount} OR m.id = $${paramCount})`;
      values.push(market);
    }

    sql += ` ORDER BY pc.product_count DESC, pc.categoria ASC`;

    const result = await query(sql, values);

    res.json({
      success: true,
      data: {
        categories: result.rows
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/:id - Buscar produto por ID (público)
router.get('/:id', optionalAuth, validateUuidParam, async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.*,
        m.name as market_name,
        m.slug as market_slug,
        m.address_street,
        m.address_city,
        m.address_state,
        m.phone as market_phone,
        m.whatsapp as market_whatsapp,
        m.verified as market_verified
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.id = $1 
      AND p.status = 'active'
      AND m.status = 'active'
      AND m.verified = true
    `;

    const result = await query(sql, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    const product = result.rows[0];

    // Incrementar visualizações
    await query(
      'UPDATE products SET visualizacoes = visualizacoes + 1 WHERE id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        product: {
          ...product,
          preco_promocional: product.promocao 
            ? (product.preco * (1 - product.desconto / 100)).toFixed(2)
            : null
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS AUTENTICADAS (gerenciamento de produtos)
// =====================================================

// POST /api/products/upload-json/:marketId - Upload de JSON com produtos
router.post('/upload-json/:marketId', 
  authenticate, 
  validateUuidParam, 
  requireMarketAccess('manage'),
  upload.single('jsonFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo JSON é obrigatório'
        });
      }

      const marketId = req.params.marketId;
      const file = req.file;

      // Calcular hash do arquivo
      const fileBuffer = await fs.readFile(file.path);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Verificar se o arquivo já foi processado
      const existingUpload = await query(
        'SELECT id FROM json_uploads WHERE market_id = $1 AND file_hash = $2',
        [marketId, fileHash]
      );

      if (existingUpload.rows.length > 0) {
        // Remover arquivo duplicado
        await fs.unlink(file.path).catch(() => {});
        
        return res.status(409).json({
          success: false,
          error: 'Este arquivo já foi processado anteriormente'
        });
      }

      // Registrar upload
      const uploadRecord = await query(`
        INSERT INTO json_uploads (
          market_id, filename, original_filename, file_size, file_hash, 
          status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        marketId,
        file.filename,
        file.originalname,
        file.size,
        fileHash,
        'processing',
        req.user.id
      ]);

      const uploadId = uploadRecord.rows[0].id;

      // Processar arquivo em background
      processJsonFile(uploadId, file.path, marketId, req.user.id)
        .catch(error => {
          console.error('❌ Erro no processamento do JSON:', error);
        });

      res.status(202).json({
        success: true,
        message: 'Arquivo recebido e está sendo processado',
        data: {
          uploadId,
          filename: file.originalname,
          status: 'processing'
        }
      });

    } catch (error) {
      console.error('❌ Erro no upload de JSON:', error);
      
      // Remover arquivo em caso de erro
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// GET /api/products/upload-status/:uploadId - Status do processamento
router.get('/upload-status/:uploadId', 
  authenticate, 
  validateUuidParam,
  async (req, res) => {
    try {
      const sql = `
        SELECT 
          ju.*,
          m.name as market_name
        FROM json_uploads ju
        JOIN markets m ON ju.market_id = m.id
        WHERE ju.id = $1
      `;

      const result = await query(sql, [req.params.uploadId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Upload não encontrado'
        });
      }

      const upload = result.rows[0];

      // Verificar se o usuário tem acesso ao mercado
      if (req.user.role !== 'admin') {
        const hasAccess = await req.user.hasMarketPermission(upload.market_id, 'view');
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado'
          });
        }
      }

      res.json({
        success: true,
        data: { upload }
      });

    } catch (error) {
      console.error('❌ Erro ao verificar status do upload:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Função para processar arquivo JSON
async function processJsonFile(uploadId, filePath, marketId, userId) {
  const startTime = Date.now();
  
  try {
    // Atualizar status para processando
    await query(
      'UPDATE json_uploads SET status = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['processing', uploadId]
    );

    // Ler e parsear arquivo JSON
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.produtos || !Array.isArray(jsonData.produtos)) {
      throw new Error('Formato de JSON inválido. Esperado: { "produtos": [...] }');
    }

    const produtos = jsonData.produtos;
    let created = 0;
    let updated = 0;
    let failed = 0;

    // Processar produtos em lotes
    await transaction(async (client) => {
      for (const produto of produtos) {
        try {
          // Validar dados obrigatórios
          if (!produto.nome || !produto.preco) {
            failed++;
            continue;
          }

          const productData = {
            market_id: marketId,
            external_id: produto.id?.toString(),
            nome: produto.nome,
            categoria: produto.categoria,
            subcategoria: produto.subcategoria,
            preco: parseFloat(produto.preco),
            loja: produto.loja,
            endereco: produto.endereco,
            telefone: produto.telefone,
            marca: produto.marca,
            codigo_barras: produto.codigo_barras,
            peso: produto.peso,
            origem: produto.origem,
            estoque: produto.estoque || 0,
            promocao: produto.promocao || false,
            desconto: produto.desconto || 0,
            preco_original: produto.promocao ? produto.preco : null,
            avaliacao: produto.avaliacao || 0,
            visualizacoes: produto.visualizacoes || 0,
            conversoes: produto.conversoes || 0,
            data_source: 'json_upload',
            json_source_file: path.basename(filePath),
            last_updated_from_source: new Date(),
            created_by: userId
          };

          // Inserir ou atualizar produto
          const upsertSql = `
            INSERT INTO products (
              market_id, external_id, nome, categoria, subcategoria, preco,
              loja, endereco, telefone, marca, codigo_barras, peso, origem,
              estoque, promocao, desconto, preco_original, avaliacao,
              visualizacoes, conversoes, data_source, json_source_file, 
              last_updated_from_source, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            )
            ON CONFLICT (market_id, external_id) 
            DO UPDATE SET
              nome = EXCLUDED.nome,
              categoria = EXCLUDED.categoria,
              subcategoria = EXCLUDED.subcategoria,
              preco = EXCLUDED.preco,
              loja = EXCLUDED.loja,
              endereco = EXCLUDED.endereco,
              telefone = EXCLUDED.telefone,
              marca = EXCLUDED.marca,
              codigo_barras = EXCLUDED.codigo_barras,
              peso = EXCLUDED.peso,
              origem = EXCLUDED.origem,
              estoque = EXCLUDED.estoque,
              promocao = EXCLUDED.promocao,
              desconto = EXCLUDED.desconto,
              preco_original = EXCLUDED.preco_original,
              avaliacao = EXCLUDED.avaliacao,
              data_source = EXCLUDED.data_source,
              last_updated_from_source = EXCLUDED.last_updated_from_source,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $24
            RETURNING (xmax = 0) AS inserted
          `;

          const values = [
            productData.market_id,
            productData.external_id,
            productData.nome,
            productData.categoria,
            productData.subcategoria,
            productData.preco,
            productData.loja,
            productData.endereco,
            productData.telefone,
            productData.marca,
            productData.codigo_barras,
            productData.peso,
            productData.origem,
            productData.estoque,
            productData.promocao,
            productData.desconto,
            productData.preco_original,
            productData.avaliacao,
            productData.visualizacoes,
            productData.conversoes,
            productData.data_source,
            productData.json_source_file,
            productData.last_updated_from_source,
            userId
          ];

          const result = await client.query(upsertSql, values);
          
          if (result.rows[0].inserted) {
            created++;
          } else {
            updated++;
          }

        } catch (productError) {
          console.error('❌ Erro ao processar produto:', productError);
          failed++;
        }
      }
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Atualizar estatísticas do mercado
    const stats = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT categoria) as total_categories
      FROM products 
      WHERE market_id = $1 AND status = 'active'
    `, [marketId]);

    await query(`
      UPDATE markets 
      SET 
        total_products = $1,
        total_categories = $2,
        has_database = true,
        last_data_sync = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [
      stats.rows[0].total_products,
      stats.rows[0].total_categories,
      marketId
    ]);

    // Finalizar upload
    await query(`
      UPDATE json_uploads 
      SET 
        status = $1,
        total_products = $2,
        products_created = $3,
        products_updated = $4,
        products_failed = $5,
        completed_at = CURRENT_TIMESTAMP,
        processing_duration = $6
      WHERE id = $7
    `, ['completed', produtos.length, created, updated, failed, duration, uploadId]);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'upload', 'products', uploadId, `JSON processado: ${created} criados, ${updated} atualizados, ${failed} falharam`]
    );

    console.log(`✅ JSON processado: ${created} criados, ${updated} atualizados, ${failed} falharam`);

  } catch (error) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.error('❌ Erro no processamento do JSON:', error);

    // Atualizar status de erro
    await query(`
      UPDATE json_uploads 
      SET 
        status = $1,
        error_message = $2,
        error_details = $3,
        completed_at = CURRENT_TIMESTAMP,
        processing_duration = $4
      WHERE id = $5
    `, [
      'failed',
      error.message,
      JSON.stringify({ error: error.stack }),
      duration,
      uploadId
    ]);
  } finally {
    // Remover arquivo após processamento
    await fs.unlink(filePath).catch(() => {});
  }
}

// =====================================================
// BUSCA UNIFICADA DE PRODUTOS (PARA CLIENTES)
// =====================================================

// GET /api/products/search - Busca unificada em todos os mercados
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      categoria, 
      subcategoria, 
      mercado_id,
      mercado_slug,
      cidade,
      estado,
      promocao, 
      preco_min,
      preco_max,
      marca,
      page = 1, 
      limit = 50,
      sort = 'price_asc'
    } = req.query;

    let sql = `
      SELECT DISTINCT ON (p.name, p.category, p.brand)
        p.id,
        p.name,
        p.category,
        p.subcategory,
        CASE 
          WHEN p.is_promotion = true AND p.promotional_price IS NOT NULL 
          THEN p.promotional_price 
          ELSE p.price 
        END as final_price,
        p.price as original_price,
        p.promotional_price,
        p.is_promotion,
        p.discount_percentage,
        p.brand,
        p.barcode,
        p.weight,
        p.origin,
        p.stock_quantity,
        p.rating,
        p.views,
        p.conversions,
        p.image_url,
        m.id as market_id,
        m.name as market_name,
        m.slug as market_slug,
        m.address_city,
        m.address_state,
        m.address_neighborhood,
        m.average_rating as market_rating
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' 
      AND m.status = 'active'
      AND m.verified = true
    `;
    
    const values = [];
    let paramCount = 0;

    // Filtros
    if (search) {
      paramCount++;
      sql += ` AND p.search_vector @@ plainto_tsquery('portuguese', $${paramCount})`;
      values.push(search);
    }

    if (categoria && categoria !== 'todas') {
      paramCount++;
      sql += ` AND p.category = $${paramCount}`;
      values.push(categoria);
    }

    if (subcategoria) {
      paramCount++;
      sql += ` AND p.subcategory = $${paramCount}`;
      values.push(subcategoria);
    }

    if (mercado_id) {
      paramCount++;
      sql += ` AND m.id = $${paramCount}`;
      values.push(mercado_id);
    }

    if (mercado_slug) {
      paramCount++;
      sql += ` AND m.slug = $${paramCount}`;
      values.push(mercado_slug);
    }

    if (cidade) {
      paramCount++;
      sql += ` AND LOWER(m.address_city) = LOWER($${paramCount})`;
      values.push(cidade);
    }

    if (estado) {
      paramCount++;
      sql += ` AND LOWER(m.address_state) = LOWER($${paramCount})`;
      values.push(estado);
    }

    if (promocao === 'true') {
      sql += ` AND p.is_promotion = true`;
    }

    if (marca) {
      paramCount++;
      sql += ` AND LOWER(p.brand) = LOWER($${paramCount})`;
      values.push(marca);
    }

    if (preco_min) {
      paramCount++;
      sql += ` AND (CASE WHEN p.is_promotion = true AND p.promotional_price IS NOT NULL THEN p.promotional_price ELSE p.price END) >= $${paramCount}`;
      values.push(preco_min);
    }

    if (preco_max) {
      paramCount++;
      sql += ` AND (CASE WHEN p.is_promotion = true AND p.promotional_price IS NOT NULL THEN p.promotional_price ELSE p.price END) <= $${paramCount}`;
      values.push(preco_max);
    }

    // Ordenação
    const sortOptions = {
      'price_asc': 'final_price ASC',
      'price_desc': 'final_price DESC',
      'name_asc': 'p.name ASC',
      'name_desc': 'p.name DESC',
      'rating_desc': 'p.rating DESC NULLS LAST',
      'market_rating_desc': 'm.average_rating DESC NULLS LAST',
      'promotion': 'p.is_promotion DESC, final_price ASC',
      'newest': 'p.created_at DESC'
    };

    const orderBy = sortOptions[sort] || sortOptions['price_asc'];
    sql += ` ORDER BY p.name, p.category, p.brand, ${orderBy}`;

    // Paginação
    const offset = (page - 1) * limit;
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(parseInt(limit));

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await query(sql, values);

    // Contar total (sem duplicatas)
    let countSql = `
      SELECT COUNT(DISTINCT (p.name, p.category, p.brand))
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' 
      AND m.status = 'active'
      AND m.verified = true
    `;
    
    const countValues = [];
    let countParams = 0;

    // Aplicar os mesmos filtros para o count
    if (search) {
      countParams++;
      countSql += ` AND p.search_vector @@ plainto_tsquery('portuguese', $${countParams})`;
      countValues.push(search);
    }

    if (categoria && categoria !== 'todas') {
      countParams++;
      countSql += ` AND p.category = $${countParams}`;
      countValues.push(categoria);
    }

    if (subcategoria) {
      countParams++;
      countSql += ` AND p.subcategory = $${countParams}`;
      countValues.push(subcategoria);
    }

    if (mercado_id) {
      countParams++;
      countSql += ` AND m.id = $${countParams}`;
      countValues.push(mercado_id);
    }

    if (mercado_slug) {
      countParams++;
      countSql += ` AND m.slug = $${countParams}`;
      countValues.push(mercado_slug);
    }

    if (cidade) {
      countParams++;
      countSql += ` AND LOWER(m.address_city) = LOWER($${countParams})`;
      countValues.push(cidade);
    }

    if (estado) {
      countParams++;
      countSql += ` AND LOWER(m.address_state) = LOWER($${countParams})`;
      countValues.push(estado);
    }

    if (promocao === 'true') {
      countSql += ` AND p.is_promotion = true`;
    }

    if (marca) {
      countParams++;
      countSql += ` AND LOWER(p.brand) = LOWER($${countParams})`;
      countValues.push(marca);
    }

    if (preco_min) {
      countParams++;
      countSql += ` AND (CASE WHEN p.is_promotion = true AND p.promotional_price IS NOT NULL THEN p.promotional_price ELSE p.price END) >= $${countParams}`;
      countValues.push(preco_min);
    }

    if (preco_max) {
      countParams++;
      countSql += ` AND (CASE WHEN p.is_promotion = true AND p.promotional_price IS NOT NULL THEN p.promotional_price ELSE p.price END) <= $${countParams}`;
      countValues.push(preco_max);
    }

    const countResult = await query(countSql, countValues);
    const total = parseInt(countResult.rows[0].count);

    // Mapear resultados
    const products = result.rows.map(p => ({
      id: p.id,
      nome: p.name,
      categoria: p.category,
      subcategoria: p.subcategoria,
      preco: parseFloat(p.final_price),
      preco_original: p.promotional_price ? parseFloat(p.original_price) : null,
      promocao: p.is_promotion,
      desconto: p.discount_percentage,
      marca: p.brand,
      codigo_barras: p.barcode,
      peso: p.weight,
      origem: p.origin,
      estoque: p.stock_quantity,
      avaliacao: p.rating,
      visualizacoes: p.views,
      conversoes: p.conversions,
      imagem: p.image_url || `https://via.placeholder.com/150x150/004A7C/white?text=${encodeURIComponent(p.name.substring(0, 10))}`,
      mercado: {
        id: p.market_id,
        nome: p.market_name,
        slug: p.market_slug,
        cidade: p.address_city,
        estado: p.address_state,
        bairro: p.address_neighborhood,
        avaliacao: p.market_rating
      }
    }));

    // Buscar categorias disponíveis para filtros
    const categoriesResult = await query(`
      SELECT DISTINCT p.category
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' AND m.status = 'active' AND m.verified = true
      ORDER BY p.category
    `);

    // Buscar marcas disponíveis
    const brandsResult = await query(`
      SELECT DISTINCT p.brand
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' AND m.status = 'active' AND m.verified = true
      AND p.brand IS NOT NULL
      ORDER BY p.brand
    `);

    res.json({
      success: true,
      data: {
        products,
        filters: {
          categorias: categoriesResult.rows.map(r => r.category),
          marcas: brandsResult.rows.map(r => r.brand)
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro na busca de produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/compare - Comparar preços de um produto entre mercados
router.get('/compare', optionalAuth, async (req, res) => {
  try {
    const { search, categoria, marca, codigo_barras } = req.query;

    if (!search && !codigo_barras) {
      return res.status(400).json({
        success: false,
        error: 'É necessário fornecer um termo de busca ou código de barras'
      });
    }

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.subcategory,
        CASE 
          WHEN p.is_promotion = true AND p.promotional_price IS NOT NULL 
          THEN p.promotional_price 
          ELSE p.price 
        END as final_price,
        p.price as original_price,
        p.promotional_price,
        p.is_promotion,
        p.discount_percentage,
        p.brand,
        p.barcode,
        p.stock_quantity,
        p.rating,
        p.image_url,
        m.id as market_id,
        m.name as market_name,
        m.slug as market_slug,
        m.address_city,
        m.address_state,
        m.average_rating as market_rating
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' 
      AND m.status = 'active'
      AND m.verified = true
    `;
    
    const values = [];
    let paramCount = 0;

    if (codigo_barras) {
      paramCount++;
      sql += ` AND p.barcode = $${paramCount}`;
      values.push(codigo_barras);
    } else {
      paramCount++;
      sql += ` AND p.search_vector @@ plainto_tsquery('portuguese', $${paramCount})`;
      values.push(search);

      if (categoria) {
        paramCount++;
        sql += ` AND p.category = $${paramCount}`;
        values.push(categoria);
      }

      if (marca) {
        paramCount++;
        sql += ` AND LOWER(p.brand) = LOWER($${paramCount})`;
        values.push(marca);
      }
    }

    sql += ` ORDER BY final_price ASC`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          products: [],
          message: 'Nenhum produto encontrado com os critérios especificados'
        }
      });
    }

    // Agrupar por produto similar e encontrar o melhor preço
    const productGroups = {};
    
    result.rows.forEach(p => {
      const key = `${p.name.toLowerCase()}-${p.category}-${p.brand || 'sem-marca'}`;
      
      if (!productGroups[key]) {
        productGroups[key] = {
          product_info: {
            nome: p.name,
            categoria: p.category,
            subcategoria: p.subcategory,
            marca: p.brand,
            codigo_barras: p.barcode
          },
          offers: [],
          best_price: p.final_price,
          worst_price: p.final_price,
          savings: 0
        };
      }

      productGroups[key].offers.push({
        id: p.id,
        preco: parseFloat(p.final_price),
        preco_original: p.promotional_price ? parseFloat(p.original_price) : null,
        promocao: p.is_promotion,
        desconto: p.discount_percentage,
        estoque: p.stock_quantity,
        avaliacao: p.rating,
        imagem: p.image_url,
        mercado: {
          id: p.market_id,
          nome: p.market_name,
          slug: p.market_slug,
          cidade: p.address_city,
          estado: p.address_state,
          avaliacao: p.market_rating
        }
      });

      // Atualizar melhor e pior preço
      if (p.final_price < productGroups[key].best_price) {
        productGroups[key].best_price = p.final_price;
      }
      if (p.final_price > productGroups[key].worst_price) {
        productGroups[key].worst_price = p.final_price;
      }
      
      productGroups[key].savings = productGroups[key].worst_price - productGroups[key].best_price;
    });

    // Converter para array e ordenar por economia
    const comparisons = Object.values(productGroups)
      .sort((a, b) => b.savings - a.savings);

    res.json({
      success: true,
      data: {
        comparisons,
        total_products: comparisons.length,
        total_offers: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Erro na comparação de produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;