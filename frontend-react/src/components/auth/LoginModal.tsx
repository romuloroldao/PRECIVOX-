import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onGoToRegister?: () => void;
  onGoToForgotPassword?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onGoToRegister,
  onGoToForgotPassword
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { login } = useAuth();

  // ✅ VALIDAÇÃO DE CAMPOS
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'E-mail é obrigatório';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'E-mail inválido';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) {
      return 'Senha é obrigatória';
    }
    if (password.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    return undefined;
  };

  // ✅ HANDLER DE LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setErrors({});
    
    // Validar campos
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login({ email, password });
      
      // ✅ SUCESSO - Fechar modal e executar callback
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      // ✅ TRATAMENTO DE ERROS ESPECÍFICOS
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error?.response?.status === 401) {
        errorMessage = 'E-mail ou senha incorretos';
      } else if (error?.response?.status === 422) {
        errorMessage = 'Dados inválidos. Verifique suas informações.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ HANDLER DE FECHAMENTO
  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setPassword('');
      setErrors({});
      setShowPassword(false);
      onClose();
    }
  };

  // ✅ ESCAPE KEY
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        
        {/* ✅ HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Entrar no PRECIVOX</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* ✅ FORM */}
        <form onSubmit={handleLogin} className="p-6 space-y-6">
          
          {/* ✅ MENSAGEM DE LOGIN NECESSÁRIO */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-blue-900 font-medium text-sm">
                  Você precisa estar logado para adicionar itens à sua lista.
                </p>
              </div>
            </div>
          </div>

          {/* ✅ ERRO GERAL */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                <p className="text-red-900 text-sm">{errors.general}</p>
              </div>
            </div>
          )}

          {/* ✅ CAMPO EMAIL */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* ✅ CAMPO SENHA */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Sua senha"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && (
                <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>
          </div>

          {/* ✅ BOTÃO ENTRAR */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Entrando...</span>
              </div>
            ) : (
              'Entrar'
            )}
          </button>

          {/* ✅ LINKS ADICIONAIS */}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={onGoToForgotPassword}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
