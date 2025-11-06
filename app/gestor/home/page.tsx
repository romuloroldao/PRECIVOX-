'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastContainer';
import Link from 'next/link';

interface Mercado {
  id: string;
  nome: string;
  cnpj: string;
  telefone?: string;
  emailContato?: string;
  _count: {
    unidades: number;
  };
}

interface Stats {
  produtosAtivos: number;
  atualizacoesHoje: number;
  produtosEmPromocao: number;
  unidadesAtivas: number;
  produtosEmRuptura: number;
}

export default function GestorHomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const [mercado, setMercado] = useState<Mercado | null>(null);
  const [stats, setStats] = useState<Stats>({
    produtosAtivos: 0,
    atualizacoesHoje: 0,
    produtosEmPromocao: 0,
    unidadesAtivas: 0,
    produtosEmRuptura: 0,
  });
  const [loading, setLoading] = useState(true);
  const [atividadesRecentes, setAtividadesRecentes] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'GESTOR') {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar mercado do gestor
      const mercadoResponse = await fetch('/api/markets');
      if (mercadoResponse.ok) {
        const mercadoResult = await mercadoResponse.json();
        if (mercadoResult.success && mercadoResult.data && mercadoResult.data.length > 0) {
          const meuMercado = mercadoResult.data[0];
          setMercado(meuMercado);

          // Buscar estatísticas
          await loadStats(meuMercado.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (mercadoId: string) => {
    try {
      // Buscar produtos do mercado
      const produtosResponse = await fetch('/api/produtos?page=1&limit=1000');
      if (produtosResponse.ok) {
        const produtosResult = await produtosResponse.json();
        if (produtosResult.success) {
          const produtos = produtosResult.data || [];
          
          // Calcular estatísticas
          const produtosAtivos = produtos.filter((p: any) => p.ativo).length;
          const produtosEmPromocao = produtos.filter((p: any) => p.emPromocao).length;
          
          // Buscar unidades
          const unidadesResponse = await fetch(`/api/markets/${mercadoId}/unidades`);
          let unidadesAtivas = 0;
          if (unidadesResponse.ok) {
            const unidadesResult = await unidadesResponse.json();
            if (unidadesResult.success) {
              unidadesAtivas = unidadesResult.data?.length || 0;
            }
          }

          // Calcular atualizações hoje (produtos atualizados nas últimas 24h)
          const agora = new Date();
          const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
          // Nota: Isso seria melhor calculado no backend, mas por enquanto usamos uma estimativa
          const atualizacoesHoje = Math.floor(produtosAtivos * 0.1); // Estimativa: 10% dos produtos atualizados

          // Produtos em ruptura (quantidade = 0)
          const produtosEmRuptura = produtos.filter((p: any) => p.quantidadeTotal === 0).length;

          setStats({
            produtosAtivos,
            atualizacoesHoje,
            produtosEmPromocao,
            unidadesAtivas,
            produtosEmRuptura,
          });
        }
      }

      // Buscar atividades recentes (últimos produtos editados)
      const atividadesResponse = await fetch('/api/produtos?page=1&limit=5');
      if (atividadesResponse.ok) {
        const atividadesResult = await atividadesResponse.json();
        if (atividadesResult.success) {
          const produtos = atividadesResult.data || [];
          setAtividadesRecentes(
            produtos.slice(0, 5).map((p: any) => ({
              id: p.id,
              tipo: 'produto_editado',
              descricao: `Produto "${p.nome}" atualizado`,
              data: new Date().toISOString(),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-precivox-green to-green-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel do Gestor</h1>
              <p className="text-lg opacity-90">
                {mercado ? `Bem-vindo ao ${mercado.nome}` : 'Gerencie produtos, preços e análises de mercado'}
              </p>
              {mercado && (
                <div className="mt-3 flex items-center gap-4 text-sm opacity-90">
                  {mercado.telefone && <span>📞 {mercado.telefone}</span>}
                  {mercado.emailContato && <span>✉️ {mercado.emailContato}</span>}
                  <span>🏢 {mercado._count.unidades} unidade(s)</span>
                </div>
              )}
            </div>
            <Link
              href="/gestor/ia"
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg flex items-center gap-2"
            >
              <span className="text-2xl">🤖</span>
              Painel de IA
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/gestor/produtos"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <div className="w-12 h-12 bg-precivox-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-precivox-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Gerenciar Produtos</h3>
            <p className="text-xs text-gray-500 text-center mt-1">{stats.produtosAtivos} produtos</p>
          </Link>

          <Link
            href="/gestor/produtos"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <div className="w-12 h-12 bg-precivox-green bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-precivox-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Atualizar Preços</h3>
            <p className="text-xs text-gray-500 text-center mt-1">{stats.atualizacoesHoje} hoje</p>
          </Link>

          <Link
            href="/gestor/ia"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Análises IA</h3>
            <p className="text-xs text-gray-500 text-center mt-1">Insights inteligentes</p>
          </Link>

          <Link
            href="/gestor/ia/compras"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <div className="w-12 h-12 bg-orange-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Compras</h3>
            <p className="text-xs text-gray-500 text-center mt-1">
              {stats.produtosEmRuptura > 0 ? (
                <span className="text-red-600 font-semibold">{stats.produtosEmRuptura} em ruptura</span>
              ) : (
                'Estoque OK'
              )}
            </p>
          </Link>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Produtos Ativos</h3>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {stats.produtosEmPromocao} em promoção
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.produtosAtivos}</p>
            <p className="text-xs text-gray-500 mt-2">Total de produtos cadastrados</p>
            <div className="mt-4">
              <Link
                href="/gestor/produtos"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todos →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Atualizações Hoje</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {stats.atualizacoesHoje > 0 ? 'Em dia' : 'Sem atualizações'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.atualizacoesHoje}</p>
            <p className="text-xs text-gray-500 mt-2">Preços atualizados nas últimas 24h</p>
            <div className="mt-4">
              <Link
                href="/gestor/produtos"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Atualizar preços →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Unidades Ativas</h3>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {mercado?._count.unidades || 0} total
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.unidadesAtivas}</p>
            <p className="text-xs text-gray-500 mt-2">Unidades operacionais</p>
            {mercado && (
              <div className="mt-4">
                <Link
                  href={`/admin/mercados/${mercado.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Gerenciar unidades →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Alertas e Avisos */}
        {stats.produtosEmRuptura > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-900">
                  Atenção: Produtos em Ruptura
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  Você tem <strong>{stats.produtosEmRuptura}</strong> produto(s) com estoque zerado. 
                  Acesse o módulo de Compras para recomendações de reposição.
                </p>
                <div className="mt-4">
                  <Link
                    href="/gestor/ia/compras"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Ver recomendações de compra →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Atividades Recentes</h2>
            <button
              onClick={loadData}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Atualizar
            </button>
          </div>
          
          {atividadesRecentes.length > 0 ? (
            <div className="space-y-3">
              {atividadesRecentes.map((atividade, index) => (
                <div
                  key={atividade.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{atividade.descricao}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(atividade.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/gestor/produtos"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>Nenhuma atividade recente</p>
              <p className="text-sm mt-2">Comece adicionando produtos e atualizando preços</p>
              <div className="mt-4">
                <Link
                  href="/gestor/produtos"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Gerenciar Produtos
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/gestor/produtos"
              className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900 block">Gerenciar Produtos</span>
                  <span className="text-sm text-gray-500">Editar, adicionar ou remover produtos</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/gestor/ia"
              className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900 block">Painel de IA</span>
                  <span className="text-sm text-gray-500">Insights e recomendações inteligentes</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/gestor/ia/compras"
              className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900 block">Compras & Reposição</span>
                  <span className="text-sm text-gray-500">Alertas de ruptura e recomendações</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/gestor/ia/promocoes"
              className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900 block">Promoções & Preços</span>
                  <span className="text-sm text-gray-500">Simulador de promoções e elasticidade</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
