import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Edit3,
  TrendingDown,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Mail,
  Smartphone,
  Volume2,
  X,
  Save
} from 'lucide-react';

interface ProductSearchResult {
  name: string;
  price: number;
  supermercado: string;
  available: boolean;
}

interface PriceAlert {
  id: string;
  productName: string;
  currentPrice: number;
  targetPrice: number;
  supermercado: string;
  alertType: 'decrease' | 'increase' | 'exact';
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationMethods: ('email' | 'browser' | 'sound')[];
}

interface PriceAlertsProps {
  products: ProductSearchResult[];
}

const PriceAlerts: React.FC<PriceAlertsProps> = ({ products }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [newAlert, setNewAlert] = useState({
    targetPrice: 0,
    alertType: 'decrease' as 'decrease' | 'increase' | 'exact',
    notificationMethods: ['browser'] as ('email' | 'browser' | 'sound')[]
  });

  // Carregar alertas do localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem('precinho_price_alerts');
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        setAlerts(parsed.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined
        })));
      } catch (error) {
        console.error('Erro ao carregar alertas:', error);
      }
    }
  }, []);

  // Salvar alertas no localStorage
  const saveAlerts = (newAlerts: PriceAlert[]) => {
    localStorage.setItem('precinho_price_alerts', JSON.stringify(newAlerts));
    setAlerts(newAlerts);
  };

  // Verificar alertas quando produtos mudarem
  useEffect(() => {
    checkAlerts();
  }, [products, alerts]);

  const checkAlerts = () => {
    const updatedAlerts = alerts.map(alert => {
      if (!alert.isActive || alert.triggeredAt) return alert;

      const product = products.find(p => 
        p.name.toLowerCase().includes(alert.productName.toLowerCase()) &&
        p.supermercado === alert.supermercado
      );

      if (product) {
        const shouldTrigger = checkAlertCondition(alert, product.price);
        if (shouldTrigger) {
          triggerAlert(alert, product.price);
          return {
            ...alert,
            triggeredAt: new Date(),
            isActive: false
          };
        }
      }

      return alert;
    });

    if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
      saveAlerts(updatedAlerts);
    }
  };

  const checkAlertCondition = (alert: PriceAlert, currentPrice: number): boolean => {
    switch (alert.alertType) {
      case 'decrease':
        return currentPrice <= alert.targetPrice;
      case 'increase':
        return currentPrice >= alert.targetPrice;
      case 'exact':
        return Math.abs(currentPrice - alert.targetPrice) < 0.01;
      default:
        return false;
    }
  };

  const triggerAlert = (alert: PriceAlert, currentPrice: number) => {
    // Notificação do browser
    if (alert.notificationMethods.includes('browser') && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🎯 Alerta de Preço - Precinho`, {
          body: `${alert.productName} atingiu R$ ${currentPrice.toFixed(2)} no ${alert.supermercado}!`,
          icon: '/favicon.ico'
        });
      }
    }

    // Som de notificação
    if (alert.notificationMethods.includes('sound')) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj');
      audio.play().catch(console.error);
    }

    console.log(`🔔 Alerta disparado: ${alert.productName} - R$ ${currentPrice.toFixed(2)}`);
  };

  const createAlert = () => {
    if (!selectedProduct) return;

    const alert: PriceAlert = {
      id: Date.now().toString(),
      productName: selectedProduct.name,
      currentPrice: selectedProduct.price,
      targetPrice: newAlert.targetPrice,
      supermercado: selectedProduct.supermercado,
      alertType: newAlert.alertType,
      isActive: true,
      createdAt: new Date(),
      notificationMethods: newAlert.notificationMethods
    };

    saveAlerts([...alerts, alert]);
    setShowCreateModal(false);
    setSelectedProduct(null);
    setNewAlert({
      targetPrice: 0,
      alertType: 'decrease',
      notificationMethods: ['browser']
    });
  };

  const deleteAlert = (id: string) => {
    saveAlerts(alerts.filter(alert => alert.id !== id));
  };

  const toggleAlert = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    );
    saveAlerts(updatedAlerts);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'decrease': return TrendingDown;
      case 'increase': return TrendingUp;
      case 'exact': return Target;
      default: return Bell;
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'decrease': return 'text-green-600 bg-green-100';
      case 'increase': return 'text-red-600 bg-red-100';
      case 'exact': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAlertType = (alertType: string) => {
    switch (alertType) {
      case 'decrease': return 'Diminuir para';
      case 'increase': return 'Aumentar para';
      case 'exact': return 'Atingir exatamente';
      default: return alertType;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-white" />
            <h3 className="text-xl font-bold text-white">🔔 Alertas de Preço</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">
              {alerts.filter(a => a.isActive).length} ativos
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Alerta
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta criado</h3>
            <p className="text-gray-500 mb-4">
              Crie alertas para ser notificado quando os preços mudarem!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Alerta
            </button>
          </div>
        ) : (
          alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.alertType);
            const alertColor = getAlertColor(alert.alertType);

            return (
              <div key={alert.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`p-2 rounded-full ${alertColor}`}>
                        <AlertIcon className="h-4 w-4" />
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : alert.triggeredAt 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.isActive ? 'Ativo' : alert.triggeredAt ? 'Disparado' : 'Inativo'}
                      </span>
                      {alert.triggeredAt && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {alert.productName}
                    </h4>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>{alert.supermercado}</span>
                      <span>•</span>
                      <span>{formatAlertType(alert.alertType)} R$ {alert.targetPrice.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Criado: {alert.createdAt.toLocaleDateString()}</span>
                      </div>
                      {alert.triggeredAt && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Disparado: {alert.triggeredAt.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center space-x-2">
                      {alert.notificationMethods.map(method => {
                        const Icon = method === 'email' ? Mail : method === 'browser' ? Bell : Volume2;
                        return (
                          <div key={method} className="flex items-center space-x-1 text-xs text-gray-500">
                            <Icon className="h-3 w-3" />
                            <span className="capitalize">{method}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        alert.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={alert.isActive ? 'Desativar alerta' : 'Ativar alerta'}
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar alerta"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar alerta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criar/Editar Alerta */}
      {(showCreateModal || editingAlert) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAlert ? 'Editar Alerta' : 'Criar Novo Alerta'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAlert(null);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Seleção de Produto */}
              {!editingAlert && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Produto
                  </label>
                  <select
                    value={selectedProduct?.name || ''}
                    onChange={(e) => {
                      const product = products.find(p => p.name === e.target.value);
                      setSelectedProduct(product || null);
                      if (product) {
                        setNewAlert(prev => ({ ...prev, targetPrice: product.price * 0.9 }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Escolha um produto...</option>
                    {products.slice(0, 50).map(product => (
                      <option key={`${product.name}-${product.supermercado}`} value={product.name}>
                        {product.name} - {product.supermercado} (R$ {product.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preço Atual */}
              {selectedProduct && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Preço atual:</div>
                  <div className="text-lg font-semibold text-gray-900">
                    R$ {selectedProduct.price.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Tipo de Alerta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Alerta
                </label>
                <select
                  value={newAlert.alertType}
                  onChange={(e) => setNewAlert(prev => ({ 
                    ...prev, 
                    alertType: e.target.value as 'decrease' | 'increase' | 'exact'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="decrease">Alertar quando diminuir para</option>
                  <option value="increase">Alertar quando aumentar para</option>
                  <option value="exact">Alertar quando atingir exatamente</option>
                </select>
              </div>

              {/* Preço Alvo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Alvo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert(prev => ({ 
                    ...prev, 
                    targetPrice: Number(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Métodos de Notificação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Métodos de Notificação
                </label>
                <div className="space-y-2">
                  {(['browser', 'sound'] as const).map(method => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAlert.notificationMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAlert(prev => ({
                              ...prev,
                              notificationMethods: [...prev.notificationMethods, method]
                            }));
                          } else {
                            setNewAlert(prev => ({
                              ...prev,
                              notificationMethods: prev.notificationMethods.filter(m => m !== method)
                            }));
                          }
                        }}
                        className="mr-3 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {method === 'browser' ? 'Notificação do Navegador' : 
                         method === 'sound' ? 'Som de Alerta' : method}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissão de Notificação */}
              {'Notification' in window && Notification.permission === 'default' && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Permita notificações para receber alertas
                    </span>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
                  >
                    Permitir notificações
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAlert(null);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createAlert}
                disabled={!selectedProduct || newAlert.targetPrice <= 0}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingAlert ? 'Salvar' : 'Criar Alerta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceAlerts;