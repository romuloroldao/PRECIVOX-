// Script para verificar se o mercado Assai Franco existe no banco de dados
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarMercado() {
  try {
    console.log('🔍 Verificando mercado "Assai Franco" no banco de dados...\n');

    // Buscar mercado por nome (case insensitive)
    const mercados = await prisma.mercados.findMany({
      where: {
        nome: {
          contains: 'Assai',
          mode: 'insensitive'
        }
      },
      include: {
        unidades: true,
        _count: {
          select: {
            unidades: true
          }
        }
      }
    });

    if (mercados.length === 0) {
      console.log('❌ Mercado "Assai Franco" NÃO encontrado no banco de dados.\n');
      console.log('💡 Para criar o mercado, você precisa:');
      console.log('   1. Acessar o sistema como ADMIN');
      console.log('   2. Ir para a seção de Mercados');
      console.log('   3. Criar um novo mercado com nome "Assai Franco"');
      console.log('   4. Preencher CNPJ (obrigatório) e outras informações');
      console.log('   5. Criar pelo menos uma unidade para o mercado\n');
      return;
    }

    console.log(`✅ Encontrado(s) ${mercados.length} mercado(s) relacionado(s) a "Assai":\n`);
    
    mercados.forEach((mercado, index) => {
      console.log(`📦 Mercado ${index + 1}:`);
      console.log(`   ID: ${mercado.id}`);
      console.log(`   Nome: ${mercado.nome}`);
      console.log(`   CNPJ: ${mercado.cnpj}`);
      console.log(`   Ativo: ${mercado.ativo ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Unidades: ${mercado._count.unidades}`);
      
      if (mercado.unidades.length > 0) {
        console.log(`   Unidades cadastradas:`);
        mercado.unidades.forEach((unidade, idx) => {
          console.log(`      ${idx + 1}. ${unidade.nome} (${unidade.id})`);
        });
      } else {
        console.log(`   ⚠️  Nenhuma unidade cadastrada - necessário criar antes do upload!`);
      }
      
      console.log('');
    });

    // Verificar se há unidades
    const mercadoPrincipal = mercados[0];
    if (mercadoPrincipal._count.unidades === 0) {
      console.log('⚠️  ATENÇÃO: O mercado não tem unidades cadastradas.');
      console.log('   Você precisa criar pelo menos uma unidade antes de fazer upload de produtos.\n');
    } else {
      console.log('✅ Mercado pronto para receber upload de produtos!\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar mercado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarMercado().catch(console.error);

