/**
 * Rotas de IA Engines - Backend Express
 * Endpoints para os 4 engines de IA TypeScript com autenticação JWT
 * 
 * Rotas:
 * - POST /api/ai-engines/demand
 * - POST /api/ai-engines/stock-health
 * - POST /api/ai-engines/pricing
 * - POST /api/ai-engines/grooc
 */

import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO JWT
// ============================================

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'Token de autenticação não fornecido'
        });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'precivox-secret-key-2024');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Token inválido ou expirado'
        });
    }
};

// ============================================
// MIDDLEWARE DE CACHE
// ============================================

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const cacheMiddleware = (keyPrefix) => {
    return (req, res, next) => {
        const cacheKey = `${keyPrefix}:${JSON.stringify(req.body)}:${req.user?.id || 'anonymous'}`;
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`✅ [CACHE HIT] ${keyPrefix}`);
            return res.json(cached.data);
        }

        res.cacheKey = cacheKey;
        next();
    };
};

const saveToCache = (res, data) => {
    if (res.cacheKey) {
        cache.set(res.cacheKey, {
            data,
            timestamp: Date.now()
        });
        console.log(`💾 [CACHE SAVE] ${res.cacheKey.split(':')[0]}`);
    }
};

// Limpar cache expirado a cada 10 minutos
setInterval(() => {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
            removed++;
        }
    }

    if (removed > 0) {
        console.log(`🧹 [CACHE CLEANUP] Removidos ${removed} itens expirados`);
    }
}, 10 * 60 * 1000);

// ============================================
// POST /api/ai-engines/demand
// Previsão de demanda
// ============================================

