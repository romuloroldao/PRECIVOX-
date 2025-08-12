// AdminDashboardPage.tsx - PAINEL ADMINISTRATIVO COMPLETO
import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Store, 
  Upload, 
  CreditCard, 
  BarChart3,
  Settings,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  Package
} from 'lucide-react';
import { usePermissions } from '../hooks/useAuth';
import MarketManager from '../components/admin/MarketManager';
import UserManager from '../components/admin/UserManager';
import SubscriptionManager from '../components/admin/SubscriptionManager';
import MarketAnalyticsAccess from '../components/admin/MarketAnalyticsAccess';
import ProductManager from '../components/admin/ProductManager';

interface AdminDashboardPageProps {
  onNavigate?: (page: string) => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { isAdmin, canAccessAdminPanel } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ PROTEÇÃO DE ACESSO - MOBILE OTIMIZADO
  if (!canAccessAdminPanel()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 sm:p-8 max-w-md w-full">
          <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <button
            onClick={() => onNavigate?.('search')}
            className="bg-[#004A7C] text-white px-6 py-3 rounded-lg hover:bg-[#0066A3] transition-all duration-300 w-full sm:w-auto"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // ✅ DADOS MOCK PARA DEMONSTRAÇÃO
  const systemStats = {
    totalMarkets: 47,
    activeMarkets: 42,
    totalUsers: 1340,
    totalRevenue: 125650.80,
    marketsPendingApproval: 3,
    suspendedMarkets: 2,
    monthlyGrowth: 12.5,
    activeSubscriptions: 39
  };

  const recentMarkets = [
    {
      id: 'market-001',
      name: 'Supermercado Vila Nova',
      city: 'Franco da Rocha',
      state: 'SP',
      status: 'active',
      plan: 'premium',
      revenue: 15420.50,
      users: 156,
      createdAt: '2024-01-15'
    },
    {
      id: 'market-002', 
      name: 'Mercado Central',
      city: 'São Paulo',
      state: 'SP',
      status: 'pending',
      plan: 'basic',
      revenue: 0,
      users: 0,
      createdAt: '2024-01-29'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'markets', label: 'Mercados', icon: Store },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
    { id: 'analytics', label: 'Analytics Global', icon: TrendingUp }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Mobile Otimizado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600">Total de Mercados</p>
              <p className="text-xl sm:text-2xl font-bold text-[#004A7C]">{systemStats.totalMarkets}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center">
            <span className="text-xs sm:text-sm text-green-600 font-medium">
              +{systemStats.monthlyGrowth}% este mês
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-[#004A7C]">{systemStats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-blue-600 font-medium">
              {systemStats.activeMarkets} mercados ativos
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-[#004A7C]">
                {formatCurrency(systemStats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-purple-600 font-medium">
              {systemStats.activeSubscriptions} assinaturas ativas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendências</p>
              <p className="text-2xl font-bold text-[#004A7C]">
                {systemStats.marketsPendingApproval}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-orange-600 font-medium">
              Requer aprovação
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity - Mobile Otimizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-[#004A7C] mb-3 sm:mb-4">Mercados Recentes</h3>
          <div className="space-y-3 sm:space-y-4">
            {recentMarkets.map((market) => (
              <div key={market.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{market.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">{market.city}, {market.state}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(market.status)}`}>
                    {market.status === 'active' ? 'Ativo' : 
                     market.status === 'pending' ? 'Pendente' : 'Suspenso'}
                  </span>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{market.plan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-[#004A7C] mb-3 sm:mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { icon: Plus, label: 'Novo Mercado', color: 'bg-blue-500', action: () => setActiveTab('markets') },
              { icon: Users, label: 'Gerenciar Usuários', color: 'bg-green-500', action: () => setActiveTab('users') },
              { icon: Upload, label: 'Upload Dados', color: 'bg-purple-500', action: () => setActiveTab('uploads') },
              { icon: BarChart3, label: 'Relatórios', color: 'bg-orange-500', action: () => setActiveTab('analytics') }
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-all duration-300 border border-gray-100"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${action.color} rounded-lg flex items-center justify-center shadow-sm`}>
                  <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 font-medium text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'markets':
        return <MarketManager />;
      case 'products':
        return <ProductManager />;
      case 'users':
        return <UserManager />;
      case 'subscriptions':
        return <SubscriptionManager />;
      case 'analytics':
        return <MarketAnalyticsAccess />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Otimizado */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-[#004A7C] flex items-center gap-2">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="truncate">Painel Administrativo</span>
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 hidden sm:block">
                Gestão completa do sistema PRECIVOX
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('profile')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-[#004A7C] hover:bg-gray-100 rounded-lg transition-all duration-300 flex-shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Mobile Scroll */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-8 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#004A7C] text-[#004A7C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Mobile Padding */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboardPage;