import { prisma } from './src/lib/prisma';

async function main() {
  try {
    console.log('Testing Prisma query...');
    const mercados = await prisma.mercados.findMany({
      include: {
        planos_de_pagamento: true,
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        _count: {
          select: {
            unidades: true,
          },
        },
      },
      orderBy: { dataCriacao: 'desc' },
    });
    console.log('✅ Success! Found:', mercados.length);
  } catch (error: any) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
