// 📦 Módulo de Conversão Inteligente para o Padrão PRECIVOX
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import xlsx from 'xlsx';
import xml2js from 'xml2js';
import {
  normalizeNumber,
  normalizeText,
  normalizeBoolean,
  normalizeBarcode,
  detectUnit,
  inferCategory,
  inferBrand
} from './normalizers.js';

/**
 * Mapeamento flexível de colunas (case-insensitive)
 */
const COLUMN_ALIASES = {
  nome: ['nome', 'product', 'produto', 'item', 'name', 'description', 'titulo'],
  preco: ['preco', 'preço', 'price', 'valor', 'value', 'custo', 'cost'],
  quantidade: ['quantidade', 'quantity', 'estoque', 'stock', 'qtd', 'qty', 'qnt'],
  categoria: ['categoria', 'category', 'grupo', 'type', 'tipo', 'secao', 'seção'],
  marca: ['marca', 'brand', 'fabricante', 'manufacturer', 'maker'],
  unidade_medida: ['unidade_medida', 'unidade', 'unit', 'measure', 'um', 'medida'],
  codigo_barras: ['codigo_barras', 'codigo', 'ean', 'barcode', 'gtin', 'upc', 'ean13'],
  descricao: ['descricao', 'descrição', 'description', 'detalhe', 'details', 'obs', 'observacao'],
  preco_promocional: ['preco_promocional', 'preço_promocional', 'promo_price', 'promocao', 'desconto'],
  em_promocao: ['em_promocao', 'promocao', 'promo', 'sale', 'oferta']
};

/**
 * Mapeia as colunas do arquivo para os campos padrão PRECIVOX
 */
function mapColumns(headers) {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const columnMap = {};

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const foundIndex = lowerHeaders.findIndex(h => 
      aliases.some(alias => h.includes(alias) || alias.includes(h))
    );
    columnMap[field] = foundIndex >= 0 ? headers[foundIndex] : null;
  }

  return columnMap;
}

/**
 * Lê e parseia o arquivo conforme seu formato
 */
async function readFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = Papa.parse(content, { 
        header: true, 
        skipEmptyLines: true,
        dynamicTyping: false
      });
      return parsed.data;
      
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_json(sheet, { defval: '' });
      
    } else if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
      
    } else if (ext === '.xml') {
      const xml = fs.readFileSync(filePath, 'utf8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true 
      });
      const result = await parser.parseStringPromise(xml);
      
      // Tenta encontrar a lista de produtos no XML
      const possibleRoots = ['produtos', 'products', 'items', 'root'];
      for (const root of possibleRoots) {
        if (result[root]) {
          const items = result[root].produto || result[root].product || result[root].item;
          return Array.isArray(items) ? items : [items];
        }
      }
      
      // Se não encontrar, retorna o primeiro elemento
      const firstKey = Object.keys(result)[0];
      const items = result[firstKey];
      return Array.isArray(items) ? items : [items];
      
    } else {
      throw new Error(`Formato de arquivo não suportado: ${ext}. Use CSV, XLSX, XLS, JSON ou XML.`);
    }
  } catch (error) {
    throw new Error(`Erro ao ler arquivo: ${error.message}`);
  }
}

/**
 * Converte um registro para o formato PRECIVOX
 */
function convertRecord(row, columnMap, index) {
  const inferredFields = [];
  const errors = [];
  
  try {
    // Extrai valores mapeados
    const nome = normalizeText(row[columnMap.nome || ''] || '');
    const precoRaw = row[columnMap.preco || ''];
    const quantidadeRaw = row[columnMap.quantidade || ''];
    
    // Validações obrigatórias
    if (!nome) {
      errors.push(`Linha ${index + 2}: Nome do produto ausente`);
      return { product: null, inferredFields, errors };
    }
    
    const preco = normalizeNumber(precoRaw);
    if (!preco || preco <= 0) {
      errors.push(`Linha ${index + 2}: Preço inválido (${precoRaw})`);
      return { product: null, inferredFields, errors };
    }
    
    const quantidade = parseInt(String(quantidadeRaw || 0), 10);
    if (isNaN(quantidade) || quantidade < 0) {
      errors.push(`Linha ${index + 2}: Quantidade inválida (${quantidadeRaw})`);
      return { product: null, inferredFields, errors };
    }
    
    // Categoria (com inferência)
    let categoria = normalizeText(row[columnMap.categoria || '']);
    if (!categoria) {
      categoria = inferCategory(nome);
      inferredFields.push('categoria');
    }
    
    // Marca (com inferência)
    let marca = normalizeText(row[columnMap.marca || '']);
    if (!marca) {
      marca = inferBrand(nome);
      inferredFields.push('marca');
    }
    
    // Unidade de medida (com inferência)
    let unidade_medida = normalizeText(row[columnMap.unidade_medida || '']);
    if (!unidade_medida) {
      unidade_medida = detectUnit(nome);
      inferredFields.push('unidade_medida');
    }
    
    // Campos complementares
    const codigo_barras = normalizeBarcode(row[columnMap.codigo_barras || '']);
    const descricao = normalizeText(row[columnMap.descricao || '']);
    const preco_promocional = normalizeNumber(row[columnMap.preco_promocional || '']);
    
    // Detecta promoção automaticamente
    let em_promocao = false;
    if (columnMap.em_promocao && row[columnMap.em_promocao]) {
      em_promocao = normalizeBoolean(row[columnMap.em_promocao]);
    } else if (preco_promocional && preco_promocional > 0 && preco_promocional < preco) {
      em_promocao = true;
    }
    
    const product = {
      nome,
      preco,
      quantidade,
      categoria,
      marca,
      unidade_medida,
      codigo_barras,
      descricao,
      preco_promocional,
      em_promocao
    };
    
    return { product, inferredFields, errors };
    
  } catch (error) {
    errors.push(`Linha ${index + 2}: Erro ao processar registro - ${error.message}`);
    return { product: null, inferredFields, errors };
  }
}

