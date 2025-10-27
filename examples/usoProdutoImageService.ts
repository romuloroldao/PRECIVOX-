// Exemplo de uso do sistema de busca e armazenamento de imagens de produtos
import { ProdutoImageService } from '../services/produtoImageService';

// Simulação do banco de dados (substitua pelo seu ORM)
const db = {
  imagens: {
    findUnique: async (params: any) => null,
    create: async (params: any) => ({ id: '1', ...params.data }),
    update: async (params: any) => ({ id: params.where.id, ...params.data }),
    findMany: async (params: any) => [],
    count: async (params: any) => 0,
    groupBy: async (params: any) => [],
    deleteMany: async (params: any) => ({ count: 0 })
  }
};

async function exemploUsoBasico() {
  console.log('🚀 Exemplo de uso básico do sistema de imagens de produtos\n');

  // Inicializa o serviço
  const produtoImageService = new ProdutoImageService(db);

  // Exemplo 1: Busca única
  console.log('📦 Exemplo 1: Busca de imagem única');
  const titulo = "Cerveja Skol 350ml";
  const imagem = await produtoImageService.buscarImagemProduto(titulo);

  console.log(`Produto: ${titulo}`);
  console.log(`Imagem: ${imagem}\n`);

  // Exemplo 2: Renderização de produto
  console.log('🖼️ Exemplo 2: Renderização de produto');
  const produtoRenderizado = produtoImageService.renderizarProduto({
    nome: titulo,
    imagemUrl: imagem,
    mercados: ["Mercado A", "Mercado B", "Mercado C"],
    preco: 2.50,
    disponivel: true
  });

  console.log('Produto renderizado:', JSON.stringify(produtoRenderizado, null, 2));
  console.log('\n');
}

async function exemploBuscaEmLote() {
  console.log('📦 Exemplo de busca em lote\n');

  const produtoImageService = new ProdutoImageService(db);

  const produtos = [
    "Cerveja Skol 350ml",
    "Refrigerante Coca-Cola 2L",
    "Água Mineral 500ml",
    "Café Pilão 500g",
    "Açúcar Cristal 1kg"
  ];

  console.log(`🔍 Buscando imagens para ${produtos.length} produtos...`);
  
  const imagens = await produtoImageService.buscarImagensProdutos(produtos);

  console.log('\n📊 Resultados:');
  imagens.forEach((imagemUrl, titulo) => {
    console.log(`✅ ${titulo}: ${imagemUrl}`);
  });
  console.log('\n');
}

async function exemploReutilizacao() {
  console.log('🔄 Exemplo de reutilização de imagens\n');

  const produtoImageService = new ProdutoImageService(db);

  // Primeira busca - vai buscar na web
  console.log('1️⃣ Primeira busca (busca na web):');
  const imagem1 = await produtoImageService.buscarImagemProduto("Cerveja Skol 350ml");
  console.log(`Imagem: ${imagem1}`);

  // Segunda busca - vai reutilizar do banco
  console.log('\n2️⃣ Segunda busca (reutilização do banco):');
  const imagem2 = await produtoImageService.buscarImagemProduto("Cerveja Skol 350ml");
  console.log(`Imagem: ${imagem2}`);

  console.log(`\n✅ Imagens são iguais: ${imagem1 === imagem2}`);
  console.log('💾 Economia: Segunda busca não precisou acessar APIs externas\n');
}

async function exemploEstatisticas() {
  console.log('📈 Exemplo de estatísticas do sistema\n');

  const produtoImageService = new ProdutoImageService(db);

  const stats = await produtoImageService.obterEstatisticas();
  
  console.log('📊 Estatísticas do sistema:');
  console.log(`Total de imagens: ${stats.totalImagens}`);
  console.log(`Imagens recentes (7 dias): ${stats.imagensRecentes}`);
  console.log(`Economia de processamento: ${stats.economiaProcessamento}`);
  
  if (Object.keys(stats.imagensPorOrigem).length > 0) {
    console.log('\nImagens por origem:');
    Object.entries(stats.imagensPorOrigem).forEach(([origem, count]) => {
      console.log(`  ${origem}: ${count}`);
    });
  }
  console.log('\n');
}

async function exemploMercados() {
  console.log('🏪 Exemplo com múltiplos mercados\n');

  const produtoImageService = new ProdutoImageService(db);

  const mercados = [
    { id: 'mercado-a', nome: 'Mercado A' },
    { id: 'mercado-b', nome: 'Mercado B' },
    { id: 'mercado-c', nome: 'Mercado C' }
  ];

  const produto = "Cerveja Skol 350ml";

  console.log(`🛒 Buscando imagem para "${produto}" em diferentes mercados:`);
  
  for (const mercado of mercados) {
    const imagem = await produtoImageService.buscarImagemProduto(produto, mercado.id);
    
    const produtoRenderizado = produtoImageService.renderizarProduto({
      nome: produto,
      imagemUrl: imagem,
      mercados: [mercado.nome],
      preco: Math.random() * 5 + 2, // Preço aleatório entre 2-7
      disponivel: Math.random() > 0.2 // 80% de chance de estar disponível
    });

    console.log(`\n${mercado.nome}:`);
    console.log(`  Preço: R$ ${produtoRenderizado.mercados[0]}`);
    console.log(`  Imagem: ${imagem.substring(0, 50)}...`);
  }
  console.log('\n✅ Mesma imagem reutilizada para todos os mercados!\n');
}

// Função principal que executa todos os exemplos
async function executarExemplos() {
  try {
    await exemploUsoBasico();
    await exemploBuscaEmLote();
    await exemploReutilizacao();
    await exemploEstatisticas();
    await exemploMercados();

    console.log('🎉 Todos os exemplos executados com sucesso!');
    console.log('\n💡 Benefícios demonstrados:');
    console.log('🔁 Reutilização inteligente: evita múltiplas buscas para o mesmo produto');
    console.log('💾 Economia de processamento: busca feita uma única vez e armazenada');
    console.log('📦 Centralização: imagem vinculada ao nome do produto, não ao mercado');
    console.log('🧠 Escalável: ideal para sistemas com muitos produtos e mercados');

  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Executa os exemplos se este arquivo for executado diretamente
if (require.main === module) {
  executarExemplos();
}

export {
  exemploUsoBasico,
  exemploBuscaEmLote,
  exemploReutilizacao,
  exemploEstatisticas,
  exemploMercados,
  executarExemplos
};
