// src/components/layouts/PublicLayout.tsx - LAYOUT PÚBLICO
import React from 'react';
import { Link } from 'react-router-dom';
import SearchPage from '../search/SearchPage';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">PRECIVOX</h1>
              <span className="ml-2 text-sm text-gray-500">Visitante</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Entrar
              </Link>
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <SearchPage />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              Faça login para acessar todas as funcionalidades do PRECIVOX
            </p>
            <Link
              to="/login"
              className="inline-flex items-center mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// src/components/layouts/AdminLayout.tsx - LAYOUT ADMIN
import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Database,
  LogOut,
  Menu,
  X,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminNavigation: React.FC<{ isMobile: boolean; onClose?: () => void }> = ({ 
  isMobile, 
  onClose 
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard Admin', icon: BarChart3 },
    { path: '/admin/usuarios', label: 'Gerenciar Usuários', icon: Users },
    { path: '/admin/sistema', label: 'Configurações', icon: Settings },
    { path: '/admin/seguranca', label: 'Segurança', icon: Shield },
    { path: '/admin/dados', label: 'Base de Dados', icon: Database },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <nav className={`${isMobile ? 'px-4 py-6' : 'px-6 py-8'}`}>
      {/* Admin Info */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-purple-600 font-medium">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">Sistema Online</span>
        </div>
        <div className="text-xs text-green-600">
          <p>Uptime: 99.9% • Usuários ativos: 1.247</p>
        </div>
      </div>

      {/* Navigation Items */}
      <ul className="space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={handleNavClick}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Separator */}
      <div className="my-6 border-t border-gray-200"></div>

      {/* Logout */}
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
    </nav>
  );
};

const AdminHeader: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
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
          <h1 className="text-2xl font-bold text-purple-600">PRECIVOX</h1>
          <span className="ml-2 text-sm text-gray-500 hidden sm:inline">Admin Panel</span>
        </div>

        {/* System Stats */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
            <div className="text-gray-600">1.247 usuários</div>
            <div className="text-gray-600">99.9% uptime</div>
          </div>

          {/* Alerts */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <AlertTriangle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></span>
            </button>
          </div>

          {/* User */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline text-sm font-medium text-gray-700">
              {user?.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

// Admin Pages (Placeholders)
const AdminDashboardPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Administrativo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">1.247</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lojas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
            <Settings className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Buscas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">12.4K</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-gray-900">99.9%</p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Atividade Recente do Sistema</h3>
        <div className="space-y-3">
          {[
            { action: 'Novo usuário cadastrado', user: 'cliente@email.com', time: '2 min atrás' },
            { action: 'Gestor atualizou estoque', user: 'gestor@loja.com', time: '5 min atrás' },
            { action: 'Backup automático concluído', user: 'Sistema', time: '1 hora atrás' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.user}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AdminUsuariosPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Usuários</h2>
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Usuários</h3>
        <p className="text-gray-600">
          Ferramenta completa para gerenciar usuários, permissões e acessos
        </p>
      </div>
    </div>
  </div>
);

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminNavigation isMobile={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-purple-600">PRECIVOX</h1>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Admin</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AdminNavigation isMobile={false} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/usuarios" element={<AdminUsuariosPage />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export { PublicLayout, AdminLayout };