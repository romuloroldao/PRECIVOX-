'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Geral', icon: '⚙️' },
    { id: 'social', label: 'Login Social', icon: '🔗' },
    { id: 'security', label: 'Segurança', icon: '🔒' },
    { id: 'notifications', label: 'Notificações', icon: '🔔' },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações gerais do PRECIVOX</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 bg-white rounded-xl shadow-md p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-xl shadow-md p-6">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'social' && <SocialSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Configurações Gerais</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Sistema
          </label>
          <input
            type="text"
            defaultValue="PRECIVOX"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Base
          </label>
          <input
            type="text"
            defaultValue="https://precivox.com.br"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuso Horário
          </label>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="America/Sao_Paulo">America/São_Paulo (GMT-3)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma
          </label>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

function SocialSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Login Social</h2>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">G</span>
              </div>
              <span className="font-medium">Google</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Client ID"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Client Secret"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">f</span>
              </div>
              <span className="font-medium">Facebook</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="App ID"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="App Secret"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">in</span>
              </div>
              <span className="font-medium">LinkedIn</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Client ID"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Client Secret"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo de expiração do token (dias)
          </label>
          <input
            type="number"
            defaultValue="7"
            min="1"
            max="30"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tentativas de login antes do bloqueio
          </label>
          <input
            type="number"
            defaultValue="5"
            min="3"
            max="10"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require-2fa"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="require-2fa" className="ml-2 text-sm text-gray-700">
            Exigir autenticação de dois fatores para administradores
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="audit-log"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            defaultChecked
          />
          <label htmlFor="audit-log" className="ml-2 text-sm text-gray-700">
            Manter log de auditoria de ações administrativas
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Novos usuários registrados</h3>
            <p className="text-sm text-gray-500">Receber notificação quando um novo usuário se registra</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Falhas de login</h3>
            <p className="text-sm text-gray-500">Receber notificação sobre tentativas de login suspeitas</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Alertas do sistema</h3>
            <p className="text-sm text-gray-500">Receber notificação sobre problemas do sistema</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
