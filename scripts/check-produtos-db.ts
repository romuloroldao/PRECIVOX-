import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não está definida.');
    process.exit(1);
  }

  const [totalProdutos, ativosProdutos, produtosComEstoque, totalEstoques, ativosComEstoque] =
    await Promise.all([
      prisma.produtos.count(),
      prisma.produtos.count({ where: { ativo: true } }),
      prisma.produtos.count({ where: { estoques: { some: {} } } }),
      prisma.estoques.count(),
      prisma.produtos.count({ where: { ativo: true, estoques: { some: {} } } }),
    ]);

  console.log('=== Contagem na base (DATABASE_URL atual) ===');
  console.log(`Produtos total:           ${totalProdutos}`);
  console.log(`Produtos ativo:           ${ativosProdutos}`);
  console.log(`Produtos com estoque:    ${produtosComEstoque}`);
  console.log(`Estoques total:          ${totalEstoques}`);
  console.log(`Ativos com estoque:      ${ativosComEstoque}`);

  const sample = await prisma.produtos.findMany({
    where: { ativo: true, estoques: { some: { quantidade: { gt: 0 } } } },
    orderBy: { dataAtualizacao: 'desc' },
    take: 1,
    include: {
      estoques: {
        where: { quantidade: { gt: 0 } },
        take: 1,
        include: {
          unidades: {
            include: { mercados: true },
          },
        },
      },
    },
  });

  const p = sample[0];
  const est = p?.estoques?.[0];
  const unidade = est?.unidades;
  const mercado = unidade?.mercados;

  console.log('');
  console.log('=== Exemplo ativo com quantidade > 0 ===');
  console.log(
    p
      ? {
          id: p.id,
          nome: p.nome,
          marca: p.marca,
          categoria: p.categoria,
          estoque: {
            id: est?.id,
            quantidade: est?.quantidade,
            preco: est?.preco?.toString(),
            emPromocao: est?.emPromocao,
            unidade: unidade?.nome,
            mercado: mercado?.nome,
          },
        }
      : null
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Erro no check:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

