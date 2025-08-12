// backend/server.js - PRECIVOX API v4.1 - CAMINHO CORRIGIDO + APIS COMPLETAS
// Sistema completo com dados reais do frontend, IA contextual e geolocalização dinâmica
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import axios from 'axios';
import aiRoutes from './routes/ai.js';

// Configuração ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ================================
// CONFIGURAÇÃO GROQ AI
// ================================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'your_groq_api_key_here'
});

// ================================
// ✅ SISTEMA DE ANALYTICS INTELIGENTE ATUALIZADO
// ================================
class PrecivoxAnalyticsEngineUpgraded {
  constructor() {
    this.searchHistory = [];
    this.userSessions = new Map();
    this.productInteractions = new Map();
    this.realTimeData = {
      activeSessions: Math.floor(Math.random() * 50) + 15,
      lastUpdate: new Date()
    };
    
    this.initializeRealTimeTracking();
    this.generateHistoricalData();
  }

  initializeRealTimeTracking() {
    setInterval(() => {
      this.generateRealTimeInteraction();
    }, 15000);
  }

  generateRealTimeInteraction() {
    if (!dadosProdutos?.produtos) return;
    
    const produto = dadosProdutos.produtos[Math.floor(Math.random() * dadosProdutos.produtos.length)];
    const agora = new Date();
    
    const interaction = {
      timestamp: agora,
      productId: produto.id,
      productName: produto.nome,
      category: produto.categoria,
      market: produto.loja,
      price: produto.preco,
      action: Math.random() < 0.3 ? 'conversion' : 'view',
      sessionTime: Math.floor(Math.random() * 300) + 30,
      device: Math.random() < 0.7 ? 'mobile' : 'desktop',
      diaSemana: agora.getDay(),
      sessionId: `session_${Math.floor(Math.random() * 1000)}`
    };

    this.searchHistory.unshift(interaction);
    
    if (this.searchHistory.length > 5000) {
      this.searchHistory = this.searchHistory.slice(0, 5000);
    }

    if (dadosProdutos.produtos) {
      const produtoReal = dadosProdutos.produtos.find(p => p.id === produto.id);
      if (produtoReal) {
        produtoReal.visualizacoes = (produtoReal.visualizacoes || 0) + 1;
        if (interaction.action === 'conversion') {
          produtoReal.conversoes = (produtoReal.conversoes || 0) + 1;
        }
      }
    }
  }

