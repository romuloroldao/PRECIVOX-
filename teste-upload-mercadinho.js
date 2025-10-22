// Teste de Upload do CSV "Mercadinho Vila Bela"
// Este script testa se o CSV é compatível com a estrutura do Precivox

const fs = require('fs');
const path = require('path');

// Função para analisar o CSV
function analisarCSV(caminhoArquivo) {
  try {
    console.log('🔍 Analisando CSV: Mercadinho Vila Bela');
    console.log('=====================================');
    
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    const linhas = conteudo.trim().split('\n');
    const cabecalho = linhas[0].split(',');
    const dados = linhas.slice(1).filter(linha => linha.trim());
    
    console.log(`📊 Total de linhas: ${linhas.length}`);
    console.log(`📋 Cabeçalho: ${cabecalho.join(', ')}`);
    console.log(`📦 Produtos: ${dados.length}`);
    
    // Analisar campos obrigatórios
    const camposObrigatorios = ['nome', 'preco', 'categoria'];
    const camposPresentes = camposObrigatorios.filter(campo => 
      cabecalho.includes(campo)
    );
    
    console.log('\n✅ Campos obrigatórios:');
    camposObrigatorios.forEach(campo => {
      const presente = cabecalho.includes(campo);
      console.log(`   ${presente ? '✅' : '❌'} ${campo}: ${presente ? 'PRESENTE' : 'AUSENTE'}`);
    });
    
    // Analisar campos opcionais importantes
    const camposOpcionais = ['marca', 'codigo_barras', 'quantidade', 'preco_promocional'];
    console.log('\n📋 Campos opcionais importantes:');
    camposOpcionais.forEach(campo => {
      const presente = cabecalho.includes(campo);
      console.log(`   ${presente ? '✅' : '❌'} ${campo}: ${presente ? 'PRESENTE' : 'AUSENTE'}`);
    });
    
    // Analisar categorias
    const categorias = new Set();
    const marcas = new Set();
    let produtosComPromocao = 0;
    let produtosComCodigoBarras = 0;
    
    dados.forEach(linha => {
      const campos = linha.split(',');
      if (campos.length >= 3) {
        const categoria = campos[4]; // categoria
        const marca = campos[6]; // marca
        const precoPromocional = campos[7]; // preco_promocional
        
        if (categoria) categorias.add(categoria);
        if (marca) marcas.add(marca);
        if (precoPromocional && precoPromocional.trim()) produtosComPromocao++;
        if (campos[5] && campos[5].trim()) produtosComCodigoBarras++; // codigo_barras
      }
    });
    
    console.log('\n📊 Estatísticas dos dados:');
    console.log(`   🏷️  Categorias únicas: ${categorias.size}`);
    console.log(`   🏢 Marcas únicas: ${marcas.size}`);
    console.log(`   🏷️  Produtos com promoção: ${produtosComPromocao}`);
    console.log(`   📊 Produtos com código de barras: ${produtosComCodigoBarras}`);
    
    console.log('\n📋 Categorias encontradas:');
    Array.from(categorias).sort().forEach(cat => {
      console.log(`   • ${cat}`);
    });
    
    // Verificar compatibilidade
    const camposObrigatoriosPresentes = camposObrigatorios.every(campo => 
      cabecalho.includes(campo)
    );
    
    const compatibilidade = camposObrigatoriosPresentes ? '✅ COMPATÍVEL' : '❌ INCOMPATÍVEL';
    
    console.log('\n🎯 RESULTADO DA ANÁLISE:');
    console.log(`   Status: ${compatibilidade}`);
    console.log(`   Campos obrigatórios: ${camposObrigatoriosPresentes ? '✅ Todos presentes' : '❌ Faltando campos'}`);
    console.log(`   Qualidade dos dados: ${produtosComCodigoBarras === dados.length ? '✅ Excelente' : '⚠️ Parcial'}`);
    
    return {
      compativel: camposObrigatoriosPresentes,
      totalProdutos: dados.length,
      categorias: Array.from(categorias),
      marcas: Array.from(marcas),
      produtosComPromocao,
      produtosComCodigoBarras,
      camposPresentes: cabecalho
    };
    
  } catch (error) {
    console.error('❌ Erro ao analisar CSV:', error.message);
    return null;
  }
}

// Função para testar upload
async function testarUpload() {
  const marketId = 'cmgr1bovn00027p2hd2kfx8cf';
  const endpoint = `http://localhost:3001/api/products/upload-smart/${marketId}`;
  
  console.log('\n🚀 Testando upload do CSV...');
  console.log(`📍 Endpoint: ${endpoint}`);
  
  try {
    // Simular upload (sem arquivo real para não modificar dados)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${contentType}`);
    console.log(`📄 É JSON: ${isJson ? '✅' : '❌'}`);
    
    if (isJson) {
      const data = await response.json();
      console.log('✅ Resposta JSON válida:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Resposta não é JSON');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de upload:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🧪 TESTE DE COMPATIBILIDADE - CSV MERCADINHO VILA BELA');
  console.log('=====================================================\n');
  
  // Verificar se o arquivo existe
  const caminhoArquivo = 'c:\\Users\\romul\\Downloads\\mercadinho_vila_bela.csv';
  
  if (!fs.existsSync(caminhoArquivo)) {
    console.log('❌ Arquivo CSV não encontrado no caminho especificado');
    console.log('📁 Caminho esperado:', caminhoArquivo);
    console.log('\n💡 Para testar, copie o arquivo para o servidor ou ajuste o caminho');
    return;
  }
  
  // Analisar CSV
  const resultado = analisarCSV(caminhoArquivo);
  
  if (resultado && resultado.compativel) {
    console.log('\n🎉 CONCLUSÃO: CSV APROVADO PARA UPLOAD!');
    console.log('\n📋 Resumo:');
    console.log(`   • Total de produtos: ${resultado.totalProdutos}`);
    console.log(`   • Categorias: ${resultado.categorias.length}`);
    console.log(`   • Produtos com promoção: ${resultado.produtosComPromocao}`);
    console.log(`   • Produtos com código de barras: ${resultado.produtosComCodigoBarras}`);
    
    console.log('\n🔧 Processamento necessário:');
    console.log('   1. Mapear quantidade → estoque');
    console.log('   2. Calcular promoção baseada em preco_promocional');
    console.log('   3. Definir status baseado no estoque');
    
    // Testar endpoint
    await testarUpload();
    
  } else {
    console.log('\n❌ CONCLUSÃO: CSV NÃO COMPATÍVEL');
    console.log('   Verifique se todos os campos obrigatórios estão presentes');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analisarCSV, testarUpload };
