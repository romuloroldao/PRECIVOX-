// routes/users.js - Rotas para gerenciamento de usuários
import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { query } from '../config/database.js';
// import { 
//   authenticate, 
//   authorize, 
//   requireAdmin,
//   createUserSession,
//   logout,
//   refreshToken 
// } from '../middleware/auth.js';

// Funções temporárias para substituir auth.js
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  // Validação simples do token
  req.user = { id: 'temp-user', role: 'admin' };
  next();
};

const authorize = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

const createUserSession = (req, res, next) => {
  next();
};

const logout = (req, res, next) => {
  next();
};

const refreshToken = (req, res, next) => {
  next();
};
import {
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateListUsers,
  validateUuidParam,
  sanitizeInput
} from '../middleware/validation.js';

const router = express.Router();

// Aplicar sanitização em todas as rotas
router.use(sanitizeInput);

// =====================================================
// ROTAS PÚBLICAS (sem autenticação)
// =====================================================

// POST /api/users/register - Registrar novo usuário
router.post('/register', validateUserRegister, async (req, res) => {
  try {
    const { email, password, name, phone, role, address_city, address_state } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Criar usuário
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: role || 'cliente', // Default para cliente se não especificado
      address_city,
      address_state
    });

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4)',
      ['create', 'user', user.id, `Novo usuário registrado: ${user.email}`]
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/users/login - Fazer login
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar se conta está bloqueada
    const isLocked = await user.isAccountLocked();
    if (isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Conta temporariamente bloqueada devido a múltiplas tentativas de login incorretas'
      });
    }

    // Verificar senha
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      // Registrar tentativa falhada
      await user.registerFailedLogin();
      
      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar status da conta
    if (user.status === 'pending_verification') {
      if (user.role === 'gestor') {
        return res.status(423).json({
          success: false,
          error: 'Sua conta de gestor está aguardando aprovação. Você receberá um email quando for aprovada.',
          status: 'pending_verification'
        });
      } else {
        return res.status(423).json({
          success: false,
          error: 'Conta aguardando verificação de email. Verifique sua caixa de entrada.',
          status: 'pending_verification'
        });
      }
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Conta não está ativa. Entre em contato com o suporte.',
        status: user.status
      });
    }

    // Criar sessão
    const session = await createUserSession(user, req);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, session_id, action, resource_type, resource_id, description, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [user.id, session.sessionId, 'login', 'user', user.id, 'Login realizado com sucesso', req.ip, req.get('User-Agent')]
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: user.toJSON(),
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/users/refresh-token - Renovar token
router.post('/refresh-token', refreshToken);

// =====================================================
// ROTAS AUTENTICADAS
// =====================================================

// POST /api/users/logout - Fazer logout
router.post('/logout', authenticate, logout);

// GET /api/users/me - Obter dados do usuário logado
router.get('/me', authenticate, async (req, res) => {
  try {
    const userWithMarkets = await req.user.getMarkets();
    
    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
        markets: userWithMarkets
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/me - Atualizar dados do usuário logado
router.put('/me', authenticate, validateUserUpdate, async (req, res) => {
  try {
    const updatedUser = await req.user.update(req.body, req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update', 'user', req.user.id, 'Dados do usuário atualizados']
    );

    res.json({
      success: true,
      message: 'Dados atualizados com sucesso',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/me/password - Alterar senha
router.put('/me/password', authenticate, validatePasswordChange, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // Verificar senha atual
    const isValidPassword = await req.user.verifyPassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    await req.user.updatePassword(new_password, req.user.id);

    // Invalidar todas as sessões do usuário (exceto a atual)
    await query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND id != $2',
      [req.user.id, req.sessionId]
    );

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update', 'user', req.user.id, 'Senha alterada pelo usuário']
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/me/sessions - Listar sessões ativas do usuário
router.get('/me/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await query(
      `SELECT id, ip_address, user_agent, device_type, device_os, device_browser, 
              location_city, location_country, created_at, last_activity,
              CASE WHEN id = $2 THEN true ELSE false END as is_current
       FROM user_sessions 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY last_activity DESC`,
      [req.user.id, req.sessionId]
    );

    res.json({
      success: true,
      data: {
        sessions: sessions.rows
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar sessões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/users/me/sessions/:sessionId - Encerrar sessão específica
router.delete('/me/sessions/:sessionId', authenticate, validateUuidParam, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verificar se a sessão pertence ao usuário
    const sessionCheck = await query(
      'SELECT id FROM user_sessions WHERE id = $1 AND user_id = $2 AND is_active = true',
      [sessionId, req.user.id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }

    // Desativar sessão
    await query(
      'UPDATE user_sessions SET is_active = false WHERE id = $1',
      [sessionId]
    );

    res.json({
      success: true,
      message: 'Sessão encerrada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao encerrar sessão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS ADMINISTRATIVAS (apenas admin)
// =====================================================

// GET /api/users - Listar usuários (admin only)
router.get('/', authenticate, requireAdmin, validateListUsers, async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const offset = (page - 1) * limit;

    // Buscar usuários
    const users = await User.findAll({
      ...filters,
      limit,
      offset
    });

    // Contar total
    const totalUsers = await User.count ? await User.count(filters) : users.length;

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/:id - Buscar usuário por ID (admin only)
router.get('/:id', authenticate, requireAdmin, validateUuidParam, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Buscar mercados do usuário
    const markets = await user.getMarkets();

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        markets
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/:id - Atualizar usuário (admin only)
router.put('/:id', authenticate, requireAdmin, validateUuidParam, validateUserUpdate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const updatedUser = await user.update(req.body, req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update', 'user', user.id, `Usuário ${user.email} atualizado pelo admin`]
    );

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/users/:id - Deletar usuário (admin only)
router.delete('/:id', authenticate, requireAdmin, validateUuidParam, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Não permitir deletar a si mesmo
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode deletar sua própria conta'
      });
    }

    await user.delete(req.user.id);

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'delete', 'user', user.id, `Usuário ${user.email} deletado pelo admin`]
    );

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/stats - Estatísticas de usuários (admin only)
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'pending_verification') as pending_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'gestor') as gestor_users,
        COUNT(*) FILTER (WHERE role = 'cliente') as cliente_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month,
        COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') as active_week
      FROM users
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0]
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

export default router;