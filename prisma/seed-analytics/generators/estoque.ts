import { PrismaClient, EstoqueFonte } from '@prisma/client';
import { CONFIG } from '../config';
import { chunk, randomInt, randomFloat, pick, addDays, seedId } from '../lib/utils';
import type { ProdutoGerado } from './produtos';
import type { MercadoCriado } from './entidades';
import type { SeedLogger } from '../lib/logger';

export async function inserirProdutos(
  prisma: PrismaClient,
  produtos: ProdutoGerado[],
  logger: SeedLogger,
) {
  const now = new Date();
  const batches = chunk(produtos, CONFIG.batchSize);
  let inserted = 0;

  for (const batch of batches) {
    await prisma.produtos.createMany({
      data: batch.map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        categoria: p.categoria,
        codigoBarras: p.codigoBarras,
        marca: p.marca,
        unidadeMedida: p.unidadeMedida,
        ativo: true,
        dataCriacao: addDays(now, -randomInt(30, 365)),
        dataAtualizacao: now,
        giroEstoqueMedio: p.giroMedio,
        elasticidadePreco: p.elasticidade,
        demandaPrevista7d: Math.round(p.giroMedio * 7),
        demandaPrevista30d: Math.round(p.giroMedio * 30),
        pontoReposicao: p.estoqueMinimo,
        margemContribuicao: p.margem,
        scoreSazonalidade: p.sazonalidade,
        categoriaABC: p.curvaABC,
        ultimaAtualizacaoIA: now,
        nomeChave: p.nomeChave,
        chaveInsight: p.chaveInsight,
      })),
      skipDuplicates: true,
    });
    inserted += batch.length;
    logger.progress('Produtos', inserted, produtos.length);
  }
  logger.ok(`${produtos.length} produtos inseridos no catálogo global`);
}

export async function inserirEstoques(
  prisma: PrismaClient,
  mercados: MercadoCriado[],
  produtos: ProdutoGerado[],
  logger: SeedLogger,
): Promise<Map<string, string>> {
  const estoqueIdMap = new Map<string, string>();
  const now = new Date();
  let total = 0;
  let targetTotal = 0;

  for (const mercado of mercados) {
    const qtdProdutos = mercado.flagship
      ? CONFIG.produtosPorUnidadeFlagship
      : CONFIG.produtosPorUnidadeLeve;
    targetTotal += qtdProdutos * mercado.unidadeIds.length;

    const produtosMercado = produtos.slice(0, qtdProdutos);

    for (const unidadeId of mercado.unidadeIds) {
      const estoqueBatch: Parameters<typeof prisma.estoques.createMany>[0]['data'] = [];

      for (const p of produtosMercado) {
        const variacao = mercado.perfil === 'atacarejo' ? randomFloat(0.85, 0.95) : mercado.perfil === 'premium' ? randomFloat(1.05, 1.25) : 1;
        const preco = parseFloat((p.precoVenda * variacao).toFixed(2));
        const emPromo = Math.random() < (mercado.perfil === 'atacarejo' ? 0.15 : 0.08);
        const precoPromo = emPromo ? parseFloat((preco * randomFloat(0.75, 0.92)).toFixed(2)) : null;
        const estoqueId = seedId(`est-${unidadeId.slice(-8)}-${p.id.slice(-8)}`);

        estoqueBatch.push({
          id: estoqueId,
          quantidade: randomInt(p.estoqueMinimo, p.estoqueMinimo * 8),
          preco,
          precoPromocional: precoPromo,
          emPromocao: emPromo,
          disponivel: Math.random() > 0.02,
          atualizadoEm: addDays(now, -randomInt(0, 14)),
          fonte: pick([EstoqueFonte.UPLOAD_GESTOR, EstoqueFonte.API_PARCEIRO, EstoqueFonte.MANUAL_GESTOR]),
          confianca: randomInt(60, 98),
          verificadoEm: Math.random() > 0.3 ? addDays(now, -randomInt(1, 30)) : null,
          unidadeId,
          produtoId: p.id,
        });
        estoqueIdMap.set(`${unidadeId}:${p.id}`, estoqueId);
      }

      for (const batch of chunk(estoqueBatch, CONFIG.batchSize)) {
        await prisma.estoques.createMany({ data: batch, skipDuplicates: true });
        total += batch.length;
      }
      logger.info(`Estoque unidade ${unidadeId.slice(-12)}: ${produtosMercado.length} SKUs`);
    }
  }

  logger.progress('Estoques', total, targetTotal);
  logger.ok(`${total} registros de estoque criados`);
  return estoqueIdMap;
}

export async function inserirMovimentacoes(
  prisma: PrismaClient,
  mercados: MercadoCriado[],
  produtos: ProdutoGerado[],
  estoqueIdMap: Map<string, string>,
  logger: SeedLogger,
) {
  const tipos = [
    { tipo: 'ENTRADA', motivo: 'Recebimento de fornecedor' },
    { tipo: 'ENTRADA', motivo: 'Transferência entre filiais' },
    { tipo: 'SAIDA', motivo: 'Venda PDV' },
    { tipo: 'SAIDA', motivo: 'Perda por validade' },
    { tipo: 'SAIDA', motivo: 'Ruptura — estoque zerado' },
    { tipo: 'AJUSTE', motivo: 'Inventário cíclico' },
    { tipo: 'AJUSTE', motivo: 'Divergência de contagem' },
    { tipo: 'ENTRADA', motivo: 'Devolução de cliente' },
  ];

  const movimentacoes: Parameters<typeof prisma.movimentacoes_estoque.createMany>[0]['data'] = [];
  const now = new Date();

  for (const mercado of mercados.filter((m) => m.flagship)) {
    for (const unidadeId of mercado.unidadeIds) {
      const amostra = produtos.slice(0, Math.min(200, produtos.length));
      for (const p of amostra) {
        const movCount = randomInt(2, 6);
        let qtdAtual = randomInt(20, 200);

        for (let m = 0; m < movCount; m++) {
          const t = pick(tipos);
          const delta = t.tipo === 'ENTRADA' ? randomInt(10, 100) : t.tipo === 'SAIDA' ? -randomInt(1, 50) : randomInt(-10, 10);
          const qtdAnterior = qtdAtual;
          qtdAtual = Math.max(0, qtdAtual + delta);
          const estoqueId = estoqueIdMap.get(`${unidadeId}:${p.id}`) ?? seedId(`est-fallback-${p.id}`);

          movimentacoes.push({
            id: seedId(`mov-${unidadeId.slice(-6)}-${p.id.slice(-6)}-${m}`),
            estoqueId,
            produtoId: p.id,
            unidadeId,
            tipo: t.tipo,
            quantidade: Math.abs(delta),
            quantidadeAnterior: qtdAnterior,
            quantidadeNova: qtdAtual,
            motivo: t.motivo,
            observacao: m === 0 ? 'Movimentação seed analítico' : undefined,
            dataMovimentacao: addDays(now, -randomInt(1, 90)),
          });
        }
      }
    }
  }

  let inserted = 0;
  for (const batch of chunk(movimentacoes, CONFIG.batchSize)) {
    await prisma.movimentacoes_estoque.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
  }
  logger.ok(`${inserted} movimentações de estoque simuladas`);
}