/**
 * 🎯 Função principal de conversão
 * Converte qualquer arquivo de produtos para o padrão PRECIVOX
 */
export async function convertToPrecivoxStandard(filePath, outputDir) {
  const stats = {
    total: 0,
    valid: 0,
    inferidos: 0,
    ignorados: 0,
    errors: []
  };
  
  const warnings = [];
  
  try {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return {
        status: 'error',
        stats,
        message: 'Arquivo não encontrado',
        warnings: [`Caminho: ${filePath}`]
      };
    }
    
    // Lê o arquivo
    console.log(`📖 Lendo arquivo: ${filePath}`);
    const rawData = await readFile(filePath);
    
    if (!rawData || rawData.length === 0) {
      return {
        status: 'error',
        stats,
        message: 'Arquivo vazio ou sem dados válidos'
      };
    }
    
    stats.total = rawData.length;
    console.log(`📊 Total de registros encontrados: ${stats.total}`);
    
    // Mapeia as colunas
    const headers = Object.keys(rawData[0]);
    const columnMap = mapColumns(headers);
    
    console.log(`🗺️  Mapeamento de colunas:`, columnMap);
    
    // Verifica colunas essenciais
    if (!columnMap.nome) {
      warnings.push('⚠️ Coluna "nome" não identificada automaticamente');
    }
    if (!columnMap.preco) {
      warnings.push('⚠️ Coluna "preco" não identificada automaticamente');
    }
    
    // Converte os registros
    const convertedProducts = [];
    const allInferredFields = new Set();
    
    for (let i = 0; i < rawData.length; i++) {
      const { product, inferredFields, errors } = convertRecord(rawData[i], columnMap, i);
      
      if (product) {
        convertedProducts.push(product);
        stats.valid++;
        inferredFields.forEach(f => allInferredFields.add(f));
      } else {
        stats.ignorados++;
        stats.errors.push(...errors);
      }
    }
    
    stats.inferidos = allInferredFields.size > 0 ? stats.valid : 0;
    
    // Salva o arquivo convertido
    const outputPath = path.join(
      outputDir || path.dirname(filePath),
      `precivox_converted_${Date.now()}.json`
    );
    
    fs.writeFileSync(
      outputPath, 
      JSON.stringify(convertedProducts, null, 2), 
      'utf8'
    );
    
    console.log(`✅ Arquivo convertido salvo em: ${outputPath}`);
    
    // Mensagem de retorno
    let message = `Conversão concluída: ${stats.valid} de ${stats.total} produtos convertidos com sucesso`;
    
    if (stats.ignorados > 0) {
      message += `. ${stats.ignorados} registros ignorados por erros.`;
    }
    
    if (allInferredFields.size > 0) {
      warnings.push(
        `Campos inferidos automaticamente: ${Array.from(allInferredFields).join(', ')}`
      );
    }
    
    const status = stats.valid === stats.total ? 'success' : 
                   stats.valid > 0 ? 'partial' : 'error';
    
    return {
      success: true,
      status,
      convertedFilePath: outputPath,
      convertedData: convertedProducts,
      stats,
      message,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    console.error('❌ Erro na conversão:', error);
    return {
      success: false,
      status: 'error',
      stats,
      message: `Erro ao processar arquivo: ${error.message}`,
      warnings
    };
  }
}

