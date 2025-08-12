import { query } from './config/database.js';

async function testQuery() {
  try {
    console.log('🔍 Testando função query...');
    
    // Teste 1: Query simples
    console.log('\n📝 Teste 1: Query simples');
    const result1 = await query('SELECT COUNT(*) FROM users');
    console.log('✅ Resultado:', result1.rows[0].count);
    
    // Teste 2: Query com parâmetro
    console.log('\n📝 Teste 2: Query com parâmetro');
    const result2 = await query('SELECT email, status, role FROM users WHERE email = $1', ['admin@precivox.com.br']);
    console.log('✅ Resultado:', result2.rows[0]);
    
    // Teste 3: Query com múltiplos parâmetros
    console.log('\n📝 Teste 3: Query com múltiplos parâmetros');
    const result3 = await query('SELECT email, name FROM users WHERE role = $1 AND status = $2', ['admin', 'active']);
    console.log('✅ Resultado:', result3.rows);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    process.exit(0);
  }
}

testQuery();
