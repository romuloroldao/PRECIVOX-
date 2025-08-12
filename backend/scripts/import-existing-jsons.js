// scripts/import-existing-jsons.js - Script para importar JSONs já existentes
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { query, transaction } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho para os JSONs existentes
const JSON_DIR = path.join(__dirname, '../../frontend-react/public');

// Mapeamento de nomes de arquivo para IDs/slugs de mercados
const MARKET_MAPPING = {
  'supermercado_vila_nova.json': 'supermercado-vila-nova',
  'mercado_central_franco.json': 'mercado-central',
  'atacadao_franco.json': 'hiper-atacadao-franco',
  'extra_franco.json': 'extra-franco',
  'hiper_franco.json': 'hiper-franco',
  'mercadinho_vila_bela.json': 'mercadinho-vila-bela',
  'mercado_120.json': 'mercado-120',
  'mercado_da_família.json': 'mercado-da-familia',
  'mercado_popular.json': 'mercado-popular',
  'mercado_porto.json': 'mercado-porto',
  'mercado_sao_joao.json': 'mercado-sao-joao',
  'padaria_central.json': 'padaria-central',
  'santa_fe_pq_paulista.json': 'santa-fe-pq-paulista'
};

async function findOrCreateMarket(marketSlug, marketName) {
  try {
    // Tentar encontrar mercado existente
    let market = await query('SELECT id FROM markets WHERE slug = $1', [marketSlug]);
    
    if (market.rows.length > 0) {
      console.log(`✅ Mercado encontrado: ${marketName} (${marketSlug})`);
      return market.rows[0].id;
    }

    // Criar mercado se não existir
    console.log(`🔄 Criando mercado: ${marketName} (${marketSlug})`);
    
    const adminUser = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const adminId = adminUser.rows[0]?.id;

    const createResult = await query(`
      INSERT INTO markets (
        name, slug, description, status, verified, category, size_category,
        address_street, address_city, address_state, address_zip_code,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id
    `, [
      marketName,
      marketSlug,
      `Mercado importado do JSON: ${marketName}`,
      'active',
      true,
      'Supermercado',
      'medium',
      'Endereço não informado',
      'Franco da Rocha',
      'SP',
      '07800-000',
      adminId
    ]);

    console.log(`✅ Mercado criado: ${marketName} (${marketSlug})`);
    return createResult.rows[0].id;

  } catch (error) {
    console.error(`❌ Erro ao encontrar/criar mercado ${marketName}:`, error);
    throw error;
  }
}

async function processJsonFile(filename, marketId) {
  try {
    const filePath = path.join(JSON_DIR, filename);
    console.log(`🔄 Processando: ${filename}`);

    // Verificar se arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      console.log(`⚠️  Arquivo não encontrado: ${filename}`);
      return { created: 0, updated: 0, failed: 0 };
    }

    // Ler e parsear JSON
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.produtos || !Array.isArray(jsonData.produtos)) {
      console.log(`⚠️  Formato inválido: ${filename}`);
      return { created: 0, updated: 0, failed: 0 };
    }

    const produtos = jsonData.produtos;
    let created = 0;
    let updated = 0;
    let failed = 0;

    // Processar produtos em lotes de 100
    const batchSize = 100;
    for (let i = 0; i < produtos.length; i += batchSize) {
      const batch = produtos.slice(i, i + batchSize);
      
      await transaction(async (client) => {
        for (const produto of batch) {
          try {
            // Validar dados obrigatórios
            if (!produto.nome || !produto.preco) {
              failed++;
              continue;
            }

            const productData = {
              market_id: marketId,
              external_id: produto.id?.toString(),
              nome: produto.nome.trim(),
              categoria: produto.categoria,
              subcategoria: produto.subcategoria,
              preco: parseFloat(produto.preco),
              loja: produto.loja,
              endereco: produto.endereco,
              telefone: produto.telefone,
              marca: produto.marca,
              codigo_barras: produto.codigo_barras,
              peso: produto.peso,
              origem: produto.origem,
              estoque: produto.estoque || 0,
              promocao: produto.promocao || false,
              desconto: produto.desconto || 0,
              avaliacao: produto.avaliacao || 0,
              visualizacoes: produto.visualizacoes || 0,
              conversoes: produto.conversoes || 0,
              json_source_file: filename,
              data_source: 'json_import'
            };

            // Inserir ou atualizar produto
            const upsertSql = `
              INSERT INTO products (
                market_id, external_id, nome, categoria, subcategoria, preco,
                loja, endereco, telefone, marca, codigo_barras, peso, origem,
                estoque, promocao, desconto, avaliacao, visualizacoes, conversoes,
                json_source_file, data_source, last_updated_from_source
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP
              )
              ON CONFLICT (market_id, external_id) 
              DO UPDATE SET
                nome = EXCLUDED.nome,
                categoria = EXCLUDED.categoria,
                subcategoria = EXCLUDED.subcategoria,
                preco = EXCLUDED.preco,
                promocao = EXCLUDED.promocao,
                desconto = EXCLUDED.desconto,
                last_updated_from_source = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `;

            const values = [
              productData.market_id,
              productData.external_id,
              productData.nome,
              productData.categoria,
              productData.subcategoria,
              productData.preco,
              productData.loja,
              productData.endereco,
              productData.telefone,
              productData.marca,
              productData.codigo_barras,
              productData.peso,
              productData.origem,
              productData.estoque,
              productData.promocao,
              productData.desconto,
              productData.avaliacao,
              productData.visualizacoes,
              productData.conversoes,
              productData.json_source_file,
              productData.data_source
            ];

            const result = await client.query(upsertSql, values);
            
            if (result.rows[0].inserted) {
              created++;
            } else {
              updated++;
            }

          } catch (productError) {
            console.error(`❌ Erro ao processar produto ${produto.nome}:`, productError.message);
            failed++;
          }
        }
      });

      // Log progresso
      const processed = Math.min(i + batchSize, produtos.length);
      console.log(`   Processado: ${processed}/${produtos.length} produtos`);
    }

    console.log(`✅ ${filename}: ${created} criados, ${updated} atualizados, ${failed} falharam`);
    return { created, updated, failed };

  } catch (error) {
    console.error(`❌ Erro ao processar ${filename}:`, error);
    return { created: 0, updated: 0, failed: 0 };
  }
}

