// Script para verificar schema da tabela users
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'precivox',
  user: 'postgres',
  password: 'postgres',
});

async function verificarSchema() {
  try {
    console.log('🔍 Verificando schema da tabela users...\n');
    
    // Query para ver as colunas da tabela
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Colunas da tabela users:');
    console.log('═══════════════════════════════════════════════\n');
    
    result.rows.forEach(col => {
      console.log(`  📌 ${col.column_name}`);
      console.log(`     Tipo: ${col.data_type}`);
      console.log(`     NULL: ${col.is_nullable}`);
      if (col.column_default) {
        console.log(`     Default: ${col.column_default}`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════\n');

    // Verificar se há usuários
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`👥 Total de usuários cadastrados: ${countResult.rows[0].total}\n`);

    // Listar usuários existentes
    if (parseInt(countResult.rows[0].total) > 0) {
      const usersResult = await pool.query('SELECT email, role, created_at FROM users LIMIT 5');
      console.log('👤 Usuários cadastrados:');
      usersResult.rows.forEach(user => {
        console.log(`   • ${user.email} (${user.role}) - ${user.created_at}`);
      });
    }

    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verificarSchema();

