// src/pages/RegisterPage.tsx - PÁGINA DE CADASTRO PRECIVOX v1.0
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
  Sparkles,
  ArrowLeft,
  UserPlus,
  Mail,
  Lock,
  Building,
  Phone,
  FileText,
  MapPin,
  Home
} from 'lucide-react';

// ===================================
// 🎭 REGISTER PAGE COMPONENT
// ===================================

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  // Campos específicos para empresas
  companyName?: string;
  cnpj?: string;
  billingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  acceptTerms: boolean;
  acceptNewsletter: boolean;
}

const RegisterPage: React.FC<{ onRegister?: (data: any) => void; onBackToLogin?: () => void }> = ({ 
  onRegister, 
  onBackToLogin 
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    error,
    user,
    userRole,
    registerUser
  } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    cnpj: '',
    billingAddress: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    acceptTerms: false,
    acceptNewsletter: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<'cliente' | 'gestor' | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // ===================================
  // 🔄 REDIRECIONAMENTO SE JÁ AUTENTICADO
  // ===================================
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Usuário já autenticado, redirecionando...');
      
      let targetPage = 'search';
      if (userRole === 'gestor' || userRole === 'admin') {
        targetPage = 'dashboard';
      }
      
      window.location.hash = targetPage;
      
      if (onRegister) {
        onRegister({ user, role: userRole, targetPage });
      }
    }
  }, [isAuthenticated, user, userRole, onRegister]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Verificar se é um campo de endereço
    if (name.startsWith('billingAddress.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress!,
          [addressField]: addressField === 'zipCode' ? formatCEP(value) : value
        }
      }));
    } else if (name === 'phone') {
      // Formatar telefone automaticamente
      setFormData(prev => ({
        ...prev,
        [name]: formatPhone(value)
      }));
    } else if (name === 'cnpj') {
      // Formatar CNPJ automaticamente
      setFormData(prev => ({
        ...prev,
        [name]: formatCNPJ(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Marcar campo como tocado
    setFieldTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validação em tempo real para alguns campos
    if (name === 'email' && value && emailRegex.test(value)) {
      // Verificar disponibilidade do email após 500ms
      setTimeout(() => checkEmailAvailability(value), 500);
    }

    // Limpar erro específico quando o usuário começar a digitar
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePersonaSelect = (persona: 'cliente' | 'gestor') => {
    console.log('🎭 Persona selecionada para cadastro:', persona);
    setSelectedPersona(persona);
    
    // Limpar dados específicos da persona anterior
    if (persona === 'cliente') {
      setFormData(prev => ({ ...prev, companyName: '' }));
    }
  };

  // ===================================
  // 🔍 UTILITÁRIOS DE VALIDAÇÃO
  // ===================================
  const validateCNPJ = (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
    
    // Validação dos dígitos verificadores
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    let digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result === parseInt(digits.charAt(1));
  };

  const formatCNPJ = (value: string): string => {
    const cleanedValue = value.replace(/[^\d]/g, '');
    
    if (cleanedValue.length <= 2) return cleanedValue;
    if (cleanedValue.length <= 5) return `${cleanedValue.slice(0, 2)}.${cleanedValue.slice(2)}`;
    if (cleanedValue.length <= 8) return `${cleanedValue.slice(0, 2)}.${cleanedValue.slice(2, 5)}.${cleanedValue.slice(5)}`;
    if (cleanedValue.length <= 12) return `${cleanedValue.slice(0, 2)}.${cleanedValue.slice(2, 5)}.${cleanedValue.slice(5, 8)}/${cleanedValue.slice(8)}`;
    return `${cleanedValue.slice(0, 2)}.${cleanedValue.slice(2, 5)}.${cleanedValue.slice(5, 8)}/${cleanedValue.slice(8, 12)}-${cleanedValue.slice(12, 14)}`;
  };

  const formatCEP = (value: string): string => {
    const cleanedValue = value.replace(/[^\d]/g, '');
    if (cleanedValue.length <= 5) return cleanedValue;
    return `${cleanedValue.slice(0, 5)}-${cleanedValue.slice(5, 8)}`;
  };

  const formatPhone = (value: string): string => {
    const cleanedValue = value.replace(/[^\d]/g, '');
    if (cleanedValue.length <= 2) return `(${cleanedValue}`;
    if (cleanedValue.length <= 6) return `(${cleanedValue.slice(0, 2)}) ${cleanedValue.slice(2)}`;
    if (cleanedValue.length <= 10) return `(${cleanedValue.slice(0, 2)}) ${cleanedValue.slice(2, 6)}-${cleanedValue.slice(6)}`;
    return `(${cleanedValue.slice(0, 2)}) ${cleanedValue.slice(2, 7)}-${cleanedValue.slice(7, 11)}`;
  };

  // ✅ VERIFICAÇÃO DE DISPONIBILIDADE DE EMAIL
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      setIsCheckingEmail(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.data?.available) {
          setValidationErrors(prev => ({
            ...prev,
            email: 'Este email já está em uso'
          }));
        }
      }
    } catch (error) {
      console.log('Email check failed:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // ✅ VALIDAÇÃO EM TEMPO REAL
  const validateField = (name: string, value: any): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    switch (name) {
      case 'name':
        if (!value?.trim()) return 'Nome é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        return '';
        
      case 'email':
        if (!value?.trim()) return 'Email é obrigatório';
        if (!emailRegex.test(value)) return 'Email deve ter um formato válido';
        return '';
        
      case 'password':
        if (!value) return 'Senha é obrigatória';
        if (value.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número';
        }
        return '';
        
      case 'confirmPassword':
        if (!value) return 'Confirmação de senha é obrigatória';
        if (value !== formData.password) return 'Senhas não coincidem';
        return '';
        
      case 'phone':
        if (value && value.trim().length > 0) {
          const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
          if (!phoneRegex.test(value.trim())) {
            return 'Telefone deve estar no formato (11) 99999-9999';
          }
        }
        return '';
        
      case 'acceptTerms':
        if (!value) return 'Você deve aceitar os termos de uso';
        return '';
        
      default:
        return '';
    }
  };

  // ===================================
  // 🔍 VALIDAÇÕES
  // ===================================
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Nome
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Email deve ter um formato válido';
    }

    // Senha - Backend requer 8+ caracteres com upper/lower/number
    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      errors.password = 'Senha deve ter pelo menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número';
    }

    // Confirmar senha
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }

    // Campos específicos para gestores/empresas
    if (selectedPersona === 'gestor') {
      // Nome da empresa
      if (!formData.companyName?.trim()) {
        errors.companyName = 'Nome da empresa é obrigatório para gestores';
      }

      // CNPJ
      if (!formData.cnpj?.trim()) {
        errors.cnpj = 'CNPJ é obrigatório para empresas';
      } else if (!validateCNPJ(formData.cnpj)) {
        errors.cnpj = 'CNPJ inválido';
      }

      // Endereço de cobrança
      if (!formData.billingAddress?.street?.trim()) {
        errors['billingAddress.street'] = 'Rua é obrigatória';
      }
      if (!formData.billingAddress?.number?.trim()) {
        errors['billingAddress.number'] = 'Número é obrigatório';
      }
      if (!formData.billingAddress?.neighborhood?.trim()) {
        errors['billingAddress.neighborhood'] = 'Bairro é obrigatório';
      }
      if (!formData.billingAddress?.city?.trim()) {
        errors['billingAddress.city'] = 'Cidade é obrigatória';
      }
      if (!formData.billingAddress?.state?.trim()) {
        errors['billingAddress.state'] = 'Estado é obrigatório';
      }
      if (!formData.billingAddress?.zipCode?.trim()) {
        errors['billingAddress.zipCode'] = 'CEP é obrigatório';
      } else if (formData.billingAddress.zipCode.replace(/[^\d]/g, '').length !== 8) {
        errors['billingAddress.zipCode'] = 'CEP deve ter 8 dígitos';
      }
    }

    // Telefone - Backend requer formato (11) 99999-9999
    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone = 'Telefone deve estar no formato (11) 99999-9999';
      }
    }

    // Termos
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPersona) {
      console.log('❌ Nenhuma persona selecionada');
      return;
    }

    if (!validateForm()) {
      console.log('❌ Formulário inválido');
      return;
    }

    console.log('📝 Iniciando cadastro como:', selectedPersona);
    console.log('📧 Email:', formData.email);
    
    setRegisterLoading(true);
    
    try {
      // Preparar dados para registro - Match backend validation
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword, // Backend requires confirmation
        role: selectedPersona,
        phone: formData.phone?.trim() || undefined,
        address_city: selectedPersona === 'gestor' ? formData.billingAddress?.city?.trim() : 'Franco da Rocha',
        address_state: selectedPersona === 'gestor' ? formData.billingAddress?.state?.trim() : 'SP',
        // Dados específicos para empresas
        companyName: selectedPersona === 'gestor' ? formData.companyName?.trim() : undefined,
        cnpj: selectedPersona === 'gestor' ? formData.cnpj?.replace(/[^\d]/g, '') : undefined,
        billingAddress: selectedPersona === 'gestor' ? {
          street: formData.billingAddress?.street?.trim(),
          number: formData.billingAddress?.number?.trim(),
          complement: formData.billingAddress?.complement?.trim() || undefined,
          neighborhood: formData.billingAddress?.neighborhood?.trim(),
          city: formData.billingAddress?.city?.trim(),
          state: formData.billingAddress?.state?.trim(),
          zipCode: formData.billingAddress?.zipCode?.replace(/[^\d]/g, '')
        } : undefined,
        acceptNewsletter: formData.acceptNewsletter,
        terms_accepted: formData.acceptTerms // Backend expects this field name
      };

      console.log('📝 Iniciando registro com dados:', registerData);
      
      // Chamar função de registro real
      const success = await registerUser(registerData);
      
      if (success) {
        console.log('✅ Registro realizado com sucesso!');
        setRegistrationSuccess(true);
      } else {
        console.log('❌ Falha no registro');
        // O erro já foi definido pelo hook useAuth
        
        // Se há um erro específico, tentar mapear para campos específicos
        if (error && typeof error === 'string') {
          if (error.includes('email')) {
            setValidationErrors({ email: error });
          } else if (error.includes('senha') || error.includes('password')) {
            setValidationErrors({ password: error });
          } else if (error.includes('telefone') || error.includes('phone')) {
            setValidationErrors({ phone: error });
          } else {
            setValidationErrors({ general: error });
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no processo de cadastro:', error);
      
      // Tratar diferentes tipos de erro
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          setValidationErrors({ general: 'Erro de conexão. Verifique sua internet e tente novamente.' });
        } else if (error.message.includes('400')) {
          setValidationErrors({ general: 'Dados inválidos. Por favor, verifique os campos.' });
        } else if (error.message.includes('409')) {
          setValidationErrors({ email: 'Este email já está em uso.' });
        } else if (error.message.includes('500')) {
          setValidationErrors({ general: 'Erro do servidor. Tente novamente em alguns minutos.' });
        } else {
          setValidationErrors({ general: error.message || 'Erro ao criar conta. Tente novamente.' });
        }
      } else {
        setValidationErrors({ general: 'Erro desconhecido. Tente novamente.' });
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  // Se já autenticado, mostrar loading
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

  // Se cadastro foi realizado com sucesso
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cadastro Realizado!</h2>
          <p className="text-gray-600 mb-6">
            {selectedPersona === 'gestor' ? (
              <>
                Sua conta de gestor foi criada com sucesso! 
                <br/><br/>
                <strong>Aguarde a aprovação:</strong> Sua conta está sendo analisada pela nossa equipe. 
                Você receberá um email quando for aprovada e poderá fazer login.
              </>
            ) : (
              <>
                Sua conta foi criada com sucesso. Agora você pode fazer login e começar a usar o PRECIVOX.
              </>
            )}
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  const personas = [
    {
      id: 'cliente',
      title: 'Sou Cliente',
      subtitle: 'Quero economizar nas compras',
      description: 'Crie sua conta para encontrar os melhores preços, criar listas inteligentes e receber alertas de ofertas',
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
      description: 'Registre-se para acessar analytics avançados, monitorar concorrência e otimizar suas vendas',
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
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                Junte-se ao <span className="text-yellow-300">PRECIVOX</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Crie sua conta e descubra uma nova forma inteligente de comprar e vender.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span>Cadastro gratuito e sem complicação</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span>Acesso imediato a todas as funcionalidades</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span>Seus dados protegidos e seguros</span>
              </div>
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full translate-y-48 -translate-x-48"></div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            
            {/* Logo Mobile */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                PRECIVOX
              </h1>
              <p className="text-gray-600 mt-2">Crie sua conta</p>
            </div>

            {/* Step 1: Escolher Persona */}
            {!selectedPersona && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Como você quer se cadastrar?</h2>
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
                          <UserPlus className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Back to Login */}
                <div className="text-center">
                  <button
                    onClick={onBackToLogin}
                    className="text-sm text-gray-600 hover:text-gray-700 flex items-center justify-center mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Já tem conta? Fazer login
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Register Form */}
            {selectedPersona && (
              <div className="space-y-6">
                {/* Persona Selected Header */}
                <div className="text-center">
                  <div className={`
                    inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-4
                    ${selectedPersona === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                  `}>
                    {selectedPersona === 'cliente' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                    <span>Cadastro como {personas.find(p => p.id === selectedPersona)?.title}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h2>
                  <p className="text-gray-600">Preencha os dados para criar sua conta</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {(error || validationErrors.general) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">{error || validationErrors.general}</p>
                    </div>
                  )}

                  {/* Nome */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Seu nome completo"
                      />
                      <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {validationErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="seu@email.com"
                      />
                      <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Senha */}
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
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Mínimo 8 caracteres (maiúscula, minúscula, número)"
                      />
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.password}</p>
                    )}
                    {formData.password && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-gray-600">Força da senha:</div>
                        <div className="flex space-x-1">
                          <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                          <div className={`h-1 flex-1 rounded ${/[a-z]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                          <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                          <div className={`h-1 flex-1 rounded ${/\d/.test(formData.password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Inclua: 8+ caracteres, maiúscula, minúscula, número
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Digite a senha novamente"
                      />
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Telefone (Opcional) */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone <span className="text-gray-400">(opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="(11) 99999-9999"
                      />
                      <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Nome da Empresa (apenas para gestores) */}
                  {selectedPersona === 'gestor' && (
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Empresa
                      </label>
                      <div className="relative">
                        <input
                          id="companyName"
                          name="companyName"
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            validationErrors.companyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Nome da sua empresa"
                        />
                        <Building className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      {validationErrors.companyName && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.companyName}</p>
                      )}
                    </div>
                  )}

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        id="acceptTerms"
                        name="acceptTerms"
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                        Eu concordo com os{' '}
                        <button type="button" className="text-blue-600 hover:text-blue-700 underline">
                          Termos de Uso
                        </button>{' '}
                        e{' '}
                        <button type="button" className="text-blue-600 hover:text-blue-700 underline">
                          Política de Privacidade
                        </button>
                      </label>
                    </div>
                    {validationErrors.acceptTerms && (
                      <p className="text-xs text-red-600">{validationErrors.acceptTerms}</p>
                    )}

                    <div className="flex items-start">
                      <input
                        id="acceptNewsletter"
                        name="acceptNewsletter"
                        type="checkbox"
                        checked={formData.acceptNewsletter}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <label htmlFor="acceptNewsletter" className="ml-2 block text-sm text-gray-700">
                        Quero receber novidades e ofertas por email
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || registerLoading}
                    className={`
                      w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white
                      ${selectedPersona === 'cliente' 
                        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isLoading || registerLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Criar Conta como {selectedPersona === 'cliente' ? 'Cliente' : 'Gestor'}
                      </>
                    )}
                  </button>
                </form>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPersona(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      phone: '',
                      companyName: '',
                      cnpj: '',
                      billingAddress: {
                        street: '',
                        number: '',
                        complement: '',
                        neighborhood: '',
                        city: '',
                        state: '',
                        zipCode: ''
                      },
                      acceptTerms: false,
                      acceptNewsletter: true
                    });
                    setValidationErrors({});
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-700 py-2"
                >
                  ← Voltar para escolha de tipo de conta
                </button>

                {/* Login Link */}
                <div className="text-center">
                  <button
                    onClick={onBackToLogin}
                    className="text-sm text-gray-600 hover:text-gray-700 flex items-center justify-center mx-auto"
                  >
                    Já tem conta? <span className="text-blue-600 hover:text-blue-700 ml-1 font-medium">Fazer login</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                © 2025 PRECIVOX. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;