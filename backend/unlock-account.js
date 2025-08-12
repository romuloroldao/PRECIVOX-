import { query } from './config/database.js';

async function unlockAccount() {
  try {
    console.log('🔓 Desbloqueando conta do admin...');
    
    // Desbloquear conta
    const result = await query(`
      UPDATE users 
      SET 
        failed_login_attempts = 0,
        account_locked_until = NULL
      WHERE email = $1
      RETURNING email, failed_login_attempts, account_locked_until
    `, ['admin@precivox.com.br']);
    
    if (result.rows.length > 0) {
      console.log('✅ Conta desbloqueada com sucesso!');
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔢 Tentativas falhadas:', result.rows[0].failed_login_attempts);
      console.log('🔒 Bloqueado até:', result.rows[0].account_locked_until);
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit(0);
  }
}

unlockAccount();
