import jwt from 'jsonwebtoken';
import { query } from './config/database.js';
import { createRequire } from 'node:module';

const { getJwtSecret } = createRequire(import.meta.url)('../lib/jwt-secret.cjs');

async function generateToken() {
  try {
    console.log('🔑 Gerando token de teste...');
    
    // Buscar usuário admin
    const result = await query('SELECT id, email, name, role FROM users WHERE email = $1', ['admin@precivox.com.br']);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    
    const user = result.rows[0];
    
    // Gerar token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
    
    console.log('✅ Token gerado com sucesso!');
    console.log('👤 Usuário:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Token:', token);
    console.log('\n📋 Para usar o token:');
    console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:3001/api/...');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit(0);
  }
}

generateToken();
