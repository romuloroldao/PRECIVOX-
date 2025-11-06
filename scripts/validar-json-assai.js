// Script para validar o JSON do Assai Franco antes do upload
// Uso: node scripts/validar-json-assai.js <caminho-do-json>

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Campos obrigatórios para o sistema Precivox
const CAMPOS_OBRIGATORIOS = ['nome', 'preco'];
const CAMPOS_OPCIONAIS = [
  'categoria', 'marca', 'codigoBarras', 'codigo_barras', 
  'descricao', 'unidadeMedida', 'quantidade', 'precoPromocional',
  'emPromocao', 'subcategoria', 'peso', 'origem', 'estoque'
];

// Estrutura esperada pelo Prisma
const ESTRUTURA_ESPERADA = {
  // Formato 1: Array direto de produtos
  formato1: {
    descricao: 'Array direto: [{ nome, preco, ... }]',
    exemplo: '[{ "nome": "Produto", "preco": 10.50 }]'
  },
  // Formato 2: Objeto com propriedade produtos
  formato2: {
    descricao: 'Objeto com produtos: { "produtos": [{ nome, preco, ... }] }',
    exemplo: '{ "produtos": [{ "nome": "Produto", "preco": 10.50 }] }'
  }
};

function validarProduto(produto, index) {
  const erros = [];
  const avisos = [];
  const dados = {};

  // Validar campos obrigatórios
  if (!produto.nome || typeof produto.nome !== 'string' || produto.nome.trim() === '') {
    erros.push(`Produto ${index + 1}: Campo "nome" é obrigatório e deve ser uma string não vazia`);
  } else {
    dados.nome = produto.nome.trim();
  }

  // Validar preço
  const preco = parseFloat(produto.preco || produto.preco_promocional || produto.valor);
  if (isNaN(preco) || preco <= 0) {
    erros.push(`Produto ${index + 1}: Campo "preco" é obrigatório e deve ser um número maior que zero`);
  } else {
    dados.preco = preco;
  }

  // Campos opcionais - mapear variações de nomes
  if (produto.categoria) dados.categoria = String(produto.categoria).trim();
  if (produto.marca) dados.marca = String(produto.marca).trim();
  if (produto.descricao) dados.descricao = String(produto.descricao).trim();
  
  // Código de barras (aceita variações)
  const codigoBarras = produto.codigoBarras || produto.codigo_barras || produto.ean || produto.gtin;
  if (codigoBarras) dados.codigoBarras = String(codigoBarras).trim();

  // Quantidade/Estoque (necessário para criar estoque no Prisma)
  const quantidade = parseInt(produto.quantidade || produto.estoque || produto.qtd || '0', 10);
  if (!isNaN(quantidade) && quantidade >= 0) {
    dados.quantidade = quantidade;
  } else {
    avisos.push(`Produto ${index + 1}: Quantidade não informada ou inválida, será definida como 0`);
    dados.quantidade = 0;
  }

  // Preço promocional
  if (produto.precoPromocional || produto.preco_promocional || produto.precoPromo) {
    const precoPromo = parseFloat(produto.precoPromocional || produto.preco_promocional || produto.precoPromo);
    if (!isNaN(precoPromo) && precoPromo > 0) {
      dados.precoPromocional = precoPromo;
      dados.emPromocao = true;
    }
  }

  // Unidade de medida
  if (produto.unidadeMedida || produto.unidade_medida || produto.unidade) {
    dados.unidadeMedida = String(produto.unidadeMedida || produto.unidade_medida || produto.unidade).trim();
  }

  return { dados, erros, avisos };
}

function validarJSON(jsonData) {
  const resultado = {
    valido: true,
    erros: [],
    avisos: [],
    produtos: [],
    estatisticas: {
      total: 0,
      validos: 0,
      invalidos: 0,
      comCategoria: 0,
      comMarca: 0,
      comCodigoBarras: 0,
      comQuantidade: 0,
      emPromocao: 0
    }
  };

  let produtosArray = [];

  // Verificar estrutura do JSON
  if (Array.isArray(jsonData)) {
    // Formato 1: Array direto
    produtosArray = jsonData;
    resultado.avisos.push('JSON é um array direto de produtos');
  } else if (jsonData.produtos && Array.isArray(jsonData.produtos)) {
    // Formato 2: Objeto com propriedade produtos
    produtosArray = jsonData.produtos;
    resultado.avisos.push('JSON tem estrutura { "produtos": [...] }');
  } else if (jsonData.products && Array.isArray(jsonData.products)) {
    // Formato 3: Objeto com propriedade products (inglês)
    produtosArray = jsonData.products;
    resultado.avisos.push('JSON tem estrutura { "products": [...] }');
  } else {
    resultado.valido = false;
    resultado.erros.push('JSON deve ser um array de produtos ou um objeto com propriedade "produtos" ou "products"');
    return resultado;
  }

  resultado.estatisticas.total = produtosArray.length;

  if (produtosArray.length === 0) {
    resultado.valido = false;
    resultado.erros.push('JSON não contém produtos');
    return resultado;
  }

  // Validar cada produto
  produtosArray.forEach((produto, index) => {
    const validacao = validarProduto(produto, index);
    
    if (validacao.erros.length > 0) {
      resultado.estatisticas.invalidos++;
      resultado.erros.push(...validacao.erros);
    } else {
      resultado.estatisticas.validos++;
      resultado.produtos.push(validacao.dados);
      
      // Estatísticas
      if (validacao.dados.categoria) resultado.estatisticas.comCategoria++;
      if (validacao.dados.marca) resultado.estatisticas.comMarca++;
      if (validacao.dados.codigoBarras) resultado.estatisticas.comCodigoBarras++;
      if (validacao.dados.quantidade > 0) resultado.estatisticas.comQuantidade++;
      if (validacao.dados.emPromocao) resultado.estatisticas.emPromocao++;
    }

    if (validacao.avisos.length > 0) {
      resultado.avisos.push(...validacao.avisos);
    }
  });

  // Verificar se há produtos válidos
  if (resultado.estatisticas.validos === 0) {
    resultado.valido = false;
    resultado.erros.push('Nenhum produto válido encontrado no JSON');
  }

  return resultado;
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Uso: node scripts/validar-json-assai.js <caminho-do-json>');
    console.log('');
    console.log('📋 Requisitos do JSON para o sistema Precivox:');
    console.log('');
    console.log('✅ Campos OBRIGATÓRIOS:');
    console.log('   - nome: string (nome do produto)');
    console.log('   - preco: number (preço do produto)');
    console.log('');
    console.log('📝 Campos OPCIONAIS (mas recomendados):');
    console.log('   - categoria: string');
    console.log('   - marca: string');
    console.log('   - quantidade ou estoque: number (para criar estoque)');
    console.log('   - codigoBarras ou codigo_barras: string');
    console.log('   - descricao: string');
    console.log('   - precoPromocional: number');
    console.log('   - unidadeMedida: string');
    console.log('');
    console.log('📦 Formatos aceitos:');
    console.log('   1. Array direto: [{ nome, preco, ... }]');
    console.log('   2. Objeto com produtos: { "produtos": [{ nome, preco, ... }] }');
    console.log('');
    process.exit(1);
  }

  const jsonPath = args[0];
  const caminhoAbsoluto = path.isAbsolute(jsonPath) 
    ? jsonPath 
    : path.join(process.cwd(), jsonPath);

  console.log('🔍 Validando JSON do Assai Franco...\n');
  console.log(`📁 Arquivo: ${caminhoAbsoluto}\n`);

  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(caminhoAbsoluto)) {
      console.error(`❌ Arquivo não encontrado: ${caminhoAbsoluto}`);
      process.exit(1);
    }

    // Ler e parsear JSON
    const conteudo = fs.readFileSync(caminhoAbsoluto, 'utf8');
    const jsonData = JSON.parse(conteudo);

    // Validar JSON
    const resultado = validarJSON(jsonData);

    // Exibir resultados
    console.log('📊 RESULTADO DA VALIDAÇÃO\n');
    console.log('═'.repeat(60));
    
    if (resultado.valido) {
      console.log('✅ JSON VÁLIDO - Pronto para upload no sistema Precivox!\n');
    } else {
      console.log('❌ JSON INVÁLIDO - Corrija os erros antes do upload\n');
    }

    console.log('📈 Estatísticas:');
    console.log(`   Total de produtos: ${resultado.estatisticas.total}`);
    console.log(`   ✅ Válidos: ${resultado.estatisticas.validos}`);
    console.log(`   ❌ Inválidos: ${resultado.estatisticas.invalidos}`);
    console.log(`   📦 Com categoria: ${resultado.estatisticas.comCategoria}`);
    console.log(`   🏷️  Com marca: ${resultado.estatisticas.comMarca}`);
    console.log(`   📊 Com código de barras: ${resultado.estatisticas.comCodigoBarras}`);
    console.log(`   📦 Com quantidade: ${resultado.estatisticas.comQuantidade}`);
    console.log(`   🔥 Em promoção: ${resultado.estatisticas.emPromocao}`);

    if (resultado.avisos.length > 0) {
      console.log('\n⚠️  Avisos:');
      resultado.avisos.slice(0, 10).forEach(aviso => {
        console.log(`   - ${aviso}`);
      });
      if (resultado.avisos.length > 10) {
        console.log(`   ... e mais ${resultado.avisos.length - 10} avisos`);
      }
    }

    if (resultado.erros.length > 0) {
      console.log('\n❌ Erros encontrados:');
      resultado.erros.slice(0, 20).forEach(erro => {
        console.log(`   - ${erro}`);
      });
      if (resultado.erros.length > 20) {
        console.log(`   ... e mais ${resultado.erros.length - 20} erros`);
      }
    }

    console.log('\n' + '═'.repeat(60));

    // Recomendações
    if (resultado.valido) {
      console.log('\n💡 Próximos passos:');
      console.log('   1. Acesse o sistema Precivox como ADMIN');
      console.log('   2. Vá até a página do mercado "Assai Franco"');
      console.log('   3. Use a opção de Upload de Base de Dados');
      console.log('   4. Selecione uma unidade');
      console.log('   5. Faça upload deste arquivo JSON');
      console.log('\n📝 Nota: O sistema aceita JSON, CSV ou XLSX');
      console.log('   Se preferir, pode converter o JSON para CSV/XLSX antes do upload.\n');
    } else {
      console.log('\n💡 Para corrigir:');
      console.log('   1. Verifique os erros listados acima');
      console.log('   2. Corrija os campos obrigatórios (nome e preco)');
      console.log('   3. Execute a validação novamente\n');
    }

    // Salvar resultado detalhado
    const resultadoPath = path.join(
      path.dirname(caminhoAbsoluto),
      `validacao-${path.basename(caminhoAbsoluto, '.json')}-${Date.now()}.json`
    );
    
    fs.writeFileSync(
      resultadoPath,
      JSON.stringify({
        caminhoOriginal: caminhoAbsoluto,
        dataValidacao: new Date().toISOString(),
        valido: resultado.valido,
        estatisticas: resultado.estatisticas,
        erros: resultado.erros,
        avisos: resultado.avisos,
        produtosExemplo: resultado.produtos.slice(0, 5) // Primeiros 5 produtos como exemplo
      }, null, 2),
      'utf8'
    );

    console.log(`📄 Relatório detalhado salvo em: ${resultadoPath}\n`);

    process.exit(resultado.valido ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Erro ao processar JSON:');
    console.error(error.message);
    
    if (error instanceof SyntaxError) {
      console.error('\n💡 O arquivo pode não ser um JSON válido.');
      console.error('   Verifique se o arquivo está bem formatado.\n');
    }
    
    process.exit(1);
  }
}

// Executar
main().catch(console.error);

