/**
 * Rotas de IA Engines - Backend Express
 * Usando engines TypeScript compilados de /dist/ai via dynamic import
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const router = express.Router();

// ============================================
// CARREGAR ENGINES COMPILADOS (CommonJS)
// ============================================

let DemandPredictor,StockHealthEngine, SmartPricingEngine, GROOCRecommendationEngine, AIEngineFactory;

try {
    const aiModule = require('/root/dist/ai/index.js');
    DemandPredictor = aiModule.DemandPredictor;
    StockHealthEngine = aiModule.StockHealthEngine;
    SmartPricingEngine = aiModule.SmartPricingEngine;
    GROOCRecommendationEngine = aiModule.GROOCRecommendationEngine;
    AIEngineFactory = aiModule.AIEngineFactory;
    console.log('✅ [AI-ENGINES] Engines compilados carregados com sucesso');
} catch (error) {
    console.error('❌ [AI-ENGINES] Erro ao carregar engines:', error.message);
}

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO JWT
// ============================================

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'Token não fornecido'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Token inválido'
        });
    }
};

// ============================================
// CACHE SIMPLES (5 minutos)
// ============================================

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(endpoint, body) {
    return `${endpoint}:${JSON.stringify(body)}`;
}

function getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function saveToCache(res, data) {
    const cacheKey = res.getHeader('X-Cache-Key');
    if (cacheKey) {
        cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
    }
}

// ============================================
// POST /api/ai-engines/demand
// ============================================

router.post('/demand', authenticateJWT, async (req, res) => {
    const startTime = Date.now();
    const { mercadoId, produtos } = req.body;

    const cacheKey = getCacheKey('/demand', { mercadoId, produtos });
    res.setHeader('X-Cache-Key', cacheKey);

    const cached = getFromCache(cacheKey);
    if (cached) {
        return res.json({
            ...cached,
            metadata: { ...cached.metadata, fromCache: true }
        });
    }

    try {
        const engine = new DemandPredictor();
        const predictions = await engine.predictBatch(produtos || []);

        const result = {
            success: true,
            data: { predictions },
            metadata: {
                engineName: 'DemandPredictor',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '1.0.0-compiled',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);
    } catch (error) {
        console.error('[DEMAND] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno',
            metadata: {
                engineName: 'DemandPredictor',
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            }
        });
    }
});

// ============================================
// POST /api/ai-engines/stock-health
// ============================================

router.post('/stock-health', authenticateJWT, async (req, res) => {
    const startTime = Date.now();
    const { unidadeId } = req.body;

    const cacheKey = getCacheKey('/stock-health', { unidadeId });
    res.setHeader('X-Cache-Key', cacheKey);

    const cached = getFromCache(cacheKey);
    if (cached) {
        return res.json({
            ...cached,
            metadata: { ...cached.metadata, fromCache: true }
        });
    }

    try {
        const engine = new StockHealthEngine();
        const analysis = await engine.analyzeStockHealth(unidadeId);

        const result = {
            success: true,
            data: analysis,
            metadata: {
                engineName: 'StockHealthEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '1.0.0-compiled',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);
    } catch (error) {
        console.error('[STOCK-HEALTH] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno',
            metadata: {
                engineName: 'StockHealthEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            }
        });
    }
});

// ============================================
// POST /api/ai-engines/pricing
// ============================================

router.post('/pricing', authenticateJWT, async (req, res) => {
    const startTime = Date.now();
    const { produtoId, unidadeId } = req.body;

    const cacheKey = getCacheKey('/pricing', { produtoId, unidadeId });
    res.setHeader('X-Cache-Key', cacheKey);

    const cached = getFromCache(cacheKey);
    if (cached) {
        return res.json({
            ...cached,
            metadata: { ...cached.metadata, fromCache: true }
        });
    }

    try {
        const engine = new SmartPricingEngine();
        const recommendation = await engine.calculateOptimalPrice(produtoId, unidadeId);

        const result = {
            success: true,
            data: recommendation,
            metadata: {
                engineName: 'SmartPricingEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '1.0.0-compiled',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);
    } catch (error) {
        console.error('[PRICING] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno',
            metadata: {
                engineName: 'SmartPricingEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            }
        });
    }
});

// ============================================
// POST /api/ai-engines/grooc
// ============================================

router.post('/grooc', authenticateJWT, async (req, res) => {
    const startTime = Date.now();
    const { produtos, localizacaoUsuario, preferencias, historicoUsuario } = req.body;

    const cacheKey = getCacheKey('/grooc', { produtos, localizacaoUsuario, preferencias });
    res.setHeader('X-Cache-Key', cacheKey);

    const cached = getFromCache(cacheKey);
    if (cached) {
        return res.json({
            ...cached,
            metadata: { ...cached.metadata, fromCache: true }
        });
    }

    try {
        const engine = new GROOCRecommendationEngine();
        const recommendations = await engine.generateRecommendations(
            produtos,
            localizacaoUsuario,
            preferencias,
            historicoUsuario
        );

        const result = {
            success: true,
            data: recommendations,
            metadata: {
                engineName: 'GROOCRecommendationEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '2.0.0-enhanced-compiled',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);
    } catch (error) {
        console.error('[GROOC] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno',
            metadata: {
                engineName: 'GROOCRecommendationEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            }
        });
    }
});

// ============================================
// GET /api/ai-engines/cache/stats
// ============================================

router.get('/cache/stats', authenticateJWT, (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado'
        });
    }

    const stats = {
        totalEntries: cache.size,
        ttlMinutes: CACHE_TTL / (60 * 1000),
        entries: Array.from(cache.keys()).map(key => ({
            key: key.split(':')[0],
            age: Math.round((Date.now() - cache.get(key).timestamp) / 1000) + 's'
        }))
    };

    res.json({ success: true, data: stats });
});

// ============================================
// DELETE /api/ai-engines/cache
// ============================================

router.delete('/cache', authenticateJWT, (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado'
        });
    }

    const sizeBefore = cache.size;
    cache.clear();

    console.log(`🧹 [CACHE] Limpo por ${req.user.email} - ${sizeBefore} itens`);

    res.json({
        success: true,
        message: 'Cache limpo',
        itemsRemoved: sizeBefore
    });
});

export default router;
