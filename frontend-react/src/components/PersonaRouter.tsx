// src/components/PersonaRouter.tsx - ROTEADOR INTELIGENTE DE PERSONAS v5.0
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// ===================================
// 🎭 INTERFACE DO ROTEADOR
// ===================================

interface PersonaRouterProps {
  children?: React.ReactNode;
}

interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  exact?: boolean;
  roles?: string[];
}

// ===================================
// 📱 COMPONENTES LAZY LOADING
// ===================================

// Layouts
const PublicLayout = React.lazy(() => import('./layouts/PublicLayout'));
const ClienteLayout = React.lazy(() => import('./layouts/ClienteLayout'));
const GestorLayout = React.lazy(() => import('./layouts/GestorLayout'));
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));

// Pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const HomePage = React.lazy(() => import('./layouts/HomePage'));
const SearchPage = React.lazy(() => import('./search/SearchPage'));

// ===================================
// 🗺️ CONFIGURAÇÃO DE ROTAS
// ===================================

const getRouteConfig = (currentPath: string, userRole: string | null): RouteConfig | null => {
  const routes: RouteConfig[] = [
    // Rotas públicas
    { path: '/', component: HomePage, exact: true },
    { path: '/login', component: LoginPage, exact: true },
    { path: '/buscar', component: PublicLayout, exact: false },
    { path: '/sobre', component: PublicLayout, exact: false },
    { path: '/planos', component: PublicLayout, exact: false },
    
    // Rotas do cliente
    { path: '/cliente', component: ClienteLayout, exact: false, roles: ['cliente', 'cliente_premium'] },
    
    // Rotas do gestor
    { path: '/gestor', component: GestorLayout, exact: false, roles: ['gestor'] },
    
    // Rotas do admin
    { path: '/admin', component: AdminLayout, exact: false, roles: ['admin', 'super_admin'] }
  ];

  // Encontrar rota correspondente
  for (const route of routes) {
    if (route.exact) {
      if (currentPath === route.path) {
        return route;
      }
    } else {
      if (currentPath.startsWith(route.path)) {
        return route;
      }
    }
  }

  return null;
};

// ===================================
// 🧭 COMPONENTE PRINCIPAL
// ===================================

export const PersonaRouter: React.FC<PersonaRouterProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [routeComponent, setRouteComponent] = useState<React.LazyExoticComponent<React.ComponentType<any>> | null>(null);

  // ===================================
  // 🔄 EFEITO DE ROTEAMENTO
  // ===================================

  useEffect(() => {
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
    };

    // Listener para mudanças de rota
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const userRole = user?.role || null;
    const routeConfig = getRouteConfig(currentPath, userRole);

    console.log('🧭 PersonaRouter:', {
      currentPath,
      userRole,
      isAuthenticated,
      routeConfig: routeConfig?.path
    });

    // Verificar se a rota existe
    if (!routeConfig) {
      console.log('❌ Rota não encontrada:', currentPath);
      
      // Redirecionar para home ou login
      if (isAuthenticated && user) {
        const defaultRoute = getDefaultRouteForRole(user.role);
        window.location.href = defaultRoute;
      } else {
        window.location.href = '/login';
      }
      return;
    }

    // Verificar permissões da rota
    if (routeConfig.roles && routeConfig.roles.length > 0) {
      if (!isAuthenticated || !user) {
        console.log('🔒 Usuário não autenticado, redirecionando para login');
        window.location.href = '/login';
        return;
      }

      if (!routeConfig.roles.includes(user.role)) {
        console.log('🚫 Usuário sem permissão para a rota:', currentPath);
        const defaultRoute = getDefaultRouteForRole(user.role);
        window.location.href = defaultRoute;
        return;
      }
    }

    // Definir componente da rota
    setRouteComponent(() => routeConfig.component);

  }, [currentPath, user, isAuthenticated, isLoading]);

  // ===================================
  // 🎯 RENDERIZAÇÃO
  // ===================================

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando PRECIVOX...</p>
        </div>
      </div>
    );
  }

  // Se não há componente definido, mostrar fallback
  if (!routeComponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Rota não encontrada</h1>
          <p className="text-gray-600 mb-4">A página que você está procurando não existe.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // Renderizar componente com Suspense
  const RouteComponent = routeComponent;
  
  return (
    <React.Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
              <div className="h-4 w-32 bg-gray-300 rounded mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">Carregando página...</p>
          </div>
        </div>
      }
    >
      <RouteComponent />
      {children}
    </React.Suspense>
  );
};

// ===================================
// 🛠️ FUNÇÕES AUXILIARES
// ===================================

const getDefaultRouteForRole = (role: string): string => {
  const roleRoutes: Record<string, string> = {
    'cliente': '/cliente/buscar',
    'cliente_premium': '/cliente/buscar',
    'gestor': '/gestor/dashboard',
    'admin': '/admin/dashboard',
    'super_admin': '/admin/dashboard',
    'guest': '/buscar'
  };

  return roleRoutes[role] || '/login';
};

// ===================================
// 🧭 HOOK PERSONALIZADO PARA NAVEGAÇÃO
// ===================================

export const usePersonaNavigation = () => {
  const { user, isAuthenticated } = useAuth();

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const navigateToPersonaHome = () => {
    if (isAuthenticated && user) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      navigateTo(defaultRoute);
    } else {
      navigateTo('/login');
    }
  };

  const navigateToSearch = () => {
    if (isAuthenticated && user) {
      const searchRoutes: Record<string, string> = {
        'cliente': '/cliente/buscar',
        'cliente_premium': '/cliente/buscar',
        'gestor': '/gestor/dashboard',
        'admin': '/admin/dashboard',
        'super_admin': '/admin/dashboard'
      };
      navigateTo(searchRoutes[user.role] || '/buscar');
    } else {
      navigateTo('/buscar');
    }
  };

  const canAccessRoute = (path: string): boolean => {
    const routeConfig = getRouteConfig(path, user?.role || null);
    
    if (!routeConfig) return false;
    
    if (routeConfig.roles && routeConfig.roles.length > 0) {
      return isAuthenticated && user && routeConfig.roles.includes(user.role);
    }
    
    return true;
  };

  return {
    navigateTo,
    navigateToPersonaHome,
    navigateToSearch,
    canAccessRoute,
    currentPath: window.location.pathname,
    userRole: user?.role || null,
    isAuthenticated
  };
};

// ===================================
// 📤 EXPORTS
// ===================================

export default PersonaRouter;
export { usePersonaNavigation };
export type { PersonaRouterProps };