'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function PainelIAGestor() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mercadoId, setMercadoId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Buscar mercado do gestor
      const mercadosResponse = await fetch('/api/markets');

      if (mercadosResponse.ok) {
        const result = await mercadosResponse.json();
        if (result.success && result.data && result.data.length > 0) {
          const meuMercado = result.data[0];
          setMercadoId(meuMercado.id);
          
          // Buscar dashboard de IA
          const dashboardResponse = await fetch(`/api/ai/painel/dashboard/${meuMercado.id}`);

          if (dashboardResponse.ok) {
            const data = await dashboardResponse.json();
            if (data.success) {
              setDashboard(data.data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarAlertaLido = async (alertaId: string) => {
    try {
      await fetch(`/api/ai/painel/alertas/${alertaId}/marcar-lido`, {
        method: 'PUT'
      });
      loadDashboard();
    } catch (error) {
      console.error('Erro ao marcar alerta:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando inteligência...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhum dado disponível</p>
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
              <h1 className="text-3xl font-bold mb-2">🤖 Painel de Inteligência Artificial</h1>
              <p className="text-lg opacity-90">
                Insights preditivos e recomendações acionáveis para seu supermercado
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Última atualização</p>
              <p className="font-semibold">
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/gestor/ia/resumo"
          className="block rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm transition hover:border-amber-400 hover:shadow-md"
        >
          <p className="text-sm font-semibold text-amber-950">Resumo inteligente para o dia a dia</p>
          <p className="mt-1 text-sm text-amber-900/90">
            Prioridades da semana: busca sem resultado, lista, NPS com temas, estoque baixo — uma narrativa
            só.
          </p>
          <span className="mt-2 inline-block text-sm font-medium text-amber-800 underline">Abrir resumo</span>
        </Link>

        {/* Alertas Críticos */}
        {dashboard.alertasCriticos && dashboard.alertasCriticos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🎯 Alertas Prioritários
              </h2>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                {dashboard.alertasCriticos.length} {dashboard.alertasCriticos.length === 1 ? 'alerta' : 'alertas'}
              </span>
            </div>

            <div className="space-y-3">
              {dashboard.alertasCriticos.map((alerta: any) => (
                <div
                  key={alerta.id}
                  className="p-4 rounded-lg border-2 border-red-200 bg-red-50 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">
                          {alerta.prioridade === 'CRITICA' ? '🚨' : '⚠️'}
                        </span>
                        <h3 className="font-bold text-gray-900">{alerta.titulo}</h3>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                          {alerta.tipo}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2">{alerta.descricao}</p>

                      {alerta.produto && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Produto:</span> {alerta.produto}
                        </p>
                      )}

                      {alerta.unidade && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Unidade:</span> {alerta.unidade}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleMarcarAlertaLido(alerta.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Marcar como lido"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visão Executiva */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Visão Executiva</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Giro de Estoque */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Giro de Estoque</h3>
              <div className="flex items-baseline space-x-2 mb-3">
                <p className="text-3xl font-bold text-gray-900">{dashboard.visaoExecutiva.giroEstoque.valor}x/mês</p>
                <span className="text-sm font-semibold text-green-600">
                  ↗️ +{dashboard.visaoExecutiva.giroEstoque.variacao}%
                </span>
              </div>
              <div className="bg-blue-50 border-l-2 border-blue-400 p-3 rounded">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">💡 </span>
                  Seu estoque está girando mais rápido! Continue otimizando.
                </p>
              </div>
            </div>

            {/* Taxa de Ruptura */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-400">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Taxa de Ruptura</h3>
              <div className="flex items-baseline space-x-2 mb-3">
                <p className="text-3xl font-bold text-gray-900">{dashboard.visaoExecutiva.taxaRuptura.valor}%</p>
                <span className="text-sm font-semibold text-green-600">
                  ↘️ {dashboard.visaoExecutiva.taxaRuptura.variacao}%
                </span>
              </div>
              <div className="bg-orange-50 border-l-2 border-orange-400 p-3 rounded">
                <p className="text-sm text-orange-900">
                  <span className="font-semibold">💡 </span>
                  {dashboard.visaoExecutiva.taxaRuptura.valor < 3 ? 'Excelente! Taxa controlada.' : 'Atenção: acima do ideal (3%)'}
                </p>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Ticket Médio</h3>
              <div className="flex items-baseline space-x-2 mb-3">
                <p className="text-3xl font-bold text-gray-900">R$ {dashboard.visaoExecutiva.ticketMedio.valor.toFixed(2)}</p>
                <span className="text-sm font-semibold text-green-600">
                  ↗️ +{dashboard.visaoExecutiva.ticketMedio.variacao}%
                </span>
              </div>
              <div className="bg-green-50 border-l-2 border-green-400 p-3 rounded">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">💡 </span>
                  Ticket em crescimento! Estratégias de upsell funcionando.
                </p>
              </div>
            </div>

            {/* Margem Líquida */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Margem Líquida</h3>
              <div className="flex items-baseline space-x-2 mb-3">
                <p className="text-3xl font-bold text-gray-900">{dashboard.visaoExecutiva.margemLiquida.valor}%</p>
                <span className="text-sm font-semibold text-red-600">
                  ↘️ {dashboard.visaoExecutiva.margemLiquida.variacao}%
                </span>
              </div>
              <div className="bg-purple-50 border-l-2 border-purple-400 p-3 rounded">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">💡 </span>
                  {dashboard.visaoExecutiva.margemLiquida.valor > 18 ? 'Margem saudável!' : 'Revise precificação e custos.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos de IA */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🧭 Módulos de Inteligência Artificial</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Módulo Compras */}
            <Link href="/gestor/ia/compras">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">🛒</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                  COMPRAS & REPOSIÇÃO
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Previsão de demanda, alertas de ruptura e recomendações de compra
                </p>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 mb-1">
                    {dashboard.modulosIA.compras.insightsPendentes}
                  </p>
                  <p className="text-xs text-gray-600">insights pendentes</p>
                </div>
                <div className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium">
                  Acessar Módulo
                </div>
              </div>
            </Link>

            {/* Módulo Promoções */}
            <Link href="/gestor/ia/promocoes">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">💸</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                  PROMOÇÕES & PREÇOS
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Elasticidade de preço, simulador de promoções e oportunidades
                </p>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {dashboard.modulosIA.promocoes.oportunidades}
                  </p>
                  <p className="text-xs text-gray-600">oportunidades</p>
                </div>
                <div className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium">
                  Acessar Módulo
                </div>
              </div>
            </Link>

            {/* Módulo Conversão */}
            <Link href="/gestor/ia/conversao">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">🛍️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                  CONVERSÃO & FIDELIZAÇÃO
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Taxa de conversão, recompra, ticket médio e NPS
                </p>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600 mb-1">
                    {dashboard.modulosIA.conversao.acoesSugeridas}
                  </p>
                  <p className="text-xs text-gray-600">ações sugeridas</p>
                </div>
                <div className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-medium">
                  Acessar Módulo
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Unidades */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 Suas Unidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboard.unidades.map((unidade: any) => (
              <div key={unidade.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <h3 className="font-semibold text-gray-900">{unidade.nome}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {unidade._count?.estoques || 0} produtos em estoque
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

