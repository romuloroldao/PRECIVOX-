// routes/analytics.js - Rotas para analytics e insights IA
import express from 'express';
const router = express.Router();

// Dados simulados para analytics (depois conectar com DB real)
const getSimulatedAnalytics = () => ({
  dashboard: {
    totalSearches: Math.floor(Math.random() * 20000) + 10000,
    totalMarkets: 12,
    totalProducts: Math.floor(Math.random() * 5000) + 2000,
    activeUsers: Math.floor(Math.random() * 100) + 20,
    searchesPerMinute: Math.floor(Math.random() * 20) + 5,
    conversions: Math.floor(Math.random() * 500) + 100,
    avgSessionTime: '3m 42s',
    topCategories: ['Alimentação', 'Limpeza', 'Higiene'],
    timestamp: new Date().toISOString()
  },
  realtime: {
    activeUsers: Math.floor(Math.random() * 50) + 15,
    currentSearches: Math.floor(Math.random() * 10) + 2,
    systemLoad: Math.floor(Math.random() * 80) + 10,
    responseTime: Math.floor(Math.random() * 200) + 50,
    timestamp: new Date().toISOString()
  },
  trends: {
    weeklyGrowth: (Math.random() * 20 + 5).toFixed(1),
    popularProducts: ['Arroz', 'Feijão', 'Óleo'],
    busyHours: ['09:00', '18:00', '20:00'],
    regionActivity: { 'Franco da Rocha': 45, 'Região': 30, 'Outros': 25 },
    timestamp: new Date().toISOString()
  }
});

// GET /analytics/dashboard - Dados gerais do dashboard
router.get('/dashboard', (req, res) => {
  try {
    console.log('📊 Buscando dados do dashboard...');
    const data = getSimulatedAnalytics().dashboard;
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /analytics/realtime - Dados em tempo real
router.get('/realtime', (req, res) => {
  try {
    console.log('⚡ Buscando dados em tempo real...');
    const data = getSimulatedAnalytics().realtime;
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Erro ao buscar dados em tempo real:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /analytics/trends - Dados de tendências
router.get('/trends', (req, res) => {
  try {
    console.log('📈 Buscando dados de tendências...');
    const data = getSimulatedAnalytics().trends;
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Erro ao buscar dados de tendências:', error);  
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /analytics/insights - Insights gerados por IA
router.get('/insights', (req, res) => {
  try {
    console.log('🧠 Gerando insights com IA...');
    
    // Simular insights baseados em dados do mercado
    const insights = [
      {
        id: 'insight_1',
        title: 'Oportunidade de Crescimento',
        description: 'Produtos de limpeza estão com alta demanda na região',
        priority: 'alta',
        confidence: 0.87,
        type: 'opportunity',
        impact: 'Alto',
        action: 'Tutorial IA',
        category: 'Tendências',
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight_2', 
        title: 'Otimização de Preços',
        description: 'Alguns produtos estão com preços acima da concorrência',
        priority: 'media',
        confidence: 0.75,
        type: 'alert',
        impact: 'Médio',
        action: 'Tutorial IA', 
        category: 'Preços',
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight_3',
        title: 'Gestão de Estoque',
        description: 'Produtos essenciais com baixo estoque identificados',
        priority: 'alta',
        confidence: 0.92,
        type: 'warning',
        impact: 'Alto',
        action: 'Tutorial IA',
        category: 'Estoque', 
        timestamp: new Date().toISOString()
      }
    ];

    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('❌ Erro ao gerar insights:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

export default router;