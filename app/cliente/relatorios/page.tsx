'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Comparison {
  id: string;
  productName: string;
  originalPrice: number;
  bestPrice: number;
  savings: number;
  store: string;
  date: string;
}

interface Alert {
  id: string;
  productName: string;
  targetPrice: number;
  triggeredPrice: number;
  savings: number;
  date: string;
}

export default function RelatoriosPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Mock data para mercados de pequeno porte
  const comparisons: Comparison[] = [
    {
      id: '1',
      productName: 'Cerveja Skol 350ml (lata)',
      originalPrice: 3.50,
      bestPrice: 3.20,
      savings: 0.30,
      store: 'Supermercado Central',
      date: '2024-01-20'
    },
    {
      id: '2',
      productName: 'Refrigerante Coca-Cola 2L',
      originalPrice: 8.50,
      bestPrice: 7.50,
      savings: 1.00,
      store: 'Mercado do João',
      date: '2024-01-18'
    },
    {
      id: '3',
      productName: 'Pão de Açúcar (kg)',
      originalPrice: 12.00,
      bestPrice: 10.50,
      savings: 1.50,
      store: 'Mercadinho da Esquina',
      date: '2024-01-15'
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      productName: 'Cerveja Skol 350ml (lata)',
      targetPrice: 3.00,
      triggeredPrice: 3.20,
      savings: 0.30,
      date: '2024-01-20'
    },
    {
      id: '2',
      productName: 'Refrigerante Coca-Cola 2L',
      targetPrice: 7.50,
      triggeredPrice: 7.50,
      savings: 1.00,
      date: '2024-01-18'
    }
  ];

  const totalSavings = comparisons.reduce((sum, comp) => sum + comp.savings, 0);
  const totalComparisons = comparisons.length;
  const totalAlerts = alerts.length;
  const averageSavings = totalComparisons > 0 ? totalSavings / totalComparisons : 0;

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7': return 'Últimos 7 dias';
      case '30': return 'Últimos 30 dias';
      case '90': return 'Últimos 90 dias';
      case '365': return 'Último ano';
      default: return 'Todos os períodos';
    }
  };

  return (
    <DashboardLayout role="CLIENTE">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-2">Visualize suas economias e histórico de comparações</p>
          </div>
          <Link 
            href="/cliente/home"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
                <option value="all">Todos os períodos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relatório
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
              >
                <option value="overview">Visão Geral</option>
                <option value="comparisons">Comparações</option>
                <option value="alerts">Alertas</option>
                <option value="savings">Economias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-precivox-blue mb-2">
              {totalComparisons}
            </div>
            <div className="text-sm text-gray-600">Comparações Realizadas</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-precivox-green mb-2">
              R$ {totalSavings.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-sm text-gray-600">Total Economizado</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {totalAlerts}
            </div>
            <div className="text-sm text-gray-600">Alertas Disparados</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              R$ {averageSavings.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-sm text-gray-600">Economia Média</div>
          </div>
        </div>

        {/* Comparisons Report */}
        {selectedReport === 'comparisons' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Histórico de Comparações - {getPeriodLabel(selectedPeriod)}
            </h2>
            
            {comparisons.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-precivox-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-precivox-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma comparação encontrada</h3>
                <p className="text-gray-600">
                  Realize algumas comparações para ver seu histórico aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comparisons.map((comparison) => (
                  <div key={comparison.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{comparison.productName}</h3>
                        <p className="text-sm text-gray-600">{comparison.store}</p>
                        <p className="text-sm text-gray-500">Data: {comparison.date}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Preço original</p>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {comparison.originalPrice.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Melhor preço</p>
                            <p className="text-lg font-semibold text-precivox-blue">
                              R$ {comparison.bestPrice.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Economia</p>
                            <p className="text-lg font-semibold text-precivox-green">
                              R$ {comparison.savings.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Report */}
        {selectedReport === 'alerts' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Histórico de Alertas - {getPeriodLabel(selectedPeriod)}
            </h2>
            
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-precivox-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-precivox-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum alerta disparado</h3>
                <p className="text-gray-600">
                  Configure alertas para ser notificado quando os preços baixarem
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                        <p className="text-sm text-gray-500">Data: {alert.date}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Preço alvo</p>
                            <p className="text-lg font-semibold text-precivox-blue">
                              R$ {alert.targetPrice.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Preço disparado</p>
                            <p className="text-lg font-semibold text-precivox-green">
                              R$ {alert.triggeredPrice.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Economia</p>
                            <p className="text-lg font-semibold text-precivox-green">
                              R$ {alert.savings.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Savings Report */}
        {selectedReport === 'savings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Análise de Economias - {getPeriodLabel(selectedPeriod)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-precivox-blue bg-opacity-10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Economias</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total economizado:</span>
                    <span className="font-semibold text-precivox-green">
                      R$ {totalSavings.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Economia média:</span>
                    <span className="font-semibold text-precivox-blue">
                      R$ {averageSavings.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comparações realizadas:</span>
                    <span className="font-semibold text-gray-900">{totalComparisons}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-precivox-green bg-opacity-10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Impacto dos Alertas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alertas disparados:</span>
                    <span className="font-semibold text-blue-500">{totalAlerts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Economia por alerta:</span>
                    <span className="font-semibold text-precivox-green">
                      R$ {totalAlerts > 0 ? (totalSavings / totalAlerts).toFixed(2).replace('.', ',') : '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxa de sucesso:</span>
                    <span className="font-semibold text-precivox-green">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Report (default) */}
        {selectedReport === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Comparações Recentes</h2>
              {comparisons.slice(0, 3).map((comparison) => (
                <div key={comparison.id} className="border-b border-gray-200 py-3 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{comparison.productName}</p>
                      <p className="text-sm text-gray-600">{comparison.store}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-precivox-green font-semibold">
                        R$ {comparison.savings.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas Recentes</h2>
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="border-b border-gray-200 py-3 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.productName}</p>
                      <p className="text-sm text-gray-600">Disparado em {alert.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-precivox-green font-semibold">
                        R$ {alert.savings.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
