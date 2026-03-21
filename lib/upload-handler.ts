import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

export interface ResultadoUpload {
  totalLinhas: number;
  sucesso: number;
  erros: number;
  duplicados: number;
  detalhesErros: Array<{
    linha: number;
    erro: string;
    dados?: unknown;
  }>;
}

const KNOWN_BRANDS = [
  'Camil', 'União', 'Tio João', 'Primor', 'Sadia', 'Perdigão', 'Seara',
  'Nestlé', 'Coca-Cola', 'Pepsi', 'Omo', 'Ariel', 'Comfort', 'Dove',
  'Colgate', 'Palmolive', 'Johnson', 'Parmalat', 'Danone', 'Yoki',
  'Quaker', 'Maggi', 'Knorr', 'Hellmanns', 'Heinz', 'Pif Paf',
  'Aurora', 'Friboi', 'Swift', 'Marfrig', 'Itambé', 'Piracanjuba',
  'Ypê', 'Bombril', 'Seda', 'Clear', 'Rexona',
];

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/arroz|feijão|feijao|açúcar|acucar|óleo|oleo|leite|macarrão|macarrao|sal|farinha|café|cafe|pão|pao|massa|molho|tempero/.test(lower)) return 'Alimentos';
  if (/refrigerante|suco|água|agua|cerveja|vinho|energético|energetico/.test(lower)) return 'Bebidas';
  if (/detergente|sabão|sabao|limpeza|desinfetante|alvejante|amaciante/.test(lower)) return 'Limpeza';
  if (/shampoo|sabonete|pasta de dente|creme dental|desodorante|papel higiênico|papel higienico|fralda/.test(lower)) return 'Higiene';
  if (/carne|frango|peixe|linguiça|linguica|salsicha|presunto|mortadela|bacon/.test(lower)) return 'Carnes e Frios';
  if (/tomate|alface|cebola|batata|cenoura|fruta|verdura|legume/.test(lower)) return 'Hortifruti';
  if (/queijo|iogurte|manteiga|margarina|requeijão|requeijao|nata/.test(lower)) return 'Laticínios';
  return 'Outros';
}

function inferBrand(text: string): string | undefined {
  for (const brand of KNOWN_BRANDS) {
    if (text.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return undefined;
}

function normalizePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[R$\s]/g, '').replace(/[^\d.,-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function validateRow(row: Record<string, unknown>, lineNumber: number): { produto: ProdutoUpload | null; erro: string | null } {
  try {
    const nome = String(row.nome || row.product || row.produto || row.item || row.name || row['nome do produto'] || row.nome_produto || '').trim().replace(/\s+/g, ' ');

    if (!nome || nome.length < 2) {
      return { produto: null, erro: `Linha ${lineNumber}: Nome ausente ou inválido` };
    }

    const preco = normalizePrice(row.preco || row.preço || row.price || row.valor || row.value || row.custo);
    if (preco === null || preco < 0) {
      return { produto: null, erro: `Linha ${lineNumber}: Preço inválido` };
    }

    const qtdRaw = String(row.quantidade || row.quantity || row.estoque || row.stock || row.qtd || row.qty || '0');
    const quantidade = parseInt(qtdRaw) || 0;

    let categoria = String(row.categoria || row.category || row.grupo || row.tipo || '').trim() || undefined;
    if (!categoria) categoria = inferCategory(nome);
    if (categoria) {
      categoria = categoria.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    const marca = String(row.marca || row.brand || row.fabricante || '').trim() || inferBrand(nome) || undefined;
    const codigoBarras = String(row.codigo_barras || row.codigo || row.ean || row.barcode || row.gtin || '').replace(/\D/g, '') || undefined;
    const descricao = String(row.descricao || row.descrição || row.description || '').trim() || undefined;
    const unidadeMedida = String(row.unidade_medida || row.unidade || row.unit || '').trim().toUpperCase() || 'UN';

    const precoPromoRaw = normalizePrice(row.preco_promocional || row.preço_promocional || row.promo_price || row.valor_promocional);
    const precoPromocional = precoPromoRaw && precoPromoRaw > 0 && precoPromoRaw < preco ? precoPromoRaw : undefined;

    const emPromocao = row.em_promocao === true || row.em_promocao === 'true' || row.em_promocao === '1'
      || row.promocao === true || row.promocao === 'true' || row.promocao === '1'
      || !!precoPromocional;

    return {
      produto: { nome, preco, quantidade, categoria, marca, codigoBarras, descricao, unidadeMedida, precoPromocional, emPromocao },
      erro: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { produto: null, erro: `Linha ${lineNumber}: ${message}` };
  }
}

function parseFileContent(buffer: Buffer, fileName: string): Record<string, unknown>[] {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const content = buffer.toString('utf-8');
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true, dynamicTyping: false });
    return normalizeHeaders(parsed.data as Record<string, unknown>[]);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
    return normalizeHeaders(data);
  }

  if (ext === 'json') {
    const content = buffer.toString('utf-8');
    const jsonData = JSON.parse(content);
    const arr = Array.isArray(jsonData) ? jsonData
      : jsonData.produtos ? jsonData.produtos
      : jsonData.items ? jsonData.items
      : jsonData.products ? jsonData.products
      : [jsonData];
    return normalizeHeaders(arr);
  }

  throw new Error(`Formato não suportado: .${ext}. Use CSV, XLSX ou JSON.`);
}

function normalizeHeaders(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }
    return normalized;
  });
}

