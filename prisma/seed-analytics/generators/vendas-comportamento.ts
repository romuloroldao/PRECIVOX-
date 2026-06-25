import { PrismaClient } from '@prisma/client';
import { CONFIG, MERCADOS_TEMPLATES } from '../config';
import {
  chunk, randomInt, randomFloat, pick, pickN, addDays, addHours,
  fatorSazonalMes, fatorHorario, seedId,
} from '../lib/utils';
import type { ProdutoGerado } from './produtos';
import type { MercadoCriado } from './entidades';
import type { SeedLogger } from '../lib/logger';

const FORMAS_PAGAMENTO = ['credito', 'debito', 'pix', 'dinheiro', 'vale_alimentacao'];

export async function inserirVendas(
  prisma: PrismaClient,
  mercados: MercadoCriado[],
  produtos: ProdutoGerado[],
  consumidores: { id: string }[],
  logger: SeedLogger,
) {
  const vendas: Parameters<typeof prisma.vendas.createMany>[0]['data'] = [];
  const now = new Date();
  const flagshipMercados = mercados.filter((m) => m.flagship);

  for (const mercado of flagshipMercados) {
    const tmplIdx = MERCADOS_TEMPLATES.findIndex((t) => t.nome === mercado.nome);
    const tmpl = MERCADOS_TEMPLATES[tmplIdx >= 0 ? tmplIdx : 0];
    const volMult = tmpl.volumeVendas === 'alto' ? 1.4 : tmpl.volumeVendas === 'medio' ? 1.0 : 0.6;

    for (const unidadeId of mercado.unidadeIds) {
      const produtosUnidade = produtos.slice(0, CONFIG.produtosPorUnidadeFlagship);
      const produtosTop = produtosUnidade.filter((p) => p.curvaABC === 'A');
      const produtosMid = produtosUnidade.filter((p) => p.curvaABC === 'B');

      for (let dia = CONFIG.diasHistoricoVendas; dia >= 0; dia--) {
        const dataBase = addDays(now, -dia);
        const mes = dataBase.getMonth();
        const sazonal = fatorSazonalMes(mes, tmpl.sazonalidade);
        const vendasDia = Math.round(randomInt(CONFIG.vendasPorDia.min, CONFIG.vendasPorDia.max) * volMult * sazonal);

        for (let v = 0; v < vendasDia; v++) {
          const hora = pick([7, 8, 9, 11, 12, 13, 17, 18, 19, 20, 21]);
          const dataVenda = addHours(dataBase, hora);
          dataVenda.setMinutes(randomInt(0, 59));

          const itensNoCarrinho = randomInt(1, 8);
          const pool = pickN([...produtosTop, ...produtosTop, ...produtosMid], itensNoCarrinho);

          for (const p of pool) {
            const qtd = p.categoria === 'Hortifruti' || p.categoria === 'Açougue'
              ? randomInt(1, 3)
              : randomInt(1, 6);
            const precoBase = p.precoVenda * (mercado.perfil === 'atacarejo' ? 0.9 : mercado.perfil === 'premium' ? 1.15 : 1);
            const emPromo = Math.random() < 0.1;
            const precoUnit = emPromo ? parseFloat((precoBase * 0.85).toFixed(2)) : parseFloat(precoBase.toFixed(2));
            const desconto = emPromo ? parseFloat((precoBase - precoUnit).toFixed(2)) : 0;
            const precoTotal = parseFloat((precoUnit * qtd).toFixed(2));
            const clienteRecorrente = Math.random() > 0.35;

            vendas.push({
              id: seedId(`venda-${unidadeId.slice(-4)}-${dia}-${v}-${p.id.slice(-4)}`),
              produtoId: p.id,
              unidadeId,
              quantidade: qtd,
              precoUnitario: precoUnit,
              precoTotal,
              desconto,
              formaPagamento: pick(FORMAS_PAGAMENTO),
              clienteId: clienteRecorrente ? pick(consumidores).id : null,
              dataVenda,
            });
          }
        }
      }
      logger.info(`Vendas simuladas para unidade ${unidadeId.slice(-12)}`);
    }
  }

  let inserted = 0;
  for (const batch of chunk(vendas, CONFIG.batchSize)) {
    await prisma.vendas.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
    if (inserted % 10000 === 0 || inserted === vendas.length) {
      logger.progress('Vendas', inserted, vendas.length);
    }
  }
  logger.ok(`${inserted} registros de vendas criados (${CONFIG.diasHistoricoVendas} dias de histórico)`);
}

