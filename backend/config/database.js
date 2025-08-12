// database.js - Configuração do banco de dados PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool de conexões PostgreSQL
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'precivox',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  
  // Pool configuration
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para nova conexão
  
  // SSL configuration (para produção)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Criar pool de conexões
const pool = new Pool(dbConfig);

// Event listeners para monitoramento
pool.on('connect', (client) => {
  console.log('🔗 Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

pool.on('acquire', (client) => {
  console.log('📦 Cliente adquirido do pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Cliente removido do pool');
});

// Função para testar a conexão
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('✅ Conexão com PostgreSQL estabelecida:', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com PostgreSQL:', err.message);
    return false;
  }
};

// Função para executar queries
export const query = async (text, params = []) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query executada:', {
        query: text.length > 100 ? text.substring(0, 100) + '...' : text,
        duration: duration + 'ms',
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro na query:', {
      query: text,
      error: error.message,
      params: params
    });
    throw error;
  } finally {
    client.release();
  }
};

// Função para executar transações
export const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Função para executar queries preparadas (mais seguras)
export const preparedQuery = async (name, text, values) => {
  try {
    const result = await pool.query({
      name: name,
      text: text,
      values: values
    });
    return result;
  } catch (error) {
    console.error('❌ Erro na query preparada:', error.message);
    throw error;
  }
};

// Função para fechar todas as conexões (graceful shutdown)
export const closePool = async () => {
  try {
    await pool.end();
    console.log('🔒 Pool de conexões PostgreSQL fechado');
  } catch (error) {
    console.error('❌ Erro ao fechar pool:', error.message);
  }
};

// Função para obter informações do pool
export const getPoolInfo = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

// Middleware para adicionar db ao req
export const dbMiddleware = (req, res, next) => {
  req.db = {
    query,
    transaction,
    preparedQuery,
    pool
  };
  next();
};

export default pool;