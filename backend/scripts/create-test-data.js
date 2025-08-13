// Script para criar dados de teste no banco PRECIVOX
// Cria 1 mercado e 1 gestor vinculado

import { query, transaction } from '../config/database.js';
import bcrypt from 'bcrypt';

async function createTestData() {
  console.log('🏪 Criando dados de teste...');
  
  try {
    // Usar transação para garantir consistência
    await transaction(async (client) => {
      
      // 1. Criar mercado de teste
      console.log('🏪 Criando mercado de teste...');
      const marketResult = await client.query(`
        INSERT INTO markets (
          id, name, slug, status, address_street, address_city, 
          address_state, address_zip_code, phone, cnpj, 
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          'Mercado Teste Upload',
          'market-test-001',
          'active',
          'Rua das Testes, 123',
          'São Paulo',
          'SP',
          '01234-567',
          '(11) 99999-9999',
          '12.345.678/0001-90',
          NOW(),
          NOW()
        ) RETURNING id, name, slug
      `);
      
      const market = marketResult.rows[0];
      console.log('✅ Mercado criado:', market);
      
      // 2. Criar gestor de teste
      console.log('👨‍💼 Criando gestor de teste...');
      const hashedPassword = await bcrypt.hash('gestor123', 12);
      
      const userResult = await client.query(`
        INSERT INTO users (
          id, name, email, password_hash, role, status, 
          phone, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          'Gestor Teste',
          'gestor.teste@precivox.com',
          $1,
          'gestor',
          'active',
          '(11) 88888-8888',
          NOW(),
          NOW()
        ) RETURNING id, name, email, role
      `, [hashedPassword]);
      
      const user = userResult.rows[0];
      console.log('✅ Gestor criado:', user);
      
      // 3. Vincular gestor ao mercado
      console.log('🔗 Vinculando gestor ao mercado...');
      await client.query(`
        INSERT INTO market_users (
          market_id, user_id, role, permissions, created_at, updated_at
        ) VALUES (
          $1, $2, 'gestor', '["view", "manage", "upload"]', NOW(), NOW()
        )
      `, [market.id, user.id]);
      
      console.log('✅ Gestor vinculado ao mercado com sucesso!');
      
      // 4. Verificar dados criados
      const finalCheck = await client.query(`
        SELECT 
          m.name as market_name,
          m.slug as market_slug,
          u.name as user_name,
          u.email as user_email,
          mu.role as user_role
        FROM markets m
        JOIN market_users mu ON m.id = mu.market_id
        JOIN users u ON mu.user_id = u.id
        WHERE m.slug = 'market-test-001'
      `);
      
      console.log('\n📊 Dados criados:');
      console.log('🏪 Mercado:', finalCheck.rows[0].market_name, `(${finalCheck.rows[0].market_slug})`);
      console.log('👨‍💼 Gestor:', finalCheck.rows[0].user_name, `(${finalCheck.rows[0].user_email})`);
      console.log('🔑 Role:', finalCheck.rows[0].user_role);
      
    });
    
    console.log('\n🎉 Dados de teste criados com sucesso!');
    
    // Verificar contagem final
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const marketCount = await query('SELECT COUNT(*) as count FROM markets');
    const marketUserCount = await query('SELECT COUNT(*) as count FROM market_users');
    
    console.log('\n📊 Status final do banco:');
    console.log(`👥 Usuários: ${userCount.rows[0].count}`);
    console.log(`🏪 Mercados: ${marketCount.rows[0].count}`);
    console.log(`🔗 Associações usuário-mercado: ${marketUserCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData()
    .then(() => {
      console.log('🎉 Criação de dados concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export default createTestData;