async function updateMarketStats(marketId) {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT categoria) as total_categories
      FROM products 
      WHERE market_id = $1 AND status = 'active'
    `, [marketId]);

    await query(`
      UPDATE markets 
      SET 
        total_products = $1,
        total_categories = $2,
        has_database = true,
        last_data_sync = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [
      stats.rows[0].total_products,
      stats.rows[0].total_categories,
      marketId
    ]);

  } catch (error) {
    console.error('❌ Erro ao atualizar estatísticas do mercado:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando importação de JSONs existentes...\n');

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  try {
    // Listar arquivos JSON na pasta
    const files = await fs.readdir(JSON_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`📁 Encontrados ${jsonFiles.length} arquivos JSON\n`);

    for (const filename of jsonFiles) {
      try {
        // Determinar o mercado baseado no nome do arquivo
        let marketSlug = MARKET_MAPPING[filename];
        let marketName = filename.replace('.json', '').replace(/_/g, ' ');

        // Se não tiver mapeamento específico, usar o nome do arquivo
        if (!marketSlug) {
          marketSlug = filename.replace('.json', '').replace(/_/g, '-').toLowerCase();
          marketName = marketName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }

        // Encontrar ou criar mercado
        const marketId = await findOrCreateMarket(marketSlug, marketName);

        // Processar produtos do JSON
        const result = await processJsonFile(filename, marketId);
        totalCreated += result.created;
        totalUpdated += result.updated;
        totalFailed += result.failed;

        // Atualizar estatísticas do mercado
        await updateMarketStats(marketId);

        console.log(''); // Linha em branco para separar
        
      } catch (error) {
        console.error(`❌ Erro ao processar mercado para ${filename}:`, error);
        totalFailed++;
      }
    }

    console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
    console.log('================================');
    console.log(`📊 Produtos criados: ${totalCreated}`);
    console.log(`🔄 Produtos atualizados: ${totalUpdated}`);
    console.log(`❌ Produtos falharam: ${totalFailed}`);
    console.log(`📁 Arquivos processados: ${jsonFiles.length}`);
    console.log('================================\n');

    // Log de auditoria
    await query(
      'INSERT INTO audit_logs (action, resource_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        'import',
        'products',
        'Importação em lote de JSONs existentes',
        JSON.stringify({
          files_processed: jsonFiles.length,
          products_created: totalCreated,
          products_updated: totalUpdated,
          products_failed: totalFailed
        })
      ]
    );

  } catch (error) {
    console.error('❌ Erro na importação:', error);
    process.exit(1);
  }
}

// Executar importação
main().catch(console.error);