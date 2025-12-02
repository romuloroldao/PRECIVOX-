// Seed do banco de dados - Dados iniciais para desenvolvimento
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpa dados existentes (cuidado em produção!)
  await prisma.movimentacoes_estoque.deleteMany();
  await prisma.vendas.deleteMany();
  await prisma.logs_importacao.deleteMany();
  await prisma.estoques.deleteMany();
  await prisma.produtos.deleteMany();
  await prisma.unidades.deleteMany();
  await prisma.mercados.deleteMany();
  await prisma.planos_de_pagamento.deleteMany();
  await prisma.User.deleteMany();

  // Cria usuários
  const senhaHash = await bcrypt.hash('senha123', 10);

  const admin = await prisma.User.create({
    data: {
      id: `user-${Date.now()}-1`,
      email: 'admin@precivox.com',
      nome: 'Administrador',
      senhaHash: senhaHash,
      role: 'ADMIN',
      dataAtualizacao: new Date(),
    },
  });

  const gestor1 = await prisma.User.create({
    data: {
      id: `user-${Date.now()}-2`,
      email: 'gestor1@mercado.com',
      nome: 'João Silva',
      senhaHash: senhaHash,
      role: 'GESTOR',
      dataAtualizacao: new Date(),
    },
  });

  const gestor2 = await prisma.User.create({
    data: {
      id: `user-${Date.now()}-3`,
      email: 'gestor2@mercado.com',
      nome: 'Maria Santos',
      senhaHash: senhaHash,
      role: 'GESTOR',
      dataAtualizacao: new Date(),
    },
  });

  const cliente = await prisma.User.create({
    data: {
      id: `user-${Date.now()}-4`,
      email: 'cliente@email.com',
      nome: 'Cliente Teste',
      senhaHash: senhaHash,
      role: 'CLIENTE',
      dataAtualizacao: new Date(),
    },
  });

  console.log('✅ Usuários criados');

  // Cria planos de pagamento
  const planoBasico = await prisma.planos_de_pagamento.create({
    data: {
      id: `plano-${Date.now()}-1`,
      nome: 'Básico',
      descricao: 'Plano básico para pequenos mercados',
      valor: 99.90,
      duracao: 30,
      limiteUnidades: 1,
      limiteUploadMb: 10,
      limiteUsuarios: 5,
    },
  });

  const planoIntermediario = await prisma.planos_de_pagamento.create({
    data: {
      id: `plano-${Date.now()}-2`,
      nome: 'Intermediário',
      descricao: 'Plano para mercados em crescimento',
      valor: 199.90,
      duracao: 30,
      limiteUnidades: 5,
      limiteUploadMb: 50,
      limiteUsuarios: 15,
    },
  });

  const planoAvancado = await prisma.planos_de_pagamento.create({
    data: {
      id: `plano-${Date.now()}-3`,
      nome: 'Avançado',
      descricao: 'Plano para grandes redes de mercados',
      valor: 399.90,
      duracao: 30,
      limiteUnidades: 20,
      limiteUploadMb: 100,
      limiteUsuarios: 50,
    },
  });

  console.log('✅ Planos de pagamento criados');

  // Cria mercados
  const mercado1 = await prisma.mercados.create({
    data: {
      id: `mercado-${Date.now()}-1`,
      nome: 'Supermercado Preço Bom',
      cnpj: '12345678000101',
      descricao: 'O melhor supermercado da região com os melhores preços',
      telefone: '1133334444',
      emailContato: 'contato@precobom.com',
      horarioFuncionamento: 'Seg-Sex: 8h-22h, Sáb: 8h-20h, Dom: 8h-18h',
      planoId: planoIntermediario.id,
      gestorId: gestor1.id,
      dataAtualizacao: new Date(),
    },
  });

  const mercado2 = await prisma.mercados.create({
    data: {
      id: `mercado-${Date.now()}-2`,
      nome: 'Mercadinho da Esquina',
      cnpj: '12345678000102',
      descricao: 'Pequeno mercado de bairro com atendimento familiar',
      telefone: '1133335555',
      emailContato: 'contato@daesquina.com',
      horarioFuncionamento: 'Todos os dias: 7h-21h',
      planoId: planoBasico.id,
      gestorId: gestor2.id,
      dataAtualizacao: new Date(),
    },
  });

  console.log('✅ Mercados criados');

  // Cria unidades
  const unidade1_1 = await prisma.unidades.create({
    data: {
      id: `unidade-${Date.now()}-1`,
      nome: 'Filial Centro',
      endereco: 'Rua Principal, 100',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000000',
      telefone: '1133334444',
      horarioFuncionamento: 'Seg-Sex: 8h-22h',
      latitude: -23.550520,
      longitude: -46.633308,
      mercadoId: mercado1.id,
      dataAtualizacao: new Date(),
    },
  });

  const unidade1_2 = await prisma.unidades.create({
    data: {
      id: `unidade-${Date.now()}-2`,
      nome: 'Filial Zona Sul',
      endereco: 'Av. Paulista, 1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310100',
      telefone: '1133334445',
      horarioFuncionamento: 'Seg-Sex: 8h-22h',
      latitude: -23.561414,
      longitude: -46.656180,
      mercadoId: mercado1.id,
      dataAtualizacao: new Date(),
    },
  });

  const unidade2_1 = await prisma.unidades.create({
    data: {
      id: `unidade-${Date.now()}-3`,
      nome: 'Loja Principal',
      endereco: 'Rua das Flores, 50',
      bairro: 'Vila Madalena',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '05434000',
      telefone: '1133335555',
      horarioFuncionamento: 'Todos os dias: 7h-21h',
      latitude: -23.546275,
      longitude: -46.688946,
      mercadoId: mercado2.id,
      dataAtualizacao: new Date(),
    },
  });

  console.log('✅ Unidades criadas');

  // Cria produtos
  const produtos = [
    {
      nome: 'Arroz Branco 5kg',
      descricao: 'Arroz tipo 1, grãos longos',
      categoria: 'Alimentos',
      codigoBarras: '7891234567890',
      marca: 'Tio João',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Feijão Preto 1kg',
      descricao: 'Feijão preto selecionado',
      categoria: 'Alimentos',
      codigoBarras: '7891234567891',
      marca: 'Camil',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Açúcar Refinado 1kg',
      descricao: 'Açúcar refinado cristal',
      categoria: 'Alimentos',
      codigoBarras: '7891234567892',
      marca: 'União',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Óleo de Soja 900ml',
      descricao: 'Óleo de soja refinado',
      categoria: 'Alimentos',
      codigoBarras: '7891234567893',
      marca: 'Liza',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Leite Integral 1L',
      descricao: 'Leite integral UHT',
      categoria: 'Laticínios',
      codigoBarras: '7891234567894',
      marca: 'Parmalat',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Café em Pó 500g',
      descricao: 'Café torrado e moído',
      categoria: 'Bebidas',
      codigoBarras: '7891234567895',
      marca: 'Pilão',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Macarrão Espaguete 500g',
      descricao: 'Massa de sêmola com ovos',
      categoria: 'Alimentos',
      codigoBarras: '7891234567896',
      marca: 'Barilla',
      unidadeMedida: 'UN',
    },
    {
      nome: 'Molho de Tomate 340g',
      descricao: 'Molho de tomate tradicional',
      categoria: 'Alimentos',
      codigoBarras: '7891234567897',
      marca: 'Quero',
      unidadeMedida: 'UN',
    },
  ];

  const produtosCriados = await Promise.all(
    produtos.map((produto, index) => prisma.produtos.create({ 
      data: {
        ...produto,
        id: `produto-${Date.now()}-${index + 1}`,
        dataAtualizacao: new Date(),
      }
    }))
  );

  console.log('✅ Produtos criados');

  // Cria estoques para as unidades
  const estoquesUnidade1_1 = [
    { produtoId: produtosCriados[0].id, quantidade: 150, preco: 28.90 },
    { produtoId: produtosCriados[1].id, quantidade: 200, preco: 9.50 },
    { produtoId: produtosCriados[2].id, quantidade: 180, preco: 4.80 },
    { produtoId: produtosCriados[3].id, quantidade: 120, preco: 7.90 },
    { produtoId: produtosCriados[4].id, quantidade: 250, preco: 5.20 },
    { produtoId: produtosCriados[5].id, quantidade: 80, preco: 18.90 },
  ];

  let estoqueCounter = 1;
  for (const estoque of estoquesUnidade1_1) {
    await prisma.estoques.create({
      data: {
        ...estoque,
        id: `estoque-${Date.now()}-${estoqueCounter++}`,
        unidadeId: unidade1_1.id,
        disponivel: true,
        atualizadoEm: new Date(),
      },
    });
  }

  const estoquesUnidade1_2 = [
    { produtoId: produtosCriados[0].id, quantidade: 120, preco: 29.90 },
    { produtoId: produtosCriados[1].id, quantidade: 150, preco: 9.80 },
    { produtoId: produtosCriados[6].id, quantidade: 200, preco: 5.90 },
    { produtoId: produtosCriados[7].id, quantidade: 180, preco: 3.50 },
  ];

  for (const estoque of estoquesUnidade1_2) {
    await prisma.estoques.create({
      data: {
        ...estoque,
        id: `estoque-${Date.now()}-${estoqueCounter++}`,
        unidadeId: unidade1_2.id,
        disponivel: true,
        atualizadoEm: new Date(),
      },
    });
  }

  const estoquesUnidade2_1 = [
    { produtoId: produtosCriados[0].id, quantidade: 50, preco: 32.90, precoPromocional: 27.90, emPromocao: true },
    { produtoId: produtosCriados[1].id, quantidade: 80, preco: 10.50 },
    { produtoId: produtosCriados[2].id, quantidade: 100, preco: 5.20 },
    { produtoId: produtosCriados[4].id, quantidade: 150, preco: 5.50, precoPromocional: 4.99, emPromocao: true },
  ];

  for (const estoque of estoquesUnidade2_1) {
    await prisma.estoques.create({
      data: {
        ...estoque,
        id: `estoque-${Date.now()}-${estoqueCounter++}`,
        unidadeId: unidade2_1.id,
        disponivel: true,
        atualizadoEm: new Date(),
      },
    });
  }

  console.log('✅ Estoques criados');

  // Buscar estoques criados para gerar movimentações
  const estoquesUnidade1_1_db = await prisma.estoques.findMany({
    where: { unidadeId: unidade1_1.id },
  });
  const estoquesUnidade1_2_db = await prisma.estoques.findMany({
    where: { unidadeId: unidade1_2.id },
  });
  const estoquesUnidade2_1_db = await prisma.estoques.findMany({
    where: { unidadeId: unidade2_1.id },
  });

  // Gerar vendas dos últimos 90 dias
  console.log('📊 Gerando vendas dos últimos 90 dias...');
  const formasPagamento = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'];
  const hoje = new Date();
  const vendasCriadas: any[] = [];

  // Função para gerar data aleatória nos últimos N dias
  const randomDate = (daysAgo: number): Date => {
    const date = new Date(hoje);
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8h e 20h
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
  };

  // Gerar vendas para unidade1_1
  for (const estoque of estoquesUnidade1_1_db) {
    // Média de 2-5 vendas por semana por produto
    const totalVendas = Math.floor(Math.random() * 30) + 20; // 20-50 vendas em 90 dias
    
    for (let i = 0; i < totalVendas; i++) {
      const quantidade = Math.floor(Math.random() * 5) + 1; // 1-5 unidades
      const precoUnitario = Number(estoque.preco);
      const desconto = Math.random() < 0.2 ? Number((precoUnitario * 0.1).toFixed(2)) : 0; // 20% chance de desconto
      const precoTotal = (precoUnitario * quantidade) - desconto;

      const venda = await prisma.vendas.create({
        data: {
          produtoId: estoque.produtoId,
          unidadeId: estoque.unidadeId,
          quantidade,
          precoUnitario,
          precoTotal,
          desconto,
          formaPagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
          dataVenda: randomDate(90),
        },
      });
      vendasCriadas.push(venda);
    }
  }

  // Gerar vendas para unidade1_2
  for (const estoque of estoquesUnidade1_2_db) {
    const totalVendas = Math.floor(Math.random() * 25) + 15; // 15-40 vendas
    
    for (let i = 0; i < totalVendas; i++) {
      const quantidade = Math.floor(Math.random() * 4) + 1;
      const precoUnitario = Number(estoque.preco);
      const desconto = Math.random() < 0.15 ? Number((precoUnitario * 0.1).toFixed(2)) : 0;
      const precoTotal = (precoUnitario * quantidade) - desconto;

      await prisma.vendas.create({
        data: {
          produtoId: estoque.produtoId,
          unidadeId: estoque.unidadeId,
          quantidade,
          precoUnitario,
          precoTotal,
          desconto,
          formaPagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
          dataVenda: randomDate(90),
        },
      });
    }
  }

  // Gerar vendas para unidade2_1
  for (const estoque of estoquesUnidade2_1_db) {
    const totalVendas = Math.floor(Math.random() * 20) + 10; // 10-30 vendas
    
    for (let i = 0; i < totalVendas; i++) {
      const quantidade = Math.floor(Math.random() * 3) + 1;
      const precoUnitario = estoque.emPromocao && estoque.precoPromocional 
        ? Number(estoque.precoPromocional) 
        : Number(estoque.preco);
      const desconto = estoque.emPromocao ? 0 : (Math.random() < 0.1 ? Number((precoUnitario * 0.05).toFixed(2)) : 0);
      const precoTotal = (precoUnitario * quantidade) - desconto;

      await prisma.vendas.create({
        data: {
          produtoId: estoque.produtoId,
          unidadeId: estoque.unidadeId,
          quantidade,
          precoUnitario,
          precoTotal,
          desconto,
          formaPagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
          dataVenda: randomDate(90),
        },
      });
    }
  }

  console.log('✅ Vendas geradas');

  // Gerar movimentações de estoque dos últimos 90 dias
  console.log('📦 Gerando movimentações de estoque...');
  const tiposMovimentacao = ['ENTRADA', 'SAIDA', 'AJUSTE', 'VENDA', 'DEVOLUCAO'];
  const motivosEntrada = ['COMPRA', 'TRANSFERENCIA', 'DEVOLUCAO_FORNECEDOR'];
  const motivosSaida = ['VENDA', 'PERDA', 'VENCIMENTO', 'AJUSTE_INVENTARIO'];

  // Função para criar movimentação
  const criarMovimentacao = async (
    estoque: any,
    tipo: string,
    quantidade: number,
    quantidadeAnterior: number,
    quantidadeNova: number,
    motivo: string,
    dataMovimentacao: Date
  ) => {
    await prisma.movimentacoes_estoque.create({
      data: {
        estoqueId: estoque.id,
        produtoId: estoque.produtoId,
        unidadeId: estoque.unidadeId,
        tipo,
        quantidade,
        quantidadeAnterior,
        quantidadeNova,
        motivo,
        dataMovimentacao,
      },
    });
  };

  // Gerar movimentações para cada estoque
  const todosEstoques = [...estoquesUnidade1_1_db, ...estoquesUnidade1_2_db, ...estoquesUnidade2_1_db];

  for (const estoque of todosEstoques) {
    let quantidadeAtual = estoque.quantidade;
    const quantidadeInicial = quantidadeAtual;

    // Simular entradas periódicas (compras/reposições)
    const numEntradas = Math.floor(Math.random() * 8) + 5; // 5-12 entradas em 90 dias
    
    for (let i = 0; i < numEntradas; i++) {
      const quantidadeEntrada = Math.floor(Math.random() * 50) + 20; // 20-70 unidades
      const quantidadeAnterior = quantidadeAtual;
      quantidadeAtual += quantidadeEntrada;
      
      await criarMovimentacao(
        estoque,
        'ENTRADA',
        quantidadeEntrada,
        quantidadeAnterior,
        quantidadeAtual,
        motivosEntrada[Math.floor(Math.random() * motivosEntrada.length)],
        randomDate(90)
      );
    }

    // Simular saídas por vendas (já temos vendas criadas, vamos criar movimentações correspondentes)
    // Buscar vendas deste produto/unidade e criar movimentações
    const vendasProduto = await prisma.vendas.findMany({
      where: {
        produtoId: estoque.produtoId,
        unidadeId: estoque.unidadeId,
      },
      orderBy: {
        dataVenda: 'asc',
      },
    });

    for (const venda of vendasProduto) {
      const quantidadeAnterior = quantidadeAtual;
      quantidadeAtual = Math.max(0, quantidadeAtual - venda.quantidade); // Não permitir negativo
      
      await criarMovimentacao(
        estoque,
        'VENDA',
        venda.quantidade,
        quantidadeAnterior,
        quantidadeAtual,
        'VENDA',
        venda.dataVenda
      );
    }

    // Simular alguns ajustes de inventário
    if (Math.random() < 0.3) { // 30% de chance de ter ajuste
      const diferenca = Math.floor(Math.random() * 10) - 5; // -5 a +5 unidades
      const quantidadeAnterior = quantidadeAtual;
      quantidadeAtual += diferenca;
      
      await criarMovimentacao(
        estoque,
        'AJUSTE',
        Math.abs(diferenca),
        quantidadeAnterior,
        quantidadeAtual,
        'AJUSTE_INVENTARIO',
        randomDate(30) // Ajustes mais recentes
      );
    }

    // Atualizar quantidade final do estoque
    await prisma.estoques.update({
      where: { id: estoque.id },
      data: {
        quantidade: quantidadeAtual,
        atualizadoEm: new Date(),
      },
    });
  }

  console.log('✅ Movimentações de estoque geradas');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - ${await prisma.User.count()} usuários`);
  console.log(`   - ${await prisma.planos_de_pagamento.count()} planos`);
  console.log(`   - ${await prisma.mercados.count()} mercados`);
  console.log(`   - ${await prisma.unidades.count()} unidades`);
  console.log(`   - ${await prisma.produtos.count()} produtos`);
  console.log(`   - ${await prisma.estoques.count()} registros de estoque`);
  console.log(`   - ${await prisma.vendas.count()} vendas`);
  console.log(`   - ${await prisma.movimentacoes_estoque.count()} movimentações de estoque`);
  
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Admin:   admin@precivox.com / senha123');
  console.log('   Gestor1: gestor1@mercado.com / senha123');
  console.log('   Gestor2: gestor2@mercado.com / senha123');
  console.log('   Cliente: cliente@email.com / senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
