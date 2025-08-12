import { query } from '../config/database.js';

async function addPerformanceIndexes() {
  try {
    console.log('🔍 Adicionando índices de performance...');
    
    console.log('📊 Criando índices para mercados...');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_cnpj ON markets(cnpj) WHERE status != \'inactive\'');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug)');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_created_by ON markets(created_by)');
    await query('CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at)');
    
    console.log('👥 Criando índices para usuários de mercado...');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_user_id ON market_users(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_market_id ON market_users(market_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_role ON market_users(role)');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_status ON market_users(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_market_users_created_at ON market_users(created_at)');
    
    console.log('👤 Criando índices para usuários...');
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');
    
    console.log('📝 Criando índices para logs de auditoria...');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    
    console.log('✅ Índices de performance criados com sucesso!');
    
    // Verificar se os índices foram criados
    console.log('\n🔍 Verificando índices criados...');
    
    const marketIndexes = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'markets' AND indexname LIKE 'idx_%'
    `);
    console.log(`📊 Índices de mercados: ${marketIndexes.rows.length}`);
    
    const userIndexes = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' AND indexname LIKE 'idx_%'
    `);
    console.log(`👤 Índices de usuários: ${userIndexes.rows.length}`);
    
    const marketUserIndexes = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'market_users' AND indexname LIKE 'idx_%'
    `);
    console.log(`👥 Índices de usuários de mercado: ${marketUserIndexes.rows.length}`);
    
    const auditIndexes = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'audit_logs' AND indexname LIKE 'idx_%'
    `);
    console.log(`📝 Índices de auditoria: ${auditIndexes.rows.length}`);
    
    console.log('\n🎉 Otimização de performance concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao criar índices:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

addPerformanceIndexes();
