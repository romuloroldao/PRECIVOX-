import { query } from './config/database.js';
import bcrypt from 'bcrypt';

async function checkPassword() {
  try {
    console.log('🔍 Verificando senha do admin...');
    
    // Buscar usuário admin
    const result = await query('SELECT email, password_hash FROM users WHERE email = $1', ['admin@precivox.com.br']);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    
    const user = result.rows[0];
    console.log('📧 Email:', user.email);
    console.log('🔑 Hash da senha:', user.password_hash.substring(0, 20) + '...');
    
    // Testar senha
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('🔍 Testando senha:', testPassword);
    console.log('✅ Senha válida:', isValid);
    
    if (!isValid) {
      console.log('🔄 Redefinindo senha...');
      
      const saltRounds = 12;
      const newHash = await bcrypt.hash(testPassword, saltRounds);
      
      await query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, user.email]);
      console.log('✅ Senha redefinida com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit(0);
  }
}

checkPassword();
