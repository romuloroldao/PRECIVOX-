import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Rota de logout - invalida o token do usuário
 */
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    // Em um sistema mais robusto, você poderia adicionar o token a uma blacklist
    // Por enquanto, apenas retornamos sucesso, pois o JWT é stateless
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      error: 'Erro ao fazer logout',
      message: 'Ocorreu um erro ao fazer logout'
    });
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

export default router;
