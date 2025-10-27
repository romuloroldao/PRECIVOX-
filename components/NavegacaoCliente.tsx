// Componente de Navegação para a Jornada do Cliente
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavegacaoClienteProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function NavegacaoCliente({ activeTab = 'buscar', onTabChange }: NavegacaoClienteProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(activeTab);

  const tabs = [
    {
      key: 'buscar',
      label: 'Buscar Produtos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      description: 'Encontre produtos e compare preços'
    },
    {
      key: 'listas',
      label: 'Minhas Listas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      description: 'Gerencie suas listas de compras'
    },
    {
      key: 'comparacao',
      label: 'Comparação',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Compare produtos entre mercados'
    },
    {
      key: 'ia',
      label: 'Inteligência',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      description: 'Recomendações e análises'
    },
    {
      key: 'historico',
      label: 'Histórico',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Seu histórico de buscas'
    }
  ];

  const handleTabClick = (tabKey: string) => {
    setCurrentTab(tabKey);
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                currentTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs text-gray-400 hidden sm:block">
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
