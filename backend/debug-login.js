// Script para debugar o processo de login
import { User } from './models/User.js';
import { query } from './config/database.js';

async function debugLogin() {
  try {
    console.log('🔍 Debugando processo de login...');
    
    const email = 'gestor.teste@precivox.com';
    const password = 'gestor123';
    
    console.log('\n1️⃣ Buscando usuário por email...');
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password_hash: user.password_hash ? 'Presente' : 'Ausente'
    });
    
    // Verificar se password_hash está presente
    if (!user.password_hash) {
      console.log('❌ PROBLEMA: password_hash não está sendo carregado!');
      console.log('🔍 Verificando dados brutos do banco...');
      
      const rawUser = await query(
        "SELECT id, name, email, role, status, password_hash FROM users WHERE email = $1",
        [email]
      );
      
      console.log('📊 Dados brutos:', rawUser.rows[0]);
      return;
    }
    
    console.log('\n2️⃣ Verificando se conta está bloqueada...');
    const isLocked = await user.isAccountLocked();
    console.log('🔒 Conta bloqueada:', isLocked);
    
    if (isLocked) {
      console.log('❌ Conta bloqueada - não pode fazer login');
      return;
    }
    
    console.log('\n3️⃣ Verificando senha...');
    const isValidPassword = await user.verifyPassword(password);
    console.log('🔑 Senha válida:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Senha inválida');
      return;
    }
    
    console.log('\n4️⃣ Verificando status da conta...');
    console.log('📊 Status atual:', user.status);
    
    if (user.status === 'pending_verification') {
      console.log('❌ Conta aguardando verificação');
      return;
    }
    
    if (user.status !== 'active') {
      console.log('❌ Conta não está ativa');
      return;
    }
    
    console.log('\n5️⃣ Todas as verificações passaram!');
    console.log('🎉 Usuário pode fazer login com sucesso');
    
    // Verificar se há algum problema com o método toJSON
    console.log('\n6️⃣ Testando método toJSON...');
    try {
      const userJson = user.toJSON();
      console.log('✅ toJSON funcionando:', Object.keys(userJson));
    } catch (error) {
      console.log('❌ Erro no toJSON:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugLogin()
  .then(() => {
    console.log('\n🎯 Debug concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
