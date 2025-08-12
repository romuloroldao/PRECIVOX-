// backend/analytics.js - Sistema de Analytics Inteligente
// Adicione estas rotas ao seu server.js existente

// ===============================================
// 🧠 SISTEMA DE ANALYTICS INTELIGENTE
// ===============================================

// Simulador de dados em tempo real
class AnalyticsEngine {
  constructor() {
    this.initializeData();
    this.startRealTimeUpdates();
  }

  initializeData() {
    // Dados de comportamento do usuário
    this.userBehavior = {
      buscarPorHorario: new Map(),
      buscarPorDia: new Map(),
      conversoesPorCategoria: new Map(),
      sessoesPorLoja: new Map(),
      tempoMedioPorPagina: new Map()
    };

    // Histórico de buscas (últimos 30 dias)
    this.searchHistory = [];
    this.generateSearchHistory();

    // Dados de concorrência
    this.competitorData = new Map();
    this.generateCompetitorData();

    // Correlações de produtos
    this.productCorrelations = new Map();
    this.generateProductCorrelations();
  }

  // Gerar histórico de buscas realista
  generateSearchHistory() {
    const produtos = ['coca cola', 'arroz', 'leite', 'detergente', 'açúcar', 'café', 'sabão', 'óleo', 'feijão', 'pão'];
    const categorias = ['Bebidas', 'Grãos', 'Laticínios', 'Limpeza', 'Alimentação', 'Padaria'];
    
    // Gerar 30 dias de dados
    for (let dia = 0; dia < 30; dia++) {
      const data = new Date();
      data.setDate(data.getDate() - dia);
      
      // Gerar buscas para cada hora do dia
      for (let hora = 6; hora < 23; hora++) {
        // Simular picos de atividade
        let intensidade = 1;
        if (hora >= 14 && hora <= 16) intensidade = 3; // Pico da tarde
        if (hora >= 19 && hora <= 21) intensidade = 2; // Pico da noite
        if ([1, 3, 6].includes(data.getDay())) intensidade *= 1.5; // Terças, quintas, sábados

        const numBuscas = Math.floor(Math.random() * 50 * intensidade) + 10;
        
        for (let i = 0; i < numBuscas; i++) {
          const produto = produtos[Math.floor(Math.random() * produtos.length)];
          const categoria = categorias[Math.floor(Math.random() * categorias.length)];
          
          this.searchHistory.push({
            timestamp: new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora, Math.floor(Math.random() * 60)),
            termo: produto,
            categoria: categoria,
            converteu: Math.random() < 0.3, // 30% de conversão
            tempoSessao: Math.floor(Math.random() * 300) + 30, // 30s a 5min
            deviceType: Math.random() < 0.7 ? 'mobile' : 'desktop',
            userAgent: 'PRECIVOX_TRACKER',
            loja: ['Supermercado Central', 'Atacadão Franco', 'Mercado da Vila'][Math.floor(Math.random() * 3)]
          });
        }
      }
    }
  }

  // Gerar dados de concorrência
  generateCompetitorData() {
    const competitors = [
      { id: 'atacadao-franco', nome: 'Atacadão Franco', tipo: 'atacado' },
      { id: 'supermercado-central', nome: 'Supermercado Central', tipo: 'varejo' },
      { id: 'mercado-vila', nome: 'Mercado da Vila', tipo: 'varejo' }
    ];

    competitors.forEach(comp => {
      this.competitorData.set(comp.id, {
        ...comp,
        precoMedio: 85 + Math.random() * 30,
        variacao7d: (Math.random() - 0.5) * 20,
        produtos: Math.floor(Math.random() * 200) + 100,
        marketShare: Math.random() * 30 + 10,
        updated: new Date()
      });
    });
  }

  // Gerar correlações de produtos
  generateProductCorrelations() {
    const correlations = [
      { produto1: 'arroz', produto2: 'feijão', correlacao: 0.85 },
      { produto1: 'coca cola', produto2: 'pepsi', correlacao: 0.72 },
      { produto1: 'detergente', produto2: 'amaciante', correlacao: 0.68 },
      { produto1: 'leite', produto2: 'açúcar', correlacao: 0.45 },
      { produto1: 'café', produto2: 'açúcar', correlacao: 0.78 },
      { produto1: 'sabão', produto2: 'detergente', correlacao: 0.55 }
    ];

    correlations.forEach(corr => {
      this.productCorrelations.set(`${corr.produto1}-${corr.produto2}`, corr);
    });
  }

  // Analisar padrões de busca
  analyzeSearchPatterns() {
    const now = new Date();
    const last7Days = this.searchHistory.filter(s => 
      (now - s.timestamp) <= 7 * 24 * 60 * 60 * 1000
    );

    // Análise por horário
    const porHorario = {};
    for (let h = 0; h < 24; h++) {
      porHorario[h] = {
        buscas: 0,
        conversoes: 0,
        tempoMedio: 0
      };
    }

    last7Days.forEach(search => {
      const hora = search.timestamp.getHours();
      porHorario[hora].buscas++;
      if (search.converteu) porHorario[hora].conversoes++;
      porHorario[hora].tempoMedio += search.tempoSessao;
    });

    // Calcular médias
    Object.keys(porHorario).forEach(hora => {
      const data = porHorario[hora];
      if (data.buscas > 0) {
        data.taxaConversao = (data.conversoes / data.buscas) * 100;
        data.tempoMedio = data.tempoMedio / data.buscas;
      }
    });

    return porHorario;
  }

  // Identificar tendências
  identifyTrends() {
    const trends = [];
    const categorias = ['Bebidas', 'Grãos', 'Laticínios', 'Limpeza', 'Alimentação'];

    categorias.forEach(categoria => {
      const last7Days = this.searchHistory.filter(s => 
        s.categoria === categoria && 
        (new Date() - s.timestamp) <= 7 * 24 * 60 * 60 * 1000
      ).length;

      const previous7Days = this.searchHistory.filter(s => 
        s.categoria === categoria && 
        (new Date() - s.timestamp) > 7 * 24 * 60 * 60 * 1000 &&
        (new Date() - s.timestamp) <= 14 * 24 * 60 * 60 * 1000
      ).length;

      if (previous7Days > 0) {
        const crescimento = ((last7Days - previous7Days) / previous7Days) * 100;
        trends.push({
          categoria,
          crescimento: crescimento.toFixed(1),
          absolute: last7Days,
          status: crescimento > 5 ? 'crescendo' : crescimento < -5 ? 'caindo' : 'estavel'
        });
      }
    });

    return trends.sort((a, b) => Math.abs(b.crescimento) - Math.abs(a.crescimento));
  }

  // Gerar insights inteligentes
  generateSmartInsights() {
    const insights = [];
    const patterns = this.analyzeSearchPatterns();
    const trends = this.identifyTrends();

    // Insight 1: Horário de pico
    const horariosAtividade = Object.entries(patterns)
      .map(([hora, data]) => ({ hora: parseInt(hora), ...data }))
      .sort((a, b) => b.buscas - a.buscas);

    const pico = horariosAtividade[0];
    if (pico && pico.buscas > 0) {
      insights.push({
        id: 'pico-horario',
        tipo: 'oportunidade',
        titulo: `Horário de pico identificado: ${pico.hora}h-${pico.hora + 1}h com ${((pico.buscas / horariosAtividade.reduce((sum, h) => sum + h.buscas, 0)) * 100).toFixed(0)}% das buscas`,
        descricao: `Concentração de atividade às ${pico.hora}h apresenta oportunidade de ofertas direcionadas`,
        impacto: 'alto',
        acao: 'Agendar ofertas flash no horário de pico',
        valor: ((pico.buscas / horariosAtividade.reduce((sum, h) => sum + h.buscas, 0)) * 100).toFixed(0),
        crescimento: 15
      });
    }

    // Insight 2: Correlação de produtos
    const arrozFeijao = this.productCorrelations.get('arroz-feijão');
    if (arrozFeijao) {
      insights.push({
        id: 'correlacao-arroz-feijao',
        tipo: 'tendencia',
        titulo: `Clientes que buscam "arroz" também se interessam por "feijão" ${(arrozFeijao.correlacao * 100).toFixed(0)}% das vezes`,
        descricao: 'Forte correlação entre busca de arroz e feijão sugere oportunidade de bundle',
        impacto: 'alto',
        acao: 'Criar combo arroz + feijão com desconto especial',
        valor: (arrozFeijao.correlacao * 100).toFixed(0),
        crescimento: 12
      });
    }

    // Insight 3: Análise por dia da semana
    const buscasPorDia = {};
    this.searchHistory.forEach(search => {
      const dia = search.timestamp.getDay();
      const categoria = search.categoria;
      
      if (!buscasPorDia[dia]) buscasPorDia[dia] = {};
      if (!buscasPorDia[dia][categoria]) buscasPorDia[dia][categoria] = 0;
      buscasPorDia[dia][categoria]++;
    });

    // Verificar se terça-feira tem pico de limpeza
    const tercaLimpeza = buscasPorDia[2]?.['Limpeza'] || 0;
    const mediaLimpeza = Object.values(buscasPorDia).reduce((sum, dia) => sum + (dia['Limpeza'] || 0), 0) / 7;
    
    if (tercaLimpeza > mediaLimpeza * 2) {
      insights.push({
        id: 'terca-limpeza',
        tipo: 'oportunidade',
        titulo: `Produtos de limpeza têm ${((tercaLimpeza / mediaLimpeza - 1) * 100).toFixed(0)}% mais visualizações às terças-feiras`,
        descricao: 'Análise de 30 dias mostra pico de interesse em produtos de limpeza nas terças-feiras',
        impacto: 'alto',
        acao: 'Lance promoções de produtos de limpeza às terças-feiras',
        valor: 18.5,
        crescimento: ((tercaLimpeza / mediaLimpeza - 1) * 100).toFixed(0)
      });
    }

    // Insight 4: Tendências de categoria
    trends.forEach(trend => {
      if (Math.abs(trend.crescimento) > 10) {
        insights.push({
          id: `trend-${trend.categoria.toLowerCase()}`,
          tipo: trend.crescimento > 0 ? 'sucesso' : 'alerta',
          titulo: `${trend.categoria} ${trend.crescimento > 0 ? 'cresceu' : 'caiu'} ${Math.abs(trend.crescimento)}% esta semana`,
          descricao: `Mudança significativa no interesse por produtos de ${trend.categoria.toLowerCase()}`,
          impacto: Math.abs(trend.crescimento) > 20 ? 'alto' : 'medio',
          acao: trend.crescimento > 0 ? 
            `Aumentar estoque de ${trend.categoria.toLowerCase()}` : 
            `Revisar estratégia para ${trend.categoria.toLowerCase()}`,
          valor: parseFloat(trend.crescimento),
          crescimento: parseFloat(trend.crescimento)
        });
      }
    });

    return insights.slice(0, 5); // Retornar top 5 insights
  }

  // Atualizar dados em tempo real
  startRealTimeUpdates() {
    setInterval(() => {
      // Simular novas buscas
      const agora = new Date();
      const intensidade = this.getIntensidadePorHorario(agora.getHours());
      
      for (let i = 0; i < intensidade; i++) {
        this.addRandomSearch();
      }
    }, 30000); // A cada 30 segundos
  }

  getIntensidadePorHorario(hora) {
    if (hora >= 14 && hora <= 16) return 5; // Pico da tarde
    if (hora >= 19 && hora <= 21) return 3; // Pico da noite
    if (hora >= 8 && hora <= 12) return 2; // Manhã
    return 1; // Outros horários
  }

  addRandomSearch() {
    const produtos = ['coca cola', 'arroz', 'leite', 'detergente', 'açúcar'];
    const categorias = ['Bebidas', 'Grãos', 'Laticínios', 'Limpeza', 'Alimentação'];
    
    this.searchHistory.unshift({
      timestamp: new Date(),
      termo: produtos[Math.floor(Math.random() * produtos.length)],
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      converteu: Math.random() < 0.3,
      tempoSessao: Math.floor(Math.random() * 300) + 30,
      deviceType: Math.random() < 0.7 ? 'mobile' : 'desktop',
      userAgent: 'PRECIVOX_TRACKER',
      loja: ['Supermercado Central', 'Atacadão Franco', 'Mercado da Vila'][Math.floor(Math.random() * 3)]
    });

    // Manter apenas últimos 10000 registros
    if (this.searchHistory.length > 10000) {
      this.searchHistory = this.searchHistory.slice(0, 10000);
    }
  }

  // Método principal para obter analytics
  getAnalytics(periodo = '7d') {
    const insights = this.generateSmartInsights();
    const patterns = this.analyzeSearchPatterns();
    const trends = this.identifyTrends();

    // Calcular estatísticas gerais
    const totalBuscas = this.searchHistory.length;
    const conversoes = this.searchHistory.filter(s => s.converteu).length;
    const taxaConversao = totalBuscas > 0 ? (conversoes / totalBuscas) * 100 : 0;

    return {
      overview: {
        totalVisualizacoes: totalBuscas * 3.5, // Aproximação
        totalBuscas: totalBuscas,
        taxaConversao: taxaConversao.toFixed(1),
        crescimentoMensal: 15.3,
        receitaImpactada: 125400,
        produtosMonitorados: 847
      },
      insights: insights,
      patterns: patterns,
      trends: trends,
      realTimeData: {
        lastUpdate: new Date().toISOString(),
        activeSessions: Math.floor(Math.random() * 50) + 10,
        currentMinuteSearches: Math.floor(Math.random() * 15) + 5
      }
    };
  }
}