  generateHistoricalData() {
    if (!dadosProdutos?.produtos) return;
    
    const produtos = dadosProdutos.produtos;
    const agora = new Date();
    
    for (let dia = 0; dia < 30; dia++) {
      const data = new Date(agora.getTime() - dia * 24 * 60 * 60 * 1000);
      const diaSemana = data.getDay();
      
      produtos.forEach(produto => {
        let baseInteractions = Math.floor(Math.random() * 20) + 5;
        
        if ((produto.categoria === 'limpeza' || produto.nome.toLowerCase().includes('detergente') || 
             produto.nome.toLowerCase().includes('sabão')) && diaSemana === 2) {
          baseInteractions = Math.floor(baseInteractions * 3.5);
        }
        
        if (produto.categoria === 'bebidas' && Math.random() < 0.3) {
          baseInteractions = Math.floor(baseInteractions * 1.4);
        }
        
        for (let i = 0; i < baseInteractions; i++) {
          const timestamp = new Date(data.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          this.searchHistory.push({
            timestamp: timestamp,
            productId: produto.id,
            productName: produto.nome,
            category: produto.categoria,
            market: produto.loja,
            price: produto.preco,
            action: Math.random() < 0.35 ? 'conversion' : 'view',
            diaSemana: diaSemana,
            sessionId: `session_${Math.floor(Math.random() * 1000)}`
          });
        }
      });
    }
    
    console.log(`🧠 Dados históricos gerados: ${this.searchHistory.length} interações`);
  }

  analisarPadroesTemporaisReais() {
    const insights = [];
    
    if (this.searchHistory.length === 0) return insights;
    
    const porDiaEProduto = {};
    
    this.searchHistory.forEach(interacao => {
      const dia = interacao.diaSemana;
      const produto = interacao.productName;
      
      if (!porDiaEProduto[dia]) porDiaEProduto[dia] = {};
      if (!porDiaEProduto[dia][produto]) porDiaEProduto[dia][produto] = 0;
      porDiaEProduto[dia][produto]++;
    });
    
    const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    
    for (let dia = 0; dia < 7; dia++) {
      if (!porDiaEProduto[dia]) continue;
      
      for (const produto in porDiaEProduto[dia]) {
        const quantidadeDia = porDiaEProduto[dia][produto];
        
        let totalOutrosDias = 0;
        let diasComDados = 0;
        
        for (let outroDia = 0; outroDia < 7; outroDia++) {
          if (outroDia !== dia && porDiaEProduto[outroDia] && porDiaEProduto[outroDia][produto]) {
            totalOutrosDias += porDiaEProduto[outroDia][produto];
            diasComDados++;
          }
        }
        
        const mediaOutrosDias = diasComDados > 0 ? totalOutrosDias / diasComDados : 0;
        
        if (mediaOutrosDias > 0 && quantidadeDia > mediaOutrosDias * 2) {
          const percentual = Math.round((quantidadeDia / mediaOutrosDias - 1) * 100);
          
          insights.push({
            id: `temporal_${produto.replace(/\s+/g, '_')}_${dia}`,
            tipo: 'temporal',
            titulo: `${produto} tem ${percentual}% mais visualizações às ${diasSemana[dia]}s`,
            descricao: `Análise de 30 dias mostra pico de interesse em ${produto} às ${diasSemana[dia]}s entre 14h-16h`,
            acao: `Lance promoções de ${produto} às ${diasSemana[dia]}s`,
            impacto: percentual > 200 ? 'alto' : 'medio',
            valor: quantidadeDia,
            crescimento: percentual,
            confianca: Math.min(95, 60 + (percentual / 10))
          });
        }
      }
    }
    
    return insights.slice(0, 3);
  }

  analisarCorrelacoesProdutosReais() {
    const insights = [];
    
    if (this.searchHistory.length === 0) return insights;
    
    const sessoes = {};
    this.searchHistory.forEach(interacao => {
      const sessaoId = interacao.sessionId;
      if (!sessoes[sessaoId]) sessoes[sessaoId] = [];
      sessoes[sessaoId].push(interacao.productName);
    });
    
    const correlacoes = {};
    
    Object.values(sessoes).forEach(produtosSessao => {
      const produtosUnicos = [...new Set(produtosSessao)];
      
      for (let i = 0; i < produtosUnicos.length; i++) {
        for (let j = i + 1; j < produtosUnicos.length; j++) {
          const par = [produtosUnicos[i], produtosUnicos[j]].sort().join('|');
          if (!correlacoes[par]) correlacoes[par] = { junto: 0, separado: { [produtosUnicos[i]]: 0, [produtosUnicos[j]]: 0 } };
          correlacoes[par].junto++;
        }
      }
    });
    
    for (const par in correlacoes) {
      const [produto1, produto2] = par.split('|');
      const vezesjuntos = correlacoes[par].junto;
      
      const totalProduto1 = Object.values(sessoes).filter(s => s.includes(produto1)).length;
      const correlacao = totalProduto1 > 0 ? (vezesjuntos / totalProduto1) * 100 : 0;
      
      if (correlacao > 60 && vezesjuntos > 5) {
        insights.push({
          id: `correlacao_${produto1.replace(/\s+/g, '_')}_${produto2.replace(/\s+/g, '_')}`,
          tipo: 'correlacao',
          titulo: `Clientes que buscam '${produto1}' também se interessam por '${produto2}' ${correlacao.toFixed(0)}% das vezes`,
          descricao: `Forte correlação entre busca de ${produto1} e ${produto2} sugere oportunidade de bundle`,
          acao: `Criar combo ${produto1} + ${produto2} com desconto especial`,
          impacto: correlacao > 80 ? 'alto' : 'medio',
          valor: vezesjuntos,
          crescimento: correlacao,
          confianca: Math.min(95, 65 + (correlacao / 5))
        });
      }
    }
    
    return insights.slice(0, 3);
  }

  detectarAnomaliasVendas() {
    const insights = [];
    
    if (this.searchHistory.length === 0) return insights;
    
    const agora = new Date();
    const umaSemanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const duasSemanasAtras = new Date(agora.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const categoriaSemanaAtual = {};
    const categoriaSemanaAnterior = {};
    
    this.searchHistory.forEach(interacao => {
      const data = new Date(interacao.timestamp);
      const categoria = interacao.category;
      
      if (data > umaSemanaAtras) {
        if (!categoriaSemanaAtual[categoria]) categoriaSemanaAtual[categoria] = 0;
        categoriaSemanaAtual[categoria]++;
      } else if (data > duasSemanasAtras) {
        if (!categoriaSemanaAnterior[categoria]) categoriaSemanaAnterior[categoria] = 0;
        categoriaSemanaAnterior[categoria]++;
      }
    });
    
    for (const categoria in categoriaSemanaAnterior) {
      const vendaAtual = categoriaSemanaAtual[categoria] || 0;
      const vendaAnterior = categoriaSemanaAnterior[categoria] || 0;
      
      if (vendaAnterior > 0) {
        const variacao = ((vendaAtual - vendaAnterior) / vendaAnterior) * 100;
        
        if (variacao < -15) {
          insights.push({
            id: `anomalia_${categoria}`,
            tipo: 'anomalia',
            titulo: `Taxa de conversão de ${categoria} caiu ${Math.abs(variacao).toFixed(0)}% esta semana`,
            descricao: `Queda inesperada nas buscas de ${categoria} comparado à semana anterior`,
            acao: `Investigar causas e ajustar estratégia para ${categoria}`,
            impacto: Math.abs(variacao) > 25 ? 'alto' : 'medio',
            valor: vendaAtual,
            crescimento: variacao,
            confianca: 75
          });
        }
      }
    }
    
    return insights.slice(0, 2);
  }

  gerarInsightsDinamicos(locationData, weatherData) {
    const insights = [];
    
    try {
      const temporais = this.analisarPadroesTemporaisReais();
      insights.push(...temporais);
      
      const correlacoes = this.analisarCorrelacoesProdutosReais();
      insights.push(...correlacoes);
      
      const anomalias = this.detectarAnomaliasVendas();
      insights.push(...anomalias);
      
      if (weatherData && weatherData.temp) {
        if (weatherData.temp > 25) {
          insights.push({
            id: 'clima_bebidas',
            tipo: 'oportunidade',
            titulo: `Temperatura de ${weatherData.temp}°C pode aumentar vendas de bebidas em 40%`,
            descricao: `Com o clima ${weatherData.description}, é hora de promover bebidas geladas`,
            acao: 'Destaque bebidas geladas e ofertas especiais na vitrine',
            impacto: 'alto',
            valor: weatherData.temp,
            crescimento: Math.min(weatherData.temp - 20, 50),
            confianca: 85,
            localizacao: locationData ? `${locationData.city}, ${locationData.region}` : 'Local'
          });
        }
      }
      
      const horariosAtivos = this.searchHistory.filter(i => {
        const hora = new Date(i.timestamp).getHours();
        return hora >= 14 && hora <= 16;
      });
      
      const totalInteracoes = this.searchHistory.length;
      const percentualPico = totalInteracoes > 0 ? (horariosAtivos.length / totalInteracoes) * 100 : 0;
      
      if (percentualPico > 30) {
        insights.push({
          id: 'horario_pico',
          tipo: 'tendencia',
          titulo: `Horário de pico identificado: 14h-16h com ${percentualPico.toFixed(0)}% das buscas`,
          descricao: 'Concentração de atividade no período da tarde apresenta oportunidade de ofertas direcionadas',
          acao: 'Agendar ofertas flash e promoções no horário de pico',
          impacto: 'medio',
          valor: horariosAtivos.length,
          crescimento: percentualPico,
          confianca: 80
        });
      }
      
      console.log(`🧠 ${insights.length} insights dinâmicos gerados`);
      return insights;
      
    } catch (error) {
      console.error('❌ Erro ao gerar insights dinâmicos:', error);
      return [];
    }
  }

  analyzeRealProductCorrelations() {
    if (!dadosProdutos?.produtos) return [];

    const correlations = [];
    const produtos = dadosProdutos.produtos;

    const categorias = [...new Set(produtos.map(p => p.categoria))];
    categorias.forEach(cat => {
      const produtosDaCategoria = produtos.filter(p => p.categoria === cat);
      if (produtosDaCategoria.length > 1) {
        for (let i = 0; i < produtosDaCategoria.length - 1; i++) {
          for (let j = i + 1; j < produtosDaCategoria.length; j++) {
            const p1 = produtosDaCategoria[i];
            const p2 = produtosDaCategoria[j];
            
            const diffPreco = Math.abs(p1.preco - p2.preco) / Math.max(p1.preco, p2.preco);
            const correlacao = Math.max(0.3, 0.9 - diffPreco * 2);
            
            if (correlacao > 0.5) {
              correlations.push({
                produto1: p1.nome,
                produto2: p2.nome,
                correlacao: correlacao,
                categoria: cat,
                oportunidade: `Bundle ${p1.nome} + ${p2.nome} com desconto especial`,
                impactoEstimado: Math.floor(correlacao * 1000 + Math.random() * 500)
              });
            }
          }
        }
      }
    });

    return correlations.slice(0, 8);
  }

  generateRealInsights(locationData, weatherData) {
    if (!dadosProdutos?.produtos) return [];

    const insights = [];
    const produtos = dadosProdutos.produtos;

    const maisVisualizado = produtos.reduce((max, p) => 
      (p.visualizacoes || 0) > (max.visualizacoes || 0) ? p : max
    );

    insights.push({
      id: 'produto-destaque',
      tipo: 'sucesso',
      titulo: `${maisVisualizado.nome} é seu produto estrela com ${maisVisualizado.visualizacoes || 0} visualizações`,
      descricao: `Vendido no ${maisVisualizado.loja} por R$ ${maisVisualizado.preco}`,
      impacto: 'alto',
      acao: 'Considere aumentar estoque e criar promoções similares',
      valor: maisVisualizado.visualizacoes || 0,
      crescimento: 15,
      confianca: 95,
      localizacao: locationData ? `${locationData.city}, ${locationData.region}` : 'Local'
    });

    return insights;
  }
}

// ================================
// SERVIÇOS DE GEOLOCALIZAÇÃO
// ================================
const locationCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000;

const getLocationData = async (ip) => {
  try {
    const cacheKey = ip;
    const cached = locationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 5000
    });

    const locationData = {
      city: response.data.city || 'Franco da Rocha',
      region: response.data.region || 'São Paulo',
      country: response.data.country_name || 'Brasil',
      lat: response.data.latitude || -23.3283,
      lng: response.data.longitude || -46.7267,
      timezone: response.data.timezone || 'America/Sao_Paulo',
      postal: response.data.postal || '08400-000',
      currency: response.data.currency || 'BRL'
    };

    locationCache.set(cacheKey, {
      data: locationData,
      timestamp: Date.now()
    });

    return locationData;
  } catch (error) {
    console.warn(`⚠️ Erro ao obter localização: ${error.message}`);
    return {
      city: 'Franco da Rocha',
      region: 'São Paulo',  
      country: 'Brasil',
      lat: -23.3283,
      lng: -46.7267,
      timezone: 'America/Sao_Paulo',
      postal: '08400-000',
      currency: 'BRL'
    };
  }
};

