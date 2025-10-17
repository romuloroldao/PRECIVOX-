// scripts/run-migration-003.js - Executar migration 003
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Executando Migration 003: Cleanup and New Tables...');
    
    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, '../migrations/003_cleanup_and_new_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration 003 executada com sucesso!');
    console.log('');
    console.log('📊 Resumo das alterações:');
    console.log('  ✓ Dados mock removidos (mercados de exemplo)');
    console.log('  ✓ Tabela customers criada');
    console.log('  ✓ Tabela payment_plans criada');
    console.log('  ✓ Tabela customer_transactions criada');
    console.log('  ✓ Índices e triggers configurados');
    console.log('  ✓ Funções auxiliares criadas');
    
    // Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('customers', 'payment_plans', 'customer_transactions')
      ORDER BY table_name
    `);
    
    console.log('');
    console.log('📋 Tabelas verificadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verificar se dados mock foram removidos
    const marketsCount = await client.query('SELECT COUNT(*) FROM markets');
    console.log('');
    console.log(`📊 Total de mercados no banco: ${marketsCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
runMigration()
  .then(() => {
    console.log('');
    console.log('✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migration:', error);
    process.exit(1);
  });

