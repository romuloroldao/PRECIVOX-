'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function ClienteHomePage() {
  return (
    <DashboardLayout role="CLIENTE">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-precivox-blue to-blue-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao PRECIVOX!</h1>
          <p className="text-lg opacity-90">
            Sua plataforma inteligente de comparação de preços
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-precivox-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-precivox-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Comparar Preços
            </h3>
            <p className="text-gray-600 text-sm">
              Compare preços de produtos em tempo real e economize nas suas compras
            </p>
            <button className="mt-4 text-precivox-blue font-medium text-sm hover:underline">
              Começar agora →
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-precivox-green bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-precivox-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Alertas de Preço
            </h3>
            <p className="text-gray-600 text-sm">
              Receba notificações quando o preço dos seus produtos favoritos baixar
            </p>
            <button className="mt-4 text-precivox-blue font-medium text-sm hover:underline">
              Criar alerta →
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Relatórios
            </h3>
            <p className="text-gray-600 text-sm">
              Visualize suas economias e histórico de comparações
            </p>
            <button className="mt-4 text-precivox-blue font-medium text-sm hover:underline">
              Ver relatórios →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Suas Estatísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-precivox-blue">0</p>
              <p className="text-sm text-gray-600 mt-1">Produtos Comparados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-precivox-green">R$ 0,00</p>
              <p className="text-sm text-gray-600 mt-1">Economia Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">0</p>
              <p className="text-sm text-gray-600 mt-1">Alertas Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">0</p>
              <p className="text-sm text-gray-600 mt-1">Favoritos</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

