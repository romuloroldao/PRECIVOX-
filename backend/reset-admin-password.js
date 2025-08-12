import bcrypt from 'bcrypt';
import { query } from './config/database.js';

async function resetAdminPassword() {
  try {
    console.log('🔧 Redefinindo senha do admin...');
    
    // Nova senha
    const newPassword = 'admin123';
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    // Atualizar senha do admin
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name',
      [password_hash, 'admin@precivox.com.br']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Senha do admin redefinida com sucesso!');
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Nova senha:', newPassword);
    } else {
      console.log('❌ Usuário admin não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
  } finally {
    process.exit(0);
  }
}

resetAdminPassword();
