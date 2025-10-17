'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ModuloComprasPage() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mercadoId, setMercadoId] = useState<string | null>(null);

  useEffect(() => {
    loadDados();
  }, []);

  const loadDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Buscar mercado
      const mercadosResponse = await fetch('/api/markets', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (mercadosResponse.ok) {
        const mercados = await mercadosResponse.json();
        if (mercados.length > 0) {
          const meuMercado = mercados[0];
          setMercadoId(meuMercado.id);
          
          // Buscar dados do módulo de compras
          const comprasResponse = await fetch(`/api/ai/painel/compras/${meuMercado.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (comprasResponse.ok) {
            const data = await comprasResponse.json();
            setDados(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar módulo de compras:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/gestor/ia" className="text-sm opacity-75 hover:opacity-100 mb-2 inline-block">
                ← Voltar ao Dashboard
              </Link>
              <h1 className="text-3xl font-bold mb-2">🛒 Compras e Reposição Inteligente</h1>
              <p className="text-lg opacity-90">
                Previsão de demanda, alertas de ruptura e recomendações de compra
              </p>
            </div>
          </div>
        </div>

        {/* Produtos em Ruptura */}
        {dados?.produtosEmRuptura && dados.produtosEmRuptura.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ⚠️ Produtos em Risco de Ruptura ({dados.produtosEmRuptura.length})
            </h2>

            <div className="space-y-4">
              {dados.produtosEmRuptura.map((produto: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-lg border-2 ${
                    produto.diasRestantes < 1
                      ? 'bg-red-50 border-red-400'
                      : 'bg-orange-50 border-orange-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">
                          {produto.diasRestantes < 1 ? '🚨' : '⚠️'}
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg">{produto.nome}</h3>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          produto.diasRestantes < 1
                            ? 'bg-red-200 text-red-800'
                            : 'bg-orange-200 text-orange-800'
                        }`}>
                          {produto.diasRestantes < 1 ? 'CRÍTICO' : 'ALTA'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-semibold">Unidade:</span> {produto.unidade}
                      </p>

                      {/* Barra de Progresso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Estoque atual: {produto.estoqueAtual} un</span>
                          <span>Ruptura em: {produto.diasRestantes.toFixed(1)} dias</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              produto.diasRestantes < 1 ? 'bg-red-600' : 'bg-orange-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (produto.diasRestantes / 7) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Estoque Atual</p>
                          <p className="font-bold text-gray-900">{produto.estoqueAtual} un</p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Demanda/Dia</p>
                          <p className="font-bold text-gray-900">{produto.demandaDiaria.toFixed(1)} un</p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Repor</p>
                          <p className="font-bold text-blue-600">{produto.quantidadeRepor} un</p>
                        </div>
                      </div>

                      {/* Recomendação */}
                      <div className="bg-white rounded-lg p-3 border border-gray-300">
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          💡 Recomendação da IA:
                        </p>
                        <p className="text-sm text-gray-600">
                          Repor <span className="font-bold text-blue-600">{produto.quantidadeRepor} unidades</span> de 
                          "{produto.nome}" {produto.diasRestantes < 1 ? 'IMEDIATAMENTE' : 'nas próximas 48 horas'}.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      🛒 Gerar Pedido Automático
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Ver Histórico
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Comparar Fornecedores
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sem produtos em ruptura */}
        {dados?.produtosEmRuptura && dados.produtosEmRuptura.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum Produto em Risco de Ruptura!
            </h2>
            <p className="text-gray-600">
              Seu estoque está em dia. Continue monitorando as previsões.
            </p>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Como funciona */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">ℹ️</span>
              Como Funciona a Previsão
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>IA analisa histórico de vendas dos últimos 30 dias</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Identifica padrões e sazonalidade</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Prevê demanda para 7 e 30 dias com 85%+ de acurácia</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Calcula ponto ideal de reposição considerando lead time</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Alerta automaticamente quando estoque fica crítico</span>
              </li>
            </ul>
          </div>

          {/* Dicas */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-green-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Dicas para Otimizar
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Mantenha dados de estoque sempre atualizados</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Configure lead time correto dos fornecedores</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Aceite as recomendações da IA para melhorar precisão</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Revise alertas diariamente pela manhã</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Use o pedido automático para economia de tempo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


