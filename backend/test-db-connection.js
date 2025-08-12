import { query } from './config/database.js';

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', result.rows[0]);
    
    console.log('🔍 Testando query simples...');
    const countResult = await query('SELECT COUNT(*) as total FROM markets');
    console.log('✅ Total de mercados:', countResult.rows[0].total);
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testConnection();