export async function inserirDadosComportamentais(
  prisma: PrismaClient,
  mercados: MercadoCriado[],
  produtos: ProdutoGerado[],
  consumidores: { id: string }[],
  logger: SeedLogger,
) {
  const now = new Date();
  const eventos: Parameters<typeof prisma.userEvent.createMany>[0]['data'] = [];
  const eventTypes = [
    'lista_criada', 'produto_adicionado_lista', 'produto_removido_lista',
    'busca_produto', 'scan_codigo_barras', 'comparacao_preco', 'carrinho_abandonado',
    'promocao_visualizada', 'substituicao_aceita', 'modo_mercado_vivo_ativado',
  ];

  for (const mercado of mercados.filter((m) => m.flagship)) {
    for (const consumidor of consumidores) {
      const numEventos = randomInt(5, 40);
      for (let e = 0; e < numEventos; e++) {
        const tipo = pick(eventTypes);
        const produto = pick(produtos);
        eventos.push({
          id: seedId(`evt-${mercado.id.slice(-4)}-${consumidor.id.slice(-4)}-${e}`),
          userId: consumidor.id,
          mercadoId: mercado.id,
          type: tipo,
          timestamp: addDays(now, -randomInt(0, 90)),
          metadata: {
            produtoId: produto.id,
            categoria: produto.categoria,
            hora: randomInt(6, 23),
            regiao: pick(['centro', 'zona_sul', 'zona_norte', 'suburbio']),
            cluster: pick(['economico', 'premium', 'familiar', 'conveniencia']),
            elasticidadeSimulada: produto.elasticidade,
            ...(tipo === 'carrinho_abandonado' ? { itensAbandonados: randomInt(2, 12), valorEstimado: randomFloat(30, 250) } : {}),
          },
        });
      }
    }
  }

  for (const batch of chunk(eventos, CONFIG.batchSize)) {
    await prisma.userEvent.createMany({ data: batch, skipDuplicates: true });
  }
  logger.ok(`${eventos.length} eventos comportamentais (user_events) criados`);

  // Produtos correlacionados (market basket)
  const topProdutos = produtos.filter((p) => p.curvaABC === 'A').slice(0, 100);
  const relacionados: Parameters<typeof prisma.produtos_relacionados.createMany>[0]['data'] = [];

  for (const p of topProdutos) {
    const correlacionados = pickN(produtos.filter((x) => x.id !== p.id && x.categoria !== p.categoria), CONFIG.maxProdutosRelacionados);
    for (const rel of correlacionados) {
      relacionados.push({
        id: seedId(`rel-${p.id.slice(-6)}-${rel.id.slice(-6)}`),
        produtoId: p.id,
        produtoRelacionadoId: rel.id,
        tipo: pick(['complementar', 'substituto', 'cross_sell']),
        confianca: randomFloat(0.55, 0.95),
        suporte: randomFloat(0.05, 0.35),
        lift: randomFloat(1.1, 3.5),
      });
    }
  }

  for (const batch of chunk(relacionados, CONFIG.batchSize)) {
    await prisma.produtos_relacionados.createMany({ data: batch, skipDuplicates: true });
  }
  logger.ok(`${relacionados.length} correlações de produtos (market basket) criadas`);

  // NPS responses
  const nps: Parameters<typeof prisma.npsResponse.createMany>[0]['data'] = [];
  for (const mercado of mercados.filter((m) => m.flagship)) {
    for (let i = 0; i < randomInt(15, 40); i++) {
      nps.push({
        id: seedId(`nps-${mercado.id.slice(-4)}-${i}`),
        userId: pick(consumidores).id,
        mercadoId: mercado.id,
        score: randomInt(0, 10),
        comment: pick([null, 'Ótimo atendimento', 'Preços altos', 'Boa variedade', 'Fila longa no caixa', 'Promoções excelentes']),
        gatilho: pick(['busca_sem_resultado', 'substituicao_aceita', 'lista_3_itens', 'compra_concluida']),
        createdAt: addDays(now, -randomInt(0, 60)),
      });
    }
  }
  await prisma.npsResponse.createMany({ data: nps, skipDuplicates: true });
  logger.ok(`${nps.length} respostas NPS criadas`);
}

