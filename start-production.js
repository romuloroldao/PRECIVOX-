#!/usr/bin/env node

// Script para iniciar Next.js em modo produção
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Next.js em modo produção...');

// Definir variáveis de ambiente para produção
const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '3000'
};

// Iniciar Next.js
const nextProcess = spawn('npm', ['start'], {
  cwd: process.cwd(),
  env: env,
  stdio: 'inherit'
});

nextProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Next.js:', error);
});

nextProcess.on('close', (code) => {
  console.log(`Next.js processo finalizado com código: ${code}`);
});

// Tratamento de sinais para shutdown graceful
process.on('SIGINT', () => {
  console.log('\n🔄 Recebido SIGINT, finalizando...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Recebido SIGTERM, finalizando...');
  nextProcess.kill('SIGTERM');
});

console.log('✅ Next.js iniciado em modo produção na porta 3000');
