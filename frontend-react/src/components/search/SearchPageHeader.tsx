// src/components/search/SearchPageHeader.tsx - Header da Página de Busca
import React from 'react';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  RefreshCw, 
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { useSecurityGuard } from '../../hooks/useSecurityGuard';
import { ProtectedButton } from '../security/ProtectedButton';

interface SearchPageHeaderProps {
  // Status da aplicação
  dataSource?: 'api' | 'local' | 'hybrid';
  jsonLoaded?: boolean;
  apiConnected?: boolean;
  allProductsCount?: number;
  totalViews?: number;
  onReloadData?: () => void;
  
  // Lista atual (apenas para clientes)
  currentList?: {
    nome: string;
    itens: any[];
  };
  onViewList?: () => void;
}

export const SearchPageHeader: React.FC<SearchPageHeaderProps> = ({
  dataSource = 'local',
  jsonLoaded = true,
  apiConnected = false,
  allProductsCount = 0,
  totalViews = 0,
  onReloadData,
  currentList,
  onViewList
}) => {
  const { canUseFeature, userRole } = useSecurityGuard();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="mb-6">
        
        {/* Título Principal */}
        <h1 className="text-3xl font-bold text-[#004A7C] mb-2 flex items-center gap-3">
          🔍 Buscar Produtos PRECIVOX
          
          {/* Badge de Fonte de Dados */}
          {dataSource === 'hybrid' && (
            <span className="text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full">
              ⚡ Híbrido
            </span>
          )}
          
          {/* Badge IA Smart */}
          <span className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            IA Smart
          </span>
        </h1>
        
        {/* Subtítulo */}
        <p className="text-lg text-gray-600">
          Encontre os melhores preços em Franco da Rocha, SP
        </p>
        
        {/* Status da Conexão */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          
          {/* Status Base de Dados Local */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            jsonLoaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <Database className="w-4 h-4" />
            {jsonLoaded ? `${allProductsCount} produtos locais` : 'Dados locais indisponíveis'}
          </div>
          
          {/* Status API */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            apiConnected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {apiConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            API {apiConnected ? 'Online' : 'Offline'}
          </div>

          {/* Badge Busca Inteligente */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
            <Sparkles className="w-4 h-4" />
            Busca Inteligente Ativa
          </div>

          {/* Botão Recarregar */}
          {onReloadData && (
            <button
              onClick={onReloadData}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
          )}
        </div>

        {/* ✅ Info da Lista Atual - APENAS PARA CLIENTES */}
        {canUseFeature('lists') && currentList && currentList.itens && currentList.itens.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h3 className="font-semibold text-blue-900">{currentList.nome}</h3>
                  <p className="text-sm text-blue-700">
                    {currentList.itens.length} itens na sua lista
                  </p>
                </div>
              </div>
              
              {/* Botão Ver Lista Protegido */}
              <ProtectedButton
                feature="lists"
                onClick={onViewList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ver Lista
              </ProtectedButton>
            </div>
          </div>
        )}

        {/* ✅ Mensagem Educativa para Não-Clientes */}
        {!canUseFeature('lists') && userRole && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-amber-900">Modo {userRole}</h3>
                <p className="text-sm text-amber-700">
                  {userRole === 'admin' && 'Funcionalidades de lista são exclusivas para clientes'}
                  {userRole === 'gestor' && 'Use o Analytics para insights sobre compras dos clientes'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Localização e Stats */}
        <div className="flex items-center text-sm text-gray-600 mt-4">
          <MapPin className="h-4 w-4 mr-2 text-[#B9E937]" />
          <span>Buscando em Franco da Rocha, SP</span>
          {totalViews > 0 && (
            <span className="ml-4 text-blue-600">
              • {totalViews.toLocaleString()} visualizações totais
            </span>
          )}
        </div>
      </div>
    </div>
  );
};