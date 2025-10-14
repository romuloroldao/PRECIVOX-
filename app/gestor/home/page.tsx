'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function GestorHomePage() {
  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-precivox-green to-green-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel do Gestor</h1>
              <p className="text-lg opacity-90">
                Gerencie produtos, preços e análises de mercado
              </p>
            </div>
            <a
              href="/gestor/ia"
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg flex items-center gap-2"
            >
              <span className="text-2xl">🤖</span>
              Painel de IA
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="w-12 h-12 bg-precivox-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-precivox-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Adicionar Produto</h3>
          </button>

          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="w-12 h-12 bg-precivox-green bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-precivox-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Atualizar Preços</h3>
          </button>

          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Análises</h3>
          </button>

          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="w-12 h-12 bg-orange-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-center">Clientes</h3>
          </button>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Produtos Ativos</h3>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-2">Total de produtos cadastrados</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Atualizações Hoje</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Em dia</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-2">Preços atualizados nas últimas 24h</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Clientes Ativos</h3>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">+5</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-2">Clientes usando seus dados</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Atividades Recentes</h2>
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma atividade recente</p>
            <p className="text-sm mt-2">Comece adicionando produtos e atualizando preços</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

