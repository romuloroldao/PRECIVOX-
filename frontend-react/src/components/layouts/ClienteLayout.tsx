// src/components/layouts/ClienteLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut,
  X,
  Home,
  List,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ClienteLayoutProps {
  children: React.ReactNode;
}

// ===================================
// 🧭 CLIENTE SIDEBAR
// ===================================

interface ClienteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const ClienteSidebar: React.FC<ClienteSidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/cliente', icon: Home, label: 'Início' },
    { path: '/cliente/pesquisar', icon: Search, label: 'Pesquisar Produtos' },
    { path: '/cliente/listas', icon: List, label: 'Minhas Listas' },
    { path: '/cliente/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/cliente/comparador', icon: TrendingUp, label: 'Comparador' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:shadow-none lg:border-r lg:border-gray-200
      `}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-blue-600">PRECIVOX</h2>
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onClose) onClose();
                      }}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              
              {/* Settings */}
              <li>
                <Link
                  to="/cliente/configuracoes"
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100
                    ${location.pathname === '/cliente/configuracoes' ? 'bg-blue-600 text-white' : ''}
                  `}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Configurações</span>
                </Link>
              </li>
              
              {/* Logout */}
              <li>
                <button
                  onClick={() => {
                    logout();
                    if (isMobile && onClose) onClose();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

// ===================================
// 🛒 CLIENTE HEADER
// ===================================

const ClienteHeader: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">PRECIVOX</h1>
          <span className="ml-2 text-sm text-gray-500 hidden sm:inline">Cliente</span>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// ===================================
// 🎯 CLIENTE LAYOUT PRINCIPAL
// ===================================

const ClienteLayout: React.FC<ClienteLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <ClienteSidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        
        {/* Header */}
        <ClienteHeader onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClienteLayout;