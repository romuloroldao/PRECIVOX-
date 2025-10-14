'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ModuloPromocoesPage() {
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [desconto, setDesconto] = useState(8);
  const [simulacao, setSimulacao] = useState<any>(null);

  // Dados de exemplo (em produção, buscar do backend)
  const oportunidades = [
    {
      id: 1,
      nome: 'Cerveja Lata 350ml',
      categoria: 'Bebidas',
      estoqueAtual: 540,
      giroAtual: 2.1,
      precoAtual: 2.50,
      margem: 22,
      elasticidade: -2.2,
      descontoSugerido: 8,
      aumentoVendasEstimado: 18
    },
    {
      id: 2,
      nome: 'Biscoito Recheado 140g',
      categoria: 'Mercearia',
      estoqueAtual: 320,
      giroAtual: 1.8,
      precoAtual: 4.50,
      margem: 28,
      elasticidade: -1.8,
      descontoSugerido: 12,
      aumentoVendasEstimado: 22
    },
    {
      id: 3,
      nome: 'Refrigerante 2L',
      categoria: 'Bebidas',
      estoqueAtual: 280,
      giroAtual: 2.5,
      precoAtual: 5.99,
      margem: 18,
      elasticidade: -1.5,
      descontoSugerido: 10,
      aumentoVendasEstimado: 15
    }
  ];

  const simularPromocao = (produto: any) => {
    const precoNovo = produto.precoAtual * (1 - desconto / 100);
    const margemNova = produto.margem - (desconto * 0.8); // Aproximação
    const vendasAtuais = 15; // vendas/dia base
    const vendasNovas = vendasAtuais * (1 + (Math.abs(produto.elasticidade) * desconto) / 100);
    
    const faturamentoAtual = produto.precoAtual * vendasAtuais;
    const faturamentoNovo = precoNovo * vendasNovas;
    
    const lucroAtual = faturamentoAtual * (produto.margem / 100);
    const lucroNovo = faturamentoNovo * (margemNova / 100);

    setSimulacao({
      precoNovo: precoNovo.toFixed(2),
      margemNova: margemNova.toFixed(1),
      vendasNovas: Math.round(vendasNovas),
      aumentoVendas: ((vendasNovas - vendasAtuais) / vendasAtuais * 100).toFixed(1),
      faturamentoNovo: faturamentoNovo.toFixed(2),
      aumentoFaturamento: ((faturamentoNovo - faturamentoAtual) / faturamentoAtual * 100).toFixed(1),
      lucroNovo: lucroNovo.toFixed(2),
      aumentoLucro: ((lucroNovo - lucroAtual) / lucroAtual * 100).toFixed(1),
      recomendacao: lucroNovo > lucroAtual
    });
  };

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
          <Link href="/gestor/ia" className="text-sm opacity-75 hover:opacity-100 mb-2 inline-block">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">💸 Promoções e Precificação Inteligente</h1>
          <p className="text-lg opacity-90">
            Elasticidade de preço, simulador de promoções e oportunidades
          </p>
        </div>

        {/* Oportunidades de Promoção */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎯 Oportunidades de Promoção (Top {oportunidades.length})
          </h2>

          <div className="space-y-6">
            {oportunidades.map((produto) => (
              <div key={produto.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-green-400 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{produto.nome}</h3>
                    <p className="text-sm text-gray-600">{produto.categoria}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                    Estoque Alto
                  </span>
                </div>

                {/* Métricas Atuais */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Estoque</p>
                    <p className="font-bold text-gray-900">{produto.estoqueAtual} un</p>
                    <p className="text-xs text-orange-600">ALTO</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Giro</p>
                    <p className="font-bold text-gray-900">{produto.giroAtual}x/mês</p>
                    <p className="text-xs text-orange-600">LENTO</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Preço</p>
                    <p className="font-bold text-gray-900">R$ {produto.precoAtual.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{produto.margem}% margem</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Elasticidade</p>
                    <p className="font-bold text-gray-900">{produto.elasticidade}</p>
                    <p className="text-xs text-gray-600">Alta sensibilidade</p>
                  </div>
                </div>

                {/* Recomendação da IA */}
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    💡 Recomendação da IA:
                  </p>
                  <p className="text-sm text-green-800">
                    Desconto de <span className="font-bold">{produto.descontoSugerido}%</span> pode aumentar vendas 
                    em <span className="font-bold">+{produto.aumentoVendasEstimado}%</span> e acelerar giro de estoque.
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setProdutoSelecionado(produto);
                      setDesconto(produto.descontoSugerido);
                      simularPromocao(produto);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    🧮 Simular Promoção
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Ver Histórico
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Simulação */}
        {produtoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  💸 Simulador de Promoção
                </h2>
                <button
                  onClick={() => {
                    setProdutoSelecionado(null);
                    setSimulacao(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-lg font-semibold text-gray-700 mb-6">
                {produtoSelecionado.nome}
              </p>

              {/* Slider de Desconto */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto: {desconto}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={desconto}
                  onChange={(e) => {
                    const novoDesconto = parseInt(e.target.value);
                    setDesconto(novoDesconto);
                    simularPromocao({ ...produtoSelecionado });
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%</span>
                </div>
              </div>

              {/* Comparação */}
              {simulacao && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Comparação: Atual vs. Com Promoção</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600"></th>
                          <th className="text-center py-3 px-2 text-sm font-semibold text-gray-600">ATUAL</th>
                          <th className="text-center py-3 px-2 text-sm font-semibold text-green-600">COM PROMOÇÃO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-3 px-2 text-sm text-gray-700">Preço Unitário</td>
                          <td className="py-3 px-2 text-center font-semibold">R$ {produtoSelecionado.precoAtual.toFixed(2)}</td>
                          <td className="py-3 px-2 text-center font-semibold text-green-600">
                            R$ {simulacao.precoNovo} <span className="text-xs">(-{desconto}%)</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 text-sm text-gray-700">Vendas/Dia</td>
                          <td className="py-3 px-2 text-center font-semibold">15 un</td>
                          <td className="py-3 px-2 text-center font-semibold text-green-600">
                            {simulacao.vendasNovas} un <span className="text-xs">(+{simulacao.aumentoVendas}%)</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 text-sm text-gray-700">Margem</td>
                          <td className="py-3 px-2 text-center font-semibold">{produtoSelecionado.margem}%</td>
                          <td className="py-3 px-2 text-center font-semibold text-orange-600">
                            {simulacao.margemNova}% <span className="text-xs">({(simulacao.margemNova - produtoSelecionado.margem).toFixed(1)}pp)</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 text-sm text-gray-700">Faturamento/Dia</td>
                          <td className="py-3 px-2 text-center font-semibold">R$ 37,50</td>
                          <td className="py-3 px-2 text-center font-semibold text-green-600">
                            R$ {simulacao.faturamentoNovo} <span className="text-xs">(+{simulacao.aumentoFaturamento}%)</span>
                          </td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="py-3 px-2 text-sm font-bold text-gray-900">Lucro Total/Dia</td>
                          <td className="py-3 px-2 text-center font-bold">R$ 8,25</td>
                          <td className="py-3 px-2 text-center font-bold text-green-600">
                            R$ {simulacao.lucroNovo} 
                            <span className={`text-xs ml-1 ${parseFloat(simulacao.aumentoLucro) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({parseFloat(simulacao.aumentoLucro) > 0 ? '+' : ''}{simulacao.aumentoLucro}%)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Recomendação */}
                  <div className={`mt-6 p-4 rounded-lg border-2 ${
                    simulacao.recomendacao ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                  }`}>
                    <p className="font-bold text-gray-900 mb-2">
                      {simulacao.recomendacao ? '✅ PROMOÇÃO RECOMENDADA' : '⚠️ ATENÇÃO'}
                    </p>
                    <p className="text-sm text-gray-700">
                      {simulacao.recomendacao
                        ? `Promoção de ${desconto}% aumenta lucro total em ${simulacao.aumentoLucro}%. ROI positivo!`
                        : `Promoção de ${desconto}% reduz lucro. Considere desconto menor ou não aplicar.`
                      }
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        setProdutoSelecionado(null);
                        setSimulacao(null);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    {simulacao.recomendacao && (
                      <button
                        onClick={() => {
                          alert(`Promoção aplicada com sucesso!\n\nProduto: ${produtoSelecionado.nome}\nDesconto: ${desconto}%\nDuração: 15 dias`);
                          setProdutoSelecionado(null);
                          setSimulacao(null);
                        }}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        🏷️ Aplicar Promoção
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

