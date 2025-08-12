import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Crown,
  Zap,
  Star,
  X,
  Save
} from 'lucide-react';

interface Subscription {
  id: string;
  marketId: string;
  marketName: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  paymentMethod: string;
  lastPaymentDate: string | null;
  autoRenew: boolean;
}

const SubscriptionManager: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: 'sub-001',
      marketId: 'market-001',
      marketName: 'Supermercado Vila Nova',
      plan: 'premium',
      status: 'active',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2025-01-15T00:00:00Z',
      nextBillingDate: '2024-02-15T00:00:00Z',
      monthlyPrice: 199.90,
      yearlyPrice: 1999.00,
      billingCycle: 'monthly',
      features: ['Unlimited products', 'Advanced analytics', 'Priority support', 'Custom branding'],
      paymentMethod: 'Cartão de Crédito ****1234',
      lastPaymentDate: '2024-01-15T00:00:00Z',
      autoRenew: true
    },
    {
      id: 'sub-002',
      marketId: 'market-002',
      marketName: 'Mercado Central',
      plan: 'basic',
      status: 'active',
      startDate: '2024-01-29T00:00:00Z',
      endDate: '2025-01-29T00:00:00Z',
      nextBillingDate: '2024-02-29T00:00:00Z',
      monthlyPrice: 99.90,
      yearlyPrice: 999.00,
      billingCycle: 'monthly',
      features: ['Up to 1000 products', 'Basic analytics', 'Email support'],
      paymentMethod: 'PIX',
      lastPaymentDate: '2024-01-29T00:00:00Z',
      autoRenew: true
    },
    {
      id: 'sub-003',
      marketId: 'market-003',
      marketName: 'Mercado Popular',
      plan: 'enterprise',
      status: 'expired',
      startDate: '2023-12-01T00:00:00Z',
      endDate: '2024-01-01T00:00:00Z',
      nextBillingDate: '2024-02-01T00:00:00Z',
      monthlyPrice: 399.90,
      yearlyPrice: 3999.00,
      billingCycle: 'yearly',
      features: ['Unlimited everything', 'Custom integrations', 'Dedicated support', 'White-label'],
      paymentMethod: 'Boleto Bancário',
      lastPaymentDate: '2023-12-01T00:00:00Z',
      autoRenew: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.marketName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || sub.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic':
        return <Star className="w-4 h-4" />;
      case 'premium':
        return <Crown className="w-4 h-4" />;
      case 'enterprise':
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'cancelled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'Básico';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Enterprise';
      default:
        return plan;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription({ ...subscription });
    setShowEditModal(true);
  };

  const handleSaveSubscription = () => {
    if (editingSubscription) {
      setSubscriptions(subscriptions.map(s => 
        s.id === editingSubscription.id ? editingSubscription : s
      ));
      setShowEditModal(false);
      setEditingSubscription(null);
    }
  };

  const handleCancelSubscription = (subId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta assinatura?')) {
      setSubscriptions(subscriptions.map(s => 
        s.id === subId ? { ...s, status: 'cancelled', autoRenew: false } : s
      ));
    }
  };

  const handleRenewSubscription = (subId: string) => {
    const subscription = subscriptions.find(s => s.id === subId);
    if (subscription) {
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      
      setSubscriptions(subscriptions.map(s => 
        s.id === subId ? { 
          ...s, 
          status: 'active', 
          endDate: newEndDate.toISOString(),
          lastPaymentDate: new Date().toISOString()
        } : s
      ));
    }
  };

  // Calculate stats
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.billingCycle === 'monthly' ? s.monthlyPrice : s.yearlyPrice / 12), 0);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const expiringThisMonth = subscriptions.filter(s => {
    const daysUntilExpiry = calculateDaysUntilExpiry(s.endDate);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl font-bold text-[#004A7C] flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="truncate">Gerenciamento de Assinaturas</span>
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
            Gerencie planos, pagamentos e renovações das assinaturas
          </p>
        </div>
        <button
          onClick={() => {/* Add new subscription functionality */}}
          className="bg-[#004A7C] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Assinatura</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-[#004A7C]">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assinaturas Ativas</p>
              <p className="text-2xl font-bold text-[#004A7C]">{activeSubscriptions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencem em 30 dias</p>
              <p className="text-2xl font-bold text-[#004A7C]">{expiringThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assinaturas</p>
              <p className="text-2xl font-bold text-[#004A7C]">{subscriptions.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar mercados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            >
              <option value="all">Todos os Planos</option>
              <option value="basic">Básico</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="cancelled">Cancelado</option>
              <option value="expired">Expirado</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mercado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próx. Cobrança
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Renovação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-[#004A7C] rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{subscription.marketName}</div>
                        <div className="text-sm text-gray-500">{subscription.paymentMethod}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPlanIcon(subscription.plan)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(subscription.plan)}`}>
                        {getPlanLabel(subscription.plan)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                      {getStatusLabel(subscription.status)}
                    </span>
                    {subscription.status === 'active' && calculateDaysUntilExpiry(subscription.endDate) <= 30 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Expira em {calculateDaysUntilExpiry(subscription.endDate)} dias
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(subscription.billingCycle === 'monthly' ? subscription.monthlyPrice : subscription.yearlyPrice)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {subscription.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(subscription.nextBillingDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      subscription.autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {subscription.autoRenew ? 'Automática' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSubscription(subscription)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-all"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {subscription.status === 'active' && (
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-all"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
                        <button
                          onClick={() => handleRenewSubscription(subscription.id)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-all"
                          title="Renovar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      {showEditModal && editingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#004A7C]">Editar Assinatura</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plano
                  </label>
                  <select
                    value={editingSubscription.plan}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription, 
                      plan: e.target.value as Subscription['plan']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingSubscription.status}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription, 
                      status: e.target.value as Subscription['status']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  >
                    <option value="active">Ativo</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="expired">Expirado</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciclo de Cobrança
                  </label>
                  <select
                    value={editingSubscription.billingCycle}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription, 
                      billingCycle: e.target.value as 'monthly' | 'yearly'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingSubscription.autoRenew}
                      onChange={(e) => setEditingSubscription({
                        ...editingSubscription, 
                        autoRenew: e.target.checked
                      })}
                      className="rounded border-gray-300 text-[#004A7C] focus:ring-[#004A7C]"
                    />
                    <span>Renovação Automática</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSubscription}
                className="bg-[#004A7C] text-white px-6 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;