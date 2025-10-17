// routes/markets.js - Rotas para gerenciamento de mercados
import express from 'express';
import { Market } from '../models/Market.js';
import { User } from '../models/User.js';
import { query, transaction } from '../config/database.js';
import { 
  authenticate, 
  requireAdmin,
  requireMarketAccess,
  optionalAuth
} from '../middleware/auth.js';
import {
  validateMarketCreate,
  validateMarketPublicRegister,
  validateMarketUpdate,
  validateListMarkets,
  validateUuidParam,
  validateAddUserToMarket,
  sanitizeInput
} from '../middleware/validation.js';

const router = express.Router();

// Aplicar sanitização em todas as rotas
router.use(sanitizeInput);

// =====================================================
// ROTAS PÚBLICAS (com autenticação opcional)
// =====================================================

// GET /api/markets - Listar mercados (público com filtros)
router.get('/', optionalAuth, validateListMarkets, async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const offset = (page - 1) * limit;

    // Para usuários não autenticados, mostrar apenas mercados ativos e verificados
    if (!req.user) {
      filters.status = 'active';
      filters.verified = true;
    }

    // Buscar mercados
    const markets = await Market.findAll({
      ...filters,
      limit,
      offset
    });

    // Contar total
    const totalMarkets = await Market.count(filters);

    res.json({
      success: true,
      data: {
        markets: markets.map(market => {
          // Para usuários não autenticados, retornar dados públicos
          return req.user && req.user.role === 'admin' 
            ? market.toJSON() 
            : market.toPublicJSON();
        }),
        pagination: {
          page,
          limit,
          total: totalMarkets,
          pages: Math.ceil(totalMarkets / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar mercados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/markets/:id - Buscar mercado por ID (público)
router.get('/:id', optionalAuth, validateUuidParam, async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Para usuários não autenticados, mostrar apenas se ativo e verificado
    if (!req.user && (market.status !== 'active' || !market.verified)) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Verificar permissão para dados completos
    let hasAccess = false;
    if (req.user) {
      hasAccess = req.user.role === 'admin' || 
                  await req.user.hasMarketPermission(market.id, 'view');
    }

    res.json({
      success: true,
      data: {
        market: hasAccess ? market.toJSON() : market.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/markets/slug/:slug - Buscar mercado por slug (público)
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const market = await Market.findBySlug(req.params.slug);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Para usuários não autenticados, mostrar apenas se ativo e verificado
    if (!req.user && (market.status !== 'active' || !market.verified)) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Verificar permissão para dados completos
    let hasAccess = false;
    if (req.user) {
      hasAccess = req.user.role === 'admin' || 
                  await req.user.hasMarketPermission(market.id, 'view');
    }

    res.json({
      success: true,
      data: {
        market: hasAccess ? market.toJSON() : market.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mercado por slug:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS AUTENTICADAS
// =====================================================

// POST /api/markets/register - Cadastro público de mercado (SEM autenticação)
router.post('/register', validateMarketPublicRegister, async (req, res) => {
  try {
    const { manager, ...marketData } = req.body;
    
    console.log('📋 Recebendo cadastro de mercado:', {
      nome: marketData.name,
      cnpj: marketData.cnpj,
      email: marketData.email
    });

    // Verificar se CNPJ já existe
    const existingMarket = await Market.findByCnpj(marketData.cnpj);
    if (existingMarket) {
      return res.status(409).json({
        success: false,
        error: 'CNPJ já está cadastrado'
      });
    }

    // Criar mercado em transação atômica
    const result = await transaction(async (client) => {
      // 1. Criar mercado com status 'pending' (aguardando aprovação)
      const market = await Market.createWithTransaction(client, {
        ...marketData,
        status: 'pending', // Mercados públicos começam como pending
        verified: false
      }, null); // sem createdBy (cadastro público)
      
      // 2. Criar/associar gestor se fornecido
      let managerUser;
      if (manager?.email) {
        // Verificar se usuário já existe
        const existingUser = await User.findByEmail(manager.email);
        
        if (existingUser) {
          // Usuário existe, associar ao mercado
          await Market.addUserWithTransaction(client, market.id, existingUser.id, 'owner', null, null);
          managerUser = existingUser;
        } else {
          // Criar novo usuário gestor
          managerUser = await User.createWithTransaction(client, {
            ...manager,
            role: 'gestor',
            status: 'pending_verification', // Requer verificação de email
            email_verified: false
          }, null);
          
          // Associar ao mercado
          await Market.addUserWithTransaction(client, market.id, managerUser.id, 'owner', null, null);
        }
      }

      return { market, managerUser };
    });

    console.log('✅ Mercado cadastrado com sucesso:', result.market.id);

    res.status(201).json({
      success: true,
      message: 'Mercado cadastrado com sucesso! Aguarde aprovação da equipe PRECIVOX.',
      data: {
        market: {
          id: result.market.id,
          name: result.market.name,
          slug: result.market.slug,
          status: result.market.status,
          cnpj: result.market.cnpj
        },
        manager: result.managerUser ? {
          id: result.managerUser.id,
          name: result.managerUser.name,
          email: result.managerUser.email
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao cadastrar mercado:', error);
    
    if (error.code === 'DUPLICATE_CNPJ' || error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'CNPJ já está cadastrado'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao cadastrar mercado. Por favor, tente novamente.'
    });
  }
});

// POST /api/markets - Criar novo mercado (autenticado - ADMIN)
router.post('/', authenticate, requireAdmin, validateMarketCreate, async (req, res) => {
  try {
    const { manager, ...marketData } = req.body;
    
    // Verificar se gestor já está associado a outro mercado
    if (manager?.email) {
      const existingUser = await User.findByEmail(manager.email);
      if (existingUser) {
        const hasOtherMarket = await existingUser.hasAnyMarketAccess();
        if (hasOtherMarket) {
          return res.status(409).json({
            success: false,
            error: 'Este gestor já está associado a outro mercado'
          });
        }
      }
    }

    // Criar mercado e gestor em transação atômica
    const result = await transaction(async (client) => {
      // 1. Criar mercado
      const market = await Market.createWithTransaction(client, marketData, req.user.id);
      
      // 2. Criar/associar gestor
      let managerUser;
      if (manager?.email) {
        if (existingUser) {
          // Usuário existe, apenas associar
          managerUser = await Market.addUserWithTransaction(client, market.id, existingUser.id, 'owner', null, req.user.id);
        } else {
          // Criar novo usuário gestor
          managerUser = await User.createWithTransaction(client, {
            ...manager,
            role: 'gestor',
            status: 'active'
          }, req.user.id);
          
          // Associar ao mercado
          await Market.addUserWithTransaction(client, market.id, managerUser.id, 'owner', null, req.user.id);
        }
      }

      // 3. Associar usuário criador como admin
      await Market.addUserWithTransaction(client, market.id, req.user.id, 'admin', null, req.user.id);

      return { market, managerUser };
    });

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'create', 'market', result.market.id, `Novo mercado criado: ${result.market.name}`]
    );

    res.status(201).json({
      success: true,
      message: 'Mercado criado com sucesso',
      data: {
        market: result.market.toJSON(),
        manager: result.managerUser ? result.managerUser.toJSON() : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar mercado:', error);
    
    if (error.code === 'DUPLICATE_CNPJ') {
      return res.status(409).json({
        success: false,
        error: 'CNPJ já está cadastrado'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/markets/:id - Atualizar mercado
router.put('/:id', authenticate, validateUuidParam, requireMarketAccess('manage'), validateMarketUpdate, async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Atualizando mercado ${req.params.id}`);
    console.log(`👤 Usuário: ${req.user.email} (${req.user.role})`);
    console.log(`📝 Dados recebidos:`, req.body);
    
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      console.log(`❌ Mercado ${req.params.id} não encontrado`);
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }
    
    console.log(`🏪 Mercado encontrado: ${market.name}`);
    console.log(`📊 Dados atuais:`, {
      name: market.name,
      email: market.email,
      phone: market.phone,
      address_city: market.address_city
    });

    // Verificar se CNPJ já existe em outro mercado (se sendo alterado)
    if (req.body.cnpj && req.body.cnpj !== market.cnpj) {
      const existingMarket = await Market.findByCnpj(req.body.cnpj);
      if (existingMarket && existingMarket.id !== market.id) {
        return res.status(409).json({
          success: false,
          error: 'CNPJ já está cadastrado em outro mercado'
        });
      }
    }

    console.log(`💾 Iniciando atualização no banco de dados...`);
    const updatedMarket = await market.update(req.body, req.user.id);
    
    console.log(`✅ Mercado atualizado com sucesso!`);
    console.log(`📊 Dados após atualização:`, {
      name: updatedMarket.name,
      email: updatedMarket.email,
      phone: updatedMarket.phone,
      address_city: updatedMarket.address_city
    });

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update', 'market', market.id, `Mercado ${market.name} atualizado`]
    );

    res.json({
      success: true,
      message: 'Mercado atualizado com sucesso',
      data: {
        market: updatedMarket.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/markets/:id - Deletar mercado (admin ou owner)
router.delete('/:id', authenticate, validateUuidParam, async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Apenas admin ou owner pode deletar
    if (req.user.role !== 'admin') {
      const hasOwnerPermission = await req.user.hasMarketPermission(market.id, 'owner');
      if (!hasOwnerPermission) {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores ou proprietários podem deletar mercados'
        });
      }
    }

    await market.delete(req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'delete', 'market', market.id, `Mercado ${market.name} deletado`]
    );

    res.json({
      success: true,
      message: 'Mercado deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS DO MERCADO
// =====================================================

// GET /api/markets/:id/users - Listar usuários do mercado
router.get('/:id/users', authenticate, validateUuidParam, requireMarketAccess('view'), async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    const users = await market.getUsers();

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          // Remover dados sensíveis
          password_hash: undefined,
          email_verification_token: undefined,
          password_reset_token: undefined,
          two_factor_secret: undefined
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários do mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/markets/:id/users - Adicionar usuário ao mercado
router.post('/:id/users', authenticate, validateUuidParam, requireMarketAccess('manage'), validateAddUserToMarket, async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    const { user_id, role, permissions } = req.body;

    // Verificar se usuário existe
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Adicionar usuário ao mercado
    const marketUser = await market.addUser(user_id, role, permissions, req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'create', 'market_user', market.id, `Usuário ${user.email} adicionado ao mercado ${market.name} como ${role}`]
    );

    res.status(201).json({
      success: true,
      message: 'Usuário adicionado ao mercado com sucesso',
      data: {
        marketUser
      }
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar usuário ao mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/markets/:id/users/:userId - Remover usuário do mercado
router.delete('/:id/users/:userId', authenticate, validateUuidParam, requireMarketAccess('manage'), async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    const { userId } = req.params;

    // Não permitir remover a si mesmo
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode remover a si mesmo do mercado'
      });
    }

    // Verificar se usuário está no mercado
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const hasPermission = await user.hasMarketPermission(market.id, 'view');
    if (!hasPermission) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não está vinculado a este mercado'
      });
    }

    await market.removeUser(userId, req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'delete', 'market_user', market.id, `Usuário ${user.email} removido do mercado ${market.name}`]
    );

    res.json({
      success: true,
      message: 'Usuário removido do mercado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao remover usuário do mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS ADMINISTRATIVAS (apenas admin)
// =====================================================

// PUT /api/markets/:id/status - Alterar status do mercado (admin only)
router.put('/:id/status', authenticate, requireAdmin, validateUuidParam, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'pending', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }

    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    const updatedMarket = await market.update({ status }, req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update', 'market', market.id, `Status do mercado ${market.name} alterado para ${status}`]
    );

    res.json({
      success: true,
      message: 'Status do mercado atualizado com sucesso',
      data: {
        market: updatedMarket.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao alterar status do mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/markets/:id/verify - Verificar mercado (admin only)
router.put('/:id/verify', authenticate, requireAdmin, validateUuidParam, async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    const updatedMarket = await market.update({ 
      verified: true,
      verification_date: new Date(),
      status: 'active' // Automaticamente ativar quando verificar
    }, req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update', 'market', market.id, `Mercado ${market.name} verificado pelo admin`]
    );

    res.json({
      success: true,
      message: 'Mercado verificado com sucesso',
      data: {
        market: updatedMarket.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao verificar mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/markets/admin/stats - Estatísticas de mercados (admin only)
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_markets,
        COUNT(*) FILTER (WHERE status = 'active') as active_markets,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_markets,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_markets,
        COUNT(*) FILTER (WHERE verified = true) as verified_markets,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_markets_month,
        COUNT(*) FILTER (WHERE has_database = true) as markets_with_database,
        AVG(total_products) as avg_products_per_market,
        SUM(total_products) as total_products_all_markets
      FROM markets
    `);

    // Estatísticas por estado
    const stateStats = await query(`
      SELECT 
        address_state,
        COUNT(*) as market_count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count
      FROM markets
      GROUP BY address_state
      ORDER BY market_count DESC
      LIMIT 10
    `);

    // Estatísticas por categoria
    const categoryStats = await query(`
      SELECT 
        category,
        COUNT(*) as market_count
      FROM markets
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY market_count DESC
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        byState: stateStats.rows,
        byCategory: categoryStats.rows
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS DE UPLOAD E PROCESSAMENTO DE DADOS
// =====================================================

// POST /api/markets/:id/upload - Upload de JSON com produtos do mercado
router.post('/:id/upload', authenticate, validateUuidParam, requireMarketAccess('manage'), async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Sistema inteligente para detectar diferentes formatos de entrada
    let produtos = null;
    
    // Tentar diferentes formatos possíveis
    if (req.body.produtos && Array.isArray(req.body.produtos)) {
      produtos = req.body.produtos;
    } else if (Array.isArray(req.body)) {
      produtos = req.body; // Array direto
    } else if (req.body.data && Array.isArray(req.body.data)) {
      produtos = req.body.data;
    } else if (req.body.items && Array.isArray(req.body.items)) {
      produtos = req.body.items;
    } else if (req.body.products && Array.isArray(req.body.products)) {
      produtos = req.body.products;
    }
    
    if (!produtos || !Array.isArray(produtos)) {
      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos - Formato não reconhecido',
        details: {
          received_keys: Object.keys(req.body),
          expected_formats: [
            '{ "produtos": [...] }',
            '{ "data": [...] }', 
            '{ "products": [...] }',
            '[...] (array direto)'
          ],
          sample_format: {
            produtos: [
              {
                nome: "Produto Exemplo",
                categoria: "categoria_exemplo", 
                preco: 10.50,
                marca: "Marca Exemplo",
                codigo_barras: "123456789"
              }
            ]
          }
        }
      });
    }
    
    console.log(`📋 Processando ${produtos.length} produtos para o mercado ${market.name}`);
    
    // Normalizar produtos para formato padrão
    produtos = produtos.map((produto, index) => {
      // Sistema de mapeamento inteligente de campos
      const normalized = {};
      
      // Nome do produto (várias possibilidades)
      normalized.nome = produto.nome || produto.name || produto.produto || produto.title || produto.item || null;
      
      // Categoria
      normalized.categoria = produto.categoria || produto.category || produto.tipo || produto.class || null;
      
      // Preço (aceitar diferentes formatos)
      let preco = produto.preco || produto.price || produto.valor || produto.cost || produto.amount || 0;
      if (typeof preco === 'string') {
        // Remover símbolos de moeda e converter
        preco = parseFloat(preco.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      normalized.preco = Number(preco);
      
      // Campos opcionais com mapeamento inteligente
      normalized.subcategoria = produto.subcategoria || produto.subcategory || produto.sub_categoria || null;
      normalized.marca = produto.marca || produto.brand || produto.fabricante || produto.manufacturer || null;
      normalized.codigo_barras = produto.codigo_barras || produto.barcode || produto.ean || produto.gtin || produto.sku || null;
      normalized.peso = produto.peso || produto.weight || produto.size || null;
      normalized.origem = produto.origem || produto.origin || produto.source || null;
      normalized.estoque = produto.estoque || produto.stock || produto.quantity || produto.qtd || 0;
      normalized.descricao = produto.descricao || produto.description || produto.desc || null;
      normalized.promocao = produto.promocao || produto.promotion || produto.sale || false;
      normalized.desconto = produto.desconto || produto.discount || produto.off || 0;
      normalized.loja = produto.loja || produto.store || produto.shop || market.name;
      
      // Adicionar índice para debug
      normalized._index = index;
      
      return normalized;
    });

    // Validar estrutura dos produtos com mais flexibilidade
    const requiredFields = ['nome', 'categoria', 'preco'];
    const invalidProducts = [];
    const warnings = [];
    
    produtos.forEach((produto, index) => {
      const missingFields = [];
      
      // Validações obrigatórias mais flexíveis
      if (!produto.nome || produto.nome.trim() === '') {
        missingFields.push('nome');
      }
      
      if (!produto.categoria || produto.categoria.trim() === '') {
        missingFields.push('categoria');
      }
      
      if (!produto.preco || produto.preco <= 0) {
        missingFields.push('preco');
      }
      
      if (missingFields.length > 0) {
        invalidProducts.push({
          index: produto._index || index,
          missingFields,
          product: {
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco
          }
        });
      }
      
      // Warnings para campos recomendados
      if (!produto.marca) {
        warnings.push(`Produto "${produto.nome}" sem marca especificada`);
      }
      
      if (!produto.codigo_barras) {
        warnings.push(`Produto "${produto.nome}" sem código de barras`);
      }
    });

    // Se mais de 50% dos produtos são inválidos, rejeitar todo o upload
    if (invalidProducts.length > produtos.length * 0.5) {
      return res.status(400).json({
        success: false,
        error: 'Muitos produtos com dados inválidos',
        details: {
          invalid_count: invalidProducts.length,
          total_count: produtos.length,
          invalid_percentage: Math.round((invalidProducts.length / produtos.length) * 100),
          invalid_products: invalidProducts.slice(0, 10), // Mostrar apenas os primeiros 10
          suggestion: 'Verifique se os campos "nome", "categoria" e "preco" estão preenchidos corretamente'
        }
      });
    }
    
    // Log de warnings se houver
    if (warnings.length > 0) {
      console.log(`⚠️ Warnings durante processamento:`, warnings.slice(0, 5));
    }

    // Processar e inserir produtos (apenas produtos válidos)
    let processedCount = 0;
    let skippedCount = invalidProducts.length;
    const errors = [];
    
    // Filtrar apenas produtos válidos
    const validProducts = produtos.filter((produto, index) => {
      return !invalidProducts.some(invalid => invalid.index === (produto._index || index));
    });
    
    console.log(`✅ Produtos válidos: ${validProducts.length}/${produtos.length}`);

    for (const produto of validProducts) {
      try {
        // Verificar se produto já existe (por código de barras ou nome + mercado)
        let existingProduct = null;
        
        if (produto.codigo_barras) {
          const result = await query(
            'SELECT id FROM products WHERE market_id = $1 AND codigo_barras = $2',
            [market.id, produto.codigo_barras]
          );
          existingProduct = result.rows[0];
        }
        
        if (!existingProduct) {
          const result = await query(
            'SELECT id FROM products WHERE market_id = $1 AND LOWER(nome) = LOWER($2)',
            [market.id, produto.nome]
          );
          existingProduct = result.rows[0];
        }

        if (existingProduct) {
          // Atualizar produto existente
          await query(`
            UPDATE products SET
              categoria = $1,
              subcategoria = $2,
              preco = $3,
              preco_original = $4,
              promocao = $5,
              desconto = $6,
              marca = $7,
              codigo_barras = $8,
              peso = $9,
              origem = $10,
              estoque = $11,
              avaliacao = $12,
              visualizacoes = $13,
              conversoes = $14,
              disponivel = $15,
              loja = $16,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $17
            WHERE id = $18
          `, [
            produto.categoria,
            produto.subcategoria || null,
            produto.preco,
            produto.promocao ? (produto.preco * (1 - (produto.desconto || 0) / 100)) : null,
            produto.promocao || false,
            produto.desconto || 0,
            produto.marca || null,
            produto.codigo_barras || null,
            produto.peso || null,
            produto.origem || null,
            produto.estoque || 0,
            produto.avaliacao || null,
            produto.visualizacoes || 0,
            produto.conversoes || 0,
            (produto.estoque || 0) > 0, // disponivel baseado no estoque
            produto.loja || market.name, // usar loja do JSON ou nome do mercado
            null, // updated_by (admin upload)
            existingProduct.id
          ]);
        } else {
          // Inserir novo produto
          await query(`
            INSERT INTO products (
              market_id, nome, categoria, subcategoria, preco, preco_original,
              promocao, desconto, marca, codigo_barras, peso, origem,
              estoque, avaliacao, visualizacoes, conversoes, disponivel, loja, status, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'active', $19
            )
          `, [
            market.id,
            produto.nome,
            produto.categoria,
            produto.subcategoria || null,
            produto.preco,
            produto.promocao ? (produto.preco * (1 - (produto.desconto || 0) / 100)) : null,
            produto.promocao || false,
            produto.desconto || 0,
            produto.marca || null,
            produto.codigo_barras || null,
            produto.peso || null,
            produto.origem || null,
            produto.estoque || 0,
            produto.avaliacao || null,
            produto.visualizacoes || 0,
            produto.conversoes || 0,
            (produto.estoque || 0) > 0, // disponivel baseado no estoque
            produto.loja || market.name, // usar loja do JSON ou nome do mercado
            null // created_by (admin upload)
          ]);
        }
        
        processedCount++;
      } catch (error) {
        console.error('❌ Erro ao processar produto:', error);
        errors.push({
          product: produto.nome,
          error: error.message
        });
        skippedCount++;
      }
    }

    // Atualizar contador de produtos do mercado
    await query(`
      UPDATE markets SET 
        total_products = (SELECT COUNT(*) FROM products WHERE market_id = $1 AND status = 'active'),
        has_database = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [market.id]);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'upload', 'products', market.id, `Upload de produtos para ${market.name}: ${processedCount} processados, ${skippedCount} com erro`]
    );

    res.json({
      success: true,
      message: 'Upload processado com sucesso',
      data: {
        processed: processedCount,
        skipped: skippedCount,
        total: produtos.length,
        valid_products: validProducts.length,
        invalid_products: invalidProducts.length,
        market: {
          id: market.id,
          name: market.name
        },
        summary: {
          success_rate: Math.round((processedCount / produtos.length) * 100),
          warnings_count: warnings.length
        },
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limitar erros mostrados
        invalid_details: invalidProducts.length > 0 ? invalidProducts.slice(0, 5) : undefined
      }
    });

  } catch (error) {
    console.error('❌ Erro no upload de produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/markets/:id/products - Listar produtos do mercado
router.get('/:id/products', optionalAuth, validateUuidParam, async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    // Para usuários não autenticados, mostrar apenas se ativo e verificado
    if (!req.user && (market.status !== 'active' || !market.verified)) {
      return res.status(404).json({
        success: false,
        error: 'Mercado não encontrado'
      });
    }

    const { 
      search, 
      categoria, 
      subcategoria, 
      promocao, 
      page = 1, 
      limit = 50,
      sort = 'name'
    } = req.query;

    let sql = `
      SELECT 
        id, name, category, subcategory, price, promotional_price,
        is_promotion, discount_percentage, brand, barcode, weight,
        origin, stock_quantity, rating, views, conversions, image_url
      FROM products 
      WHERE market_id = $1 AND status = 'active'
    `;
    
    const values = [market.id];
    let paramCount = 1;

    // Filtros
    if (search) {
      paramCount++;
      sql += ` AND search_vector @@ plainto_tsquery('portuguese', $${paramCount})`;
      values.push(search);
    }

    if (categoria && categoria !== 'todas') {
      paramCount++;
      sql += ` AND category = $${paramCount}`;
      values.push(categoria);
    }

    if (subcategoria) {
      paramCount++;
      sql += ` AND subcategory = $${paramCount}`;
      values.push(subcategoria);
    }

    if (promocao === 'true') {
      sql += ` AND is_promotion = true`;
    }

    // Ordenação
    const validSorts = ['name', 'price', 'rating', 'views'];
    const sortField = validSorts.includes(sort) ? sort : 'name';
    sql += ` ORDER BY ${sortField} ASC`;

    // Paginação
    const offset = (page - 1) * limit;
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(parseInt(limit));

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await query(sql, values);

    // Contar total
    let countSql = `SELECT COUNT(*) FROM products WHERE market_id = $1 AND status = 'active'`;
    const countValues = [market.id];
    let countParams = 1;

    if (search) {
      countParams++;
      countSql += ` AND search_vector @@ plainto_tsquery('portuguese', $${countParams})`;
      countValues.push(search);
    }

    if (categoria && categoria !== 'todas') {
      countParams++;
      countSql += ` AND category = $${countParams}`;
      countValues.push(categoria);
    }

    if (subcategoria) {
      countParams++;
      countSql += ` AND subcategory = $${countParams}`;
      countValues.push(subcategoria);
    }

    if (promocao === 'true') {
      countSql += ` AND is_promotion = true`;
    }

    const countResult = await query(countSql, countValues);
    const total = parseInt(countResult.rows[0].count);

    const products = result.rows.map(p => ({
      id: p.id,
      nome: p.name,
      categoria: p.category,
      subcategoria: p.subcategory,
      preco: p.promotional_price || p.price,
      preco_original: p.promotional_price ? p.price : null,
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
      mercado: market.name,
      mercado_slug: market.slug
    }));

    res.json({
      success: true,
      data: {
        products,
        market: {
          id: market.id,
          name: market.name,
          slug: market.slug
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
    console.error('❌ Erro ao listar produtos do mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;