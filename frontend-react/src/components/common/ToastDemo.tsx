// components/common/ToastDemo.tsx - DEMONSTRAÇÃO DO SISTEMA DE TOASTS
import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Loader2,
  Wifi,
  Crown,
  MapPin,
  Key,
  Settings,
  Play
} from 'lucide-react';

const ToastDemo: React.FC = () => {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSmart,
    showLoading,
    showActionToast,
    showTemporaryLoading,
    showNetworkError,
    showUnavailableFeature,
    showLocationPermissionDenied,
    showAuthenticationError,
    showMaintenanceMode,
    clearAllToasts,
    getToastStats
  } = useToast();

  const handleTemporaryLoading = () => {
    const fakeApiCall = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve('Dados carregados com sucesso!');
        } else {
          reject(new Error('Falha no carregamento'));
        }
      }, 2000);
    });

    showTemporaryLoading(
      'Carregando dados do servidor...',
      fakeApiCall,
      'Dados sincronizados!',
      'Falha ao carregar dados'
    );
  };

  const handleActionToast = () => {
    showActionToast(
      'info',
      'Você tem 3 produtos em promoção na sua lista!',
      'Ver Lista',
      () => {
        showSuccess('Navegando para sua lista...');
      },
      {
        title: 'Promoções Encontradas',
        duration: 8000
      }
    );
  };

  const stats = getToastStats();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔔 Sistema de Notificações PRECIVOX
        </h2>
        <p className="text-gray-600">
          Sistema avançado de toasts otimizado para mobile com gestos e animações
        </p>
      </div>

      {/* Estatísticas */}
      {stats.total > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">📊 Estatísticas Ativas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-medium">{stats.total}</span>
            </div>
            <div>
              <span className="text-gray-500">Persistentes:</span>
              <span className="ml-2 font-medium">{stats.persistent}</span>
            </div>
            <div>
              <span className="text-gray-500">Carregando:</span>
              <span className="ml-2 font-medium">{stats.loading}</span>
            </div>
            <div>
              <button
                onClick={clearAllToasts}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Demonstração */}
      <div className="grid gap-4">
        {/* Toasts Básicos */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">🎯 Tipos Básicos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => showSuccess('Produto adicionado à lista!')}
              className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Sucesso
            </button>
            
            <button
              onClick={() => showError('Erro ao conectar com servidor')}
              className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Erro
            </button>
            
            <button
              onClick={() => showWarning('Produto com pouco estoque')}
              className="flex items-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Aviso
            </button>
            
            <button
              onClick={() => showInfo('Nova atualização disponível')}
              className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Info className="w-4 h-4" />
              Info
            </button>
          </div>
        </div>

        {/* Toasts Especiais */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">✨ Tipos Especiais</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => showSmart('IA encontrou 5 produtos similares mais baratos!')}
              className="flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              IA Smart
            </button>
            
            <button
              onClick={() => showLoading('Sincronizando dados...')}
              className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Loader2 className="w-4 h-4" />
              Loading
            </button>
            
            <button
              onClick={handleTemporaryLoading}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <Play className="w-4 h-4" />
              Loading Temp
            </button>
          </div>
        </div>

        {/* Toasts Contextuais */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">🎭 Contextuais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => showNetworkError()}
              className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Wifi className="w-4 h-4" />
              Erro de Rede
            </button>
            
            <button
              onClick={() => showUnavailableFeature('Análise Premium')}
              className="flex items-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Feature Premium
            </button>
            
            <button
              onClick={() => showLocationPermissionDenied()}
              className="flex items-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Localização
            </button>
            
            <button
              onClick={() => showAuthenticationError()}
              className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Key className="w-4 h-4" />
              Auth Error
            </button>
            
            <button
              onClick={() => showMaintenanceMode()}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manutenção
            </button>
            
            <button
              onClick={handleActionToast}
              className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Com Ação
            </button>
          </div>
        </div>
      </div>

      {/* Instruções Mobile */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">📱 Funcionalidades Mobile</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Swipe</strong>: Arraste os toasts para os lados para dispensar</li>
          <li>• <strong>Tap</strong>: Toque em qualquer toast para fechá-lo</li>
          <li>• <strong>Auto-Position</strong>: Toasts se posicionam acima da navegação mobile</li>
          <li>• <strong>Progress Bar</strong>: Indica tempo restante para auto-dismiss</li>
          <li>• <strong>Backdrop Blur</strong>: Efeito visual moderno com transparência</li>
        </ul>
      </div>

      {/* Debug Info */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          🔧 Debug Info
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default ToastDemo;