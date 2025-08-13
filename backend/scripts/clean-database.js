// Script para limpar o banco de dados PRECIVOX
// Mantém apenas o usuário admin@precivox.com

import { query, transaction } from '../config/database.js';
import bcrypt from 'bcrypt';

async function cleanDatabase() {
  console.log('🧹 Iniciando limpeza do banco de dados...');
  
  try {
    // Usar transação para garantir consistência
    await transaction(async (client) => {
      
      // 1. Limpar tabelas relacionadas (ordem importante devido às foreign keys)
      console.log('🗑️ Removendo registros de auditoria...');
      await client.query('DELETE FROM audit_logs');
      
      console.log('🗑️ Removendo sessões de usuário...');
      await client.query('DELETE FROM user_sessions');
      
      console.log('🗑️ Removendo uploads de JSON...');
      await client.query('DELETE FROM json_uploads');
      
      console.log('🗑️ Removendo produtos...');
      await client.query('DELETE FROM products');
      
      console.log('🗑️ Removendo associações usuário-mercado...');
      await client.query('DELETE FROM market_users');
      
      console.log('🗑️ Removendo mercados...');
      await client.query('DELETE FROM markets');
      
      console.log('🗑️ Removendo usuários (exceto admin)...');
      await client.query("DELETE FROM users WHERE email != 'admin@precivox.com'");
      
      console.log('✅ Limpeza concluída com sucesso!');
    });
    
    // Verificar se o admin ainda existe
    const adminCheck = await query("SELECT id, email, name, role FROM users WHERE email = 'admin@precivox.com'");
    
    if (adminCheck.rows.length === 0) {
      console.log('⚠️ Usuário admin não encontrado. Criando...');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await query(`
        INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'Administrador PRECIVOX',
          'admin@precivox.com',
          $1,
          'admin',
          'active',
          NOW(),
          NOW()
        )
      `, [hashedPassword]);
      
      console.log('✅ Usuário admin criado com sucesso!');
    } else {
      console.log('✅ Usuário admin mantido:', adminCheck.rows[0]);
    }
    
    // Verificar contagem final
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const marketCount = await query('SELECT COUNT(*) as count FROM markets');
    const productCount = await query('SELECT COUNT(*) as count FROM products');
    
    console.log('\n📊 Status final do banco:');
    console.log(`👥 Usuários: ${userCount.rows[0].count}`);
    console.log(`🏪 Mercados: ${marketCount.rows[0].count}`);
    console.log(`📦 Produtos: ${productCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanDatabase()
    .then(() => {
      console.log('🎉 Limpeza concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export default cleanDatabase;
