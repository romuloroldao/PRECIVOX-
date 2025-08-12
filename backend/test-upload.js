import fs from 'fs';
import path from 'path';

// Testar se o diretório de uploads existe
console.log('🔍 Verificando diretório de uploads...');
const uploadDir = path.join(process.cwd(), 'uploads', 'json');
console.log('📁 Diretório de uploads:', uploadDir);

if (fs.existsSync(uploadDir)) {
  console.log('✅ Diretório de uploads existe');
  
  // Verificar permissões
  const stats = fs.statSync(uploadDir);
  console.log('📊 Permissões:', stats.mode.toString(8));
  console.log('👤 Proprietário:', stats.uid);
  console.log('👥 Grupo:', stats.gid);
} else {
  console.log('❌ Diretório de uploads não existe');
}

// Testar se conseguimos criar um arquivo
console.log('\n🔍 Testando criação de arquivo...');
const testFile = path.join(uploadDir, 'test.json');
try {
  fs.writeFileSync(testFile, JSON.stringify({ test: true }));
  console.log('✅ Arquivo de teste criado com sucesso');
  
  // Verificar se o arquivo foi criado
  if (fs.existsSync(testFile)) {
    console.log('✅ Arquivo existe após criação');
    
    // Remover arquivo de teste
    fs.unlinkSync(testFile);
    console.log('✅ Arquivo de teste removido');
  }
} catch (error) {
  console.error('❌ Erro ao criar arquivo de teste:', error.message);
}

// Verificar se o multer está funcionando
console.log('\n🔍 Verificando configuração do multer...');
try {
  const multer = await import('multer');
  console.log('✅ Multer importado com sucesso');
  
  // Testar configuração básica
  const storage = multer.default.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  });
  
  console.log('✅ Configuração do storage criada');
} catch (error) {
  console.error('❌ Erro ao configurar multer:', error.message);
}

console.log('\n✅ Teste concluído!');