export async function processarUpload(
  fileBuffer: Buffer,
  fileName: string,
  fileSize: number,
  mercadoId: string,
  unidadeId: string,
): Promise<ResultadoUpload> {
  const logImportacao = await prisma.logs_importacao.create({
    data: {
      id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      mercadoId,
      nomeArquivo: fileName,
      tamanhoBytes: fileSize,
      status: 'PROCESSANDO',
      dataInicio: new Date(),
    },
  });

  const resultado: ResultadoUpload = {
    totalLinhas: 0,
    sucesso: 0,
    erros: 0,
    duplicados: 0,
    detalhesErros: [],
  };

  try {
    const dados = parseFileContent(fileBuffer, fileName);
    resultado.totalLinhas = dados.length;

    if (dados.length === 0) {
      throw new Error('Arquivo vazio ou sem dados válidos');
    }

    for (let i = 0; i < dados.length; i++) {
      try {
        const { produto: produtoData, erro } = validateRow(dados[i], i + 2);

        if (erro || !produtoData) {
          resultado.erros++;
          resultado.detalhesErros.push({ linha: i + 2, erro: erro || 'Validação falhou', dados: dados[i] });
          continue;
        }

        let produto = null;

        if (produtoData.codigoBarras) {
          produto = await prisma.produtos.findFirst({ where: { codigoBarras: produtoData.codigoBarras } });
        }

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
          produto = await prisma.produtos.create({
            data: {
              id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
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

        const estoqueExistente = await prisma.estoques.findUnique({
          where: { unidadeId_produtoId: { unidadeId, produtoId: produto.id } },
        });

        if (estoqueExistente) {
          await prisma.estoques.update({
            where: { id: estoqueExistente.id },
            data: {
              quantidade: produtoData.quantidade,
              preco: produtoData.preco,
              precoPromocional: produtoData.precoPromocional ?? null,
              emPromocao: produtoData.emPromocao || false,
              disponivel: produtoData.quantidade > 0,
              atualizadoEm: new Date(),
            },
          });
          resultado.duplicados++;
        } else {
          await prisma.estoques.create({
            data: {
              id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              unidadeId,
              produtoId: produto.id,
              quantidade: produtoData.quantidade,
              preco: produtoData.preco,
              precoPromocional: produtoData.precoPromocional ?? null,
              emPromocao: produtoData.emPromocao || false,
              disponivel: produtoData.quantidade > 0,
              atualizadoEm: new Date(),
              dataCriacao: new Date(),
            },
          });
        }

        resultado.sucesso++;
      } catch (rowErr: unknown) {
        resultado.erros++;
        const message = rowErr instanceof Error ? rowErr.message : 'Erro desconhecido';
        resultado.detalhesErros.push({ linha: i + 2, erro: message, dados: dados[i] });
      }
    }

    const statusFinal = resultado.erros === resultado.totalLinhas
      ? 'FALHA'
      : resultado.erros === 0
        ? 'CONCLUIDO'
        : 'PARCIAL';

    await prisma.logs_importacao.update({
      where: { id: logImportacao.id },
      data: {
        totalLinhas: resultado.totalLinhas,
        linhasSucesso: resultado.sucesso,
        linhasErro: resultado.erros,
        linhasDuplicadas: resultado.duplicados,
        status: statusFinal as 'CONCLUIDO' | 'PARCIAL' | 'FALHA',
        detalhesErros: resultado.detalhesErros.length > 0 ? JSON.stringify(resultado.detalhesErros.slice(0, 100)) : null,
        mensagemErro: statusFinal === 'FALHA'
          ? `Falha total: ${resultado.erros} erros em ${resultado.totalLinhas} linhas`
          : statusFinal === 'PARCIAL'
            ? `Parcial: ${resultado.sucesso} ok, ${resultado.erros} erros, ${resultado.duplicados} atualizados`
            : null,
        dataFim: new Date(),
      },
    });

    console.log(`[upload] ${statusFinal}: ${resultado.sucesso} ok, ${resultado.erros} erros, ${resultado.duplicados} atualizados`);
    return resultado;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    await prisma.logs_importacao.update({
      where: { id: logImportacao.id },
      data: {
        status: 'FALHA',
        mensagemErro: message,
        dataFim: new Date(),
      },
    });
    throw error;
  }
}
