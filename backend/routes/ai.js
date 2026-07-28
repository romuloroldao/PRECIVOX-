// backend/routes/ai.js
// Rotas de análise com IA — todo acesso a LLM via AI Gateway (lib/ai-gateway)

import express from 'express';
import { getAiGateway, sanitizeListItems, sanitizeProduct } from '../lib/ai-gateway/index.js';

const router = express.Router();
const aiGateway = getAiGateway();

/**
 * Health check do serviço AI
 */
router.get('/health', (req, res) => {
  res.json({
    ...aiGateway.health(),
    service: 'AI Analysis Service',
    timestamp: new Date().toISOString(),
  });
});

/** Métricas de observabilidade do gateway (uso interno / admin) */
router.get('/metrics', (req, res) => {
  res.json({
    metrics: aiGateway.metrics(),
    cache: aiGateway.health().cache,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Análise completa da lista de compras
 */
router.post('/analyze-list', async (req, res) => {
  try {
    const { listItems, userLocation, userPreferences, sessionId } = req.body;
    
    console.log('🧠 [AI] Analisando lista com', listItems?.length || 0, 'itens');
    
    if (!listItems || !Array.isArray(listItems) || listItems.length === 0) {
      return res.status(400).json({
        error: 'Lista de itens é obrigatória e deve conter pelo menos um item'
      });
    }

    const safeItems = sanitizeListItems(listItems);

    const listSummary = safeItems.map(item =>
      `${item.produto.nome} - R$${item.produto.preco} (${item.quantidade}x) - ${item.produto.loja || 'Loja não especificada'}`
    ).join('\n');

    const totalValue = safeItems.reduce((sum, item) =>
      sum + (item.produto.preco * item.quantidade), 0
    );

    const gatewayResult = await aiGateway.complete({
      task: 'shopping-list-analysis',
      input: { listSummary, totalValue: totalValue.toFixed(2), itemCount: safeItems.length },
      consumer: 'POST /analyze-list',
      fallback: () => generateMockAnalysis(safeItems),
    });

    if (gatewayResult._meta?.provider === 'fallback') {
      return res.json(gatewayResult.data);
    }

    const parsed = /** @type {Record<string, unknown>} */ (gatewayResult.data);
    const structuredResponse = {
      sessionId,
      timestamp: new Date().toISOString(),
      analysis: {
        totalCost: totalValue,
        estimatedSavings: parsed.economia_estimada || totalValue * 0.1,
        efficiencyScore: parsed.score_eficiencia || 75,
        routeOptimization: {
          currentRoute: extractStores(safeItems),
          optimizedRoute: parsed.rota_otimizada || extractStores(safeItems),
          timeSaved: parsed.tempo_economizado || 0,
          fuelSaved: parsed.combustivel_economizado || 0
        },
        insights: parsed.insights || [
          'Análise concluída com sucesso',
          `Lista com ${safeItems.length} itens analisada`
        ],
        warnings: parsed.avisos || [],
        explicacao: parsed.explicacao || null,
      },
      suggestions: parsed.sugestoes || [],
      alternatives: parsed.alternativas || [],
      marketAnalysis: parsed.analise_mercados || [],
      metadata: {
        model: gatewayResult._meta?.model || 'fallback',
        promptVersion: gatewayResult._meta?.promptVersion,
        processingTime: gatewayResult._meta?.latencyMs || 0,
        confidence: parsed.confianca || 0.8,
        tokens: gatewayResult._meta?.tokens,
        costUsd: gatewayResult._meta?.costUsd,
        cached: gatewayResult._meta?.cached || false,
      }
    };

    return res.json(structuredResponse);

  } catch (error) {
    console.error('❌ Erro na análise AI:', error);
    
    res.status(500).json({
      error: 'Erro interno na análise AI',
      message: error.message,
      fallback: generateMockAnalysis(req.body.listItems || [])
    });
  }
});

/**
 * Buscar alternativas para um produto específico
 */
router.post('/product-alternatives', async (req, res) => {
  try {
    const { product, context } = req.body;
    
    if (!product) {
      return res.status(400).json({ error: 'Produto é obrigatório' });
    }

    console.log('🔍 [AI] Buscando alternativas para:', product.nome);

    const safeProduct = sanitizeProduct(product);

    const gatewayResult = await aiGateway.complete({
      task: 'product-alternatives',
      input: { product: safeProduct, contextSize: context?.length || 0 },
      consumer: 'POST /product-alternatives',
      useCache: true,
      fallback: () => ({ alternativas: [], explicacao: null }),
    });

    const parsed = /** @type {Record<string, unknown>} */ (gatewayResult.data || {});
    res.json({
      originalProduct: safeProduct,
      alternatives: parsed.alternativas || [],
      explicacao: parsed.explicacao || null,
      metadata: gatewayResult._meta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar alternativas:', error);
    res.status(500).json({
      error: 'Erro ao buscar alternativas',
      originalProduct: req.body.product,
      alternatives: []
    });
  }
});

/**
 * Otimizar rota de compras
 */
router.post('/optimize-route', async (req, res) => {
  try {
    const { items, userLocation } = req.body;
    
    console.log('🗺️ [AI] Otimizando rota para', items?.length || 0, 'itens');
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Lista de itens é obrigatória' });
    }

    const stores = extractStores(items);
    const safeItems = sanitizeListItems(items);

    const storesList = stores.join(', ');
    const itemsList = safeItems.map(item =>
      `${item.produto.nome} (${item.produto.loja})`
    ).join(', ');
    const locationLine = userLocation
      ? `Lat ${userLocation.lat}, Lng ${userLocation.lng}`
      : '';

    const gatewayResult = await aiGateway.complete({
      task: 'route-optimization',
      input: { storesList, itemsList, locationLine },
      consumer: 'POST /optimize-route',
      fallback: () => ({
        rota_otimizada: stores.map(store => ({
          store,
          items: items.filter(item => item.produto.loja === store),
          totalCost: 0,
          distance: 0,
          estimatedTime: 30,
          pros: ['Loja disponível'],
          cons: [],
          recommendation: 'acceptable'
        })),
        economia: { time: 0, fuel: 0 },
        confianca: 0.5,
      }),
    });

    const parsed = /** @type {Record<string, unknown>} */ (gatewayResult.data || {});
    res.json({
      optimizedRoute: parsed.rota_otimizada || [],
      savings: parsed.economia || { time: 0, fuel: 0 },
      confidence: parsed.confianca || 0.7,
      explicacao: parsed.explicacao || null,
      metadata: gatewayResult._meta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na otimização de rota:', error);
    res.status(500).json({
      error: 'Erro na otimização de rota',
      optimizedRoute: [],
      savings: { time: 0, fuel: 0 },
      confidence: 0
    });
  }
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Extrair lojas únicas da lista de itens
 */
function extractStores(items) {
  const stores = new Set();
  items.forEach(item => {
    if (item.produto && item.produto.loja) {
      stores.add(item.produto.loja);
    }
  });
  return Array.from(stores);
}

/**
 * Gerar análise mock quando IA não está disponível
 */
function generateMockAnalysis(listItems) {
  const totalValue = listItems.reduce((sum, item) => 
    sum + (item.produto.preco * item.quantidade), 0
  );

  return {
    sessionId: `mock_${Date.now()}`,
    timestamp: new Date().toISOString(),
    analysis: {
      totalCost: totalValue,
      estimatedSavings: totalValue * 0.08,
      efficiencyScore: 72,
      routeOptimization: {
        currentRoute: extractStores(listItems),
        optimizedRoute: extractStores(listItems),
        timeSaved: 5,
        fuelSaved: 3.50
      },
      insights: [
        `Lista com ${listItems.length} itens analisada (modo offline)`,
        `Valor total: R$${totalValue.toFixed(2)}`,
        'Conecte-se à internet para análise AI completa'
      ],
      warnings: ['Análise em modo offline - funcionalidade limitada']
    },
    suggestions: [
      {
        id: 'mock_suggestion_1',
        type: 'price_optimization',
        title: 'Oportunidade de economia identificada',
        description: 'Alguns produtos podem ter alternativas mais baratas',
        impact: {
          savings: totalValue * 0.05,
          timeReduction: 0,
          qualityImpact: 'neutral'
        },
        confidence: 0.6,
        actionable: false
      }
    ],
    alternatives: [],
    marketAnalysis: extractStores(listItems).map(store => ({
      store,
      items: listItems.filter(item => item.produto.loja === store),
      totalCost: listItems
        .filter(item => item.produto.loja === store)
        .reduce((sum, item) => sum + (item.produto.preco * item.quantidade), 0),
      distance: 0,
      estimatedTime: 20,
      pros: ['Produtos disponíveis'],
      cons: ['Análise limitada (offline)'],
      recommendation: 'acceptable'
    })),
    metadata: {
      model: 'mock',
      processingTime: 100,
      confidence: 0.5
    }
  };
}

/**
 * Análise inteligente de preços baseada nos dados dos mercados
 */
router.post('/analyze-prices', async (req, res) => {
  try {
    const { products, market_ids, user_location } = req.body;
    
    console.log('💰 [AI] Analisando preços para', products?.length || 0, 'produtos');
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'Lista de produtos é obrigatória'
      });
    }

    // Buscar dados reais dos mercados no banco
    let marketData = [];
    for (const product of products) {
      const query = `
        SELECT 
          p.name, p.category, p.price, p.promotional_price, p.is_promotion,
          p.discount_percentage, p.brand, p.barcode, p.stock_quantity,
          m.name as market_name, m.slug as market_slug,
          m.address_city, m.address_state, m.address_neighborhood
        FROM products p
        JOIN markets m ON p.market_id = m.id
        WHERE p.status = 'active' 
        AND m.status = 'active' 
        AND m.verified = true
        AND (
          LOWER(p.name) LIKE LOWER($1) OR
          p.search_vector @@ plainto_tsquery('portuguese', $2)
        )
        ORDER BY p.price ASC
        LIMIT 20
      `;
      
      const searchTerm = `%${product.name || product.nome}%`;
      const result = await req.db.query(query, [searchTerm, product.name || product.nome]);
      
      if (result.rows.length > 0) {
        marketData.push({
          searchedProduct: product,
          matches: result.rows
        });
      }
    }

    if (marketData.length === 0) {
      return res.json({
        analysis: {
          message: 'Nenhum produto encontrado nos mercados cadastrados',
          searchedProducts: products.length
        },
        suggestions: [],
        alternatives: []
      });
    }

    // Preparar dados para análise AI
    const marketAnalysis = marketData.map(data => {
      const matches = data.matches;
      const prices = matches.map(m => m.promotional_price || m.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      return {
        product: data.searchedProduct.name || data.searchedProduct.nome,
        found_matches: matches.length,
        price_range: {
          min: minPrice,
          max: maxPrice,
          average: avgPrice
        },
        best_offers: matches.slice(0, 3).map(m => ({
          market: m.market_name,
          price: m.promotional_price || m.price,
          original_price: m.promotional_price ? m.price : null,
          promotion: m.is_promotion,
          discount: m.discount_percentage,
          location: `${m.address_city}, ${m.address_state}`
        }))
      };
    });

    // Análise AI via gateway se disponível
    if (process.env.GROQ_API_KEY) {
      const analysisData = JSON.stringify(marketAnalysis, null, 2);

      try {
        const gatewayResult = await aiGateway.complete({
          task: 'price-analysis',
          input: { marketDataJson: analysisData },
          consumer: 'POST /analyze-prices',
          useCache: true,
        });

        const aiAnalysis = /** @type {Record<string, unknown>} */ (gatewayResult.data || {});

        return res.json({
          analysis: {
            total_products_searched: products.length,
            products_found: marketData.length,
            markets_analyzed: [...new Set(marketData.flatMap(d => d.matches.map(m => m.market_name)))].length,
            ai_insights: aiAnalysis.insights || [],
            total_savings_potential: aiAnalysis.economia_total || 0,
            best_markets: aiAnalysis.melhores_lojas || [],
            explicacoes_por_produto: aiAnalysis.explicacoes_por_produto || [],
          },
          product_analysis: marketAnalysis,
          suggestions: aiAnalysis.recomendacoes || [],
          alerts: aiAnalysis.alertas || [],
          metadata: gatewayResult._meta,
          timestamp: new Date().toISOString()
        });
      } catch (aiError) {
        console.error('Erro na chamada AI:', aiError);
        // Continuar com análise básica
      }
    }

    // Análise básica sem AI
    const totalSavingsPotential = marketAnalysis.reduce((sum, analysis) => {
      return sum + (analysis.price_range.max - analysis.price_range.min);
    }, 0);

    const bestMarkets = {};
    marketData.forEach(data => {
      data.matches.forEach(match => {
        if (!bestMarkets[match.market_name]) {
          bestMarkets[match.market_name] = {
            name: match.market_name,
            location: `${match.address_city}, ${match.address_state}`,
            product_count: 0,
            avg_savings: 0,
            best_deals: []
          };
        }
        bestMarkets[match.market_name].product_count++;
        
        if (match.is_promotion) {
          bestMarkets[match.market_name].best_deals.push({
            product: match.name,
            price: match.promotional_price,
            discount: match.discount_percentage
          });
        }
      });
    });

    res.json({
      analysis: {
        total_products_searched: products.length,
        products_found: marketData.length,
        markets_analyzed: Object.keys(bestMarkets).length,
        total_savings_potential: totalSavingsPotential,
        best_markets: Object.values(bestMarkets).slice(0, 5)
      },
      product_analysis: marketAnalysis,
      suggestions: [
        {
          type: 'price_comparison',
          title: 'Compare preços entre mercados',
          description: `Encontramos ${marketData.length} produtos em diferentes mercados com variação de preços`,
          savings_potential: totalSavingsPotential
        }
      ],
      alerts: marketAnalysis
        .filter(analysis => analysis.found_matches === 0)
        .map(analysis => ({
          type: 'product_not_found',
          product: analysis.product,
          message: 'Produto não encontrado nos mercados cadastrados'
        })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na análise de preços:', error);
    res.status(500).json({
      error: 'Erro interno na análise de preços',
      message: error.message
    });
  }
});

/**
 * Relatório de tendências de preços
 */
router.get('/price-trends', async (req, res) => {
  try {
    const { category, market_id, days = 30 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(String(days), 10) || 30, 1), 365);
    
    console.log('📈 [AI] Analisando tendências de preços');
    
    let sql = `
      SELECT 
        p.category,
        p.name,
        p.price,
        p.promotional_price,
        p.is_promotion,
        p.created_at,
        p.updated_at,
        m.name as market_name,
        COUNT(*) OVER (PARTITION BY p.category) as category_count,
        AVG(p.price) OVER (PARTITION BY p.category) as category_avg_price
      FROM products p
      JOIN markets m ON p.market_id = m.id
      WHERE p.status = 'active' 
      AND m.status = 'active' 
      AND m.verified = true
    `;
    
    const values = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      sql += ` AND p.category = $${paramCount}`;
      values.push(category);
    }
    
    if (market_id) {
      paramCount++;
      sql += ` AND m.id = $${paramCount}`;
      values.push(market_id);
    }

    paramCount++;
    sql += ` AND p.created_at >= CURRENT_DATE - ($${paramCount}::int * INTERVAL '1 day')`;
    values.push(daysNum);
    
    sql += ` ORDER BY p.category, p.price ASC`;
    
    const result = await req.db.query(sql, values);
    
    if (result.rows.length === 0) {
      return res.json({
        trends: [],
        summary: {
          message: 'Nenhum dado encontrado para análise de tendências',
          period: `${daysNum} dias`
        }
      });
    }

    // Agrupar por categoria
    const categoryTrends = {};
    result.rows.forEach(row => {
      if (!categoryTrends[row.category]) {
        categoryTrends[row.category] = {
          category: row.category,
          products: [],
          price_stats: {
            min: Infinity,
            max: -Infinity,
            avg: 0,
            promotion_rate: 0
          }
        };
      }
      
      const finalPrice = row.promotional_price || row.price;
      categoryTrends[row.category].products.push({
        name: row.name,
        price: row.price,
        final_price: finalPrice,
        promotion: row.is_promotion,
        market: row.market_name
      });
      
      // Atualizar estatísticas
      const stats = categoryTrends[row.category].price_stats;
      stats.min = Math.min(stats.min, finalPrice);
      stats.max = Math.max(stats.max, finalPrice);
    });
    
    // Calcular médias e taxas de promoção
    Object.values(categoryTrends).forEach(trend => {
      const prices = trend.products.map(p => p.final_price);
      const promotions = trend.products.filter(p => p.promotion).length;
      
      trend.price_stats.avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      trend.price_stats.promotion_rate = (promotions / trend.products.length) * 100;
    });

    res.json({
      trends: Object.values(categoryTrends),
      summary: {
        categories_analyzed: Object.keys(categoryTrends).length,
        total_products: result.rows.length,
        period: `${days} dias`,
        most_promoted_category: Object.values(categoryTrends)
          .sort((a, b) => b.price_stats.promotion_rate - a.price_stats.promotion_rate)[0]?.category,
        cheapest_category: Object.values(categoryTrends)
          .sort((a, b) => a.price_stats.avg - b.price_stats.avg)[0]?.category
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na análise de tendências:', error);
    res.status(500).json({
      error: 'Erro na análise de tendências',
      message: error.message
    });
  }
});

// ============================================
// 🆕 PAINEL DE IA DO GESTOR - DASHBOARD PRINCIPAL
// ============================================

router.get('/painel/dashboard/:mercadoId', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const { mercadoId } = req.params;
    
    // 1. Buscar alertas críticos
    const alertasCriticos = await prisma.alertaIA.findMany({
      where: {
        mercadoId,
        lido: false,
        prioridade: { in: ['ALTA', 'CRITICA'] }
      },
      orderBy: [{ prioridade: 'desc' }, { criadoEm: 'desc' }],
      take: 5,
      include: {
        produto: { select: { nome: true } },
        unidade: { select: { nome: true } }
      }
    });

    // 2. Buscar métricas do dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let metricas = await prisma.metricasDashboard.findFirst({
      where: { mercadoId, data: hoje, periodo: 'DIA' }
    });

    if (!metricas) {
      metricas = await prisma.metricasDashboard.create({
        data: {
          mercadoId,
          data: hoje,
          periodo: 'DIA',
          giroEstoqueGeral: 4.2,
          taxaRuptura: 2.3,
          ticketMedio: 87.30,
          margemLiquida: 18.5,
        }
      });
    }

    // 3. Análises pendentes por módulo
    const analisesPendentes = await prisma.analiseIA.groupBy({
      by: ['tipo'],
      where: { mercadoId, status: 'PENDENTE' },
      _count: { id: true }
    });

    // 4. Unidades do mercado
    const unidades = await prisma.unidade.findMany({
      where: { mercadoId },
      select: {
        id: true,
        nome: true,
        _count: { select: { estoques: true } }
      }
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: {
        alertasCriticos: alertasCriticos.map(a => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          descricao: a.descricao,
          prioridade: a.prioridade,
          produto: a.produto?.nome,
          unidade: a.unidade?.nome
        })),
        visaoExecutiva: {
          giroEstoque: { valor: metricas.giroEstoqueGeral, variacao: 8 },
          taxaRuptura: { valor: metricas.taxaRuptura, variacao: -1.2 },
          ticketMedio: { valor: Number(metricas.ticketMedio), variacao: 3 },
          margemLiquida: { valor: metricas.margemLiquida, variacao: -2 }
        },
        modulosIA: {
          compras: { insightsPendentes: analisesPendentes.find(a => a.tipo === 'DEMANDA')?._count.id || 0 },
          promocoes: { oportunidades: analisesPendentes.find(a => a.tipo === 'PROMOCAO')?._count.id || 0 },
          conversao: { acoesSugeridas: analisesPendentes.find(a => a.tipo === 'PERFORMANCE')?._count.id || 0 }
        },
        unidades
      }
    });
  } catch (error) {
    console.error('Erro dashboard IA:', error);
    res.status(500).json({ error: 'Erro ao buscar dashboard IA' });
  }
});

// Módulo de Compras e Reposição
router.get('/painel/compras/:mercadoId', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const { mercadoId } = req.params;
    
    const estoques = await prisma.estoque.findMany({
      where: { unidade: { mercadoId } },
      include: {
        produto: true,
        unidade: { select: { nome: true } }
      }
    });

    const produtosEmRuptura = estoques
      .filter(e => {
        const demandaDiaria = (e.produto.demandaPrevista7d || 1) / 7;
        return e.quantidade / demandaDiaria < 3;
      })
      .map(e => ({
        nome: e.produto.nome,
        unidade: e.unidade.nome,
        estoqueAtual: e.quantidade,
        diasRestantes: e.quantidade / ((e.produto.demandaPrevista7d || 1) / 7),
        quantidadeRepor: Math.ceil((e.produto.demandaPrevista30d || 0) - e.quantidade)
      }));

    await prisma.$disconnect();

    res.json({
      success: true,
      data: { produtosEmRuptura }
    });
  } catch (error) {
    console.error('Erro compras:', error);
    res.status(500).json({ error: 'Erro ao buscar módulo de compras' });
  }
});

// Marcar alerta como lido
router.put('/painel/alertas/:alertaId/marcar-lido', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const alerta = await prisma.alertaIA.update({
      where: { id: req.params.alertaId },
      data: { lido: true, lidoEm: new Date() }
    });

    await prisma.$disconnect();

    res.json({ success: true, data: alerta });
  } catch (error) {
    console.error('Erro marcar alerta:', error);
    res.status(500).json({ error: 'Erro ao marcar alerta' });
  }
});

export default router;