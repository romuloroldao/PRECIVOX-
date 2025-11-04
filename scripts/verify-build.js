#!/usr/bin/env node

/**
 * Script de Verificação de Build
 * Verifica se todos os chunks listados no build-manifest existem fisicamente
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', '.next');
const BUILD_MANIFEST = path.join(BUILD_DIR, 'build-manifest.json');

console.log('🔍 Verificando build de produção...\n');

// Verificar se .next existe
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Diretório .next não encontrado. Execute "npm run build" primeiro.');
  process.exit(1);
}

// Verificar se build-manifest existe
if (!fs.existsSync(BUILD_MANIFEST)) {
  console.error('❌ build-manifest.json não encontrado. Execute "npm run build" primeiro.');
  process.exit(1);
}

// Ler build-manifest
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));
} catch (error) {
  console.error('❌ Erro ao ler build-manifest.json:', error.message);
  process.exit(1);
}

// Coletar todos os arquivos referenciados
const allFiles = new Set();

// Adicionar arquivos de pages
const pages = manifest.pages || {};
Object.values(pages).forEach(pageFiles => {
  if (Array.isArray(pageFiles)) {
    pageFiles.forEach(file => allFiles.add(file));
  }
});

// Adicionar arquivos de rootMainFiles
if (manifest.rootMainFiles && Array.isArray(manifest.rootMainFiles)) {
  manifest.rootMainFiles.forEach(file => allFiles.add(file));
}

// Adicionar arquivos de polyfillFiles
if (manifest.polyfillFiles && Array.isArray(manifest.polyfillFiles)) {
  manifest.polyfillFiles.forEach(file => allFiles.add(file));
}

// Adicionar arquivos de lowPriorityFiles
if (manifest.lowPriorityFiles && Array.isArray(manifest.lowPriorityFiles)) {
  manifest.lowPriorityFiles.forEach(file => allFiles.add(file));
}

// Verificar se cada arquivo existe
const missingFiles = [];
const existingFiles = [];

allFiles.forEach(file => {
  // Remover query strings se houver
  const cleanFile = file.split('?')[0];
  // O manifest já tem caminho relativo como "static/chunks/..." ou "static/..."
  // Precisamos apenas adicionar ao BUILD_DIR
  const filePath = path.join(BUILD_DIR, cleanFile);
  
  if (fs.existsSync(filePath)) {
    existingFiles.push(file);
  } else {
    missingFiles.push(file);
    console.error(`❌ Arquivo não encontrado: ${file}`);
  }
});

console.log(`\n📊 Estatísticas:`);
console.log(`   Total de arquivos referenciados: ${allFiles.size}`);
console.log(`   ✅ Arquivos existentes: ${existingFiles.length}`);
console.log(`   ❌ Arquivos faltando: ${missingFiles.length}`);

// Verificar diretório _next/static
const staticDir = path.join(BUILD_DIR, 'static');
if (!fs.existsSync(staticDir)) {
  console.error('\n❌ Diretório .next/static não encontrado!');
  process.exit(1);
}

// Verificar estrutura de chunks
const chunksDir = path.join(staticDir, 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.error('\n❌ Diretório .next/static/chunks não encontrado!');
  process.exit(1);
}

// Contar chunks
const chunkFiles = [];
function countChunks(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      countChunks(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.css')) {
      chunkFiles.push(filePath);
    }
  });
}

countChunks(chunksDir);
console.log(`   📦 Total de chunks encontrados: ${chunkFiles.length}`);

// Verificar tamanho total
const totalSize = chunkFiles.reduce((sum, file) => {
  try {
    return sum + fs.statSync(file).size;
  } catch {
    return sum;
  }
}, 0);
console.log(`   💾 Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// Resultado final
if (missingFiles.length > 0) {
  console.error('\n❌ Build inconsistente! Execute "npm run build" novamente.');
  process.exit(1);
} else {
  console.log('\n✅ Build verificado com sucesso!');
  console.log('   Todos os arquivos estão presentes e acessíveis.');
  process.exit(0);
}

