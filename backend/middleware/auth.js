// middleware/auth.js - Middleware de autenticação e autorização
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { query } from '../config/database.js';

// Chave secreta JWT (em produção deve vir de variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'precivox-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Gerar token JWT
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Gerar refresh token
export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Cache em memória para usuários (10 minutos TTL)
const userCache = new Map();
const USER_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Middleware de autenticação ESCALÁVEL
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    // 🚀 OTIMIZAÇÃO: Cache de usuário
    let user = null;
    const cacheKey = `user:${decoded.id}`;
    const cached = userCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < USER_CACHE_TTL) {
      user = cached.user;
    } else {
      // Buscar usuário no banco apenas se não estiver em cache
      user = await User.findById(decoded.id);
      
      if (user) {
        userCache.set(cacheKey, {
          user,
          timestamp: Date.now()
        });
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Conta de usuário não está ativa'
      });
    }

    // 🚀 OTIMIZAÇÃO: Remover verificação de sessão no banco
    // Para alta escala, confiamos apenas no JWT
    
    // Adicionar usuário ao request (sem sessionId para stateless)
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Middleware de autorização por role
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - permissões insuficientes'
      });
    }

    next();
  };
};

// Middleware para verificar se é admin
export const requireAdmin = authorize('admin');

// Middleware para verificar se é gestor ou admin
export const requireGestor = authorize('gestor', 'admin');

// Middleware para verificar acesso a mercado específico
export const requireMarketAccess = (permission = 'view') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      const marketId = req.params.id || req.params.marketId || req.body.marketId || req.query.marketId;
      
      if (!marketId) {
        return res.status(400).json({
          success: false,
          error: 'ID do mercado é obrigatório'
        });
      }

      // Admin tem acesso a tudo
      if (req.user.role === 'admin') {
        req.marketId = marketId;
        return next();
      }

      // Verificar permissão do usuário no mercado
      const hasPermission = await req.user.hasMarketPermission(marketId, permission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado - você não tem permissão para este mercado'
        });
      }

      req.marketId = marketId;
      next();
    } catch (error) {
      console.error('❌ Erro na verificação de acesso ao mercado:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware opcional de autenticação (não falha se não autenticado)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continua sem usuário
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return next(); // Continua sem usuário
    }

    const user = await User.findById(decoded.id);
    
    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação opcional:', error);
    next(); // Continua mesmo com erro
  }
};

// Middleware para criar sessão de usuário OTIMIZADO
export const createUserSession = async (user, req) => {
  try {
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // 🚀 OTIMIZAÇÃO: Session stateless - apenas gerar tokens
    // Em alta escala, não armazenamos sessões no banco
    
    // Extrair informações básicas
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

    // 🚀 OTIMIZAÇÃO: Login assíncrono (não bloqueia response)
    process.nextTick(async () => {
      try {
        await user.registerLogin(ipAddress, userAgent);
      } catch (error) {
        console.error('⚠️ Erro no log assíncrono de login:', error);
      }
    });

    // Atualizar cache de usuário
    const cacheKey = `user:${user.id}`;
    userCache.set(cacheKey, {
      user,
      timestamp: Date.now()
    });

    return {
      token,
      refreshToken,
      sessionId: null, // Stateless - sem ID de sessão
      expiresAt
    };
  } catch (error) {
    console.error('❌ Erro ao criar sessão:', error);
    throw error;
  }
};

// Middleware para logout
export const logout = async (req, res, next) => {
  try {
    if (req.sessionId) {
      // Desativar sessão
      await query(
        'UPDATE user_sessions SET is_active = false WHERE id = $1',
        [req.sessionId]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Middleware para refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token é obrigatório'
      });
    }

    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token inválido'
      });
    }

    // Verificar se o refresh token existe e está ativo
    const sessionResult = await query(
      'SELECT * FROM user_sessions WHERE user_id = $1 AND refresh_token = $2 AND is_active = true',
      [decoded.id, refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token não encontrado ou inativo'
      });
    }

    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo'
      });
    }

    // Gerar novo token
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Atualizar sessão
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await query(
      'UPDATE user_sessions SET session_token = $1, refresh_token = $2, expires_at = $3 WHERE id = $4',
      [newToken, newRefreshToken, expiresAt, sessionResult.rows[0].id]
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt
      }
    });
  } catch (error) {
    console.error('❌ Erro no refresh token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export default {
  authenticate,
  authorize,
  requireAdmin,
  requireGestor,
  requireMarketAccess,
  optionalAuth,
  createUserSession,
  logout,
  refreshToken,
  generateToken,
  generateRefreshToken,
  verifyToken
};