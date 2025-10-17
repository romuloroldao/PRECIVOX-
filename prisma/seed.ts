// Seed do banco de dados - Dados iniciais para desenvolvimento
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpa dados existentes (cuidado em produção!)
  await prisma.logImportacao.deleteMany();
  await prisma.estoque.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.unidade.deleteMany();
  await prisma.mercado.deleteMany();
  await prisma.planoPagamento.deleteMany();
  await prisma.user.deleteMany();

  // Cria usuários
  const senhaHash = await bcrypt.hash('senha123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@precivox.com',
      nome: 'Administrador',
      senha: senhaHash,
      role: 'ADMIN',
      cpf: '12345678901',
      telefone: '11999999999',
    },
  });

  const gestor1 = await prisma.user.create({
    data: {
      email: 'gestor1@mercado.com',
      nome: 'João Silva',
      senha: senhaHash,
      role: 'GESTOR',
      cpf: '12345678902',
      telefone: '11999999998',
    },
  });

  const gestor2 = await prisma.user.create({
    data: {
      email: 'gestor2@mercado.com',
      nome: 'Maria Santos',
      senha: senhaHash,
      role: 'GESTOR',
      cpf: '12345678903',
      telefone: '11999999997',
    },
  });

  const cliente = await prisma.user.create({
    data: {
      email: 'cliente@email.com',
      nome: 'Cliente Teste',
      senha: senhaHash,
      role: 'CLIENTE',
      cpf: '12345678904',
    },
  });

  console.log('✅ Usuários criados');

  // Cria planos de pagamento
  const planoBasico = await prisma.planoPagamento.create({
    data: {
      nome: 'Básico',
      descricao: 'Plano básico para pequenos mercados',
      valor: 99.90,
      duracao: 30,
      limiteUnidades: 1,
      limiteUploadMb: 10,
      limiteUsuarios: 5,
    },
  });

  const planoIntermediario = await prisma.planoPagamento.create({
    data: {
      nome: 'Intermediário',
      descricao: 'Plano para mercados em crescimento',
      valor: 199.90,
      duracao: 30,
      limiteUnidades: 5,
      limiteUploadMb: 50,
      limiteUsuarios: 15,
    },
  });

  const planoAvancado = await prisma.planoPagamento.create({
    data: {
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
  const mercado1 = await prisma.mercado.create({
    data: {
      nome: 'Supermercado Preço Bom',
      cnpj: '12345678000101',
      descricao: 'O melhor supermercado da região com os melhores preços',
      telefone: '1133334444',
      emailContato: 'contato@precobom.com',
      horarioFuncionamento: 'Seg-Sex: 8h-22h, Sáb: 8h-20h, Dom: 8h-18h',
      planoId: planoIntermediario.id,
      gestorId: gestor1.id,
    },
  });

  const mercado2 = await prisma.mercado.create({
    data: {
      nome: 'Mercadinho da Esquina',
      cnpj: '12345678000102',
      descricao: 'Pequeno mercado de bairro com atendimento familiar',
      telefone: '1133335555',
      emailContato: 'contato@daesquina.com',
      horarioFuncionamento: 'Todos os dias: 7h-21h',
      planoId: planoBasico.id,
      gestorId: gestor2.id,
    },
  });

  console.log('✅ Mercados criados');

  // Cria unidades
  const unidade1_1 = await prisma.unidade.create({
    data: {
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
    },
  });

  const unidade1_2 = await prisma.unidade.create({
    data: {
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
    },
  });

  const unidade2_1 = await prisma.unidade.create({
    data: {
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
    produtos.map((produto) => prisma.produto.create({ data: produto }))
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

  for (const estoque of estoquesUnidade1_1) {
    await prisma.estoque.create({
      data: {
        ...estoque,
        unidadeId: unidade1_1.id,
        disponivel: true,
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
    await prisma.estoque.create({
      data: {
        ...estoque,
        unidadeId: unidade1_2.id,
        disponivel: true,
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
    await prisma.estoque.create({
      data: {
        ...estoque,
        unidadeId: unidade2_1.id,
        disponivel: true,
      },
    });
  }

  console.log('✅ Estoques criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - ${await prisma.user.count()} usuários`);
  console.log(`   - ${await prisma.planoPagamento.count()} planos`);
  console.log(`   - ${await prisma.mercado.count()} mercados`);
  console.log(`   - ${await prisma.unidade.count()} unidades`);
  console.log(`   - ${await prisma.produto.count()} produtos`);
  console.log(`   - ${await prisma.estoque.count()} registros de estoque`);
  
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
