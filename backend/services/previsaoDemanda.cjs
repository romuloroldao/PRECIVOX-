/**
 * Serviço de Previsão de Demanda - PRECIVOX
 * 
 * Usa média móvel ponderada (versão simplificada)
 * Em produção: integrar com Prophet/ARIMA do Python
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Prever demanda para um produto específico
 * @param {string} produtoId - ID do produto
 * @param {string} unidadeId - ID da unidade
 * @param {number} dias - Número de dias para prever (7 ou 30)
 * @returns {Object} Previsão com intervalo de confiança
 */
async function preverDemandaProduto(produtoId, unidadeId, dias = 7) {
  // Buscar histórico de vendas (simulado por enquanto)
  const historicoVendas = await buscarHistoricoVendas(produtoId, unidadeId);
  
  if (historicoVendas.length < 7) {
    return {
      previsao: 0,
      confianca: 0,
      metodo: 'DADOS_INSUFICIENTES'
    };
  }

  // Calcular média móvel ponderada
  const previsaoDiaria = calcularMediaMovelPonderada(historicoVendas, 7);
  const previsaoTotal = Math.round(previsaoDiaria * dias);
  
  // Calcular intervalo de confiança (95%)
  const desvioPadrao = calcularDesvioPadrao(historicoVendas);
  const margemErro = desvioPadrao * 1.96; // 95% confiança
  
  return {
    previsao: previsaoTotal,
    previsaoDiaria: Math.round(previsaoDiaria),
    intervaloMin: Math.max(0, Math.round(previsaoTotal - margemErro)),
    intervaloMax: Math.round(previsaoTotal + margemErro),
    confianca: Math.min(0.95, historicoVendas.length / 30), // Confiança baseada em dados
    metodo: 'MEDIA_MOVEL_PONDERADA',
    diasHistorico: historicoVendas.length
  };
}

/**
 * Buscar histórico de vendas
 * (Simulado - em produção, buscar de tabela VendasDiarias)
 */
async function buscarHistoricoVendas(produtoId, unidadeId) {
  // Simular vendas dos últimos 30 dias
  const vendas = [];
  const baseVendas = 10 + Math.floor(Math.random() * 15);
  
  for (let i = 30; i > 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    
    // Adicionar variação aleatória (+/- 30%)
    const variacao = (Math.random() - 0.5) * 0.6;
    const quantidade = Math.max(0, Math.round(baseVendas * (1 + variacao)));
    
    vendas.push({
      data: data.toISOString().split('T')[0],
      quantidade
    });
  }
  
  return vendas;
}

/**
 * Calcular média móvel ponderada
 * (dá mais peso aos dados recentes)
 */
function calcularMediaMovelPonderada(historico, janela) {
  const dadosRecentes = historico.slice(-janela);
  let somaPonderada = 0;
  let somaPesos = 0;

  dadosRecentes.forEach((registro, index) => {
    const peso = index + 1; // Peso crescente (mais recente = mais peso)
    somaPonderada += registro.quantidade * peso;
    somaPesos += peso;
  });

  return somaPonderada / somaPesos;
}

/**
 * Calcular desvio padrão
 */
function calcularDesvioPadrao(historico) {
  const quantidades = historico.map(h => h.quantidade);
  const media = quantidades.reduce((a, b) => a + b, 0) / quantidades.length;
  const variancia = quantidades.reduce((acc, q) => acc + Math.pow(q - media, 2), 0) / quantidades.length;
  return Math.sqrt(variancia);
}

/**
 * Calcular ponto de reposição
 * (estoque mínimo antes de fazer novo pedido)
 */
function calcularPontoReposicao(demandaSemanal, leadTimeDias = 5) {
  const demandaDiaria = demandaSemanal / 7;
  const estoqueSeguranca = demandaSemanal * 0.3; // 30% de margem de segurança
  
  return Math.ceil((demandaDiaria * leadTimeDias) + estoqueSeguranca);
}

/**
 * Classificar produto em curva ABC
 */
function classificarABC(giroEstoque) {
  if (giroEstoque >= 6) return 'A'; // 20% top (alta rotação)
  if (giroEstoque >= 3) return 'B'; // 30% (média rotação)
  return 'C'; // 50% (baixa rotação)
}

/**
 * Atualizar todos os produtos de um mercado
 */
async function atualizarPrevisoesMercado(mercadoId) {
  const estoques = await prisma.estoque.findMany({
    where: {
      unidade: { mercadoId }
    },
    include: {
      produto: true,
      unidade: true
    }
  });

  let atualizados = 0;

  for (const estoque of estoques) {
    try {
      // Prever demanda
      const previsao7d = await preverDemandaProduto(estoque.produtoId, estoque.unidadeId, 7);
      const previsao30d = await preverDemandaProduto(estoque.produtoId, estoque.unidadeId, 30);
      
      // Calcular ponto de reposição
      const pontoReposicao = calcularPontoReposicao(previsao7d.previsao);
      
      // Simular giro de estoque (vendas/estoque médio)
      const giro = previsao7d.previsaoDiaria > 0 ? 
        (previsao30d.previsao / (estoque.quantidade || 1)) : 0;
      
      // Classificar ABC
      const categoriaABC = classificarABC(giro);

      // Atualizar produto
      await prisma.produto.update({
        where: { id: estoque.produtoId },
        data: {
          demandaPrevista7d: previsao7d.previsao,
          demandaPrevista30d: previsao30d.previsao,
          pontoReposicao,
          giroEstoqueMedio: giro,
          categoriaABC,
          ultimaAtualizacaoIA: new Date()
        }
      });

      atualizados++;
    } catch (error) {
      console.error(`Erro ao atualizar produto ${estoque.produtoId}:`, error.message);
    }
  }

  return atualizados;
}

module.exports = {
  preverDemandaProduto,
  calcularPontoReposicao,
  classificarABC,
  atualizarPrevisoesMercado
};

