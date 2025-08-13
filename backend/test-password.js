// Script para testar verificação de senha
import bcrypt from 'bcrypt';
import { query } from './config/database.js';

async function testPassword() {
  try {
    console.log('🔍 Testando verificação de senha...');
    
    // Buscar usuário
    const userResult = await query(
      "SELECT id, name, email, password_hash FROM users WHERE email = 'gestor.teste@precivox.com'"
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', user.name, `(${user.email})`);
    console.log('🔑 Hash da senha:', user.password_hash);
    
    // Testar senha
    const testPassword = 'gestor123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('🧪 Testando senha:', testPassword);
    console.log('✅ Senha válida:', isValid);
    
    if (isValid) {
      console.log('🎉 Senha está funcionando corretamente!');
    } else {
      console.log('❌ Senha inválida - problema na verificação');
      
      // Testar hash da senha
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('🔄 Novo hash gerado:', newHash);
      
      // Verificar se o novo hash funciona
      const newHashValid = await bcrypt.compare(testPassword, newHash);
      console.log('✅ Novo hash válido:', newHashValid);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPassword()
  .then(() => {
    console.log('🎯 Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