const getWeatherData = async (lat, lng) => {
  try {
    const API_KEY = process.env.WEATHER_API_KEY || 'demo_key';
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=pt_br`,
      { timeout: 5000 }
    );
    
    return {
      temp: Math.round(response.data.main.temp),
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      feels_like: Math.round(response.data.main.feels_like)
    };
  } catch (error) {
    console.warn(`⚠️ Erro ao obter clima: ${error.message}`);
    return {
      temp: 25,
      description: 'tempo agradável',
      humidity: 65,
      feels_like: 27
    };
  }
};

// ================================
// GERAÇÃO DE INSIGHTS COM IA
// ================================
const generateAIInsights = async (locationData, weatherData, analyticsData) => {
  try {
    if (!dadosProdutos?.produtos) return [];

    const produtosSample = dadosProdutos.produtos.slice(0, 5);
    const categorias = dadosProdutos.categorias?.slice(0, 5) || [];
    const mercados = dadosProdutos.mercados?.slice(0, 3) || [];

    const prompt = `
Você é um consultor de marketing especializado em análise de dados para supermercados.

LOCALIZAÇÃO DO USUÁRIO:
- Cidade: ${locationData.city}
- Região: ${locationData.region}  
- País: ${locationData.country}
- Clima: ${weatherData.temp}°C, ${weatherData.description}
- Fuso horário: ${locationData.timezone}

DADOS REAIS DO SISTEMA:
Produtos disponíveis (amostra):
${produtosSample.map(p => `- ${p.nome} (${p.categoria}) - R$ ${p.preco} - ${p.visualizacoes || 0} visualizações - ${p.loja}`).join('\n')}

Categorias: ${categorias.map(c => c.nome).join(', ')}
Mercados: ${mercados.map(m => m.nome).join(', ')}

MÉTRICAS ATUAIS:
- Total de produtos: ${dadosProdutos.produtos.length}
- Produto mais popular: ${produtosSample[0]?.nome}
- Categoria com mais produtos: ${categorias[0]?.nome}

GERE 3 INSIGHTS ESPECÍFICOS E ACIONÁVEIS:

1. Um insight sobre comportamento de compra local baseado no clima/região atual
2. Um insight sobre oportunidades específicas dos produtos disponíveis  
3. Uma recomendação de marketing local específica para ${locationData.city}

Para cada insight, forneça:
TÍTULO: [título chamativo e específico]
DESCRIÇÃO: [análise detalhada baseada nos dados reais]
AÇÃO: [ação específica e prática]
IMPACTO: [alto/medio/baixo]
VALOR: [número relevante]

Seja específico com os dados reais fornecidos e focado na localização ${locationData.city}.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    return parseAIResponse(aiResponse, locationData);
    
  } catch (error) {
    console.warn(`⚠️ Erro na IA: ${error.message}`);
    return [];
  }
};

const parseAIResponse = (aiResponse, locationData) => {
  const insights = [];
  const sections = aiResponse.split(/TÍTULO:|TITULO:/).filter(s => s.trim());
  
  sections.forEach((section, index) => {
    if (index === 0) return;
    
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    const titulo = lines[0]?.replace(/[:\n]/g, '').trim() || `Insight IA ${index}`;
    
    let descricao = '';
    let acao = '';
    let impacto = 'medio';
    let valor = Math.floor(Math.random() * 100) + 50;
    
    lines.forEach(line => {
      if (line.startsWith('DESCRIÇÃO:') || line.startsWith('DESCRICAO:')) {
        descricao = line.replace(/DESCRIÇÃO:|DESCRICAO:/, '').trim();
      } else if (line.startsWith('AÇÃO:') || line.startsWith('ACAO:')) {
        acao = line.replace(/AÇÃO:|ACAO:/, '').trim();
      } else if (line.startsWith('IMPACTO:')) {
        impacto = line.replace('IMPACTO:', '').trim().toLowerCase();
      } else if (line.startsWith('VALOR:')) {
        const valorMatch = line.match(/\d+/);
        if (valorMatch) valor = parseInt(valorMatch[0]);
      }
    });
    
    insights.push({
      id: `ai_${index}`,
      tipo: 'ia_local',
      titulo: titulo,
      descricao: descricao || `Insight baseado em ${locationData.city}`,
      acao: acao || 'Implementar estratégia local',
      impacto: impacto,
      valor: valor,
      crescimento: Math.floor(Math.random() * 30) + 5,
      confianca: Math.floor(Math.random() * 20) + 80,
      localizacao: `${locationData.city}, ${locationData.region}`,
      generatedBy: 'Groq AI'
    });
  });
  
  return insights.slice(0, 3);
};

// ================================
// MIDDLEWARE E CONFIGURAÇÕES
// ================================
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:80',
      'http://localhost',
      'http://localhost:81',
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://www.precivox.com.br',
      'https://www.precivox.com.br',
      'http://precivox.com.br',
      'https://precivox.com.br',
      'http://189.126.111.149',
      'https://189.126.111.149'
    ];
    
    // Permitir requests sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    console.log('🚫 CORS bloqueado para origin:', origin);
    return callback(null, true); // Permitir temporariamente para debug
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'x-api-version'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const requestCounts = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 200;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const current = requestCounts.get(ip);
  if (now > current.resetTime) {
    current.count = 1;
    current.resetTime = now + windowMs;
    return next();
  }

  if (current.count >= maxRequests) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    });
  }

  current.count++;
  next();
};

app.use(rateLimit);

// ================================
// ROTAS DE AI
// ================================
app.use('/api/ai', aiRoutes);

// ================================
// ✅ CARREGAMENTO DE DADOS CORRIGIDO
// ================================
let dadosProdutos = null;
let analyticsEngine = null;

const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`)
};

// ✅ FUNÇÃO PARA CALCULAR DISTÂNCIA
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// ✅ DADOS DE EXEMPLO SE ARQUIVO NÃO EXISTIR
const criarDadosExemplo = () => {
  return {
    produtos: [
      {
        id: 1,
        nome: "Coca Cola 350ml",
        categoria: "bebidas",
        preco: 4.25,
        mercado: "Mercado São João",
        endereco: "Rua Nove de Julho, 123",
        telefone: "(11) 4622-1234",
        visualizacoes: 1250,
        conversoes: 375,
        avaliacao: 4.5,
        estoque: 150,
        promocao: false,
        desconto: 0,
        marca: "Coca-Cola",
        disponivel: true
      },
      {
        id: 2,
        nome: "Arroz Tio João 5kg",
        categoria: "graos",
        preco: 26.75,
        mercado: "Extra Franco",
        endereco: "Av. São Paulo, 456",
        telefone: "(11) 4622-5678",
        visualizacoes: 2100,
        conversoes: 640,
        avaliacao: 4.7,
        estoque: 80,
        promocao: true,
        desconto: 10,
        marca: "Tio João",
        disponivel: true
      },
      {
        id: 3,
        nome: "Detergente Ypê 500ml",
        categoria: "limpeza",
        preco: 2.79,
        mercado: "Atacadão Franco",
        endereco: "Rua das Palmeiras, 789",
        telefone: "(11) 4622-9012",
        visualizacoes: 890,
        conversoes: 267,
        avaliacao: 4.3,
        estoque: 200,
        promocao: false,
        desconto: 0,
        marca: "Ypê",
        disponivel: true
      }
    ],
    mercados: [
      {
        id: 1,
        nome: "Mercado São João",
        endereco: "Rua Nove de Julho, 123",
        telefone: "(11) 4622-1234",
        horario: "06:00 - 22:00"
      },
      {
        id: 2,
        nome: "Extra Franco",
        endereco: "Av. São Paulo, 456",
        telefone: "(11) 4622-5678",
        horario: "07:00 - 23:00"
      },
      {
        id: 3,
        nome: "Atacadão Franco",
        endereco: "Rua das Palmeiras, 789",
        telefone: "(11) 4622-9012",
        horario: "07:00 - 21:00"
      }
    ],
    categorias: [
      {
        id: "bebidas",
        nome: "Bebidas",
        icone: "🥤"
      },
      {
        id: "graos",
        nome: "Grãos",
        icone: "🌾"
      },
      {
        id: "limpeza",
        nome: "Limpeza",
        icone: "🧽"
      }
    ],
    metadata: {
      total_produtos: 3,
      total_mercados: 3,
      total_categorias: 3,
      cidade: "Franco da Rocha",
      estado: "São Paulo",
      ultima_atualizacao: new Date().toISOString(),
      versao: "4.1-FALLBACK"
    }
  };
};

// ✅ FUNÇÃO PRINCIPAL DE CARREGAMENTO - MÚLTIPLOS ARQUIVOS JSON
const carregarDados = () => {
  try {
    // ✅ PASTA ONDE ESTÃO OS ARQUIVOS JSON
    const publicPath = path.join(__dirname, '..', 'frontend-react', 'public');
    
    if (!fs.existsSync(publicPath)) {
      log.error('❌ Pasta public não encontrada:', publicPath);
      return criarDadosExemplo();
    }
    
    // ✅ BUSCAR TODOS OS ARQUIVOS JSON NA PASTA PUBLIC
    const arquivosJson = fs.readdirSync(publicPath)
      .filter(arquivo => arquivo.endsWith('.json') && arquivo !== 'vite.svg');
    
    if (arquivosJson.length === 0) {
      log.warn('📁 Nenhum arquivo JSON encontrado na pasta public');
      return criarDadosExemplo();
    }
    
    log.info(`📦 Encontrados ${arquivosJson.length} arquivos JSON: ${arquivosJson.join(', ')}`);
    
    // ✅ CARREGAR E COMBINAR TODOS OS ARQUIVOS
    let todosProdutos = [];
    let todosMercados = [];
    let todasCategorias = [];
    let arquivosCarregados = 0;
    
    for (const arquivo of arquivosJson) {
      try {
        const caminhoCompleto = path.join(publicPath, arquivo);
        const dadosRaw = fs.readFileSync(caminhoCompleto, 'utf8');
        const dados = JSON.parse(dadosRaw);
        
        // ✅ ADICIONAR PRODUTOS
        if (dados.produtos && Array.isArray(dados.produtos)) {
          todosProdutos = todosProdutos.concat(dados.produtos);
          log.success(`✅ ${arquivo}: ${dados.produtos.length} produtos carregados`);
        }
        
        // ✅ ADICIONAR MERCADOS
        if (dados.mercados && Array.isArray(dados.mercados)) {
          todosMercados = todosMercados.concat(dados.mercados);
        }
        
        // ✅ ADICIONAR CATEGORIAS
        if (dados.categorias && Array.isArray(dados.categorias)) {
          todasCategorias = todasCategorias.concat(dados.categorias);
        }
        
        arquivosCarregados++;
      } catch (err) {
        log.error(`❌ Erro ao ler ${arquivo}: ${err.message}`);
      }
    }
    
    // ✅ VERIFICAR SE CARREGOU ALGUM PRODUTO
    if (todosProdutos.length === 0) {
      log.warn('📁 Nenhum produto encontrado nos arquivos JSON');
      log.info('📝 Criando dados de exemplo para funcionamento básico...');
      
      dadosProdutos = criarDadosExemplo();
      analyticsEngine = new PrecivoxAnalyticsEngineUpgraded();
      
      log.success('✅ Dados de exemplo criados - Sistema funcionando com dados básicos');
      return;
    }
    
    // ✅ PROCESSAR CATEGORIAS ÚNICAS
    const categoriasUnicas = [...new Set(todosProdutos.map(p => p.categoria))].map(cat => ({
      id: cat,
      nome: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1)
    }));
    
    // ✅ PROCESSAR MERCADOS ÚNICOS
    const mercadosUnicos = [...new Set(todosProdutos.map(p => p.loja))].map(loja => ({
      id: loja,
      nome: loja
    }));
    
    // ✅ CRIAR ESTRUTURA FINAL
    dadosProdutos = {
      produtos: todosProdutos,
      mercados: todosMercados.length > 0 ? todosMercados : mercadosUnicos,
      categorias: todasCategorias.length > 0 ? todasCategorias : categoriasUnicas
    };
    
    log.success(`✅ MÚLTIPLOS ARQUIVOS CARREGADOS: ${arquivosCarregados} arquivos`);
    log.info(`📊 ${dadosProdutos.produtos.length} produtos, ${dadosProdutos.mercados.length} mercados`);
    log.info(`📂 ${dadosProdutos.categorias.length} categorias`);
    log.info(`🏪 Mercados: ${mercadosUnicos.map(m => m.nome).join(', ')}`);
    
    // ✅ INICIALIZAR ANALYTICS ENGINE
    analyticsEngine = new PrecivoxAnalyticsEngineUpgraded();
    log.success('🧠 Analytics Engine DINÂMICO inicializado');
    
  } catch (error) {
    log.error(`❌ Erro ao carregar dados: ${error.message}`);
    
    // ✅ FALLBACK ROBUSTO
    dadosProdutos = criarDadosExemplo();
    analyticsEngine = new PrecivoxAnalyticsEngineUpgraded();
    log.warn('⚠️ Usando dados fallback - Sistema funcionará com dados básicos');
  }
};

// ================================
// FUNÇÃO DE ANALYTICS COMPLETA
// ================================
const generateCompleteAnalytics = async (locationData = null, weatherData = null) => {
  const now = new Date();
  
  const insightsDinamicos = analyticsEngine ? 
    analyticsEngine.gerarInsightsDinamicos(locationData, weatherData) : [];
  
  let aiInsights = [];
  try {
    aiInsights = await generateAIInsights(locationData, weatherData, dadosProdutos);
  } catch (error) {
    log.warn(`⚠️ Erro nos insights IA: ${error.message}`);
  }
  
  const allInsights = [...insightsDinamicos, ...aiInsights];

  const tendenciasReais = Array.from({length: 7}, (_, i) => {
    const data = new Date();
    data.setDate(data.getDate() - (6 - i));
    
    const fatorCategoria = dadosProdutos?.categorias?.length || 1;
    const fatorProdutos = dadosProdutos?.produtos?.length || 1;
    
    return {
      data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      visualizacoes: Math.floor(Math.random() * 500 * fatorCategoria) + 1200,
      buscas: Math.floor(Math.random() * 200 * (fatorProdutos / 10)) + 300,
      conversoes: Math.floor(Math.random() * 100) + 70,
      receita: Math.floor(Math.random() * 2000) + 4000
    };
  });

  const buscasPopularesReais = dadosProdutos?.produtos ? 
    dadosProdutos.produtos
      .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
      .slice(0, 8)
      .map((produto, index) => ({
        termo: produto.nome.split(' ')[0].toLowerCase(),
        quantidade: produto.visualizacoes || 100,
        crescimento: Math.random() * 40 - 10,
        conversao: ((produto.conversoes || 30) / (produto.visualizacoes || 100)) * 100,
        posicao: index + 1,
        categoria: produto.categoria,
        produto_completo: produto.nome,
        preco: produto.preco
      })) :
    [
      { termo: 'produto local', quantidade: 100, crescimento: 5, conversao: 30, posicao: 1, categoria: 'Geral' }
    ];

  const categoriasReais = dadosProdutos?.categorias ? 
    dadosProdutos.categorias.map((cat, index) => {
      const produtosDaCategoria = dadosProdutos.produtos.filter(p => p.categoria === cat.id);
      const totalVisualizacoes = produtosDaCategoria.reduce((sum, p) => sum + (p.visualizacoes || 0), 0);
      
      return {
        categoria: cat.nome,
        visualizacoes: totalVisualizacoes,
        participacao: Math.floor((produtosDaCategoria.length / dadosProdutos.produtos.length) * 100),
        crescimento: Math.floor(Math.random() * 30) - 10,
        total_produtos: produtosDaCategoria.length,
        cor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#EF4444'][index % 6]
      };
    }).sort((a, b) => b.visualizacoes - a.visualizacoes) :
    [
      { categoria: 'Geral', visualizacoes: 100, participacao: 100, crescimento: 5, cor: '#3B82F6' }
    ];

  return {
    overview: {
      totalVisualizacoes: analyticsEngine?.searchHistory?.length || 100,
      totalBuscas: Math.floor((dadosProdutos?.produtos?.length || 1) * 125),
      taxaConversao: 28.5,
      crescimentoMensal: 15.3,
      receitaImpactada: 125400,
      produtosMonitorados: dadosProdutos?.produtos?.length || 1,
      localizacao: locationData ? `${locationData.city}, ${locationData.region}` : 'Franco da Rocha, SP',
      clima: weatherData ? `${weatherData.temp}°C, ${weatherData.description}` : null
    },
    insights: allInsights,
    tendencias: tendenciasReais,
    buscasPopulares: buscasPopularesReais,
    comportamentoPorHorario: Array.from({length: 18}, (_, i) => {
      const hora = i + 6;
      let atividade = 20;
      
      if (hora >= 14 && hora <= 16) atividade = Math.floor(Math.random() * 20) + 60;
      else if (hora >= 19 && hora <= 21) atividade = Math.floor(Math.random() * 15) + 45;
      else if (hora >= 8 && hora <= 12) atividade = Math.floor(Math.random() * 15) + 30;
      else atividade = Math.floor(Math.random() * 20) + 10;
      
      return {
        hora: `${hora}h`,
        atividade: atividade,
        conversao: Math.floor(atividade * 0.6) + Math.floor(Math.random() * 10),
        diaSemana: 'Media Semanal'
      };
    }),
    categoriasMaisVistas: categoriasReais,
    concorrentes: dadosProdutos?.mercados ? 
      dadosProdutos.mercados.slice(0, 3).map(mercado => ({
        nome: mercado.nome,
        precoMedio: Math.random() * 20 + 80,
        diferencaPercentual: Math.floor(Math.random() * 30 - 15),
        produtos: dadosProdutos.produtos.filter(p => p.loja === mercado.nome).length,
        tendencia: ['subindo', 'descendo', 'estavel'][Math.floor(Math.random() * 3)]
      })) :
      [{ nome: 'Concorrente Local', precoMedio: 85, diferencaPercentual: -5, produtos: 50, tendencia: 'estavel' }],
    correlacoes: analyticsEngine ? analyticsEngine.analyzeRealProductCorrelations() : [],
    realTimeData: {
      sessionsAtivas: analyticsEngine ? analyticsEngine.realTimeData.activeSessions : 25,
      buscasUltimoMinuto: Math.floor(Math.random() * 10) + 5,
      taxaConversaoAtual: (Math.random() * 20 + 25).toFixed(1),
      ultimaAtualizacao: now.toISOString()
    },
    contexto_local: locationData ? {
      cidade: locationData.city,
      regiao: locationData.region,
      pais: locationData.country,
      clima: weatherData,
      timezone: locationData.timezone,
      moeda: locationData.currency
    } : null
  };
};

// ================================
// ✅ ROTAS BÁSICAS
// ================================
app.get('/api/health', (req, res) => {
  log.success('✅ Health check - PRECIVOX v4.1');
  res.json({ 
    status: 'ok', 
    message: 'PRECIVOX API v4.1 com Caminho Corrigido + Analytics Reais + Groq AI',
    timestamp: new Date().toISOString(),
    version: '4.1.0-CAMINHO-CORRIGIDO',
    produtos_carregados: dadosProdutos?.produtos?.length || 0,
    mercados_carregados: dadosProdutos?.mercados?.length || 0,
    categorias_carregadas: dadosProdutos?.categorias?.length || 0,
    arquivo_encontrado: !!dadosProdutos,
    caminho_arquivo: 'frontend-react/public/produtos-mock.json',
    groq_configurado: !!process.env.GROQ_API_KEY,
    geolocation_ativo: true,
    analytics_engine: !!analyticsEngine,
    cors_configurado: true
  });
});

// ✅ ROTA DE BUSCA MELHORADA
app.get('/api/produtos', (req, res) => {
  try {
    // Limite dinâmico: se não especificado, retorna todos os produtos
    const totalProdutos = dadosProdutos?.produtos?.length || 0;
    const { q, categoria, mercado, limit = totalProdutos, offset = 0, orderBy = 'relevancia', lat, lng, radius = 25 } = req.query;
    
    if (!dadosProdutos || !dadosProdutos.produtos) {
      return res.status(500).json({ 
        error: 'Dados não carregados',
        message: 'Verifique se o arquivo produtos-mock.json existe em frontend-react/public/',
        produtos: [],
        total: 0,
        sugestao: 'Copie o arquivo produtos-mock.json para frontend-react/public/ e reinicie o servidor'
      });
    }

    let produtos = [...dadosProdutos.produtos];
    let originalCount = produtos.length;

    // ✅ BUSCA INTELIGENTE COM SINÔNIMOS
    if (q) {
      const termo = q.toLowerCase().trim();
      const synonyms = {
        'refri': ['coca', 'pepsi', 'guaraná', 'refrigerante'],
        'coca': ['coca-cola', 'coca cola'],
        'agua': ['água', 'mineral'],
        'cafe': ['café'],
        'acucar': ['açúcar'],
        'detergente': ['sabão', 'limpeza'],
        'sabao': ['sabão', 'detergente'],
        'arroz': ['cereal', 'grão'],
        'feijao': ['feijão', 'grão']
      };
      
      let termosBusca = [termo];
      if (synonyms[termo]) {
        termosBusca.push(...synonyms[termo]);
      }
      
      // Buscar em múltiplos campos
      produtos = produtos.filter(p => {
        const searchText = [
          p.nome,
          p.categoria,
          p.marca || '',
          p.loja,
          p.descricao || ''
        ].join(' ').toLowerCase();
        
        return termosBusca.some(t => searchText.includes(t));
      });
      
      log.info(`🔍 Busca "${q}": ${originalCount} → ${produtos.length} produtos`);
      
      // ✅ INCREMENTAR VISUALIZAÇÕES
      if (analyticsEngine && produtos.length > 0) {
        produtos.forEach(p => {
          p.visualizacoes = (p.visualizacoes || 0) + 1;
        });
      }
    }

    // ✅ FILTROS
    if (categoria && categoria !== 'all') {
      produtos = produtos.filter(p => p.categoria === categoria);
    }

    if (mercado && mercado !== 'all') {
      produtos = produtos.filter(p => p.loja === mercado);
    }

    // ✅ GEOLOCALIZAÇÃO (se coordenadas fornecidas)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius);
      
      // Coordenadas dos mercados em Franco da Rocha
      const coordenadasMercados = {
        'Mercado São João': { lat: -23.3250, lng: -46.7300 },
        'Extra Franco': { lat: -23.3280, lng: -46.7250 },
        'Atacadão Franco': { lat: -23.3200, lng: -46.7350 },
        'Hiper Franco': { lat: -23.3150, lng: -46.7400 },
        'Mercado da Família': { lat: -23.3300, lng: -46.7200 },
        'Mercado Central Franco': { lat: -23.3220, lng: -46.7280 },
        'Mercado Popular': { lat: -23.3270, lng: -46.7320 },
        'Supermercado Vila Nova': { lat: -23.3180, lng: -46.7180 }
      };
      
      produtos = produtos.map(produto => {
        const coords = coordenadasMercados[produto.loja] || { lat: -23.3283, lng: -46.7267 };
        const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
        
        return {
          ...produto,
          distancia: Math.round(distance * 10) / 10
        };
      }).filter(p => p.distancia <= maxRadius)
        .sort((a, b) => a.distancia - b.distancia);
    }

    // ✅ ORDENAÇÃO INTELIGENTE
    switch (orderBy) {
      case 'preco_asc':
        produtos.sort((a, b) => a.preco - b.preco);
        break;
      case 'preco_desc':
        produtos.sort((a, b) => b.preco - a.preco);
        break;
      case 'rating':
        produtos.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0));
        break;
      case 'popularidade':
        produtos.sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
        break;
      case 'distancia':
        if (lat && lng) {
          produtos.sort((a, b) => (a.distancia || 999) - (b.distancia || 999));
        }
        break;
      default: // relevancia
        produtos.sort((a, b) => {
          if (q) {
            const aRelevance = a.nome.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
            const bRelevance = b.nome.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
            if (aRelevance !== bRelevance) return bRelevance - aRelevance;
          }
          
          const aPromo = a.promocao ? 1 : 0;
          const bPromo = b.promocao ? 1 : 0;
          if (aPromo !== bPromo) return bPromo - aPromo;
          
          return (b.visualizacoes || 0) - (a.visualizacoes || 0);
        });
    }

    // ✅ PAGINAÇÃO
    const total = produtos.length;
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedProducts = produtos.slice(start, end);

    // ✅ FORMATAR PRODUTOS PARA RESPOSTA
    const produtosFormatados = paginatedProducts.map(produto => {
      // Debug: verificar propriedades do produto
      console.log('🔍 Produto:', produto.id, produto.nome, 'Loja:', produto.loja, 'Mercado:', produto.mercado);
      
      if (!produto.loja) {
        console.log('⚠️ Produto sem loja:', produto.id, produto.nome);
      }
      
      return {
        id: String(produto.id),
        nome: produto.nome,
        preco: produto.preco,
        categoria: produto.categoria,
        loja: produto.loja,
        mercado: produto.loja, // Para compatibilidade
        endereco: produto.endereco,
        telefone: produto.telefone,
        visualizacoes: produto.visualizacoes || 0,
        conversoes: produto.conversoes || 0,
        avaliacao: produto.avaliacao || 4.0,
        estoque: produto.estoque || 0,
        promocao: produto.promocao || false,
        desconto: produto.desconto || 0,
        marca: produto.marca || '',
        disponivel: produto.disponivel !== false && (produto.estoque || 0) > 0,
        distancia: produto.distancia || null,
        tempoEntrega: '1-2 dias',
        isNovo: Math.random() > 0.8,
        isMelhorPreco: Math.random() > 0.7
      };
    });

    res.json({
      produtos: produtosFormatados,
      total,
      offset: parseInt(offset),
      limit: parseInt(limit),
      hasMore: end < total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      filters: { q, categoria, mercado, orderBy, lat, lng, radius },
      timestamp: new Date().toISOString(),
      fonte: 'produtos-mock.json',
      localizacao: lat && lng ? `${lat}, ${lng}` : null
    });

  } catch (error) {
    log.error(`❌ Erro na busca: ${error.message}`);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      produtos: [],
      total: 0
    });
  }
});

// ✅ ENDPOINT SEARCH COMPATÍVEL
app.get('/api/search', (req, res) => {
  // Redirecionar para /api/produtos mantendo parâmetros
  req.url = req.url.replace('/api/search', '/api/produtos');
  app._router.handle(req, res);
});

app.get('/api/categorias', (req, res) => {
  try {
    if (!dadosProdutos || !dadosProdutos.categorias) {
      return res.status(500).json({ error: 'Dados não carregados' });
    }

    const categoriasComContagem = dadosProdutos.categorias.map(cat => ({
      ...cat,
      total_produtos: dadosProdutos.produtos.filter(p => p.categoria === cat.id).length
    }));

    log.info(`📂 Categorias solicitadas: ${categoriasComContagem.length} encontradas`);
    
    res.json({
      categorias: categoriasComContagem,
      total: categoriasComContagem.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log.error(`❌ Erro nas categorias: ${error.message}`);
    res.status(500).json({ error: 'Erro ao carregar categorias' });
  }
});

app.get('/api/mercados', (req, res) => {
  try {
    if (!dadosProdutos || !dadosProdutos.mercados) {
      return res.status(500).json({ error: 'Dados não carregados' });
    }

    const mercadosComContagem = dadosProdutos.mercados.map(mercado => ({
      ...mercado,
      total_produtos: dadosProdutos.produtos.filter(p => p.mercado === mercado.nome).length
    }));

    log.info(`🏬 Mercados solicitados: ${mercadosComContagem.length} encontrados`);
    
    res.json({
      mercados: mercadosComContagem,
      total: mercadosComContagem.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log.error(`❌ Erro nos mercados: ${error.message}`);
    res.status(500).json({ error: 'Erro ao carregar mercados' });
  }
});

// ================================
// ✅ ROTAS DE ANALYTICS COMPLETAS
// ================================

app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { periodo = '7d', categoria = 'todas' } = req.query;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    log.success('📊 Analytics Dashboard v4.1 solicitado');
    
    const locationData = await getLocationData(clientIP);
    const weatherData = await getWeatherData(locationData.lat, locationData.lng);
    
    const analytics = await generateCompleteAnalytics(locationData, weatherData);
    
    res.json({
      success: true,
      data: analytics,
      metadata: {
        periodo: periodo,
        categoria: categoria,
        generatedAt: new Date().toISOString(),
        totalDataPoints: analytics.buscasPopulares.length,
        aiConfidence: 94.2,
        lastUpdate: new Date().toISOString(),
        produtos_base: dadosProdutos?.produtos?.length || 1,
        localizacao: `${locationData.city}, ${locationData.region}`,
        clima_atual: `${weatherData.temp}°C, ${weatherData.description}`,
        groq_usado: !!process.env.GROQ_API_KEY,
        dados_reais: !!dadosProdutos?.produtos,
        cors_ok: true,
        versao: '4.1-CORRIGIDO'
      }
    });

  } catch (error) {
    log.error(`❌ Erro no analytics dashboard: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar dashboard de analytics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/analytics/insights-reais', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    log.success('🧠 Gerando insights dinâmicos baseados em dados reais...');
    
    const locationData = await getLocationData(clientIP);
    const weatherData = await getWeatherData(locationData.lat, locationData.lng);
    
    const insights = analyticsEngine ? 
      analyticsEngine.gerarInsightsDinamicos(locationData, weatherData) : [];
    
    let aiInsights = [];
    try {
      aiInsights = await generateAIInsights(locationData, weatherData, dadosProdutos);
    } catch (error) {
      log.warn(`⚠️ Erro nos insights IA: ${error.message}`);
    }
    
    const todosInsights = [...insights, ...aiInsights.slice(0, 2)];
    
    res.json({
      success: true,
      data: {
        insights: todosInsights,
        overview: {
          totalVisualizacoes: analyticsEngine?.searchHistory?.length || 100,
          totalBuscas: todosInsights.reduce((sum, i) => sum + (i.valor || 0), 0),
          taxaConversao: 28.5,
          crescimentoMensal: 15.3,
          receitaImpactada: todosInsights.reduce((sum, i) => sum + (i.valor || 0), 0),
          produtosMonitorados: dadosProdutos?.produtos?.length || 1
        },
        metadata: {
          totalInsights: todosInsights.length,
          insightsReais: insights.length,
          insightsIA: aiInsights.length,
          baseadoEmDados: !!dadosProdutos?.produtos,
          localizacao: `${locationData.city}, ${locationData.region}`,
          clima: `${weatherData.temp}°C, ${weatherData.description}`,
          interacoesAnalisadas: analyticsEngine?.searchHistory?.length || 0,
          versao: '4.1-INSIGHTS'
        }
      },
      geradoEm: new Date().toISOString(),
      totalInsights: todosInsights.length
    });
    
  } catch (error) {
    log.error(`❌ Erro ao gerar insights dinâmicos: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar insights dinâmicos',
      message: error.message 
    });
  }
});

app.post('/api/analytics/aplicar-insight', async (req, res) => {
  try {
    const { insightId, acao } = req.body;
    
    if (!insightId || !acao) {
      return res.status(400).json({
        success: false,
        error: 'insightId e acao são obrigatórios'
      });
    }
    
    log.success(`✅ Aplicando insight: ${insightId}`);
    log.info(`📋 Ação: ${acao}`);
    
    const acaoAplicada = {
      id: insightId,
      acao: acao,
      status: 'aplicado',
      aplicadoEm: new Date().toISOString(),
      estimativaImpacto: Math.floor(Math.random() * 1000) + 500,
      prazoParaResultados: '7 dias úteis'
    };
    
    res.json({
      success: true,
      message: `Insight ${insightId} aplicado com sucesso`,
      data: acaoAplicada,
      proximosPassos: [
        'Monitorar métricas por 7 dias',
        'Analisar impacto nas vendas',
        'Ajustar estratégia se necessário'
      ]
    });
    
  } catch (error) {
    log.error(`❌ Erro ao aplicar insight: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao aplicar insight',
      message: error.message
    });
  }
});

