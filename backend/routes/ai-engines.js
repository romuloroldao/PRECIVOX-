import express from 'express';
import { createRequire } from 'module';
import jwt from 'jsonwebtoken';
import { rateLimitAI } from '../middleware/rate-limit.js';
import { paginationMiddleware } from '../middleware/pagination.js';

const require = createRequire(import.meta.url);

// Importar engines compilados (CommonJS)
const { DemandPredictor } = require('../../dist/ai/engines/demand-predictor');
const { StockHealthEngine } = require('../../dist/ai/engines/stock-health');
const { SmartPricingEngine } = require('../../dist/ai/engines/smart-pricing');
const { GROOCRecommendationEngine } = require('../../dist/ai/engines/grooc-recommendation');

const router = express.Router();

// ============================================
// CACHE SIMPLES (5 minutos)
// ============================================

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(endpoint, body, query) {
    return `${endpoint}:${JSON.stringify(body)}:${JSON.stringify(query)}`;
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

// Aplicar Rate Limit em todas as rotas de IA
router.use(rateLimitAI);

// ============================================
// POST /api/ai-engines/demand
// ============================================

router.post('/demand', authenticateJWT, paginationMiddleware, async (req, res) => {
    const startTime = Date.now();
    const { mercadoId, produtos, unidadeId } = req.body;
    const { page, limit, skip } = req.pagination;

    // Filtro por unidade (opcional)
    const filter = unidadeId ? { unidadeId } : {};

    const cacheKey = getCacheKey('/demand', { mercadoId, produtos, unidadeId }, { page, limit });
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
        // Nota: predictBatch geralmente processa uma lista de IDs. 
        // Se 'produtos' não for fornecido, o ideal seria buscar do banco paginado.
        // Aqui assumimos que o engine lida com isso ou que passamos a lista.
        
        let predictions = await engine.predictBatch(produtos || []);

        // Paginação manual dos resultados (se o engine retornar tudo)
        const total = predictions.length;
        const paginatedPredictions = predictions.slice(skip, skip + limit);

        const result = {
            success: true,
            data: { 
                predictions: paginatedPredictions 
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
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

router.post('/stock-health', authenticateJWT, paginationMiddleware, async (req, res) => {
    const startTime = Date.now();
    const { unidadeId, mercadoId, categorias, incluirInativos } = req.body;
    const { page, limit, skip } = req.pagination;

    // Validação: unidadeId ou mercadoId deve ser fornecido
    if (!unidadeId && !mercadoId) {
        return res.status(400).json({
            success: false,
            error: 'unidadeId ou mercadoId deve ser fornecido'
        });
    }

    // Validação de escopo (se usuário tem acesso ao mercado/unidade)
    // TODO: Adicionar verificação de permissão aqui

    const cacheKey = getCacheKey('/stock-health', { unidadeId, mercadoId, categorias, incluirInativos }, { page, limit });
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
        
        // Preparar input com filtros
        const input = {
            unidadeId: unidadeId || '',
            mercadoId: mercadoId || '',
            categorias: categorias || undefined,
            incluirInativos: incluirInativos || false
        };

        const analysisResult = await engine.analyze(input);

        if (!analysisResult.success) {
            return res.status(500).json(analysisResult);
        }

        // Paginar alertas se necessário
        const analysis = analysisResult.data;
        const totalAlertas = analysis.alertas.length;
        const paginatedAlertas = analysis.alertas.slice(skip, skip + limit);

        const result = {
            success: true,
            data: {
                ...analysis,
                alertas: paginatedAlertas
            },
            pagination: {
                page,
                limit,
                total: totalAlertas,
                totalPages: Math.ceil(totalAlertas / limit),
                hasNext: page < Math.ceil(totalAlertas / limit),
                hasPrev: page > 1
            },
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

router.post('/pricing', authenticateJWT, paginationMiddleware, async (req, res) => {
    const startTime = Date.now();
    const { produtoId, unidadeId, mercadoId, produtos } = req.body;
    const { page, limit, skip } = req.pagination;

    // Validação: produtoId ou produtos deve ser fornecido
    if (!produtoId && (!produtos || produtos.length === 0)) {
        return res.status(400).json({
            success: false,
            error: 'produtoId ou produtos deve ser fornecido'
        });
    }

    // Se produtos for fornecido, usar paginação
    const produtosToProcess = produtos || [produtoId];
    const totalProdutos = produtosToProcess.length;
    const paginatedProdutos = produtosToProcess.slice(skip, skip + limit);

    const cacheKey = getCacheKey('/pricing', { produtoId, unidadeId, mercadoId, produtos: paginatedProdutos }, { page, limit });
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
        
        // Processar produtos paginados
        const recommendations = [];
        for (const prodId of paginatedProdutos) {
            const input = {
                produtoId: prodId,
                unidadeId: unidadeId || undefined,
                mercadoId: mercadoId || undefined
            };
            
            const result = await engine.analyze(input);
            if (result.success) {
                recommendations.push(result.data);
            }
        }

        const result = {
            success: true,
            data: {
                recommendations: recommendations
            },
            pagination: {
                page,
                limit,
                total: totalProdutos,
                totalPages: Math.ceil(totalProdutos / limit),
                hasNext: page < Math.ceil(totalProdutos / limit),
                hasPrev: page > 1
            },
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

router.post('/grooc', authenticateJWT, paginationMiddleware, async (req, res) => {
    const startTime = Date.now();
    const { produtos, localizacaoUsuario, preferencias, historicoUsuario, mercadoId, unidadeId } = req.body;
    const { page, limit, skip } = req.pagination;

    // Validação: produtos deve ser fornecido
    if (!produtos || produtos.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'produtos deve ser fornecido'
        });
    }

    const cacheKey = getCacheKey('/grooc', { produtos, localizacaoUsuario, preferencias, mercadoId, unidadeId }, { page, limit });
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
        
        // Preparar input com filtros
        const input = {
            produtos,
            localizacaoUsuario,
            preferencias,
            historicoUsuario,
            mercadoId: mercadoId || undefined,
            unidadeId: unidadeId || undefined
        };

        const result = await engine.recommend(input);

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Paginar recomendações
        const recommendations = result.data.recomendacoes || [];
        const total = recommendations.length;
        const paginatedRecommendations = recommendations.slice(skip, skip + limit);

        const paginatedResult = {
            success: true,
            data: {
                ...result.data,
                recomendacoes: paginatedRecommendations
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            metadata: {
                engineName: 'GROOCRecommendationEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '2.0.0-enhanced-compiled',
                userId: req.user.id
            }
        };

        saveToCache(res, paginatedResult);
        res.json(paginatedResult);
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
