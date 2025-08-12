// components/Navigation.tsx - VERSÃO FINAL COM SEGURANÇA BASEADA EM ROLES
import React, { useState } from 'react';
import { 
  Search, 
  BarChart3, 
  Store, 
  Users, 
  Settings, 
  Menu, 
  X,
  ShoppingCart,
  List,
  MapPin,
  User,
  Shield
} from 'lucide-react';
import { useAuth, usePermissions } from '../hooks/useAuth';
import '../styles/mobile-fixes.css';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ USAR HOOKS DE AUTENTICAÇÃO E PERMISSÕES
  const { user, isAuthenticated } = useAuth();
  const { canAccessAdminPanel } = usePermissions();

  // ✅ SISTEMA DE PERMISSÕES SIMPLES BASEADO EM ROLES
  const getNavigationPermissions = () => {
    if (!isAuthenticated || !user) {
      return ['search']; // Apenas busca para não autenticados
    }

    const role = user.role;
    
    switch (role) {
      case 'cliente':
        return ['search', 'listas', 'profile'];
      case 'gestor':
        return ['search', 'analytics', 'profile'];
      case 'admin':
        return ['search', 'analytics', 'markets', 'admin', 'profile'];
      default:
        return ['search'];
    }
  };

  // ✅ TODOS OS ITENS POSSÍVEIS DE NAVEGAÇÃO
  const allNavigationItems = [
    {
      id: 'search',
      label: 'Buscar',
      icon: Search,
      description: 'Buscar produtos',
      primary: true
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Dashboard premium',
      premium: true
    },
    {
      id: 'markets',
      label: 'Mercados',
      icon: Store,
      description: 'Mercados parceiros'
    },
    {
      id: 'listas',
      label: 'Minhas Listas',
      icon: List,
      description: 'Gerenciar suas listas'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      description: 'Painel administrativo',
      admin: true
    },
    {
      id: 'profile',
      label: 'Minha Conta',
      icon: User,
      description: 'Perfil do usuário'
    }
  ];

  // ✅ FILTRAR ITENS BASEADO NO TIPO DE USUÁRIO
  const allowedPages = getNavigationPermissions();
  const navigationItems = allNavigationItems.filter(item => 
    allowedPages.includes(item.id)
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (pageId: string) => {
    console.log(`🔄 NAVEGAÇÃO SOLICITADA: ${pageId}`);
    
    // ✅ VERIFICAR PERMISSÕES ANTES DE NAVEGAR
    if (!allowedPages.includes(pageId)) {
      console.error(`🚨 ACESSO NEGADO: ${pageId} - usuário ${user?.role || 'não autenticado'} não tem permissão`);
      
      // ✅ LOG DE SEGURANÇA PARA TENTATIVAS DE ACESSO NÃO AUTORIZADO
      if (user) {
        console.warn(`🚨 TENTATIVA DE ACESSO NÃO AUTORIZADO:
          Usuário: ${user.name} (${user.email})
          Role: ${user.role}
          Página: ${pageId}
          Timestamp: ${new Date().toISOString()}`);
      }
      
      return;
    }

    // ✅ VERIFICAÇÃO ADICIONAL PARA DADOS PRIVADOS (LISTAS)
    if (pageId === 'listas' && user?.role !== 'cliente') {
      console.error(`🚨 VIOLAÇÃO DE PRIVACIDADE BLOQUEADA:
        Usuário: ${user?.name} (${user?.role})
        Tentou acessar: ${pageId} (dados pessoais de clientes)
        Ação: BLOQUEADO`);
      return;
    }

    console.log(`✅ NAVEGAÇÃO AUTORIZADA: ${pageId} para ${user?.role}`);
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Header Principal */}
      <header className="bg-white shadow-lg border-b-2 border-[#B9E937] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo PRECIVOX - SEMPRE LEVA PARA BUSCAR */}
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => handleNavigation('search')}
            >
              <div className="bg-gradient-to-r from-[#004A7C] to-[#0066A3] p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#004A7C]">PRECIVOX</h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {isAuthenticated && user ? (
                    `Olá, ${user.name}! (${user.role})`
                  ) : (
                    'Sua voz no preço. Sua vantagem no mercado.'
                  )}
                </p>
              </div>
            </div>

            {/* Menu Desktop - APENAS ITENS PERMITIDOS */}
            <nav className="hidden lg:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`
                      relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation min-h-[40px]
                      ${isActive 
                        ? (item.admin 
                          ? 'bg-red-600 text-white shadow-lg border-red-600' 
                          : 'bg-[#004A7C] text-white shadow-lg'
                        )
                        : (item.admin 
                          ? 'text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 hover:text-red-800 active:bg-red-200' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#004A7C] active:bg-gray-200'
                        )
                      }
                      ${item.premium && !isActive ? 'border border-[#B9E937]' : ''}
                      ${item.primary && !isActive ? 'ring-2 ring-[#B9E937] ring-opacity-50' : ''}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    
                    {/* Badge Premium para Analytics */}
                    {item.premium && (
                      <span className="absolute -top-1 -right-1 bg-[#B9E937] text-[#004A7C] text-xs px-1 rounded-full font-bold">
                        PRO
                      </span>
                    )}
                    
                    {/* Badge Admin */}
                    {item.admin && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full font-bold">
                        ADM
                      </span>
                    )}
                    
                    {/* Indicador para item principal */}
                    {item.primary && (
                      <span className="absolute -top-1 -right-1 bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>
                    )}

                    {/* Badge de tipo de usuário */}
                    {isAuthenticated && user && item.id === 'profile' && (
                      <span className={`
                        absolute -top-1 -right-1 text-xs px-1 rounded-full font-bold
                        ${user.role === 'admin' ? 'bg-red-500 text-white' : ''}
                        ${user.role === 'gestor' ? 'bg-blue-500 text-white' : ''}
                        ${user.role === 'cliente' ? 'bg-green-500 text-white' : ''}
                      `}>
                        {user.role === 'admin' ? 'ADM' : ''}
                        {user.role === 'gestor' ? 'GES' : ''}
                        {user.role === 'cliente' ? 'CLI' : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Indicador de Status do Usuário */}
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className={`
                  w-2 h-2 rounded-full animate-pulse
                  ${user.role === 'admin' ? 'bg-red-500' : ''}
                  ${user.role === 'gestor' ? 'bg-blue-500' : ''}
                  ${user.role === 'cliente' ? 'bg-green-500' : ''}
                `}></div>
                <span className="text-gray-600 capitalize font-medium">
                  {user.role}
                </span>
              </div>
            )}

            {/* Botão Mobile Menu */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Mobile Overlay - APENAS ITENS PERMITIDOS */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
          <div className="fixed inset-y-0 right-0 w-72 sm:w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              
              {/* Info do usuário no mobile */}
              {isAuthenticated && user && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className={`
                        text-xs capitalize font-bold
                        ${user.role === 'admin' ? 'text-red-600' : ''}
                        ${user.role === 'gestor' ? 'text-blue-600' : ''}
                        ${user.role === 'cliente' ? 'text-green-600' : ''}
                      `}>
                        {user.role}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`
                        w-full flex items-center space-x-3 p-4 rounded-lg text-left transition-all duration-200 min-h-[60px] touch-manipulation
                        ${isActive 
                          ? (item.admin 
                            ? 'bg-red-600 text-white shadow-lg' 
                            : 'bg-[#004A7C] text-white shadow-lg'
                          )
                          : (item.admin 
                            ? 'text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200' 
                            : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                          )
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium flex items-center">
                          {item.label}
                          {item.primary && (
                            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <div className="text-xs opacity-75">{item.description}</div>
                      </div>
                      {item.premium && (
                        <span className="bg-[#B9E937] text-[#004A7C] text-xs px-2 py-1 rounded-full font-bold">
                          PRO
                        </span>
                      )}
                      {item.admin && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          ADM
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb - NAVEGAÇÃO INTELIGENTE */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <nav className="flex items-center justify-between">
              
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm">
                <button 
                  onClick={() => handleNavigation('search')}
                  className="text-[#004A7C] hover:text-[#0066A3] font-medium"
                >
                  🔍 Buscar
                </button>
                {currentPage !== 'search' && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 capitalize">
                      {navigationItems.find(item => item.id === currentPage)?.label || 'Página'}
                    </span>
                  </>
                )}
              </div>

              {/* Info de permissões (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && isAuthenticated && user && (
                <div className="text-xs text-gray-500">
                  Permissões: {navigationItems.map(item => item.label).join(', ')}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};