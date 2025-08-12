// src/pages/LoginPage.tsx - LOGIN COM PERSONAS v5.1 - CORRIGIDO SEM REACT ROUTER
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  User, 
  Store, 
  Shield, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import '../styles/mobile-fixes.css';

// ===================================
// 🎭 LOGIN PAGE COMPONENT - CORRIGIDO
// ===================================

const LoginPage: React.FC<{ onLogin?: (data: any) => void; onGoToRegister?: () => void }> = ({ onLogin, onGoToRegister }) => {
  const { 
    loginAsCliente, 
    loginAsGestor, 
    isAuthenticated, 
    isLoading, 
    error,
    user,
    userRole,
    isGestor,
    isAdmin
  } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<'cliente' | 'gestor' | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // ===================================
  // 🔄 REDIRECIONAMENTO CORRIGIDO
  // ===================================
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Usuário autenticado, redirecionando...');
      console.log('👤 Usuário:', user.name, 'Role:', userRole);
      
      // Redirecionar baseado no role
      let targetPage = 'search';
      if (isGestor || isAdmin) {
        targetPage = 'dashboard';
        console.log('🏢 Redirecionando gestor/admin para dashboard');
      } else {
        targetPage = 'search';
        console.log('👤 Redirecionando cliente para search');
      }
      
      // Usar hash navigation (compatível com o sistema atual)
      window.location.hash = targetPage;
      
      // Chamar callback se fornecido
      if (onLogin) {
        onLogin({ user, role: userRole, targetPage });
      }
    }
  }, [isAuthenticated, user, userRole, isGestor, isAdmin, onLogin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePersonaSelect = (persona: 'cliente' | 'gestor') => {
    console.log('🎭 Persona selecionada:', persona);
    setSelectedPersona(persona);
    
    // Auto-fill com dados de demonstração
    if (persona === 'cliente') {
      setFormData({
        email: 'demo@precivox.com.br',
        password: 'demo123',
        rememberMe: true
      });
    } else {
      setFormData({
        email: 'demo@precivox.com.br',
        password: 'demo123',
        rememberMe: true
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersona) {
      console.log('❌ Nenhuma persona selecionada');
      return;
    }

    console.log('🔐 Iniciando login como:', selectedPersona);
    console.log('📧 Email:', formData.email);
    
    setLoginLoading(true);
    
    try {
      let success = false;
      
      if (selectedPersona === 'cliente') {
        console.log('👤 Fazendo login como cliente...');
        success = await loginAsCliente(formData);
      } else {
        console.log('🏢 Fazendo login como gestor...');
        success = await loginAsGestor(formData);
      }
      
      if (success) {
        console.log(`✅ Login realizado com sucesso como ${selectedPersona}`);
      } else {
        console.log(`❌ Falha no login como ${selectedPersona}`);
      }
    } catch (error) {
      console.error('❌ Erro no processo de login:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  // Se já autenticado, mostrar loading enquanto redireciona
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Redirecionando...</p>
          <small className="text-gray-600">
            Logado como: {user?.name} ({userRole})
          </small>
        </div>
      </div>
    );
  }

  const personas = [
    {
      id: 'cliente',
      title: 'Sou Cliente',
      subtitle: 'Quero economizar nas compras',
      description: 'Encontre os melhores preços, crie listas inteligentes e receba alertas de ofertas',
      icon: User,
      color: 'blue',
      features: [
        'Busca inteligente com IA',
        'Listas de compras otimizadas',
        'Alertas de preços baixos',
        'Comparação entre lojas',
        'Histórico de economias'
      ]
    },
    {
      id: 'gestor',
      title: 'Sou Gestor',
      subtitle: 'Quero gerenciar meu negócio',
      description: 'Acesse analytics avançados, monitore concorrência e otimize suas vendas',
      icon: Store,
      color: 'green',
      features: [
        'Dashboard executivo em tempo real',
        'Análise de concorrência',
        'Gestão de estoque inteligente',
        'Relatórios personalizados',
        'Insights de comportamento'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex min-h-screen">
        
        {/* Left Side - Hero */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-green-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                Bem-vindo ao <span className="text-yellow-300">PRECIVOX</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                A plataforma inteligente que revoluciona a forma como você compra e vende.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span>Comparação inteligente de preços</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span>IA avançada para melhores decisões</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span>100% seguro e confiável</span>
              </div>
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full translate-y-48 -translate-x-48"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            
            {/* Logo Mobile */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                PRECIVOX
              </h1>
              <p className="text-gray-600 mt-2">Sua plataforma inteligente de compras</p>
            </div>

            {/* Step 1: Escolher Persona */}
            {!selectedPersona && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Como você quer acessar?</h2>
                  <p className="text-gray-600">Escolha o tipo de conta para uma experiência personalizada</p>
                </div>

                <div className="space-y-4">
                  {personas.map((persona) => {
                    const IconComponent = persona.icon;
                    const colorClasses = {
                      blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
                      green: 'border-green-200 hover:border-green-400 hover:bg-green-50'
                    };

                    return (
                      <div
                        key={persona.id}
                        onClick={() => handlePersonaSelect(persona.id as 'cliente' | 'gestor')}
                        className={`
                          border-2 rounded-xl p-6 cursor-pointer transition-all duration-200
                          ${colorClasses[persona.color as keyof typeof colorClasses]}
                        `}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`
                            w-12 h-12 rounded-lg flex items-center justify-center
                            ${persona.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                          `}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{persona.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{persona.subtitle}</p>
                            <p className="text-gray-700 text-sm">{persona.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Login Form */}
            {selectedPersona && (
              <div className="space-y-6">
                {/* Persona Selected Header */}
                <div className="text-center">
                  <div className={`
                    inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-4
                    ${selectedPersona === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                  `}>
                    {selectedPersona === 'cliente' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                    <span>{personas.find(p => p.id === selectedPersona)?.title}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Fazer Login</h2>
                  <p className="text-gray-600">Entre na sua conta para continuar</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                        Lembrar de mim
                      </label>
                    </div>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                      Esqueceu a senha?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || loginLoading}
                    className={`
                      w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white
                      ${selectedPersona === 'cliente' 
                        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isLoading || loginLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Entrar como {selectedPersona === 'cliente' ? 'Cliente' : 'Gestor'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </form>

                {/* Demo Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Demonstração</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        Os dados de login foram preenchidos automaticamente para demonstração. 
                        Clique em "Entrar" para acessar a experiência {selectedPersona === 'cliente' ? 'do Cliente' : 'do Gestor'}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPersona(null);
                    setFormData({ email: '', password: '', rememberMe: false });
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-700 py-2"
                >
                  ← Voltar para escolha de persona
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Não tem uma conta? 
                <button 
                  onClick={onGoToRegister}
                  className="text-blue-600 hover:text-blue-700 ml-1 font-medium"
                >
                  Cadastre-se gratuitamente
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                © 2025 PRECIVOX. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;