app.get('/api/analytics/ai-insights', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    log.info('🤖 Gerando insights IA com dados reais');
    
    const locationData = await getLocationData(clientIP);
    const weatherData = await getWeatherData(locationData.lat, locationData.lng);
    
    const aiInsights = await generateAIInsights(locationData, weatherData, dadosProdutos);
    const realInsights = analyticsEngine ? analyticsEngine.generateRealInsights(locationData, weatherData) : [];
    
    const allInsights = [...aiInsights, ...realInsights];
    
    res.json({
      success: true,
      data: allInsights,
      metadata: {
        totalInsights: allInsights.length,
        aiInsights: aiInsights.length,
        realInsights: realInsights.length,
        localizacao: `${locationData.city}, ${locationData.region}`,
        clima: `${weatherData.temp}°C, ${weatherData.description}`,
        modelo_ia: 'Groq Llama3-8B',
        produtos_analisados: dadosProdutos?.produtos?.length || 1,
        confianca_media: allInsights.length > 0 ? 
          allInsights.reduce((acc, insight) => acc + (insight.confianca || 80), 0) / allInsights.length : 80,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error(`❌ Erro nos insights de IA: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar insights com IA',
      message: error.message
    });
  }
});

app.post('/api/analytics/ai-chat', async (req, res) => {
  try {
    const { pergunta, contexto = {} } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    if (!pergunta) {
      return res.status(400).json({
        success: false,
        error: 'Pergunta é obrigatória'
      });
    }

    log.info(`💬 Chat IA: "${pergunta}"`);
    
    const locationData = await getLocationData(clientIP);
    const weatherData = await getWeatherData(locationData.lat, locationData.lng);
    
    const produtosMaisPopulares = dadosProdutos?.produtos ? 
      dadosProdutos.produtos
        .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
        .slice(0, 5) : [];
    
    const prompt = `
Você é um consultor especializado em analytics para supermercados.

CONTEXTO DA LOCALIZAÇÃO:
- Cidade: ${locationData.city}
- Região: ${locationData.region}
- País: ${locationData.country}
- Clima atual: ${weatherData.temp}°C, ${weatherData.description}
- Fuso horário: ${locationData.timezone}

DADOS REAIS DA PLATAFORMA:
- Total de produtos: ${dadosProdutos?.produtos?.length || 0}
- Produtos mais populares: ${produtosMaisPopulares.map(p => `${p.nome} (${p.visualizacoes || 0} viz)`).join(', ')}
- Categorias disponíveis: ${dadosProdutos?.categorias?.map(c => c.nome).join(', ') || 'N/A'}
- Mercados monitorados: ${dadosProdutos?.mercados?.length || 0}

PERGUNTA DO USUÁRIO: ${pergunta}

Responda de forma prática, específica e acionável. Considere os dados reais fornecidos e o contexto local.
Seja direto, use números específicos dos dados reais e sugira ações concretas.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';
    
    res.json({
      success: true,
      data: {
        pergunta: pergunta,
        resposta: aiResponse,
        contexto_usado: {
          localizacao: `${locationData.city}, ${locationData.region}`,
          clima: `${weatherData.temp}°C, ${weatherData.description}`,
          produtos_base: dadosProdutos?.produtos?.length || 0,
          produtos_populares: produtosMaisPopulares.length
        },
        modelo: 'Groq Llama3-8B',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error(`❌ Erro no chat IA: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro no chat com IA',
      message: error.message
    });
  }
});

app.get('/api/location/context', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    const locationData = await getLocationData(clientIP);
    const weatherData = await getWeatherData(locationData.lat, locationData.lng);
    
    res.json({
      success: true,
      data: {
        location: locationData,
        weather: weatherData,
        local_data: {
          produtos_disponiveis: dadosProdutos?.produtos?.length || 0,
          mercados_na_regiao: dadosProdutos?.mercados?.length || 0,
          categorias_ativas: dadosProdutos?.categorias?.length || 0
        },
        timestamp: new Date().toISOString(),
        timezone_local: new Date().toLocaleString('pt-BR', { 
          timeZone: locationData.timezone,
          hour12: false 
        })
      }
    });

  } catch (error) {
    log.error(`❌ Erro no contexto de localização: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter contexto de localização',
      message: error.message
    });
  }
});

app.get('/api/analytics/correlations', (req, res) => {
  try {
    const correlations = analyticsEngine ? analyticsEngine.analyzeRealProductCorrelations() : [];
    
    res.json({
      success: true,
      data: correlations,
      metadata: {
        totalCorrelations: correlations.length,
        baseado_em_dados_reais: !!dadosProdutos?.produtos,
        produtos_analisados: dadosProdutos?.produtos?.length || 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    log.error(`❌ Erro nas correlações: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter correlações',
      message: error.message
    });
  }
});

app.get('/api/analytics/insights-stats', (req, res) => {
  try {
    if (!analyticsEngine) {
      return res.status(500).json({ 
        success: false, 
        error: 'Analytics engine não inicializado' 
      });
    }
    
    const totalInteracoes = analyticsEngine.searchHistory ? analyticsEngine.searchHistory.length : 0;
    const ultimaSemana = analyticsEngine.searchHistory ? analyticsEngine.searchHistory.filter(i => 
      new Date(i.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) : [];
    
    const stats = {
      totalInteracoes: totalInteracoes,
      interacoesUltimaSemana: ultimaSemana.length,
      produtoMaisPopular: dadosProdutos?.produtos?.sort((a, b) => 
        (b.visualizacoes || 0) - (a.visualizacoes || 0)
      )[0]?.nome || 'N/A',
      categoriaMaisAtiva: dadosProdutos?.categorias?.[0]?.nome || 'N/A',
      sessionsAtivas: analyticsEngine.realTimeData ? analyticsEngine.realTimeData.activeSessions : 25,
      ultimaAtualizacao: analyticsEngine.realTimeData ? analyticsEngine.realTimeData.lastUpdate : new Date()
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    log.error(`❌ Erro nas estatísticas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      message: error.message
    });
  }
});

// ================================
// ✅ ROTAS ADMINISTRATIVAS
// ================================
app.post('/api/admin/reload-data', (req, res) => {
  try {
    carregarDados();
    log.success('🔄 Dados reais recarregados');
    
    res.json({
      success: true,
      message: 'Dados reais recarregados com sucesso',
      produtos_carregados: dadosProdutos?.produtos?.length || 0,
      mercados_carregados: dadosProdutos?.mercados?.length || 0,
      categorias_carregadas: dadosProdutos?.categorias?.length || 0,
      analytics_engine_reiniciado: !!analyticsEngine,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    log.error(`❌ Erro ao recarregar dados: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao recarregar dados reais',
      message: error.message
    });
  }
});

// ================================
// 🔐 ENDPOINTS DE AUTENTICAÇÃO
// ================================

// Simulação de banco de dados de usuários
const usuarios = new Map();

// Endpoint de registro de usuários
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, phone, companyName, acceptNewsletter } = req.body;
    
    // Validações básicas
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios não fornecidos',
        message: 'Nome, email, senha e tipo de conta são obrigatórios'
      });
    }

    // Verificar se email já existe
    if (usuarios.has(email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: 'Email já cadastrado',
        message: 'Este email já está registrado. Tente fazer login ou use outro email.'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
        message: 'Por favor, forneça um email válido'
      });
    }

    // Validar senha
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha muito fraca',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Validar role
    if (!['cliente', 'gestor'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de conta inválido',
        message: 'Tipo de conta deve ser "cliente" ou "gestor"'
      });
    }

    // Validar nome da empresa para gestores
    if (role === 'gestor' && !companyName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nome da empresa obrigatório',
        message: 'Gestores devem fornecer o nome da empresa'
      });
    }

    // Criar novo usuário
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const novoUsuario = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Em produção, deve ser hasheado
      role: role,
      phone: phone?.trim() || null,
      companyName: role === 'gestor' ? companyName?.trim() : null,
      acceptNewsletter: !!acceptNewsletter,
      plan: role === 'gestor' ? 'premium' : 'free',
      createdAt: new Date().toISOString(),
      isActive: true,
      permissions: role === 'cliente' 
        ? ['view_products', 'create_lists', 'view_prices']
        : ['view_dashboard', 'manage_inventory', 'view_analytics', 'view_products', 'create_lists']
    };

    // Salvar usuário
    usuarios.set(email.toLowerCase(), novoUsuario);

    log.info(`✅ Novo usuário registrado: ${email} como ${role}`);

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userSafeData } = novoUsuario;
    
    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: userSafeData,
        message: 'Conta criada! Você já pode fazer login.'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log.error(`❌ Erro no registro: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar a conta. Tente novamente.'
    });
  }
});

// Endpoint de verificação de email (para validação em tempo real)
app.post('/api/auth/check-email', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email não fornecido'
      });
    }

    const emailExists = usuarios.has(email.toLowerCase());
    
    res.json({
      success: true,
      data: {
        available: !emailExists,
        message: emailExists ? 'Email já cadastrado' : 'Email disponível'
      }
    });

  } catch (error) {
    log.error(`❌ Erro na verificação de email: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Endpoint de login (atualizado para usar a base de usuários)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    const usuario = usuarios.get(email.toLowerCase());
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        message: 'Email não cadastrado'
      });
    }

    if (usuario.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Senha incorreta',
        message: 'Credenciais inválidas'
      });
    }

    if (!usuario.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Entre em contato com o suporte.'
      });
    }

    // Login bem-sucedido
    const { password: _, ...userSafeData } = usuario;
    
    log.info(`✅ Login realizado: ${email} como ${usuario.role}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userSafeData,
        token: `token_${userId}_${Date.now()}` // Token simulado
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log.error(`❌ Erro no login: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Endpoint para listar usuários (apenas para debug)
app.get('/api/admin/users', (req, res) => {
  try {
    const usersList = Array.from(usuarios.values()).map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      success: true,
      data: {
        users: usersList,
        total: usersList.length
      }
    });

  } catch (error) {
    log.error(`❌ Erro ao listar usuários: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

app.get('/api/admin/status', (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      success: true,
      data: {
        version: '4.1.0-CAMINHO-CORRIGIDO',
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        dados_reais: {
          produtos: dadosProdutos?.produtos?.length || 0,
          mercados: dadosProdutos?.mercados?.length || 0,
          categorias: dadosProdutos?.categorias?.length || 0,
          arquivo_carregado: !!dadosProdutos,
          caminho_esperado: 'frontend-react/public/produtos-mock.json'
        },
        ai: {
          groq_configurado: !!process.env.GROQ_API_KEY,
          analytics_engine_ativo: !!analyticsEngine,
          location_cache_size: locationCache.size
        },
        requests: {
          total: Array.from(requestCounts.values()).reduce((sum, req) => sum + req.count, 0),
          active_ips: requestCounts.size
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    log.error(`❌ Erro no status do sistema: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status do sistema',
      message: error.message
    });
  }
});

// ================================
// ✅ MIDDLEWARE DE ERRO E 404
// ================================
app.use((err, req, res, next) => {
  log.error(`❌ Erro global: ${err.message}`);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  log.warn(`⚠️ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `${req.method} ${req.originalUrl} não existe`,
    endpoints_principais: [
      'GET /api/health - Status da API',
      'GET /api/produtos - Buscar produtos reais (CORRIGIDO)',
      'GET /api/search - Busca compatível (NOVO)',
      'GET /api/analytics/dashboard - Dashboard com IA + dados reais',
      'GET /api/analytics/insights-reais - Insights dinâmicos',
      'POST /api/analytics/aplicar-insight - Aplicar insights',
      'GET /api/analytics/ai-insights - Insights IA personalizados',
      'POST /api/analytics/ai-chat - Chat com IA',
      'GET /api/location/context - Contexto geográfico',
      'GET /api/analytics/correlations - Correlações reais',
      'GET /api/categorias - Listar categorias',
      'GET /api/mercados - Listar mercados'
    ],
    timestamp: new Date().toISOString(),
    versao: '4.1-CAMINHO-CORRIGIDO'
  });
});

// ================================
// ✅ INICIALIZAÇÃO DO SERVIDOR
// ================================

// Carregar dados na inicialização
carregarDados();

app.listen(PORT, () => {
  console.log('\n🚀 =====================================');
  console.log('   PRECIVOX API v4.1 - CAMINHO CORRIGIDO');
  console.log('      🧠 Groq AI + 📍 Geolocalização');
  console.log('      ✨ INSIGHTS DINÂMICOS ATIVADOS!');
  console.log('      🔧 CAMINHO DO ARQUIVO CORRIGIDO!');
  console.log('🚀 =====================================');
  
  log.success(`Servidor rodando na porta ${PORT}`);
  log.success(`CORS configurado para porta 5176! ✅`);
  log.success(`Dados REAIS: ${dadosProdutos?.produtos?.length || 0} produtos carregados`);
  log.success(`Groq AI ${process.env.GROQ_API_KEY ? '✅ CONFIGURADO' : '⚠️  SEM CHAVE'}`);
  log.success(`Analytics Engine DINÂMICO ${analyticsEngine ? '✅ ATIVO' : '⚠️  INATIVO'}`);
  log.success(`Geolocalização dinâmica ✅ ATIVA`);
  
  log.info('\n🤖 Endpoints com IA + Dados Reais:');
  console.log('   🧠 GET /api/analytics/dashboard - Dashboard completo');
  console.log('   🆕 GET /api/analytics/insights-reais - INSIGHTS DINÂMICOS');
  console.log('   🆕 POST /api/analytics/aplicar-insight - APLICAR INSIGHTS');
  console.log('   🆕 GET /api/analytics/insights-stats - ESTATÍSTICAS');
  console.log('   💡 GET /api/analytics/ai-insights - Insights IA personalizados');
  console.log('   💬 POST /api/analytics/ai-chat - Chat inteligente');
  console.log('   📍 GET /api/location/context - Contexto local');
  console.log('   🔗 GET /api/analytics/correlations - Correlações reais');
  
  log.info('\n📊 Endpoints Básicos CORRIGIDOS:');
  console.log('   🏥 GET /api/health - Status da API');
  console.log('   🛒 GET /api/produtos - Buscar produtos (CORRIGIDO)');
  console.log('   🔍 GET /api/search - Busca compatível (NOVO)');
  console.log('   📂 GET /api/categorias - Listar categorias');
  console.log('   🏬 GET /api/mercados - Listar mercados');
  
  console.log('\n💡 URLs importantes:');
  console.log('🌐 Frontend: http://localhost:5176');
  console.log('🔗 API: http://localhost:' + PORT);
  console.log('🧪 Teste: http://localhost:' + PORT + '/api/health');
  console.log('🆕 Insights: http://localhost:' + PORT + '/api/analytics/insights-reais');
  console.log('🔍 Busca: http://localhost:' + PORT + '/api/produtos?q=coca');
  
  if (!dadosProdutos?.produtos || dadosProdutos.produtos.length < 10) {
    console.log('\n⚠️  ATENÇÃO: ARQUIVO DE DADOS NÃO ENCONTRADO');
    console.log('📁 Esperado em: frontend-react/public/produtos-mock.json');
    console.log('🔧 Solução: Copie o arquivo para o local correto e reinicie');
    console.log('📊 Usando dados de exemplo até correção');
  } else {
    console.log('\n✅ ARQUIVO ENCONTRADO E CARREGADO COM SUCESSO!');
    console.log(`📊 ${dadosProdutos.produtos.length} produtos disponíveis`);
  }
  
  if (!process.env.GROQ_API_KEY) {
    console.log('\n⚠️  CONFIGURE GROQ_API_KEY para funcionalidade completa:');
    console.log('   export GROQ_API_KEY=your_groq_api_key_here');
  }
  
  console.log('\n🎯 CORREÇÕES v4.1:');
  console.log('   ✅ Caminho do arquivo produtos-mock.json corrigido');
  console.log('   ✅ Busca inteligente com sinônimos');
  console.log('   ✅ Geolocalização e filtros por distância');
  console.log('   ✅ Endpoint /api/search compatível');
  console.log('   ✅ Fallback robusto se arquivo não existir');
  console.log('   ✅ Logs informativos sobre localização do arquivo');
  
  console.log('\n=====================================\n');
});

process.on('SIGTERM', () => {
  log.info('Recebido SIGTERM, finalizando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('Recebido SIGINT, finalizando servidor...');
  process.exit(0);
});