export async function inserirMetricasDashboard(
  prisma: PrismaClient,
  mercados: MercadoCriado[],
  logger: SeedLogger,
) {
  const metricas: Parameters<typeof prisma.metricas_dashboard.createMany>[0]['data'] = [];
  const now = new Date();

  for (const mercado of mercados) {
    for (let dia = CONFIG.diasMetricasDashboard; dia >= 0; dia--) {
      const data = addDays(now, -dia);
      const baseFat = mercado.flagship ? randomFloat(15000, 85000) : randomFloat(3000, 15000);

      metricas.push({
        id: seedId(`met-${mercado.id.slice(-6)}-${dia}`),
        mercadoId: mercado.id,
        data,
        periodo: 'DIARIO',
        giroEstoqueGeral: randomFloat(2, 12),
        taxaRuptura: randomFloat(0.01, 0.08),
        valorEstoque: randomFloat(50000, 500000),
        diasCobertura: randomFloat(5, 25),
        produtosAtivos: mercado.flagship ? CONFIG.produtosPorUnidadeFlagship : CONFIG.produtosPorUnidadeLeve,
        produtosInativos: randomInt(5, 50),
        ticketMedio: randomFloat(35, 180),
        quantidadeVendas: Math.round(baseFat / randomFloat(40, 80)),
        faturamentoDia: baseFat,
        margemLiquida: randomFloat(0.05, 0.15),
        margemBruta: randomFloat(0.18, 0.35),
        taxaConversao: randomFloat(0.12, 0.35),
        taxaRecompra: randomFloat(0.25, 0.65),
        clientesAtivos: randomInt(50, 500),
        clientesNovos: randomInt(5, 40),
        nps: randomFloat(6, 9.5),
        churnRate: randomFloat(0.02, 0.12),
        variacaoD1: { faturamento: randomFloat(-0.15, 0.15), vendas: randomFloat(-0.1, 0.1) },
        variacaoD7: { faturamento: randomFloat(-0.25, 0.25), vendas: randomFloat(-0.2, 0.2) },
        variacaoD30: { faturamento: randomFloat(-0.35, 0.35), vendas: randomFloat(-0.3, 0.3) },
      });
    }
  }

  for (const batch of chunk(metricas, CONFIG.batchSize)) {
    await prisma.metricas_dashboard.createMany({ data: batch, skipDuplicates: true });
  }
  logger.ok(`${metricas.length} métricas de dashboard criadas`);
}

export async function inserirAnalisesIA(
  prisma: PrismaClient,
  mercados: MercadoCriado[],
  produtos: ProdutoGerado[],
  gestores: { id: string }[],
  logger: SeedLogger,
) {
  const now = new Date();
  const analises: Parameters<typeof prisma.analises_ia.createMany>[0]['data'] = [];
  const alertas: Parameters<typeof prisma.alertas_ia.createMany>[0]['data'] = [];

  for (const mercado of mercados.filter((m) => m.flagship)) {
    const amostra = produtos.filter((p) => p.curvaABC === 'A').slice(0, 30);
    for (const p of amostra) {
      analises.push({
        id: seedId(`analise-${mercado.id.slice(-4)}-${p.id.slice(-6)}`),
        mercadoId: mercado.id,
        unidadeId: mercado.unidadeIds[0],
        produtoId: p.id,
        tipo: pick(['DEMANDA', 'PRECO', 'ESTOQUE', 'SAZONALIDADE']),
        categoria: p.categoria,
        resultado: {
          demandaPrevista: randomInt(50, 500),
          elasticidade: p.elasticidade,
          recomendacaoPreco: parseFloat((p.precoVenda * randomFloat(0.95, 1.08)).toFixed(2)),
          confianca: randomFloat(0.7, 0.95),
        },
        recomendacao: pick([
          'Aumentar estoque em 15% para próxima semana',
          'Reduzir preço em 5% para estimular demanda',
          'Ativar promoção cruzada com produtos complementares',
          'Antecipar reposição — risco de ruptura em 3 dias',
        ]),
        prioridade: pick(['ALTA', 'MEDIA', 'BAIXA']),
        impactoEstimado: randomFloat(500, 15000),
        status: pick(['PENDENTE', 'ACEITA', 'EXECUTADA']),
        criadoEm: addDays(now, -randomInt(0, 30)),
      });

      if (Math.random() < 0.4) {
        alertas.push({
          id: seedId(`alerta-${mercado.id.slice(-4)}-${p.id.slice(-6)}`),
          mercadoId: mercado.id,
          unidadeId: mercado.unidadeIds[0],
          produtoId: p.id,
          tipo: pick(['RUPTURA', 'PRECO', 'DEMANDA', 'VALIDADE']),
          titulo: `Alerta: ${p.nome}`,
          descricao: pick(['Estoque abaixo do mínimo', 'Pico de demanda detectado', 'Validade próxima — 3 dias', 'Concorrente reduziu preço']),
          prioridade: pick(['ALTA', 'MEDIA', 'BAIXA']),
          acaoRecomendada: 'Revisar política de reposição',
          lido: Math.random() > 0.5,
          lidoEm: Math.random() > 0.5 ? addDays(now, -randomInt(0, 5)) : null,
          metadata: { produtoId: p.id, curvaABC: p.curvaABC },
        });
      }
    }
  }

  await prisma.analises_ia.createMany({ data: analises, skipDuplicates: true });
  await prisma.alertas_ia.createMany({ data: alertas, skipDuplicates: true });
  logger.ok(`${analises.length} análises IA e ${alertas.length} alertas IA criados`);
}
