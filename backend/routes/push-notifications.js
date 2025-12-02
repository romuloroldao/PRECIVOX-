/**
 * Routes para notificações push
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { PushNotificationService } from '../../core/services/push-notification.service.js';

const router = express.Router();
const pushService = new PushNotificationService();

// Middleware de autenticação
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Token inválido' });
    }
};

/**
 * POST /api/push/register
 * Registra subscription de push
 */
router.post('/register', authenticateJWT, async (req, res) => {
    try {
        const { subscription } = req.body;

        await pushService.registerSubscription(req.user.id, subscription);

        res.json({
            success: true,
            message: 'Subscription registrada com sucesso'
        });
    } catch (error) {
        console.error('[PUSH] Erro ao registrar:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao registrar subscription'
        });
    }
});

/**
 * GET /api/push/vapid-public-key
 * Retorna chave pública VAPID
 */
router.get('/vapid-public-key', (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
        return res.status(500).json({
            success: false,
            error: 'VAPID keys não configuradas'
        });
    }

    res.json({
        success: true,
        publicKey
    });
});

export default router;

