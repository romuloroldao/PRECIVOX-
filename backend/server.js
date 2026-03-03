// backend/server.js - PRECIVOX API v5.0 - Com PostgreSQL e autenticação completa
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import net from 'net';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { testConnection, dbMiddleware, closePool } from './config/database.js';
import internalOnly from './middleware/internalOnly.js';
import { validateJWT } from './middleware/validateJWT.js';
import { checkTokenVersion } from './middleware/checkTokenVersion.js';

// Importar rotas
import userRoutes from './routes/users.js';
import marketRoutes from './routes/markets.js';
import productRoutes from './routes/products.js';
import aiRoutes from './routes/ai.js';
import aiEnginesRoutes from './routes/ai-engines.js';
import analyticsRoutes from './routes/analytics.js';
import reportsRoutes from './routes/reports.js';
import pushNotificationsRoutes from './routes/push-notifications.js';
// import loginSimplesRoutes from './routes/login-simples.js';

// Importar serviços avançados
import { RealtimeAnalyticsService } from '../core/dist/services/realtime-analytics.service.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Inicializar Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://precivox.com.br', 'https://www.precivox.com.br']
      : ['http://localhost:3000', 'http://localhost:5176', 'http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Inicializar serviço de analytics em tempo real
const analyticsService = new RealtimeAnalyticsService();
analyticsService.initialize(io);

// ✅ FUNÇÃO PARA VERIFICAR SE PORTA ESTÁ DISPONÍVEL
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.once('close', () => resolve(true));
        server.close();
      }
    });
    server.on('error', () => resolve(false));
  });
};

// ✅ FUNÇÃO PARA ENCONTRAR PORTA DISPONÍVEL
const findAvailablePort = async (startPort = 3001, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`Nenhuma porta disponível entre ${startPort} e ${startPort + maxAttempts - 1}`);
};

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

// Rate limiting apenas em /api/v1 (contrato da camada API)
const v1Limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
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
    : ['http://localhost:3000', 'http://localhost:5176', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-version', 'Accept', 'x-client', 'x-internal-secret']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Trust proxy (para IP real em produção)
app.set('trust proxy', 1);

// Middleware de database
app.use(dbMiddleware);

// Rate limiting apenas em /api/v1 (não global)
// app.use('/api/', limiter) removido - só /api/v1 tem rate limit

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
// ORDEM OBRIGATÓRIA: /api/v1, /api/health e /api/admin/* devem vir ANTES do middleware
// que retorna 410 para o resto de /api. Novas rotas em /api devem ser registradas
// antes do bloco "app.use('/api', ...)" abaixo, senão receberão 410 Gone.

// ----- /api/v1: contrato fixo (internalOnly + JWT + tokenVersion + rate limit)
app.use('/api/v1', internalOnly);
app.use('/api/v1', validateJWT);
app.use('/api/v1', checkTokenVersion);
app.use('/api/v1', v1Limiter);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/markets', marketRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/ai-engines', aiEnginesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/push', pushNotificationsRoutes);

// ----- Rotas legadas /api (compatibilidade; login/register sem JWT aqui)

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

// Usuários recentes (admin endpoint)
app.get('/api/admin/recent-users', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT 
        id,
        email,
        name,
        role,
        created_at,
        last_login_at,
        is_active
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários recentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários recentes'
    });
  }
});

// ----- Rotas legadas /api removidas: uso exclusivo de /api/v1
// Qualquer /api/* não tratado acima (incl. rotas criadas por descuido depois deste bloco) → 410.
// Este use('/api') deve ser o ÚLTIMO registro sob /api.
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/admin/')) return next();
  res.status(410).json({
    error: 'Gone',
    message: 'Legacy /api removed. Use /api/v1 with BFF.',
    migration: 'https://docs.precivox.com.br/api-v1'
  });
});

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

    // ✅ VERIFICAR PORTA DISPONÍVEL E INICIAR SERVIDOR
    console.log(`🔍 Verificando disponibilidade da porta ${PORT}...`);

    let finalPort;
    try {
      const portAvailable = await isPortAvailable(PORT);
      if (portAvailable) {
        finalPort = PORT;
        console.log(`✅ Porta ${PORT} disponível`);
      } else {
        console.log(`⚠️ Porta ${PORT} ocupada, buscando alternativa...`);
        finalPort = await findAvailablePort(PORT);
        console.log(`✅ Porta alternativa encontrada: ${finalPort}`);
      }
    } catch (error) {
      console.error('❌ Erro ao encontrar porta disponível:', error.message);
      process.exit(1);
    }

    // Iniciar servidor HTTP com Socket.IO - bind seguro 127.0.0.1 (contrato camada API)
    const server = httpServer.listen(finalPort, '127.0.0.1', () => {
      console.log('🚀 ================================');
      console.log('🚀 PRECIVOX API v5.0 INICIADA');
      console.log('🚀 ================================');
      console.log(`🚀 Servidor: http://127.0.0.1:${finalPort}`);
      console.log(`🚀 WebSocket: ws://localhost:${finalPort}`);
      if (finalPort !== PORT) {
        console.log(`🔄 Porta original ${PORT} ocupada, usando ${finalPort}`);
      }
      console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Banco: PostgreSQL ✅`);
      console.log(`🚀 Socket.IO: Ativo ✅`);
      console.log(`🚀 Analytics em Tempo Real: Ativo ✅`);
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