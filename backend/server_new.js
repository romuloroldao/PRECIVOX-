// backend/server.js - PRECIVOX API v5.0 - Com PostgreSQL e autenticação completa
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testConnection, dbMiddleware, closePool } from './config/database.js';

// Importar rotas
import userRoutes from './routes/users.js';
import marketRoutes from './routes/markets.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ================================
// CONFIGURAÇÕES DE SEGURANÇA
// ================================

// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests em produção, 1000 em dev
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por IP
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================
// MIDDLEWARES GLOBAIS
// ================================

// CORS configurado
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://precivox.com.br', 'https://www.precivox.com.br']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (para IP real em produção)
app.set('trust proxy', 1);

// Middleware de database
app.use(dbMiddleware);

// Rate limiting geral
app.use('/api/', limiter);

// Rate limiting específico para auth
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ================================
// LOGGING E MONITORAMENTO
// ================================

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent');
  
  console.log(`🔵 ${method} ${url} - ${ip} - ${userAgent}`);
  
  // Log da resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '🟡' : '✅';
    
    console.log(`${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
});

// ================================
// ROTAS DA API
// ================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexão com banco
    const dbStatus = await testConnection();
    
    res.json({
      success: true,
      message: 'PRECIVOX API v5.0 - Online',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '5.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro no health check',
      timestamp: new Date().toISOString()
    });
  }
});

// Status detalhado (admin endpoint)
app.get('/api/admin/status', async (req, res) => {
  try {
    const stats = await req.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM markets) as total_markets,
        (SELECT COUNT(*) FROM user_sessions WHERE is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE) as today_actions
    `);

    res.json({
      success: true,
      system: {
        version: '5.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected'
      },
      stats: stats.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro no status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status do sistema'
    });
  }
});

// Rotas principais
app.use('/api/users', userRoutes);
app.use('/api/markets', marketRoutes);

// ================================
// BACKWARD COMPATIBILITY
// ================================

// Manter compatibilidade com frontend antigo
app.get('/api/produtos', async (req, res) => {
  try {
    const { search, categoria, mercado } = req.query;
    
    // Buscar dados dos mercados com produtos (mock por enquanto)
    const produtos = [
      {
        id: 1,
        nome: "Arroz Tio João 5kg",
        categoria: "Mercearia",
        preco: 25.90,
        mercado: "Supermercado Vila Nova",
        imagem: "https://via.placeholder.com/150x150/004A7C/white?text=Arroz"
      },
      {
        id: 2,
        nome: "Feijão Carioca 1kg",
        categoria: "Mercearia", 
        preco: 8.50,
        mercado: "Mercado Central",
        imagem: "https://via.placeholder.com/150x150/004A7C/white?text=Feijão"
      }
    ];

    let filteredProdutos = produtos;

    if (search) {
      filteredProdutos = filteredProdutos.filter(p => 
        p.nome.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoria && categoria !== 'todas') {
      filteredProdutos = filteredProdutos.filter(p => p.categoria === categoria);
    }

    if (mercado && mercado !== 'todos') {
      filteredProdutos = filteredProdutos.filter(p => p.mercado === mercado);
    }

    res.json({
      success: true,
      produtos: filteredProdutos,
      total: filteredProdutos.length
    });
  } catch (error) {
    console.error('❌ Erro na API de produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Mercados públicos (compatibility)
app.get('/api/mercados', async (req, res) => {
  try {
    const markets = await req.db.query(`
      SELECT 
        id, name, slug, address_city, address_state, 
        address_neighborhood, verified, status,
        total_products, average_rating
      FROM markets 
      WHERE status = 'active' AND verified = true
      ORDER BY name
    `);

    res.json({
      success: true,
      mercados: markets.rows.map(m => ({
        id: m.id,
        nome: m.name,
        slug: m.slug,
        cidade: m.address_city,
        estado: m.address_state,
        bairro: m.address_neighborhood,
        verificado: m.verified,
        status: m.status,
        totalProdutos: m.total_products,
        avaliacao: m.average_rating
      }))
    });
  } catch (error) {
    console.error('❌ Erro na API de mercados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ================================
// TRATAMENTO DE ERROS
// ================================

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    message: `Rota ${req.method} ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

// Error Handler Global
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);

  // Erro de validação do Joi
  if (error.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Dados de entrada inválidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido no corpo da requisição'
    });
  }

  // Erro do PostgreSQL
  if (error.code) {
    let message = 'Erro de banco de dados';
    
    switch (error.code) {
      case '23505': // unique_violation
        message = 'Dados duplicados - registro já existe';
        break;
      case '23503': // foreign_key_violation
        message = 'Referência inválida - registro relacionado não encontrado';
        break;
      case '23502': // not_null_violation
        message = 'Campo obrigatório não informado';
        break;
      case '23514': // check_violation
        message = 'Dados não atendem às regras de validação';
        break;
    }

    return res.status(400).json({
      success: false,
      error: message
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// ================================
// INICIALIZAÇÃO DO SERVIDOR
// ================================

const startServer = async () => {
  try {
    // Testar conexão com banco
    console.log('🔍 Testando conexão com PostgreSQL...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 ================================');
      console.log('🚀 PRECIVOX API v5.0 INICIADA');
      console.log('🚀 ================================');
      console.log(`🚀 Servidor: http://localhost:${PORT}`);
      console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Banco: PostgreSQL ✅`);
      console.log(`🚀 Timestamp: ${new Date().toISOString()}`);
      console.log('🚀 ================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Recebido ${signal}. Iniciando shutdown graceful...`);
      
      server.close(async () => {
        console.log('🔒 Servidor HTTP fechado');
        
        try {
          await closePool();
          console.log('🔒 Pool de conexões PostgreSQL fechado');
        } catch (error) {
          console.error('❌ Erro ao fechar pool:', error);
        }
        
        console.log('✅ Shutdown concluído');
        process.exit(0);
      });

      // Force close após 10 segundos
      setTimeout(() => {
        console.error('❌ Força shutdown após timeout');
        process.exit(1);
      }, 10000);
    };

    // Listeners para shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Listener para erros não tratados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();