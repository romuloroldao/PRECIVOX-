// src/components/layouts/GestorLayout.tsx - LAYOUT DO GESTOR v4.0
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  FileText,
  Target,
  Globe,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../dashboard/DashboardPage';

// ===================================
// 🏢 GESTOR NAVIGATION
// ===================================

const GestorNavigation: React.FC<{ isMobile: boolean; onClose?: () => void }> = ({ 
  isMobile, 
  onClose 
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/gestor/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/gestor/estoque', label: 'Gestão de Estoque', icon: Package },
    { path: '/gestor/vendas', label: 'Análise de Vendas', icon: DollarSign },
    { path: '/gestor/competicao', label: 'Concorrência', icon: Target },
    { path: '/gestor/relatorios', label: 'Relatórios', icon: FileText },
    { path: '/gestor/clientes', label: 'Comportamento Cliente', icon: Users },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <nav className={`${isMobile ? 'px-4 py-6' : 'px-6 py-8'}`}>
      {/* Store Info */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">Supermercado Central</p>
            <p className="text-xs text-green-600 font-medium">Gestor</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Vendas Hoje</p>
            <p className="font-bold text-green-600">R$ 12.450</p>
          </div>
          <div>
            <p className="text-gray-600">Produtos</p>
            <p className="font-bold text-blue-600">2.847</p>
          </div>
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
                    ? 'bg-green-600 text-white shadow-lg' 
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

      {/* Settings & Logout */}
      <ul className="space-y-2">
        <li>
          <Link
            to="/gestor/configuracoes"
            onClick={handleNavClick}
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100
              ${location.pathname === '/gestor/configuracoes' ? 'bg-green-600 text-white' : ''}
            `}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configurações</span>
          </Link>
        </li>
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
  );
};

// ===================================
// 🏢 GESTOR HEADER
// ===================================

const GestorHeader: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
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
          <h1 className="text-2xl font-bold text-green-600">PRECIVOX</h1>
          <span className="ml-2 text-sm text-gray-500 hidden sm:inline">Business</span>
        </div>

        {/* Real-time Stats */}
        <div className="flex items-center space-x-6">
          {/* Live Metrics */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Live</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Vendas Hoje</span>
              <span className="font-bold text-green-600">R$ 12.450</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Visitantes</span>
              <span className="font-bold text-blue-600">247</span>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <AlertCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
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

// ===================================
// 📊 GESTOR PAGES
// ===================================

const GestorEstoquePage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Estoque</h2>
        <p className="text-gray-600">Monitore e gerencie seu inventário em tempo real</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">2,847</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estoque Baixo</p>
              <p className="text-2xl font-bold text-orange-600">23</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">R$ 245K</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Giro Médio</p>
              <p className="text-2xl font-bold text-purple-600">15 dias</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Estoque Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Produtos com Estoque Baixo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Arroz Branco 5kg</div>
                  <div className="text-sm text-gray-500">Marca Premium</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Grãos</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5 unidades</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Crítico
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Repor Estoque
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const GestorVendasPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise de Vendas</h2>
        <p className="text-gray-600">Performance de vendas e insights de negócio</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard de Vendas em Desenvolvimento</h3>
        <p className="text-gray-600 mb-6">
          Análises avançadas de vendas, tendências e projeções estarão disponíveis em breve
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Vendas Hoje</p>
            <p className="text-lg font-bold text-green-700">R$ 12.450</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Meta Mensal</p>
            <p className="text-lg font-bold text-blue-700">73%</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Crescimento</p>
            <p className="text-lg font-bold text-purple-700">+12%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const GestorCompeticaoPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise de Concorrência</h2>
        <p className="text-gray-600">Compare seus preços e performance com a concorrência</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Inteligência Competitiva</h3>
        <p className="text-gray-600 mb-6">
          Monitore preços da concorrência e identifique oportunidades de mercado
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-6 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Supermercado Norte</h4>
            <p className="text-sm text-gray-600 mb-3">Concorrente principal</p>
            <div className="flex justify-between text-sm">
              <span>Preços similares:</span>
              <span className="font-medium text-green-600">67%</span>
            </div>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Mercado Sul</h4>
            <p className="text-sm text-gray-600 mb-3">Segundo concorrente</p>
            <div className="flex justify-between text-sm">
              <span>Preços similares:</span>
              <span className="font-medium text-blue-600">54%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const GestorRelatoriosPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatórios Executivos</h2>
        <p className="text-gray-600">Gere relatórios personalizados para sua gestão</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Relatório de Vendas */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Relatório de Vendas</h3>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Análise detalhada das vendas por período, categoria e produto
          </p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Gerar Relatório
          </button>
        </div>

        {/* Relatório de Estoque */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Relatório de Estoque</h3>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Status do inventário, produtos em falta e necessidade de reposição
          </p>
          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            Gerar Relatório
          </button>
        </div>

        {/* Relatório de Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Performance Geral</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            KPIs principais, metas atingidas e oportunidades de melhoria
          </p>
          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Últimos Relatórios */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Relatórios Recentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { nome: 'Vendas Dezembro 2024', tipo: 'Vendas', data: '15/01/2025', status: 'Concluído' },
            { nome: 'Estoque Crítico', tipo: 'Estoque', data: '14/01/2025', status: 'Concluído' },
            { nome: 'Performance Q4', tipo: 'Performance', data: '10/01/2025', status: 'Concluído' }
          ].map((relatorio, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{relatorio.nome}</h4>
                  <p className="text-sm text-gray-500">{relatorio.tipo} • {relatorio.data}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {relatorio.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const GestorClientesPage = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Comportamento do Cliente</h2>
        <p className="text-gray-600">Insights sobre padrões de compra e preferências</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics de Cliente</h3>
        <p className="text-gray-600 mb-6">
          Compreenda melhor seus clientes através de dados e padrões de comportamento
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Clientes Hoje</p>
            <p className="text-lg font-bold text-blue-700">247</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Ticket Médio</p>
            <p className="text-lg font-bold text-green-700">R$ 87</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Recorrência</p>
            <p className="text-lg font-bold text-purple-700">68%</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Satisfação</p>
            <p className="text-lg font-bold text-orange-700">4.7⭐</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const GestorConfiguracoesPage = () => (
  <div className="p-6">
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Negócio</h2>
        <p className="text-gray-600">Configure as preferências da sua loja</p>
      </div>
      
      <div className="space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informações da Loja</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                defaultValue="Supermercado Central"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                defaultValue="Rua das Flores, 123 - Franco da Rocha, SP"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Configurações de Negócio</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Alertas de estoque baixo</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Monitoramento de concorrência</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Relatórios automáticos</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===================================
// 🏢 MAIN GESTOR LAYOUT
// ===================================

const GestorLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Menu Business</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <GestorNavigation isMobile={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-green-600">PRECIVOX</h1>
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Business</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <GestorNavigation isMobile={false} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <GestorHeader onToggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/gestor/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/estoque" element={<GestorEstoquePage />} />
            <Route path="/vendas" element={<GestorVendasPage />} />
            <Route path="/competicao" element={<GestorCompeticaoPage />} />
            <Route path="/relatorios" element={<GestorRelatoriosPage />} />
            <Route path="/clientes" element={<GestorClientesPage />} />
            <Route path="/configuracoes" element={<GestorConfiguracoesPage />} />
            <Route path="*" element={<Navigate to="/gestor/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default GestorLayout;