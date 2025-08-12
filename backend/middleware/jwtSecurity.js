// middleware/jwtSecurity.js - SEGURANÇA JWT AVANÇADA PARA PRODUÇÃO
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database.js';

// ✅ CONFIGURAÇÕES SEGURAS DE PRODUÇÃO
const JWT_CONFIG = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m', // 15 minutos em produção
    algorithm: 'HS256'
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    algorithm: 'HS256'
  },
  reset: {
    secret: process.env.JWT_RESET_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: process.env.JWT_RESET_EXPIRES || '1h',
    algorithm: 'HS256'
  }
};

// ✅ BLACKLIST DE TOKENS (Redis seria ideal, usando memory como fallback)
const tokenBlacklist = new Set();
const blacklistCleanupInterval = 60 * 60 * 1000; // Limpar a cada hora

// Limpar tokens expirados da blacklist
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const token of tokenBlacklist) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp && decoded.exp < now) {
        tokenBlacklist.delete(token);
      }
    } catch (error) {
      tokenBlacklist.delete(token); // Remove token inválido
    }
  }
}, blacklistCleanupInterval);

// ✅ DETECÇÃO DE TENTATIVAS DE BRUTEFORCE
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutos

class JWTSecurity {
  
  /**
   * Gerar access token seguro
   */
  static generateAccessToken(user, sessionId = null) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionId: sessionId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID() // JWT ID único
    };

    return jwt.sign(payload, JWT_CONFIG.access.secret, {
      expiresIn: JWT_CONFIG.access.expiresIn,
      algorithm: JWT_CONFIG.access.algorithm,
      issuer: 'precivox-api',
      audience: 'precivox-app'
    });
  }

  /**
   * Gerar refresh token seguro
   */
  static generateRefreshToken(userId, sessionId = null) {
    const payload = {
      id: userId,
      sessionId: sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID()
    };

    return jwt.sign(payload, JWT_CONFIG.refresh.secret, {
      expiresIn: JWT_CONFIG.refresh.expiresIn,
      algorithm: JWT_CONFIG.refresh.algorithm,
      issuer: 'precivox-api',
      audience: 'precivox-app'
    });
  }

  /**
   * Gerar token de reset de senha
   */
  static generateResetToken(userId, email) {
    const payload = {
      id: userId,
      email: email,
      type: 'reset',
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID()
    };

    return jwt.sign(payload, JWT_CONFIG.reset.secret, {
      expiresIn: JWT_CONFIG.reset.expiresIn,
      algorithm: JWT_CONFIG.reset.algorithm,
      issuer: 'precivox-api',
      audience: 'precivox-app'
    });
  }

  /**
   * Verificar token com validação avançada
   */
  static verifyToken(token, tokenType = 'access') {
    try {
      // Verificar se token está na blacklist
      if (tokenBlacklist.has(token)) {
        throw new Error('Token revogado');
      }

      const config = JWT_CONFIG[tokenType];
      if (!config) {
        throw new Error('Tipo de token inválido');
      }

      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: 'precivox-api',
        audience: 'precivox-app'
      });

      // Verificar se o tipo do token corresponde
      if (decoded.type !== tokenType) {
        throw new Error('Tipo de token não corresponde');
      }

      return decoded;
    } catch (error) {
      console.log(`❌ Erro na verificação do token: ${error.message}`);
      return null;
    }
  }

  /**
   * Revogar token (adicionar à blacklist)
   */
  static revokeToken(token) {
    tokenBlacklist.add(token);
    console.log(`✅ Token revogado e adicionado à blacklist`);
  }

  /**
   * Verificar tentativas de login por IP
   */
  static checkLoginAttempts(ip) {
    const attempts = loginAttempts.get(ip);
    
    if (!attempts) {
      return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
    }

    const now = Date.now();
    
    // Filtrar tentativas dentro da janela de tempo
    const recentAttempts = attempts.filter(attempt => (now - attempt) < ATTEMPT_WINDOW);
    
    // Atualizar lista de tentativas
    if (recentAttempts.length === 0) {
      loginAttempts.delete(ip);
      return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
    }

    loginAttempts.set(ip, recentAttempts);

    // Verificar se excedeu o limite
    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const lockoutRemaining = LOCKOUT_TIME - (now - oldestAttempt);
      
      return {
        allowed: false,
        remaining: 0,
        lockoutTime: Math.ceil(lockoutRemaining / 1000 / 60) // em minutos
      };
    }

    return {
      allowed: true,
      remaining: MAX_LOGIN_ATTEMPTS - recentAttempts.length
    };
  }

  /**
   * Registrar tentativa de login
   */
  static recordLoginAttempt(ip, success = false) {
    if (success) {
      // Limpar tentativas em caso de sucesso
      loginAttempts.delete(ip);
      return;
    }

    // Adicionar tentativa falha
    const attempts = loginAttempts.get(ip) || [];
    attempts.push(Date.now());
    loginAttempts.set(ip, attempts);
  }

  /**
   * Middleware de segurança avançada
   */
  static secureAuth() {
    return async (req, res, next) => {
      try {
        // Verificar rate limiting por IP
        const ip = req.ip || req.connection.remoteAddress;
        const loginCheck = this.checkLoginAttempts(ip);
        
        if (!loginCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: `Muitas tentativas de login. Tente novamente em ${loginCheck.lockoutTime} minutos.`,
            retryAfter: loginCheck.lockoutTime * 60
          });
        }

        // Verificar header de autorização
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Token de acesso requerido',
            code: 'NO_TOKEN'
          });
        }

        const token = authHeader.substring(7);
        
        // Verificar estrutura básica do token
        if (!token || token.split('.').length !== 3) {
          this.recordLoginAttempt(ip, false);
          return res.status(401).json({
            success: false,
            error: 'Token malformado',
            code: 'MALFORMED_TOKEN'
          });
        }

        // Verificar token
        const decoded = this.verifyToken(token, 'access');

        if (!decoded) {
          this.recordLoginAttempt(ip, false);
          return res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado',
            code: 'INVALID_TOKEN'
          });
        }

        // Verificar sessão no banco (se sessionId estiver presente)
        if (decoded.sessionId) {
          const sessionResult = await query(
            'SELECT id, is_active, expires_at FROM user_sessions WHERE id = $1 AND session_token = $2',
            [decoded.sessionId, token]
          );

          if (sessionResult.rows.length === 0) {
            this.revokeToken(token);
            return res.status(401).json({
              success: false,
              error: 'Sessão não encontrada',
              code: 'SESSION_NOT_FOUND'
            });
          }

          const session = sessionResult.rows[0];
          
          if (!session.is_active) {
            this.revokeToken(token);
            return res.status(401).json({
              success: false,
              error: 'Sessão inativa',
              code: 'SESSION_INACTIVE'
            });
          }

          if (new Date(session.expires_at) < new Date()) {
            this.revokeToken(token);
            await query('UPDATE user_sessions SET is_active = false WHERE id = $1', [session.id]);
            return res.status(401).json({
              success: false,
              error: 'Sessão expirada',
              code: 'SESSION_EXPIRED'
            });
          }

          // Atualizar última atividade
          await query(
            'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1',
            [session.id]
          );
        }

        // Adicionar dados do usuário ao request
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name
        };
        req.sessionId = decoded.sessionId;
        req.token = token;
        req.tokenJti = decoded.jti;

        // Registrar login bem-sucedido
        this.recordLoginAttempt(ip, true);

        next();
      } catch (error) {
        console.error('❌ Erro na autenticação segura:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  }

  /**
   * Middleware para refresh token
   */
  static secureRefresh() {
    return async (req, res, next) => {
      try {
        const { refreshToken } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        if (!refreshToken) {
          return res.status(400).json({
            success: false,
            error: 'Refresh token é obrigatório',
            code: 'NO_REFRESH_TOKEN'
          });
        }

        // Verificar tentativas de refresh
        const loginCheck = this.checkLoginAttempts(ip);
        if (!loginCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: `Muitas tentativas. Tente novamente em ${loginCheck.lockoutTime} minutos.`,
            retryAfter: loginCheck.lockoutTime * 60
          });
        }

        // Verificar refresh token
        const decoded = this.verifyToken(refreshToken, 'refresh');

        if (!decoded) {
          this.recordLoginAttempt(ip, false);
          return res.status(401).json({
            success: false,
            error: 'Refresh token inválido ou expirado',
            code: 'INVALID_REFRESH_TOKEN'
          });
        }

        // Verificar se a sessão ainda existe e está ativa
        const sessionResult = await query(
          'SELECT * FROM user_sessions WHERE id = $1 AND refresh_token = $2 AND is_active = true',
          [decoded.sessionId, refreshToken]
        );

        if (sessionResult.rows.length === 0) {
          this.revokeToken(refreshToken);
          return res.status(401).json({
            success: false,
            error: 'Sessão não encontrada ou inativa',
            code: 'SESSION_NOT_FOUND'
          });
        }

        const session = sessionResult.rows[0];

        // Buscar dados atualizados do usuário
        const userResult = await query(
          'SELECT * FROM users WHERE id = $1 AND status = $2',
          [decoded.id, 'active']
        );

        if (userResult.rows.length === 0) {
          this.revokeToken(refreshToken);
          await query('UPDATE user_sessions SET is_active = false WHERE id = $1', [session.id]);
          return res.status(401).json({
            success: false,
            error: 'Usuário não encontrado ou inativo',
            code: 'USER_NOT_FOUND'
          });
        }

        const user = userResult.rows[0];

        // Gerar novos tokens
        const newAccessToken = this.generateAccessToken(user, session.id);
        const newRefreshToken = this.generateRefreshToken(user.id, session.id);

        // Revogar tokens antigos
        this.revokeToken(session.session_token);
        this.revokeToken(refreshToken);

        // Atualizar sessão
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

        await query(
          'UPDATE user_sessions SET session_token = $1, refresh_token = $2, expires_at = $3, last_activity = NOW() WHERE id = $4',
          [newAccessToken, newRefreshToken, expiresAt, session.id]
        );

        // Responder com novos tokens
        res.json({
          success: true,
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAt,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          }
        });

        this.recordLoginAttempt(ip, true);
      } catch (error) {
        console.error('❌ Erro no refresh seguro:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  }

  /**
   * Middleware para logout seguro
   */
  static secureLogout() {
    return async (req, res, next) => {
      try {
        const token = req.token;
        const sessionId = req.sessionId;

        if (token) {
          // Adicionar token à blacklist
          this.revokeToken(token);
        }

        if (sessionId) {
          // Desativar sessão no banco
          await query(
            'UPDATE user_sessions SET is_active = false, logout_at = NOW() WHERE id = $1',
            [sessionId]
          );
        }

        res.json({
          success: true,
          message: 'Logout realizado com sucesso'
        });
      } catch (error) {
        console.error('❌ Erro no logout seguro:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    };
  }

  /**
   * Obter estatísticas de segurança
   */
  static getSecurityStats() {
    return {
      blacklistedTokens: tokenBlacklist.size,
      suspiciousIPs: loginAttempts.size,
      loginAttempts: Array.from(loginAttempts.entries()).map(([ip, attempts]) => ({
        ip,
        attempts: attempts.length,
        lastAttempt: new Date(Math.max(...attempts))
      }))
    };
  }
}

export default JWTSecurity;