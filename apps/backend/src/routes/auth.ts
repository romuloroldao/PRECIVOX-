import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '@shared/prisma';
import bcrypt from 'bcryptjs';
import { TokenManager, logAuthEvent } from '@shared/auth-core';

const router = Router();

function getClientMeta(req: any) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  return { ip, userAgent };
}

/**
 * Rota de login - autentica usuário e retorna tokens (audit + userAgent/IP no refresh token)
 */
router.post('/login', async (req, res) => {
  const { ip, userAgent } = getClientMeta(req);

  try {
    const { email, senha, password } = req.body;
    const passwordValue = senha ?? password;

    if (!email || !passwordValue) {
      return res.status(400).json({
        error: 'Campos obrigatórios',
        message: 'Email e senha são obrigatórios',
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { email },
    });

    if (!usuario || !usuario.senhaHash) {
      await logAuthEvent({ event: 'login_failure', ip, userAgent, metadata: { email } });
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos',
      });
    }

    const senhaValida = await bcrypt.compare(passwordValue, usuario.senhaHash);

    if (!senhaValida) {
      await logAuthEvent({ event: 'login_failure', userId: usuario.id, ip, userAgent });
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos',
      });
    }

    await prisma.user.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const tokens = await TokenManager.issueTokenPair(
      {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role as any,
        nome: usuario.nome,
        tokenVersion: (usuario as any).tokenVersion ?? 0,
      },
      { userAgent, ip }
    );

    await logAuthEvent({
      event: 'login_success',
      userId: usuario.id,
      ip,
      userAgent,
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
      user: {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        nome: usuario.nome,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    logAuthEvent({ event: 'login_failure', ip, userAgent, metadata: { error: String(error) } }).catch(() => {});
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Erro ao fazer login',
      message: 'Ocorreu um erro ao processar seu login',
    });
  }
});

/** Logout com invalidação por tokenVersion + revogação de refresh tokens. */
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  const { ip, userAgent } = getClientMeta(req);

  try {
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { tokenVersion: { increment: 1 } },
      });
      await TokenManager.revokeUserTokens(req.user.id);
      await logAuthEvent({ userId: req.user.id, event: 'logout', ip, userAgent });
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      error: 'Erro ao fazer logout',
      message: 'Ocorreu um erro ao fazer logout',
    });
  }
});

/**
 * Rota de refresh - rotaciona refresh token e retorna novo par (audit)
 */
router.post('/refresh', async (req, res) => {
  const { ip, userAgent } = getClientMeta(req);

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    const tokens = await TokenManager.rotateRefreshToken(refreshToken, { userAgent, ip });

    if (!tokens) {
      await logAuthEvent({ event: 'login_failure', ip, userAgent, metadata: { reason: 'refresh_invalid' } });
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    await logAuthEvent({
      event: 'refresh',
      ip,
      userAgent,
      metadata: { hasNewTokens: true },
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({ error: 'Erro ao renovar tokens' });
  }
});

/**
 * Rota para verificar se o usuário está autenticado
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    res.json({
      user: req.user,
      authenticated: true
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    res.status(500).json({
      error: 'Erro ao verificar autenticação',
      message: 'Ocorreu um erro ao verificar sua autenticação'
    });
  }
});

/**
 * ERAD-10: Stub route para /api/auth/error
 * NextAuth foi removido completamente. Esta rota retorna 410 (Gone)
 * para evitar erros 500 quando algum código legado tenta acessá-la.
 */
router.all('/error', (req, res) => {
  res.status(410).json({
    error: 'NextAuth removed',
    message: 'NextAuth foi removido. Use TokenManager com /api/auth/login, /api/auth/refresh, /api/auth/logout',
    code: 'NEXTAUTH_REMOVED'
  });
});

export default router;