router.post('/demand', authenticateJWT, cacheMiddleware('demand'), async (req, res) => {
    const startTime = Date.now();

    try {
        const { produtoId, unidadeId, periodoHistorico, periodoPrevisao } = req.body;

        // Validação de entrada
        if (!produtoId || !unidadeId) {
            return res.status(400).json({
                success: false,
                error: 'produtoId e unidadeId são obrigatórios',
                received: { produtoId, unidadeId }
            });
        }

        if (periodoHistorico && (periodoHistorico < 7 || periodoHistorico > 365)) {
            return res.status(400).json({
                success: false,
                error: 'periodoHistorico deve estar entre 7 e 365 dias'
            });
        }

        if (periodoPrevisao && (periodoPrevisao < 1 || periodoPrevisao > 90)) {
            return res.status(400).json({
                success: false,
                error: 'periodoPrevisao deve estar entre 1 e 90 dias'
            });
        }

        console.log(`🔮 [DEMAND] Previsão para produto ${produtoId} na unidade ${unidadeId}`);

        // TODO: Quando TypeScript estiver compilado, importar engine real:
        // const { DemandPredictor } = require('../../core/ai/dist');
        // const predictor = new DemandPredictor();
        // const result = await predictor.predict({ produtoId, unidadeId, periodoHistorico, periodoPrevisao });

        // Mock response estruturado
        const dias = periodoPrevisao || 7;
        const previsoes = Array.from({ length: dias }, (_, i) => {
            const data = new Date();
            data.setDate(data.getDate() + i + 1);

            const base = 10 + Math.random() * 10;
            const variation = base * 0.2;

            return {
                data,
                quantidadeEsperada: Math.round(base),
                intervaloConfianca: {
                    min: Math.round(base - variation),
                    max: Math.round(base + variation)
                }
            };
        });

        const totalPrevisto = previsoes.reduce((sum, p) => sum + p.quantidadeEsperada, 0);
        const mediaDiaria = totalPrevisto / dias;

        const result = {
            success: true,
            data: {
                produtoId,
                unidadeId,
                previsoes,
                confianca: 0.75,
                tendencia: 'ESTAVEL',
                sazonalidade: {
                    score: 0.3,
                    picos: [],
                    vales: []
                },
                metricas: {
                    mediaDiaria,
                    desvioPadrao: 2.5,
                    coeficienteVariacao: 0.25,
                    totalPrevisto
                },
                recomendacoes: [
                    `Demanda média prevista: ${mediaDiaria.toFixed(1)} unidades/dia`,
                    'Tendência: ESTAVEL',
                    `Estoque recomendado para 7 dias: ${Math.ceil(mediaDiaria * 7)} unidades`,
                    'Confiança da previsão: 75%'
                ]
            },
            metadata: {
                engineName: 'DemandPredictor',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '1.0.0-mock',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);

    } catch (error) {
        console.error('[DEMAND] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
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
// Análise de saúde do estoque
// ============================================

router.post('/stock-health', authenticateJWT, cacheMiddleware('stock-health'), async (req, res) => {
    const startTime = Date.now();

    try {
        const { unidadeId, mercadoId, categorias } = req.body;

        // Validação
        if (!unidadeId || !mercadoId) {
            return res.status(400).json({
                success: false,
                error: 'unidadeId e mercadoId são obrigatórios'
            });
        }

        console.log(`🏥 [STOCK-HEALTH] Análise para unidade ${unidadeId}`);

        // TODO: Importar engine real quando compilado
        // const { StockHealthEngine } = require('../../core/ai/dist');
        // const engine = new StockHealthEngine();
        // const result = await engine.analyze({ unidadeId, mercadoId, categorias });

        // Mock response
        const alertas = [
            {
                tipo: 'RUPTURA',
                prioridade: 'CRITICA',
                produtoId: `prod-${Math.random().toString(36).substr(2, 9)}`,
                produtoNome: 'Arroz Tipo 1 5kg',
                categoria: 'Alimentos',
                descricao: 'Estoque crítico: apenas 3 unidades disponíveis',
                quantidadeAtual: 3,
                quantidadeRecomendada: 50,
                diasParaRuptura: 1,
                valorImpacto: 750,
                acaoRecomendada: 'Repor IMEDIATAMENTE - risco de ruptura em menos de 24h',
                urgencia: 'IMEDIATA'
            },
            {
                tipo: 'EXCESSO',
                prioridade: 'MEDIA',
                produtoId: `prod-${Math.random().toString(36).substr(2, 9)}`,
                produtoNome: 'Refrigerante 2L',
                categoria: 'Bebidas',
                descricao: 'Estoque excessivo: 250 unidades (giro estimado: baixo)',
                quantidadeAtual: 250,
                quantidadeRecomendada: 100,
                valorImpacto: 1200,
                acaoRecomendada: 'Considerar promoção para acelerar giro e liberar capital',
                urgencia: 'MEDIO_PRAZO'
            }
        ];

        const score = 78.5;
        const status = score >= 90 ? 'OTIMO' : score >= 70 ? 'SAUDAVEL' : score >= 50 ? 'ATENCAO' : 'CRITICO';

        const result = {
            success: true,
            data: {
                unidadeId,
                score,
                status,
                alertas,
                metricas: {
                    giroMedio: 4.2,
                    taxaRuptura: 2.3,
                    valorEstoque: 45000,
                    diasCobertura: 28,
                    produtosAtivos: 150,
                    produtosEmRisco: alertas.filter(a => a.tipo === 'RUPTURA').length,
                    produtosParados: alertas.filter(a => a.tipo === 'EXCESSO').length,
                    produtosOtimos: 133,
                    distribuicaoABC: {
                        A: 30,
                        B: 45,
                        C: 75
                    }
                },
                recomendacoes: [
                    `Score de saúde do estoque: ${score}/100 (${status})`,
                    `${alertas.filter(a => a.prioridade === 'CRITICA').length} alertas críticos requerem ação imediata`,
                    `${alertas.filter(a => a.tipo === 'RUPTURA').length} produtos em risco de ruptura`,
                    `${alertas.filter(a => a.tipo === 'EXCESSO').length} produtos com giro baixo - considerar promoções`
                ],
                analiseDetalhada: [
                    {
                        categoria: 'Alimentos',
                        totalProdutos: 60,
                        valorEstoque: 18000,
                        giroMedio: 5.1,
                        status: 'SAUDAVEL',
                        alertas: 1
                    },
                    {
                        categoria: 'Bebidas',
                        totalProdutos: 40,
                        valorEstoque: 12000,
                        giroMedio: 3.8,
                        status: 'ATENCAO',
                        alertas: 1
                    }
                ]
            },
            metadata: {
                engineName: 'StockHealthEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '1.0.0-mock',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);

    } catch (error) {
        console.error('[STOCK-HEALTH] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
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
// Análise de precificação inteligente
// ============================================

router.post('/pricing', authenticateJWT, cacheMiddleware('pricing'), async (req, res) => {
    const startTime = Date.now();

    try {
        const { produtoId, unidadeId, precoAtual, custoProduto } = req.body;

        // Validação
        if (!produtoId || !unidadeId || !precoAtual) {
            return res.status(400).json({
                success: false,
                error: 'produtoId, unidadeId e precoAtual são obrigatórios'
            });
        }

        if (precoAtual <= 0) {
            return res.status(400).json({
                success: false,
                error: 'precoAtual deve ser maior que zero'
            });
        }

        console.log(`💰 [PRICING] Análise de preço para produto ${produtoId}: R$ ${precoAtual}`);

        // TODO: Importar engine real
        // const { SmartPricingEngine } = require('../../core/ai/dist');
        // const engine = new SmartPricingEngine();
        // const result = await engine.analyze({ produtoId, unidadeId, precoAtual, custoProduto });

        // Mock response
        const elasticidade = -(0.8 + Math.random() * 1.0);
        const precoMercado = precoAtual * (0.95 + Math.random() * 0.1);
        const precoOtimo = precoMercado * 0.97;

        const variacaoPreco = ((precoOtimo - precoAtual) / precoAtual) * 100;
        const variacaoVendas = -elasticidade * variacaoPreco;
        const variacaoReceita = variacaoPreco + variacaoVendas;

        const result = {
            success: true,
            data: {
                produtoId,
                unidadeId,
                elasticidade,
                precoOtimo: Number(precoOtimo.toFixed(2)),
                impactoEstimado: {
                    variacaoPreco: Number(variacaoPreco.toFixed(2)),
                    variacaoVendas: Number(variacaoVendas.toFixed(2)),
                    variacaoReceita: Number(variacaoReceita.toFixed(2)),
                    variacaoMargem: Number((variacaoReceita * 0.8).toFixed(2))
                },
                competitividade: {
                    posicao: precoAtual < precoMercado ? 'MAIS_BARATO' :
                        precoAtual > precoMercado * 1.1 ? 'MAIS_CARO' : 'COMPETITIVO',
                    diferencaMedia: Number(((precoAtual - precoMercado) / precoMercado * 100).toFixed(2)),
                    precoMercado: Number(precoMercado.toFixed(2)),
                    ranking: Math.floor(Math.random() * 5) + 1
                },
                recomendacoes: [
                    {
                        tipo: precoOtimo < precoAtual ? 'REDUZIR' : 'AUMENTAR',
                        precoSugerido: Number(precoOtimo.toFixed(2)),
                        justificativa: `Preço ótimo baseado em elasticidade de ${elasticidade.toFixed(2)}`,
                        impactoEsperado: `${variacaoReceita > 0 ? 'Aumento' : 'Redução'} estimado de ${Math.abs(variacaoReceita).toFixed(1)}% na receita`,
                        prioridade: Math.abs(variacaoPreco) > 10 ? 'ALTA' : 'MEDIA',
                        confianca: 0.7
                    }
                ]
            },
            metadata: {
                engineName: 'SmartPricingEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '1.0.0-mock',
                userId: req.user.id
            }
        };

        saveToCache(res, result);
        res.json(result);

    } catch (error) {
        console.error('[PRICING] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
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
// Recomendações GROOC (produtos e rotas) - ENHANCED
// ============================================

router.post('/grooc', authenticateJWT, cacheMiddleware('grooc'), async (req, res) => {
    const startTime = Date.now();

    try {
        const { produtos, localizacaoUsuario, preferencias, historicoUsuario } = req.body;

        // Validação
        if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'produtos deve ser um array não vazio',
                exemplo: {
                    produtos: [
                        { nome: 'Arroz', categoria: 'Alimentos', quantidade: 2, precoMaximo: 25 }
                    ]
                }
            });
        }

        // Validar estrutura dos produtos
        for (const produto of produtos) {
            if (!produto.nome) {
                return res.status(400).json({
                    success: false,
                    error: 'Cada produto deve ter um nome'
                });
            }
            if (!produto.quantidade || produto.quantidade <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Cada produto deve ter uma quantidade válida'
                });
            }
        }

        console.log(`🛒 [GROOC] Recomendações para ${produtos.length} produtos (Enhanced)`);

        // TODO: Importar engine real quando compilado
        // const { GROOCRecommendationEngine } = require('../../core/ai/dist');
        // const engine = new GROOCRecommendationEngine();
        // const result = await engine.recommend({ produtos, localizacaoUsuario, preferencias, historicoUsuario });

        // Enhanced Mock Response com todos os critérios
        const recomendacoes = produtos.flatMap((produtoSolicitado, index) => {
            // Gerar 2-3 recomendações por produto
            const numRecomendacoes = Math.min(3, Math.floor(Math.random() * 2) + 2);

            return Array.from({ length: numRecomendacoes }, (_, i) => {
                const precoBase = produtoSolicitado.precoMaximo || (15 + Math.random() * 20);
                const preco = Number((precoBase * (0.7 + Math.random() * 0.3)).toFixed(2));
                const economia = Number((precoBase - preco).toFixed(2));
                const economiaPercentual = Number(((economia / precoBase) * 100).toFixed(1));

                // Calcular scores
                const custoBeneficio = Math.round(60 + Math.random() * 40);
                const compatibilidade = i === 0 ? Math.round(80 + Math.random() * 20) : Math.round(50 + Math.random() * 30);
                const estoque = Math.round(70 + Math.random() * 30);
                const saude = Math.round(40 + Math.random() * 60);
                const preferencia = historicoUsuario ? Math.round(60 + Math.random() * 40) : Math.round(40 + Math.random() * 30);

                const scoreTotal = Math.round(
                    custoBeneficio * 0.3 +
                    compatibilidade * 0.25 +
                    estoque * 0.15 +
                    saude * (preferencias?.opcoesSaudaveis ? 0.15 : 0.05) +
                    preferencia * 0.20
                );

                const tipos = ['MELHOR_PRECO', 'SUBSTITUTO', 'PROMOCAO', 'MAIS_SAUDAVEL'];
                const tipo = i === 0 && economia > 2 ? 'MELHOR_PRECO' : tipos[Math.floor(Math.random() * tipos.length)];

                const marcas = ['Marca Premium', 'Marca Econômica', 'Marca Orgânica', 'Marca Nacional'];
                const marca = preferencias?.marcasPreferidas?.[0] || marcas[Math.floor(Math.random() * marcas.length)];

                // Atributos de saúde
                const atributosSaude = {
                    calorias: Math.floor(Math.random() * 300) + 50,
                    gorduras: Math.floor(Math.random() * 20),
                    acucares: Math.floor(Math.random() * 30),
                    sodio: Math.floor(Math.random() * 500),
                    organico: tipo === 'MAIS_SAUDAVEL' || Math.random() > 0.8,
                    integral: Math.random() > 0.7,
                    semGluten: Math.random() > 0.8,
                    semLactose: Math.random() > 0.85,
                    vegano: Math.random() > 0.9
                };

                // Justificativas
                const justificativa = [];
                if (economia > 0) {
                    justificativa.push(`Economia de R$ ${economia.toFixed(2)} (${economiaPercentual.toFixed(1)}%)`);
                }
                if (custoBeneficio >= 80) {
                    justificativa.push('Excelente custo-benefício');
                }
                if (tipo === 'PROMOCAO') {
                    justificativa.push('Em promoção especial');
                }
                if (tipo === 'MAIS_SAUDAVEL') {
                    justificativa.push('Opção mais saudável');
                }
                if (preferencia >= 70) {
                    justificativa.push('Compatível com suas preferências');
                }
                if (estoque >= 80) {
                    justificativa.push('Estoque abundante');
                }

                return {
                    produtoOriginal: produtoSolicitado.nome,
                    produtoId: `prod-${index}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                    produtoNome: `${produtoSolicitado.nome} ${marca}`,
                    tipo,
                    unidadeSugerida: `unidade-${index % 3}`,
                    unidadeNome: `Unidade ${['Centro', 'Bairro', 'Shopping'][index % 3]}`,
                    preco,
                    precoOriginal: tipo === 'PROMOCAO' ? Number((preco * 1.2).toFixed(2)) : undefined,
                    economia,
                    economiaPercentual,
                    distancia: localizacaoUsuario ? Number((Math.random() * 10).toFixed(1)) : undefined,
                    estoque: Math.floor(Math.random() * 100) + 20,
                    marca,
                    categoria: produtoSolicitado.categoria || 'Geral',
                    scores: {
                        custoBeneficio,
                        compatibilidade,
                        estoque,
                        saude,
                        preferencia,
                        total: scoreTotal
                    },
                    atributosSaude,
                    justificativa,
                    confianca: Number((scoreTotal / 100).toFixed(2)),
                    prioridade: scoreTotal >= 80 ? 'ALTA' : scoreTotal >= 60 ? 'MEDIA' : 'BAIXA'
                };
            });
        });

        // Ordenar por score total, depois por prioridade
        recomendacoes.sort((a, b) => {
            if (a.prioridade !== b.prioridade) {
                const prioridadeOrder = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
                return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
            }
            return b.scores.total - a.scores.total;
        });

        const economiaTotal = recomendacoes.reduce((sum, r) => sum + r.economia, 0);

        // Gerar resumo
        const resumo = {
            totalProdutos: produtos.length,
            totalRecomendacoes: recomendacoes.length,
            economiaTotal: Number(economiaTotal.toFixed(2)),
            economiaMedia: Number((economiaTotal / recomendacoes.length).toFixed(2)),
            scoreGeralSaude: Math.round(recomendacoes.reduce((sum, r) => sum + r.scores.saude, 0) / recomendacoes.length),
            scoreGeralCustoBeneficio: Math.round(recomendacoes.reduce((sum, r) => sum + r.scores.custoBeneficio, 0) / recomendacoes.length),
            produtosForaEstoque: recomendacoes.filter(r => r.estoque === 0).length,
            produtosSubstituidos: recomendacoes.filter(r => r.tipo === 'SUBSTITUTO').length
        };

        // Otimizar rota se houver localização
        let rotaOtimizada;
        if (localizacaoUsuario) {
            // Agrupar por unidade
            const porUnidade = {};
            recomendacoes.forEach(rec => {
                if (!porUnidade[rec.unidadeSugerida]) {
                    porUnidade[rec.unidadeSugerida] = [];
                }
                porUnidade[rec.unidadeSugerida].push(rec);
            });

            const paradas = Object.entries(porUnidade).map(([unidadeId, produtosUnidade], index) => {
                const economiaParada = produtosUnidade.reduce((sum, p) => sum + p.economia, 0);
                const distancia = Number((Math.random() * 5 + 1).toFixed(1));

                return {
                    unidadeId,
                    unidadeNome: produtosUnidade[0].unidadeNome,
                    endereco: `Rua Exemplo, ${100 + index * 50} - ${produtosUnidade[0].unidadeNome}`,
                    produtos: produtosUnidade,
                    ordem: index + 1,
                    distancia,
                    tempoEstimado: Math.round(distancia * 3 + 10),
                    economiaAcumulada: Number(economiaParada.toFixed(2)),
                    latitude: localizacaoUsuario.latitude + (Math.random() - 0.5) * 0.02,
                    longitude: localizacaoUsuario.longitude + (Math.random() - 0.5) * 0.02
                };
            });

            // Ordenar por economia se preferir menor preço, senão por distância
            if (preferencias?.prefereMenorPreco) {
                paradas.sort((a, b) => b.economiaAcumulada - a.economiaAcumulada);
            } else if (preferencias?.prefereMenorDistancia) {
                paradas.sort((a, b) => a.distancia - b.distancia);
            }

            // Atualizar ordem
            paradas.forEach((parada, index) => {
                parada.ordem = index + 1;
            });

            const distanciaTotal = paradas.reduce((sum, p) => sum + p.distancia, 0);
            const tempoTotal = paradas.reduce((sum, p) => sum + p.tempoEstimado, 0);

            rotaOtimizada = {
                unidades: paradas,
                distanciaTotal: Number(distanciaTotal.toFixed(2)),
                tempoEstimado: Math.round(tempoTotal),
                economiaTotal: Number(economiaTotal.toFixed(2)),
                eficiencia: Number((economiaTotal / distanciaTotal).toFixed(2)),
                ordemOtimizada: true
            };
        }

        const result = {
            success: true,
            data: {
                recomendacoes,
                rotaOtimizada,
                economiaEstimada: Number(economiaTotal.toFixed(2)),
                tempoEstimado: rotaOtimizada?.tempoEstimado || 30,
                resumo
            },
            metadata: {
                engineName: 'GROOCEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
                version: '2.0.0-enhanced',
                userId: req.user.id,
                criteriosAplicados: {
                    custoBeneficio: true,
                    historicoUsuario: !!historicoUsuario,
                    estoqueConsiderado: true,
                    marcaPreferida: !!(preferencias?.marcasPreferidas?.length),
                    opcoesSaudaveis: preferencias?.opcoesSaudaveis || false,
                    ordenacaoMultiCriterio: true
                }
            }
        };

        saveToCache(res, result);
        res.json(result);

    } catch (error) {
        console.error('[GROOC] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            metadata: {
                engineName: 'GROOCEngine',
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            }
        });
    }
});

// ============================================
// GET /api/ai-engines/cache/stats
// Estatísticas do cache (apenas para admins)
// ============================================

router.get('/cache/stats', authenticateJWT, (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado - apenas administradores e gestores'
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

    res.json({
        success: true,
        data: stats
    });
});

// ============================================
// DELETE /api/ai-engines/cache
// Limpar cache (apenas para admins)
// ============================================

router.delete('/cache', authenticateJWT, (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado - apenas administradores'
        });
    }

    const sizeBefore = cache.size;
    cache.clear();

    console.log(`🧹 [CACHE] Limpo manualmente por ${req.user.email} - ${sizeBefore} itens removidos`);

    res.json({
        success: true,
        message: 'Cache limpo com sucesso',
        itemsRemoved: sizeBefore
    });
});

export default router;
