#!/usr/bin/env node

/**
 * Job de Monitoramento e Alertas - PRECIVOX
 * Roda a cada 30 minutos
 * 
 * Tarefas:
 * - Monitorar rupturas iminentes
 * - Detectar anomalias
 * - Limpar alertas antigos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔔 [ALERTAS] Verificando alertas...');

  try {
    // 1. Monitorar rupturas críticas
    await monitorarRupturas();

    // 2. Limpar alertas expirados ou lidos antigos
    await limparAlertasAntigos();

    // 3. Limpar análises expiradas
    await limparAnalisesExpiradas();

    console.log('✅ [ALERTAS] Verificação concluída');

  } catch (error) {
    console.error('❌ [ALERTAS] Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Monitorar rupturas críticas em tempo real
 */
async function monitorarRupturas() {
  const mercados = await prisma.mercado.findMany({
    where: { ativo: true },
    include: {
      unidades: {
        where: { ativa: true },
        include: {
          estoques: {
            where: { disponivel: true },
            include: { produto: true }
          }
        }
      }
    }
  });

  let alertasGerados = 0;

  for (const mercado of mercados) {
    for (const unidade of mercado.unidades) {
      for (const estoque of unidade.estoques) {
        const { produto } = estoque;
        
        if (!produto.demandaPrevista7d) continue;

        const demandaDiaria = produto.demandaPrevista7d / 7;
        const diasRestantes = estoque.quantidade / (demandaDiaria || 1);

        // Alerta crítico: < 24h
        if (diasRestantes < 1 && estoque.quantidade > 0) {
          const alertaExistente = await prisma.alertaIA.findFirst({
            where: {
              mercadoId: mercado.id,
              unidadeId: unidade.id,
              produtoId: produto.id,
              tipo: 'RUPTURA',
              prioridade: 'CRITICA',
              lido: false,
              criadoEm: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
              }
            }
          });

          if (!alertaExistente) {
            await prisma.alertaIA.create({
              data: {
                mercadoId: mercado.id,
                unidadeId: unidade.id,
                produtoId: produto.id,
                tipo: 'RUPTURA',
                titulo: `🚨 URGENTE: ${produto.nome} em ruptura`,
                descricao: `Apenas ${estoque.quantidade} unidades restantes. Ruptura prevista em ${(diasRestantes * 24).toFixed(1)} horas!`,
                prioridade: 'CRITICA',
                acaoRecomendada: `AÇÃO IMEDIATA: Repor ${Math.ceil(produto.demandaPrevista7d)} unidades.`,
                metadata: {
                  estoqueAtual: estoque.quantidade,
                  horasRestantes: (diasRestantes * 24).toFixed(1)
                }
              }
            });

            alertasGerados++;
            console.log(`  🚨 Alerta crítico criado: ${produto.nome} (${unidade.nome})`);
          }
        }
      }
    }
  }

  if (alertasGerados > 0) {
    console.log(`  ✓ ${alertasGerados} novos alertas críticos gerados`);
  } else {
    console.log('  ✓ Nenhum alerta crítico novo');
  }
}

/**
 * Limpar alertas lidos com mais de 7 dias
 */
async function limparAlertasAntigos() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 7);

  const resultado = await prisma.alertaIA.deleteMany({
    where: {
      lido: true,
      lidoEm: {
        lt: dataLimite
      }
    }
  });

  if (resultado.count > 0) {
    console.log(`  ✓ ${resultado.count} alertas antigos removidos`);
  }

  // Marcar alertas expirados
  const expirados = await prisma.alertaIA.updateMany({
    where: {
      expiradoEm: {
        lt: new Date()
      },
      lido: false
    },
    data: {
      lido: true,
      lidoEm: new Date()
    }
  });

  if (expirados.count > 0) {
    console.log(`  ✓ ${expirados.count} alertas expirados marcados como lidos`);
  }
}

/**
 * Limpar análises expiradas
 */
async function limparAnalisesExpiradas() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30);

  const resultado = await prisma.analiseIA.deleteMany({
    where: {
      OR: [
        {
          expiraEm: {
            lt: new Date()
          }
        },
        {
          criadoEm: {
            lt: dataLimite
          },
          status: {
            in: ['REJEITADA', 'EXECUTADA']
          }
        }
      ]
    }
  });

  if (resultado.count > 0) {
    console.log(`  ✓ ${resultado.count} análises expiradas removidas`);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Monitoramento finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { main };

