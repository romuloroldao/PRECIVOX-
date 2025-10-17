// Handler de Upload e Processamento de CSV/XLSX
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import fs from 'fs';

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
 * Processa arquivo CSV ou XLSX e importa produtos para uma unidade
 */
export async function processarArquivoUpload(
  filePath: string,
  fileName: string,
  mercadoId: string,
  unidadeId: string,
  fileSize: number
): Promise<ResultadoUpload> {
  const logImportacao = await prisma.logImportacao.create({
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
    // Processa XLSX
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
    } else {
      throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX');
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
        const produtoData = mapearCamposProduto(linha);

        // Valida campos obrigatórios
        if (!produtoData.nome || !produtoData.preco) {
          resultado.erros++;
          resultado.detalhesErros.push({
            linha: i + 2, // +2 porque linha 1 é header e índice começa em 0
            erro: 'Campos obrigatórios faltando (nome, preco)',
            dados: linha,
          });
          continue;
        }

        // Busca ou cria produto
        let produto = await prisma.produto.findFirst({
          where: {
            OR: [
              { codigoBarras: produtoData.codigoBarras || '' },
              { 
                AND: [
                  { nome: produtoData.nome },
                  { marca: produtoData.marca || null },
                ]
              },
            ],
          },
        });

        if (!produto) {
          produto = await prisma.produto.create({
            data: {
              nome: produtoData.nome,
              descricao: produtoData.descricao,
              categoria: produtoData.categoria,
              codigoBarras: produtoData.codigoBarras,
              marca: produtoData.marca,
              unidadeMedida: produtoData.unidadeMedida,
            },
          });
        }

        // Verifica se já existe estoque para este produto nesta unidade
        const estoqueExistente = await prisma.estoque.findUnique({
          where: {
            unidadeId_produtoId: {
              unidadeId,
              produtoId: produto.id,
            },
          },
        });

        if (estoqueExistente) {
          // Atualiza estoque existente
          await prisma.estoque.update({
            where: { id: estoqueExistente.id },
            data: {
              quantidade: produtoData.quantidade,
              preco: produtoData.preco,
              precoPromocional: produtoData.precoPromocional,
              emPromocao: produtoData.emPromocao || false,
              disponivel: produtoData.quantidade > 0,
            },
          });
          resultado.duplicados++;
        } else {
          // Cria novo estoque
          await prisma.estoque.create({
            data: {
              unidadeId,
              produtoId: produto.id,
              quantidade: produtoData.quantidade,
              preco: produtoData.preco,
              precoPromocional: produtoData.precoPromocional,
              emPromocao: produtoData.emPromocao || false,
              disponivel: produtoData.quantidade > 0,
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

    // Atualiza log de importação
    await prisma.logImportacao.update({
      where: { id: logImportacao.id },
      data: {
        totalLinhas: resultado.totalLinhas,
        linhasSucesso: resultado.sucesso,
        linhasErro: resultado.erros,
        linhasDuplicadas: resultado.duplicados,
        status: resultado.erros === 0 ? 'CONCLUIDO' : 'PARCIAL',
        detalhesErros: JSON.stringify(resultado.detalhesErros),
        dataFim: new Date(),
      },
    });

    // Remove arquivo temporário
    fs.unlinkSync(filePath);

    return resultado;
  } catch (error: any) {
    // Atualiza log com falha
    await prisma.logImportacao.update({
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
 * Mapeia campos do CSV/XLSX para o formato do produto
 */
function mapearCamposProduto(linha: any): ProdutoUpload {
  // Aceita diferentes formatos de headers
  const nome = linha.nome || linha.product_name || linha['nome do produto'] || '';
  const descricao = linha.descricao || linha.description || linha.desc || '';
  const categoria = linha.categoria || linha.category || '';
  const codigoBarras = linha.codigo_barras || linha.ean || linha.barcode || linha.codigo || '';
  const marca = linha.marca || linha.brand || '';
  const unidadeMedida = linha.unidade_medida || linha.unidade || linha.unit || 'UN';
  const preco = parseFloat(
    String(linha.preco || linha.price || linha.valor || 0)
      .replace(',', '.')
      .replace(/[^0-9.]/g, '')
  );
  const quantidade = parseInt(
    String(linha.quantidade || linha.quantity || linha.estoque || linha.stock || 0)
  );
  const precoPromocional = linha.preco_promocional || linha.promo_price
    ? parseFloat(
        String(linha.preco_promocional || linha.promo_price)
          .replace(',', '.')
          .replace(/[^0-9.]/g, '')
      )
    : undefined;
  const emPromocao = linha.em_promocao === 'true' || 
                     linha.em_promocao === '1' || 
                     linha.promocao === 'true' ||
                     !!precoPromocional;

  return {
    nome,
    descricao,
    categoria,
    codigoBarras,
    marca,
    unidadeMedida,
    preco,
    quantidade,
    precoPromocional,
    emPromocao,
  };
}

/**
 * Obtém histórico de importações de um mercado
 */
export async function obterHistoricoImportacoes(mercadoId: string) {
  return await prisma.logImportacao.findMany({
    where: { mercadoId },
    orderBy: { dataInicio: 'desc' },
    take: 20,
  });
}

