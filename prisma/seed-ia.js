// Seed de dados para testar o Painel de IA
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados de IA...');

  // Buscar primeiro mercado existente
  const mercado = await prisma.mercado.findFirst({
    include: {
      unidades: true
    }
  });

  if (!mercado) {
    console.log('❌ Nenhum mercado encontrado. Crie um mercado primeiro.');
    return;
  }

  console.log(`✅ Usando mercado: ${mercado.nome} (${mercado.id})`);

  const unidade = mercado.unidades[0];
  if (!unidade) {
    console.log('❌ Nenhuma unidade encontrada.');
    return;
  }

  console.log(`✅ Usando unidade: ${unidade.nome} (${unidade.id})`);

  // 1. Criar produtos de exemplo com campos de IA
  console.log('\n📦 Criando produtos com dados de IA...');
  
  const produtos = [
    {
      nome: 'Leite Integral 1L',
      categoria: 'Laticínios',
      codigoBarras: '7891234567890',
      marca: 'Elegê',
      unidadeMedida: 'UN',
      giroEstoqueMedio: 8.2,
      elasticidadePreco: -1.5,
      demandaPrevista7d: 105,
      demandaPrevista30d: 450,
      pontoReposicao: 45,
      margemContribuicao: 0.55,
      scoreSazonalidade: 0.3,
      categoriaABC: 'A'
    },
    {
      nome: 'Água de Coco 1L',
      categoria: 'Bebidas',
      codigoBarras: '7891234567891',
      marca: 'Coco Natural',
      unidadeMedida: 'UN',
      giroEstoqueMedio: 6.5,
      elasticidadePreco: -1.8,
      demandaPrevista7d: 84,
      demandaPrevista30d: 360,
      pontoReposicao: 50,
      margemContribuicao: 0.80,
      scoreSazonalidade: 0.7,
      categoriaABC: 'A'
    },
    {
      nome: 'Cerveja Lata 350ml',
      categoria: 'Bebidas',
      codigoBarras: '7891234567892',
      marca: 'Skol',
      unidadeMedida: 'UN',
      giroEstoqueMedio: 2.1,
      elasticidadePreco: -2.2,
      demandaPrevista7d: 42,
      demandaPrevista30d: 180,
      pontoReposicao: 100,
      margemContribuicao: 0.45,
      scoreSazonalidade: 0.6,
      categoriaABC: 'B'
    },
    {
      nome: 'Detergente Ypê 500ml',
      categoria: 'Limpeza',
      codigoBarras: '7891234567893',
      marca: 'Ypê',
      unidadeMedida: 'UN',
      giroEstoqueMedio: 3.2,
      elasticidadePreco: -1.3,
      demandaPrevista7d: 56,
      demandaPrevista30d: 240,
      pontoReposicao: 35,
      margemContribuicao: 0.38,
      scoreSazonalidade: 0.2,
      categoriaABC: 'B'
    },
    {
      nome: 'Papel Higiênico 4 rolos',
      categoria: 'Higiene',
      codigoBarras: '7891234567894',
      marca: 'Personal',
      unidadeMedida: 'UN',
      giroEstoqueMedio: 5.1,
      elasticidadePreco: -1.1,
      demandaPrevista7d: 84,
      demandaPrevista30d: 360,
      pontoReposicao: 60,
      margemContribuicao: 0.42,
      scoreSazonalidade: 0.1,
      categoriaABC: 'A'
    }
  ];

  for (const produtoData of produtos) {
    const produto = await prisma.produto.upsert({
      where: { codigoBarras: produtoData.codigoBarras },
      update: produtoData,
      create: produtoData
    });

    // Criar estoque para este produto
    await prisma.estoque.upsert({
      where: {
        unidadeId_produtoId: {
          unidadeId: unidade.id,
          produtoId: produto.id
        }
      },
      update: {
        quantidade: produto.nome === 'Leite Integral 1L' ? 12 : // Ruptura crítica
                    produto.nome === 'Papel Higiênico 4 rolos' ? 28 : // Ruptura alta
                    produto.nome === 'Cerveja Lata 350ml' ? 540 : // Estoque alto
                    150,
        preco: produto.nome === 'Leite Integral 1L' ? 6.75 :
               produto.nome === 'Água de Coco 1L' ? 5.90 :
               produto.nome === 'Cerveja Lata 350ml' ? 2.50 :
               produto.nome === 'Detergente Ypê 500ml' ? 4.20 :
               8.90
      },
      create: {
        unidadeId: unidade.id,
        produtoId: produto.id,
        quantidade: produto.nome === 'Leite Integral 1L' ? 12 :
                    produto.nome === 'Papel Higiênico 4 rolos' ? 28 :
                    produto.nome === 'Cerveja Lata 350ml' ? 540 :
                    150,
        preco: produto.nome === 'Leite Integral 1L' ? 6.75 :
               produto.nome === 'Água de Coco 1L' ? 5.90 :
               produto.nome === 'Cerveja Lata 350ml' ? 2.50 :
               produto.nome === 'Detergente Ypê 500ml' ? 4.20 :
               8.90
      }
    });

    console.log(`  ✅ ${produto.nome}`);
  }

  // 2. Criar alertas de exemplo
  console.log('\n🚨 Criando alertas de IA...');

  const leite = await prisma.produto.findFirst({
    where: { codigoBarras: '7891234567890' }
  });

  const papel = await prisma.produto.findFirst({
    where: { codigoBarras: '7891234567894' }
  });

  const cerveja = await prisma.produto.findFirst({
    where: { codigoBarras: '7891234567892' }
  });

  if (leite) {
    await prisma.alertaIA.create({
      data: {
        mercadoId: mercado.id,
        unidadeId: unidade.id,
        produtoId: leite.id,
        tipo: 'RUPTURA',
        titulo: '🚨 RUPTURA CRÍTICA: Leite Integral 1L',
        descricao: 'Estoque atual de 12 unidades. Previsão de ruptura em menos de 24 horas!',
        prioridade: 'CRITICA',
        acaoRecomendada: 'Repor 180 unidades IMEDIATAMENTE',
        linkAcao: `/gestor/ia/compras?produto=${leite.id}`,
        metadata: {
          estoqueAtual: 12,
          diasRestantes: 0.8,
          quantidadeSugerida: 180
        }
      }
    });
    console.log('  ✅ Alerta de ruptura crítica criado');
  }

  if (papel) {
    await prisma.alertaIA.create({
      data: {
        mercadoId: mercado.id,
        unidadeId: unidade.id,
        produtoId: papel.id,
        tipo: 'RUPTURA',
        titulo: '⚠️ Ruptura iminente: Papel Higiênico',
        descricao: 'Estoque atual de 28 unidades. Previsão de ruptura em 2.3 dias.',
        prioridade: 'ALTA',
        acaoRecomendada: 'Repor 120 unidades nas próximas 48h',
        linkAcao: `/gestor/ia/compras?produto=${papel.id}`,
        metadata: {
          estoqueAtual: 28,
          diasRestantes: 2.3,
          quantidadeSugerida: 120
        }
      }
    });
    console.log('  ✅ Alerta de ruptura iminente criado');
  }

  if (cerveja) {
    await prisma.alertaIA.create({
      data: {
        mercadoId: mercado.id,
        unidadeId: unidade.id,
        produtoId: cerveja.id,
        tipo: 'OPORTUNIDADE',
        titulo: '💰 Oportunidade: Promoção pode aumentar lucro em 18%',
        descricao: 'Estoque alto (540 unidades) com giro lento (2.1x/mês). Desconto de 8% pode aumentar vendas em 22%.',
        prioridade: 'MEDIA',
        acaoRecomendada: 'Aplicar promoção de 8% por 15 dias',
        linkAcao: `/gestor/ia/promocoes?produto=${cerveja.id}`,
        metadata: {
          estoqueAtual: 540,
          giroAtual: 2.1,
          descontoSugerido: 8,
          aumentoEstimado: 22
        }
      }
    });
    console.log('  ✅ Alerta de oportunidade criado');
  }

  // 3. Criar métricas do dashboard
  console.log('\n📊 Criando métricas do dashboard...');

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  await prisma.metricasDashboard.upsert({
    where: {
      mercadoId_data_periodo: {
        mercadoId: mercado.id,
        data: hoje,
        periodo: 'DIA'
      }
    },
    update: {
      giroEstoqueGeral: 4.2,
      taxaRuptura: 2.3,
      ticketMedio: 87.30,
      margemLiquida: 18.5,
      margemBruta: 25.0,
      produtosAtivos: 5,
      quantidadeVendas: 45,
      faturamentoDia: 3928.50,
      taxaConversao: 68.0,
      taxaRecompra: 42.0,
      clientesAtivos: 125
    },
    create: {
      mercadoId: mercado.id,
      data: hoje,
      periodo: 'DIA',
      giroEstoqueGeral: 4.2,
      taxaRuptura: 2.3,
      ticketMedio: 87.30,
      margemLiquida: 18.5,
      margemBruta: 25.0,
      produtosAtivos: 5,
      quantidadeVendas: 45,
      faturamentoDia: 3928.50,
      taxaConversao: 68.0,
      taxaRecompra: 42.0,
      clientesAtivos: 125
    }
  });

  console.log('  ✅ Métricas do dashboard criadas');

  console.log('\n✅ Seed de IA concluído com sucesso!');
  console.log(`\n🎯 Acesse: http://localhost:3000/gestor/ia para ver o painel`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