// Instanciar o engine de analytics
const analyticsEngine = new AnalyticsEngine();

// ===============================================
// 🚀 ENDPOINTS DE ANALYTICS
// ===============================================

// Endpoint principal de analytics
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const { periodo = '7d', categoria = 'todas' } = req.query;
    
    console.log('📊 Gerando analytics dashboard:', { periodo, categoria });
    
    const analyticsData = analyticsEngine.getAnalytics(periodo);
    
    // Simular delay para mostrar loading
    setTimeout(() => {
      res.json({
        success: true,
        data: analyticsData,
        metadata: {
          periodo: periodo,
          categoria: categoria,
          generatedAt: new Date().toISOString(),
          totalDataPoints: analyticsEngine.searchHistory.length
        }
      });
    }, 800);
    
  } catch (error) {
    console.error('❌ Erro no analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar dashboard de analytics',
      message: error.message
    });
  }
});

// Endpoint de insights em tempo real
app.get('/api/analytics/insights', (req, res) => {
  try {
    const insights = analyticsEngine.generateSmartInsights();
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro nos insights:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar insights'
    });
  }
});

// Endpoint de dados em tempo real
app.get('/api/analytics/realtime', (req, res) => {
  try {
    const realtimeData = {
      activeSessions: Math.floor(Math.random() * 50) + 10,
      currentMinuteSearches: Math.floor(Math.random() * 15) + 5,
      topSearchesLastHour: analyticsEngine.searchHistory
        .filter(s => (new Date() - s.timestamp) <= 60 * 60 * 1000)
        .reduce((acc, search) => {
          acc[search.termo] = (acc[search.termo] || 0) + 1;
          return acc;
        }, {}),
      conversionRate: analyticsEngine.searchHistory
        .filter(s => (new Date() - s.timestamp) <= 60 * 60 * 1000)
        .reduce((sum, s, _, arr) => sum + (s.converteu ? 1 : 0), 0) / 
        Math.max(1, analyticsEngine.searchHistory.filter(s => (new Date() - s.timestamp) <= 60 * 60 * 1000).length) * 100
    };

    res.json({
      success: true,
      data: realtimeData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro nos dados em tempo real:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter dados em tempo real'
    });
  }
});

// Endpoint para exportar relatório
app.get('/api/analytics/export', (req, res) => {
  try {
    const { format = 'json', periodo = '7d' } = req.query;
    const analyticsData = analyticsEngine.getAnalytics(periodo);
    
    if (format === 'csv') {
      // Simular CSV export
      const csv = `Data,Buscas,Conversões,Taxa Conversão\n` +
        analyticsData.trends.map(t => `${t.categoria},${t.absolute},${Math.floor(t.absolute * 0.3)},${(Math.random() * 50).toFixed(1)}%`).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-precivox.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: analyticsData,
        exportedAt: new Date().toISOString(),
        format: format
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no export:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao exportar dados'
    });
  }
});

console.log('🧠 Sistema de Analytics Inteligente inicializado!');
console.log('📊 Endpoints disponíveis:');
console.log('   GET /api/analytics/dashboard - Dashboard principal');
console.log('   GET /api/analytics/insights - Insights em tempo real');
console.log('   GET /api/analytics/realtime - Dados em tempo real');
console.log('   GET /api/analytics/export - Exportar relatórios');