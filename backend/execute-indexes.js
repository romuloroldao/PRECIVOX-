import { query } from './config/database.js';

async function addPerformanceIndexes() {
  try {
    console.log('🔍 Adicionando índices de performance...');
    
    // Índices para mercados
    console.log('📊 Criando índices para mercados...');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_cnpj ON markets(cnpj) WHERE status != \'inactive\'');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug)');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_verified ON markets(verified)');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_created_by ON markets(created_by)');
    
    // Índices para usuários de mercado
    console.log('👥 Criando índices para usuários de mercado...');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_user_id ON market_users(user_id) WHERE status = \'active\'');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_market_id ON market_users(market_id) WHERE status = \'active\'');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_role ON market_users(role)');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_status ON market_users(status)');
    
    // Índices para usuários
    console.log('👤 Criando índices para usuários...');
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE status = \'active\'');
    await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    
    // Índices para auditoria
    console.log('📝 Criando índices para auditoria...');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');
    
    console.log('✅ Índices de performance criados com sucesso!');
    
    // Verificar índices criados
    console.log('\n🔍 Verificando índices criados...');
    const result = await query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('markets', 'market_users', 'users', 'audit_logs')
      ORDER BY tablename, indexname
    `);
    
    console.log(`📊 Total de índices encontrados: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar índices:', error.message);
  } finally {
    process.exit(0);
  }
}

addPerformanceIndexes();
