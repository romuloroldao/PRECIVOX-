// Handler de Upload e Processamento de CSV/XLSX/JSON/DB
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import fs from 'fs';

// better-sqlite3 é opcional - só necessário para processar arquivos DB
let Database: any = null;
try {
  Database = require('better-sqlite3');
} catch (e) {
  // better-sqlite3 não instalado - suporte a DB será desabilitado
}

const prisma = new PrismaClient();

interface ProdutoUpload {
  nome: string;
  descricao?: string;
  categoria?: string;
  codigoBarras?: string;
  marca?: string;
  unidadeMedida?: string;
  preco: number;
  quantidade: number;
  precoPromocional?: number;
  emPromocao?: boolean;
}

interface ResultadoUpload {
  totalLinhas: number;
  sucesso: number;
  erros: number;
  duplicados: number;
  detalhesErros: Array<{
    linha: number;
    erro: string;
    dados?: any;
  }>;
}

/**
 * Valida e normaliza dados do produto
 */
function validateAndNormalizeData(linha: any, _linhaNumero: number): { 
  produto: ProdutoUpload | null; 
  erro: string | null 
} {
  try {
    // Mapeia campos
    const nome = String(linha.nome || linha.product_name || linha['nome do produto'] || linha.nome_produto || '').trim();
    const descricao = String(linha.descricao || linha.description || linha.desc || '').trim() || undefined;
    const categoria = String(linha.categoria || linha.category || linha.cat || '').trim() || undefined;
    const codigoBarras = String(linha.codigo_barras || linha.ean || linha.barcode || linha.codigo || linha.codigobarras || '').trim() || undefined;
    const marca = String(linha.marca || linha.brand || linha.fabricante || '').trim() || undefined;
    const unidadeMedida = String(linha.unidade_medida || linha.unidade || linha.unit || linha.um || 'UN').trim().toUpperCase();

    // Validação de campos obrigatórios
    if (!nome || nome.length === 0) {
      return { produto: null, erro: 'Campo "nome" é obrigatório e não pode estar vazio' };
    }

    if (nome.length < 2) {
      return { produto: null, erro: 'Nome do produto deve ter pelo menos 2 caracteres' };
    }

    // Processa preço
    let preco = 0;
    const precoStr = String(linha.preco || linha.price || linha.valor || linha.preco_unitario || 0);
    if (precoStr) {
      const precoLimpo = precoStr.replace(/[^\d,.-]/g, '').replace(',', '.');
      const precoNum = parseFloat(precoLimpo);
      if (isNaN(precoNum) || precoNum < 0) {
        return { produto: null, erro: 'Preço inválido. Deve ser um número maior ou igual a zero' };
      }
      preco = precoNum;
    } else {
      return { produto: null, erro: 'Campo "preco" é obrigatório' };
    }

    // Processa quantidade
    let quantidade = 0;
    const qtdStr = String(linha.quantidade || linha.quantity || linha.estoque || linha.stock || linha.qtd || 0);
    if (qtdStr) {
      const qtdNum = parseInt(qtdStr);
      if (isNaN(qtdNum) || qtdNum < 0) {
        quantidade = 0; // Quantidade pode ser 0, não é erro crítico
      } else {
        quantidade = qtdNum;
      }
    }

    // Processa preço promocional
    let precoPromocional: number | undefined = undefined;
    const precoPromoStr = String(linha.preco_promocional || linha.promo_price || linha.preco_promo || linha.valor_promocional || '');
    if (precoPromoStr && precoPromoStr.trim()) {
      const precoPromoLimpo = precoPromoStr.replace(/[^\d,.-]/g, '').replace(',', '.');
      const precoPromoNum = parseFloat(precoPromoLimpo);
      if (!isNaN(precoPromoNum) && precoPromoNum >= 0) {
        precoPromocional = precoPromoNum;
      }
    }

    // Determina se está em promoção
    const emPromocao = linha.em_promocao === 'true' || 
                       linha.em_promocao === '1' || 
                       linha.em_promocao === true ||
                       linha.promocao === 'true' ||
                       linha.promocao === '1' ||
                       linha.promocao === true ||
                       !!precoPromocional;

    // Normaliza categoria (remove espaços extras, capitaliza primeira letra)
    const categoriaNormalizada = categoria 
      ? categoria.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : undefined;

    // Remove duplicatas de espaços no nome
    const nomeNormalizado = nome.replace(/\s+/g, ' ').trim();

    return {
      produto: {
        nome: nomeNormalizado,
        descricao: descricao || undefined,
        categoria: categoriaNormalizada,
        codigoBarras: codigoBarras || undefined,
        marca: marca || undefined,
        unidadeMedida: unidadeMedida || 'UN',
        preco,
        quantidade,
        precoPromocional,
        emPromocao,
      },
      erro: null,
    };
  } catch (error: any) {
    return { 
      produto: null, 
      erro: `Erro ao validar dados: ${error.message}` 
    };
  }
}

