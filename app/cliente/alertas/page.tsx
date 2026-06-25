'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { ClientePage } from '@/components/cliente/ClientePage';
import { EmptyState } from '@/components/ui';
import { Button } from '@/components/ui';

interface PriceAlert {
  id: string;
  productName: string;
  currentPrice: number;
  targetPrice: number;
  store: string;
  status: 'active' | 'triggered' | 'expired';
  createdAt: string;
  triggeredAt?: string;
}

export default function AlertasPrecoPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    productName: '',
    targetPrice: '',
    store: ''
  });

  // Mock data para mercados de pequeno porte
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: '1',
      productName: 'Cerveja Skol 350ml (lata)',
      currentPrice: 3.50,
      targetPrice: 3.00,
      store: 'Mercado do João',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      productName: 'Refrigerante Coca-Cola 2L',
      currentPrice: 8.50,
      targetPrice: 7.50,
      store: 'Supermercado Central',
      status: 'triggered',
      createdAt: '2024-01-10',
      triggeredAt: '2024-01-20'
    },
    {
      id: '3',
      productName: 'Pão de Açúcar (kg)',
      currentPrice: 12.00,
      targetPrice: 10.00,
      store: 'Mercadinho da Esquina',
      status: 'expired',
      createdAt: '2024-01-05'
    }
  ]);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.productName || !newAlert.targetPrice) return;

    const alert: PriceAlert = {
      id: Date.now().toString(),
      productName: newAlert.productName,
      currentPrice: 0, // Será preenchido quando o produto for encontrado
      targetPrice: parseFloat(newAlert.targetPrice),
      store: newAlert.store || 'Todas as lojas',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAlerts([alert, ...alerts]);
    setNewAlert({ productName: '', targetPrice: '', store: '' });
    setShowCreateForm(false);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'triggered':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'triggered':
        return 'Disparado';
      case 'expired':
        return 'Expirado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title="Alertas de preço"
        description="Configure alertas para ser notificado quando os preços baixarem"
        actions={
          <div className="flex gap-2">
            <Link
              href="/cliente/home"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>
            <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
              Criar alerta
            </Button>
          </div>
        }
      >
      <div className="space-y-6">
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Criar Novo Alerta</h2>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={newAlert.productName}
                  onChange={(e) => setNewAlert({ ...newAlert, productName: e.target.value })}
                  placeholder="Ex: Cerveja Skol, Refrigerante Coca-Cola, Pão de Açúcar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Alvo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                    placeholder="3.50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loja (opcional)
                  </label>
                  <input
                    type="text"
                    value={newAlert.store}
                    onChange={(e) => setNewAlert({ ...newAlert, store: e.target.value })}
                    placeholder="Ex: Mercado do João, Supermercado Central"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar Alerta
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seus Alertas</h2>
          
          {alerts.length === 0 ? (
            <EmptyState
              title="Nenhum alerta criado"
              message="Crie seu primeiro alerta para ser notificado quando os preços baixarem"
              action={{
                label: 'Criar primeiro alerta',
                onClick: () => setShowCreateForm(true),
              }}
            />
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                      <p className="text-sm text-gray-600">{alert.store}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600">
                          Preço atual: <span className="font-medium">R$ {alert.currentPrice.toFixed(2).replace('.', ',')}</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Alerta em: <span className="font-medium text-precivox-blue">R$ {alert.targetPrice.toFixed(2).replace('.', ',')}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alert.status)}`}>
                        {getStatusText(alert.status)}
                      </span>
                      
                      {alert.status === 'triggered' && (
                        <div className="text-right">
                          <p className="text-sm text-precivox-green font-medium">
                            Alerta disparado em {alert.triggeredAt}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Excluir alerta"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-precivox-blue mb-2">
              {alerts.filter(a => a.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Alertas Ativos</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-precivox-green mb-2">
              {alerts.filter(a => a.status === 'triggered').length}
            </div>
            <div className="text-sm text-gray-600">Alertas Disparados</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-500 mb-2">
              {alerts.filter(a => a.status === 'expired').length}
            </div>
            <div className="text-sm text-gray-600">Alertas Expirados</div>
          </div>
        </div>
      </div>
      </ClientePage>
    </DashboardLayout>
  );
}
