// components/AutoDiscoveryStatus.tsx - Status do Sistema de Autodescoberta
import React from 'react';

interface AutoDiscoveryStatusProps {
  totalSources: number;
  totalMarkets: number;
  lastLoadTime: number;
  totalProducts: number;
  loading: boolean;
  error?: string | null;
}

export const AutoDiscoveryStatus: React.FC<AutoDiscoveryStatusProps> = ({
  totalSources,
  totalMarkets,
  lastLoadTime,
  totalProducts,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
          <div>
            <p className="text-blue-800 font-medium">🔍 Descobrindo fontes de dados...</p>
            <p className="text-blue-600 text-sm">Carregando arquivos JSON automaticamente</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="text-red-500 mr-3">❌</div>
          <div>
            <p className="text-red-800 font-medium">Erro na autodescoberta</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (totalSources === 0 && totalProducts === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="text-yellow-500 mr-3">⚠️</div>
          <div>
            <p className="text-yellow-800 font-medium">Nenhum dado encontrado</p>
            <p className="text-yellow-600 text-sm">Verifique se o backend está rodando e tem dados carregados</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-green-500 mr-3">✅</div>
          <div>
            <p className="text-green-800 font-medium">
              {totalSources} fontes descobertas automaticamente
            </p>
            <p className="text-green-600 text-sm">
              {totalProducts} produtos • {totalMarkets} mercados • {lastLoadTime}ms
            </p>
          </div>
        </div>
        <div className="text-green-600 text-xs">
          🚀 Autodescoberta
        </div>
      </div>
    </div>
  );
};

export default AutoDiscoveryStatus;