/**
 * Processa arquivo CSV ou XLSX e importa produtos para uma unidade
 */
export async function processarArquivoUpload(
  filePath: string,
  fileName: string,
  mercadoId: string,
  unidadeId: string,
  fileSize: number
): Promise<ResultadoUpload> {
  const logImportacao = await prisma.logs_importacao.create({
    data: {
      mercadoId,
      nomeArquivo: fileName,
      tamanhoBytes: fileSize,
      status: 'PROCESSANDO',
      dataInicio: new Date(),
    },
  });

  try {
    const extensao = fileName.split('.').pop()?.toLowerCase();
    let dados: any[] = [];

    // Processa CSV
    if (extensao === 'csv') {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
      });
      dados = parseResult.data;
    }
    // Processa XLSX/XLS
    else if (extensao === 'xlsx' || extensao === 'xls') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      dados = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      // Normaliza headers para lowercase
      dados = dados.map(row => {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.trim().toLowerCase()] = row[key];
        });
        return normalizedRow;
      });
    }
    // Processa JSON
    else if (extensao === 'json') {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      // Se for array direto
      if (Array.isArray(jsonData)) {
        dados = jsonData;
      }
      // Se for objeto com propriedade "produtos"
      else if (jsonData.produtos && Array.isArray(jsonData.produtos)) {
        dados = jsonData.produtos;
      }
      // Se for objeto com propriedade "items"
      else if (jsonData.items && Array.isArray(jsonData.items)) {
        dados = jsonData.items;
      }
      else {
        throw new Error('Formato JSON inválido. Esperado array ou objeto com propriedade "produtos" ou "items"');
      }
      
      // Normaliza keys para lowercase
      dados = dados.map((row: any) => {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.trim().toLowerCase()] = row[key];
        });
        return normalizedRow;
      });
    }
    // Processa DB (SQLite) - opcional (requer better-sqlite3)
    else if (extensao === 'db' || extensao === 'sqlite' || extensao === 'sqlite3') {
      if (!Database) {
        throw new Error('Suporte a arquivos DB requer instalação do pacote better-sqlite3. Execute: npm install better-sqlite3');
      }
      
      try {
        const db = new Database(filePath, { readonly: true });
        
        // Tenta encontrar tabela de produtos
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
        const tableName = tables.find(t => 
          ['produtos', 'products', 'estoque', 'stock', 'items'].includes(t.name.toLowerCase())
        )?.name || tables[0]?.name;
        
        if (!tableName) {
          throw new Error('Nenhuma tabela encontrada no banco de dados');
        }
        
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as any[];
        
        // Normaliza keys para lowercase
        dados = rows.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });
          return normalizedRow;
        });
        
        db.close();
      } catch (dbError: any) {
        throw new Error(`Erro ao processar banco de dados: ${dbError.message}`);
      }
    } else {
      throw new Error('Formato de arquivo não suportado. Use CSV, XLSX ou JSON. Para DB, instale better-sqlite3');
    }

    const resultado: ResultadoUpload = {
      totalLinhas: dados.length,
      sucesso: 0,
      erros: 0,
      duplicados: 0,
      detalhesErros: [],
    };

    // Processa cada linha
    for (let i = 0; i < dados.length; i++) {
      try {
        const linha = dados[i];
        
        // Valida e normaliza dados
        const { produto: produtoData, erro: erroValidacao } = validateAndNormalizeData(linha, i + 2);
        
        if (erroValidacao || !produtoData) {
          resultado.erros++;
          resultado.detalhesErros.push({
            linha: i + 2,
            erro: erroValidacao || 'Erro desconhecido na validação',
            dados: linha,
          });
          continue;
        }

        // Busca ou cria produto (verifica por código de barras ou nome+marca)
        let produto = null;
        
        // Primeiro tenta buscar por código de barras (se existir)
        if (produtoData.codigoBarras && produtoData.codigoBarras.length > 0) {
          produto = await prisma.produtos.findFirst({
            where: {
              codigoBarras: produtoData.codigoBarras,
            },
          });
        }
        
        // Se não encontrou por código de barras, tenta por nome+marca
        if (!produto) {
          produto = await prisma.produtos.findFirst({
            where: {
              AND: [
                { nome: { equals: produtoData.nome, mode: 'insensitive' } },
                produtoData.marca 
                  ? { marca: { equals: produtoData.marca, mode: 'insensitive' } }
                  : { marca: null },
              ],
            },
          });
        }

        if (!produto) {
          // Gera ID único para o produto
          const produtoId = `prod-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          produto = await prisma.produtos.create({
            data: {
              id: produtoId,
              nome: produtoData.nome,
              descricao: produtoData.descricao,
              categoria: produtoData.categoria,
              codigoBarras: produtoData.codigoBarras || null,
              marca: produtoData.marca || null,
              unidadeMedida: produtoData.unidadeMedida || 'UN',
              ativo: true,
              dataCriacao: new Date(),
              dataAtualizacao: new Date(),
            },
          });
        } else {
          // Atualiza produto existente com novos dados (se houver)
          await prisma.produtos.update({
            where: { id: produto.id },
            data: {
              descricao: produtoData.descricao || produto.descricao,
              categoria: produtoData.categoria || produto.categoria,
              marca: produtoData.marca || produto.marca,
              unidadeMedida: produtoData.unidadeMedida || produto.unidadeMedida,
              dataAtualizacao: new Date(),
            },
          });
        }

        // Verifica se já existe estoque para este produto nesta unidade
        const estoqueExistente = await prisma.estoques.findUnique({
          where: {
            unidadeId_produtoId: {
              unidadeId,
              produtoId: produto.id,
            },
          },
        });

        if (estoqueExistente) {
          // Atualiza estoque existente para a mesma unidade
          await prisma.estoques.update({
            where: { id: estoqueExistente.id },
            data: {
              quantidade: produtoData.quantidade,
              preco: produtoData.preco,
              precoPromocional: produtoData.precoPromocional,
              emPromocao: produtoData.emPromocao || false,
              disponivel: produtoData.quantidade > 0,
              atualizadoEm: new Date(),
            },
          });
          resultado.duplicados++;
          resultado.sucesso++;
        } else {
          // Cria novo estoque
          await prisma.estoques.create({
            data: {
              id: `estoque-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              unidadeId,
              produtoId: produto.id,
              quantidade: produtoData.quantidade,
              preco: produtoData.preco,
              precoPromocional: produtoData.precoPromocional,
              emPromocao: produtoData.emPromocao || false,
              disponivel: produtoData.quantidade > 0,
              atualizadoEm: new Date(),
              dataCriacao: new Date(),
            },
          });
          resultado.sucesso++;
        }
      } catch (error: any) {
        resultado.erros++;
        resultado.detalhesErros.push({
          linha: i + 2,
          erro: error.message || 'Erro desconhecido',
          dados: dados[i],
        });
      }
    }

    // Determina status final
    let statusFinal: 'CONCLUIDO' | 'PARCIAL' | 'FALHA';
    if (resultado.erros === resultado.totalLinhas) {
      statusFinal = 'FALHA';
    } else if (resultado.erros === 0 && resultado.sucesso > 0) {
      statusFinal = 'CONCLUIDO';
    } else {
      statusFinal = 'PARCIAL';
    }

    // Atualiza log de importação com tempo de execução
    const dataFim = new Date();
    const tempoExecucao = Math.round((dataFim.getTime() - logImportacao.dataInicio.getTime()) / 1000); // segundos
    
    await prisma.logs_importacao.update({
      where: { id: logImportacao.id },
      data: {
        totalLinhas: resultado.totalLinhas,
        linhasSucesso: resultado.sucesso,
        linhasErro: resultado.erros,
        linhasDuplicadas: resultado.duplicados,
        status: statusFinal,
        detalhesErros: resultado.detalhesErros.length > 0 ? JSON.stringify(resultado.detalhesErros) : null,
        mensagemErro: statusFinal === 'FALHA' 
          ? `Falha total: ${resultado.erros} erros em ${resultado.totalLinhas} linhas`
          : statusFinal === 'PARCIAL'
          ? `Processamento parcial: ${resultado.sucesso} sucesso, ${resultado.erros} erros, ${resultado.duplicados} duplicados`
          : null,
        dataFim,
      },
    });
    
    console.log(`✅ Importação ${statusFinal}: ${resultado.sucesso} sucesso, ${resultado.erros} erros, ${resultado.duplicados} duplicados em ${tempoExecucao}s`);

    // Remove arquivo temporário
    fs.unlinkSync(filePath);

    return resultado;
  } catch (error: any) {
    // Atualiza log com falha
    await prisma.logs_importacao.update({
      where: { id: logImportacao.id },
      data: {
        status: 'FALHA',
        mensagemErro: error.message || 'Erro desconhecido ao processar arquivo',
        dataFim: new Date(),
      },
    });

    // Remove arquivo temporário
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw error;
  }
}


/**
 * Obtém histórico de importações de um mercado
 */
export async function obterHistoricoImportacoes(mercadoId: string) {
  return await prisma.logs_importacao.findMany({
    where: { mercadoId },
    orderBy: { dataInicio: 'desc' },
    take: 20,
  });
}

