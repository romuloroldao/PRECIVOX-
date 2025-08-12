// ProfilePage.tsx - MOBILE-FIRST UX REDESIGN
import React, { useState } from 'react';
import { 
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  LogOut,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Award,
  TrendingUp,
  ShoppingCart,
  Clock,
  Heart,
  AlertTriangle,
  Loader2,
  Store,
  Crown,
  ChevronRight,
  BarChart3,
  Target,
  Users,
  PieChart
} from 'lucide-react';
import { useAuth, usePermissions } from '../hooks/useAuth';

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onLogout }) => {
  const { user, logout, isLoading } = useAuth();
  const { canAccessAdminPanel } = usePermissions();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ FUNÇÃO DE LOGOUT INTEGRADA
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('🚪 Iniciando logout...');
      
      await logout(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onLogout?.();
      console.log('✅ Logout concluído');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirmation(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  // ✅ FALLBACK SE NÃO HOUVER USUÁRIO
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full animate-pulse mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-600">Carregando perfil...</h2>
        </div>
      </div>
    );
  }

  // ✅ AVATAR URL
  const getAvatarUrl = () => {
    if (user.avatar) return user.avatar;
    const avatarStyle = user.role === 'gestor' ? 'personas' : 'avataaars';
    const seed = user.name.replace(/\s+/g, '').toLowerCase();
    return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=b6e937`;
  };

  // ✅ PLANO CONFIG
  const getPlanConfig = () => {
    switch (user.plan) {
      case 'enterprise': return {
        color: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: Crown,
        name: 'Enterprise'
      };
      case 'pro': return {
        color: 'from-yellow-500 to-orange-500',
        bg: 'bg-yellow-50',
        text: 'text-orange-700',
        icon: Star,
        name: 'Pro'
      };
      default: return {
        color: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: Award,
        name: 'Básico'
      };
    }
  };

  const planConfig = getPlanConfig();

  // ✅ QUICK ACTIONS - DIFERENTES POR ROLE - PADRÃO SISTEMA
  const getQuickActions = () => {
    if (user.role === 'admin') {
      return [
        { 
          id: 'admin', 
          icon: Shield, 
          title: 'Admin Panel', 
          subtitle: 'Painel administrativo',
          color: 'bg-red-600',
          onClick: () => onNavigate?.('admin')
        },
        { 
          id: 'dashboard', 
          icon: BarChart3, 
          title: 'Dashboard', 
          subtitle: 'Análises globais',
          color: 'bg-[#004A7C]',
          onClick: () => onNavigate?.('dashboard')
        },
        { 
          id: 'analytics', 
          icon: PieChart, 
          title: 'Analytics', 
          subtitle: 'Relatórios do sistema',
          color: 'bg-purple-500',
          onClick: () => console.log('Analytics')
        },
        { 
          id: 'markets', 
          icon: Store, 
          title: 'Mercados', 
          subtitle: `${user.stats?.total_mercados || 0} mercados`,
          color: 'bg-[#B9E937]',
          onClick: () => console.log('Mercados')
        }
      ];
    } else if (user.role === 'gestor') {
      return [
        { 
          id: 'dashboard', 
          icon: BarChart3, 
          title: 'Dashboard', 
          subtitle: 'Análises da loja',
          color: 'bg-[#004A7C]',
          onClick: () => onNavigate?.('dashboard')
        },
        { 
          id: 'products', 
          icon: Store, 
          title: 'Produtos', 
          subtitle: 'Gerenciar catálogo',
          color: 'bg-[#B9E937]',
          onClick: () => console.log('Produtos')
        },
        { 
          id: 'analytics', 
          icon: PieChart, 
          title: 'Analytics', 
          subtitle: 'Relatórios detalhados',
          color: 'bg-purple-500',
          onClick: () => console.log('Analytics')
        },
        { 
          id: 'customers', 
          icon: Users, 
          title: 'Clientes', 
          subtitle: 'Base de clientes',
          color: 'bg-orange-500',
          onClick: () => console.log('Clientes')
        }
      ];
    } else {
      return [
        { 
          id: 'search', 
          icon: ShoppingCart, 
          title: 'Buscar', 
          subtitle: 'Encontrar produtos',
          color: 'bg-[#004A7C]',
          onClick: () => onNavigate?.('search')
        },
        { 
          id: 'lists', 
          icon: Heart, 
          title: 'Minhas Listas', 
          subtitle: `${user.stats?.listas_criadas || 0} listas`,
          color: 'bg-red-500',
          onClick: () => onNavigate?.('listas')
        },
        { 
          id: 'favorites', 
          icon: Star, 
          title: 'Favoritos', 
          subtitle: `${user.stats?.produtos_favoritados || 0} produtos`,
          color: 'bg-yellow-500',
          onClick: () => console.log('Favoritos')
        },
        { 
          id: 'economy', 
          icon: Target, 
          title: 'Economia', 
          subtitle: `R$ ${(user.stats?.economia_total || 0).toFixed(2)}`,
          color: 'bg-[#B9E937]',
          onClick: () => console.log('Economia')
        }
      ];
    }
  };

  const quickActions = getQuickActions();

  // ✅ STATS - DIFERENTES POR ROLE
  const getMainStats = () => {
    if (user.role === 'admin') {
      return [
        { 
          label: 'Mercados', 
          value: user.stats?.total_mercados || 0, 
          icon: Store, 
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        },
        { 
          label: 'Usuários', 
          value: user.stats?.usuarios_sistema || 0, 
          icon: Users, 
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
        { 
          label: 'Receita', 
          value: `R$ ${((user.stats?.revenue_total || 0) / 1000).toFixed(0)}k`, 
          icon: TrendingUp, 
          color: 'text-purple-600',
          bg: 'bg-purple-50'
        }
      ];
    } else if (user.role === 'gestor') {
      return [
        { 
          label: 'Produtos', 
          value: user.stats?.produtos_cadastrados || 0, 
          icon: Store, 
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        },
        { 
          label: 'Vendas Hoje', 
          value: `R$ ${(user.stats?.vendas_hoje || 0).toFixed(0)}`, 
          icon: TrendingUp, 
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
        { 
          label: 'Clientes', 
          value: user.stats?.total_clientes || 0, 
          icon: Users, 
          color: 'text-purple-600',
          bg: 'bg-purple-50'
        }
      ];
    } else {
      return [
        { 
          label: 'Listas', 
          value: user.stats?.listas_criadas || 0, 
          icon: ShoppingCart, 
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        },
        { 
          label: 'Economia', 
          value: `R$ ${(user.stats?.economia_total || 0).toFixed(0)}`, 
          icon: TrendingUp, 
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
        { 
          label: 'Favoritos', 
          value: user.stats?.produtos_favoritados || 0, 
          icon: Heart, 
          color: 'text-red-600',
          bg: 'bg-red-50'
        }
      ];
    }
  };

  const mainStats = getMainStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ HEADER RESPONSIVO - MOBILE COMPACT / DESKTOP EXPANSIVO */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
          
          {/* Mobile Header */}
          <div className="flex items-center gap-3 lg:hidden">
            <img
              src={getAvatarUrl()}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#B9E937]"
            />
            <div className="flex-1">
              <h1 className="font-semibold text-[#004A7C] text-lg">{user.name}</h1>
              <div className="flex items-center gap-2">
                <span className={`${planConfig.bg} ${planConfig.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
                  {planConfig.name}
                </span>
                <span className="text-gray-500 text-xs">
                  {user.role === 'admin' ? 'Administrador' : user.role === 'gestor' ? 'Gestor' : 'Cliente'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('search')}
              className="p-2 text-[#004A7C] hover:bg-gray-100 rounded-lg transition-all duration-300"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <img
                src={getAvatarUrl()}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-[#B9E937] shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-[#004A7C] mb-2">{user.name}</h1>
                <div className="flex items-center gap-4">
                  <span className={`${planConfig.bg} ${planConfig.text} px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2`}>
                    <planConfig.icon className="w-4 h-4" />
                    {planConfig.name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'gestor' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : user.role === 'gestor' ? 'Gestor' : 'Cliente'}
                  </span>
                  {user.market && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Store className="w-4 h-4" />
                      <span className="text-sm">{user.market.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate?.('search')}
                className="flex items-center gap-2 px-4 py-2 text-[#004A7C] hover:bg-blue-50 rounded-lg transition-all duration-300 border border-[#004A7C]"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Buscar Produtos</span>
              </button>
              
              {user.role === 'admin' && (
                <button
                  onClick={() => onNavigate?.('admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all duration-300"
                >
                  <Shield className="w-5 h-5" />
                  <span>Painel Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MAIN CONTENT - LAYOUT RESPONSIVO */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        
        {/* Desktop: Layout 2 colunas / Mobile: Stack vertical */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">

          {/* COLUNA ESQUERDA - Desktop: 8/12 / Mobile: Full width */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Stats - Responsivo */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
              <h2 className="text-lg lg:text-xl font-semibold text-[#004A7C] mb-4">Estatísticas</h2>
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-6">
                {mainStats.map((stat, index) => (
                  <div key={index} className={`${stat.bg} rounded-xl p-3 lg:p-4 text-center hover:shadow-md transition-shadow`}>
                    <stat.icon className={`w-6 h-6 lg:w-8 lg:h-8 ${stat.color} mx-auto mb-2`} />
                    <div className={`text-lg lg:text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-xs lg:text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions - Desktop: 3 colunas / Mobile: 2 colunas */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
              <h2 className="text-lg lg:text-xl font-semibold text-[#004A7C] mb-4">
                {user.role === 'admin' ? 'Painel Administrativo' : 
                 user.role === 'gestor' ? 'Gestão Rápida' : 'Ações Rápidas'}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="bg-gray-50 hover:bg-white rounded-xl p-4 lg:p-5 text-left hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#004A7C]/20 group"
                  >
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${action.color === 'bg-[#B9E937]' ? 'text-[#004A7C]' : 'text-white'}`} />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1 text-sm lg:text-base">{action.title}</h3>
                    <p className="text-xs lg:text-sm text-gray-500 leading-relaxed">{action.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Informações da Loja (Gestor) - Expansiva no Desktop */}
            {user.role === 'gestor' && user.market && (
              <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
                <h2 className="text-lg lg:text-xl font-semibold text-[#004A7C] mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#004A7C]" />
                  Informações da Loja
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Store className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-sm text-gray-500">Nome da Loja</span>
                        <p className="font-medium text-gray-900">{user.market.name}</p>
                      </div>
                    </div>
                    
                    {user.market.cnpj && (
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-500">CNPJ</span>
                          <p className="font-medium text-gray-900">{user.market.cnpj}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {user.market.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-500">Telefone</span>
                          <p className="font-medium text-gray-900">{user.market.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-sm text-gray-500">Endereço</span>
                        <p className="font-medium text-gray-900 text-sm leading-relaxed">{user.market.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Atividade Recente - Expansiva no Desktop */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
              <h2 className="text-lg lg:text-xl font-semibold text-[#004A7C] mb-4">Atividade Recente</h2>
              
              <div className="space-y-4">
                {[
                  { icon: ShoppingCart, title: 'Lista "Compras da Semana" criada', time: 'Há 2 horas', color: 'text-blue-600' },
                  { icon: Heart, title: 'Produto "Arroz Integral" favoritado', time: 'Há 4 horas', color: 'text-red-600' },
                  { icon: TrendingUp, title: 'Economia de R$ 12,50 alcançada', time: 'Ontem', color: 'text-green-600' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="text-[#004A7C] hover:text-[#0066A3] text-sm font-medium transition-colors">
                  Ver Todas as Atividades
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - Desktop: 4/12 / Mobile: Hidden ou Stack */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#004A7C]">Meu Perfil</h3>
                <button className="flex items-center gap-1 text-[#004A7C] text-sm hover:text-[#0066A3] transition-all duration-300">
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-xs text-gray-500">Email</span>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-xs text-gray-500">Telefone</span>
                      <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}
                
                {user.stats?.membro_desde && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-xs text-gray-500">Membro desde</span>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.stats.membro_desde).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plano Atual */}
            <div className={`bg-gradient-to-br ${planConfig.color} rounded-xl p-4 lg:p-6 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <planConfig.icon className="w-6 h-6" />
                  <h3 className="font-semibold text-lg">Plano {planConfig.name}</h3>
                </div>
                <ChevronRight className="w-5 h-5 opacity-75" />
              </div>
              
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {user.plan === 'enterprise' ? 'Recursos empresariais completos com suporte prioritário e analytics avançados.' : 
                 user.plan === 'pro' ? 'Recursos avançados para otimizar suas compras e economizar mais.' : 
                 'Recursos básicos para começar a economizar nas suas compras.'}
              </p>
              
              <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm">
                Gerenciar Plano
              </button>
            </div>

            {/* Configurações Rápidas */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
              <h3 className="font-semibold text-[#004A7C] mb-4">Configurações</h3>
              
              <div className="space-y-3">
                {[
                  { icon: Settings, label: 'Preferências', color: 'bg-gray-500' },
                  { icon: Bell, label: 'Notificações', color: 'bg-blue-500' },
                  { icon: Shield, label: 'Privacidade', color: 'bg-green-500' },
                  { icon: HelpCircle, label: 'Ajuda', color: 'bg-orange-500' }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 text-left"
                  >
                    <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-lg">
              <button 
                onClick={handleLogoutClick}
                disabled={isLoading || isLoggingOut}
                className="w-full flex items-center justify-center gap-3 p-4 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE CONFIRMAÇÃO DE LOGOUT - MOBILE OPTIMIZED - PADRÃO SISTEMA */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl transform transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#004A7C]">Confirmar Saída</h3>
                <p className="text-sm text-gray-600">Tem certeza que deseja sair?</p>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-6">
              <p>• Suas listas e dados serão salvos</p>
              <p>• Você precisará fazer login novamente</p>
              <p>• Suas configurações serão mantidas</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Sair
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;