// src/pages/PricingPlans.tsx - PLANOS DE PREÇOS PRECIVOX
import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  BarChart3,
  Brain,
  Shield,
  Headphones,
  Globe,
  Download,
  Clock,
  Target,
  TrendingUp,
  Heart,
  Gift
} from 'lucide-react';

// ✅ INTERFACE LOCAL PARA PROPS
interface PricingPlansProps {
  onSelectPlan: (planId: string) => void;
  userPreferences?: any;
}

// ✅ INTERFACE DO PLANO
interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  currency: string;
  period: string;
  description: string;
  popular?: boolean;
  recommended?: boolean;
  features: Feature[];
  limitations?: string[];
  cta: string;
  badge?: string;
  color: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    border: string;
  };
  icon: React.ReactNode;
  savings?: string;
  trial?: string;
}

interface Feature {
  name: string;
  included: boolean;
  description?: string;
  highlight?: boolean;
  premium?: boolean;
}

// ✅ CONFIGURAÇÃO DOS PLANOS
const plans: Plan[] = [
  {
    id: 'free',
    name: 'Consumidor',
    subtitle: 'Para uso pessoal',
    price: 0,
    currency: 'R$',
    period: 'para sempre',
    description: 'CRUD completo de listas com IA para otimizar suas compras pessoais',
    popular: false,
    features: [
      { name: 'CRUD completo de listas', included: true, highlight: true },
      { name: 'Criar, editar, visualizar listas', included: true },
      { name: 'IA otimiza rotas e economia', included: true, highlight: true },
      { name: 'Busca premium completa', included: true },
      { name: 'Comparação de preços em tempo real', included: true },
      { name: 'Sugestões automáticas inteligentes', included: true },
      { name: 'Geolocalização e lojas próximas', included: true },
      { name: 'Histórico de buscas', included: true },
      { name: 'Sistema de favoritos', included: true },
      { name: 'Modo offline básico', included: true },
      { name: 'Analytics empresarial', included: false },
      { name: 'Chat com IA Groq', included: false },
      { name: 'Insights comportamentais', included: false },
      { name: 'API personalizada', included: false },
      { name: 'Suporte prioritário', included: false }
    ],
    cta: 'Começar Grátis',
    color: {
      primary: 'text-gray-700',
      secondary: 'text-gray-600',
      accent: 'bg-gray-600',
      background: 'bg-white',
      border: 'border-gray-200'
    },
    icon: <Heart className="w-8 h-8" />,
    trial: 'Sem limitações para uso pessoal'
  },
  {
    id: 'business',
    name: 'Business',
    subtitle: 'Para mercados e empresas',
    price: 199,
    originalPrice: 299,
    currency: 'R$',
    period: '/mês',
    description: 'Analytics inteligente com IA Groq para insights que realmente aumentam vendas',
    popular: true,
    recommended: true,
    features: [
      { name: 'Tudo do plano Consumidor', included: true, highlight: true },
      { name: '🧠 Analytics inteligente com Groq', included: true, highlight: true, premium: true },
      { name: 'Chat com IA especializada', included: true, premium: true },
      { name: 'Insights comportamentais dinâmicos', included: true, premium: true },
      { name: 'Correlações de produtos em tempo real', included: true, premium: true },
      { name: 'Previsões de demanda', included: true, premium: true },
      { name: 'Relatórios mensais personalizados', included: true },
      { name: 'Dashboard executivo', included: true },
      { name: 'Alertas e notificações inteligentes', included: true },
      { name: 'Exportação de dados avançada', included: true },
      { name: 'Suporte prioritário por email', included: true },
      { name: 'Integração com sistemas existentes', included: true },
      { name: 'Até 10 usuários', included: true },
      { name: 'API personalizada completa', included: false },
      { name: 'Consultoria estratégica', included: false }
    ],
    cta: '🧠 Começar Analytics Grátis',
    badge: 'Mais Popular',
    color: {
      primary: 'text-blue-700',
      secondary: 'text-blue-600',
      accent: 'bg-blue-600',
      background: 'bg-blue-50',
      border: 'border-blue-500'
    },
    icon: <Brain className="w-8 h-8" />,
    savings: 'Economize R$ 100/mês',
    trial: '7 dias grátis • Cancele quando quiser'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Para grandes redes',
    price: 499,
    originalPrice: 699,
    currency: 'R$',
    period: '/mês',
    description: 'Solução completa com IA de otimização de preços e consultoria estratégica',
    popular: false,
    features: [
      { name: 'Tudo do plano Business', included: true, highlight: true },
      { name: '🤖 IA de otimização de preços', included: true, highlight: true, premium: true },
      { name: 'Previsões de demanda com Groq', included: true, premium: true },
      { name: 'Análise competitiva avançada', included: true, premium: true },
      { name: 'API personalizada completa', included: true, premium: true },
      { name: 'Alertas em tempo real', included: true, premium: true },
      { name: 'Dashboard customizado', included: true, premium: true },
      { name: 'White-label disponível', included: true },
      { name: 'Integração completa com ERP/CRM', included: true },
      { name: 'Consultoria estratégica mensal', included: true },
      { name: 'Suporte 24/7 dedicado', included: true },
      { name: 'Usuários ilimitados', included: true },
      { name: 'SLA garantido 99.9%', included: true },
      { name: 'Treinamento da equipe', included: true },
      { name: 'Implementação assistida', included: true }
    ],
    cta: 'Falar com Consultor',
    badge: 'Máximo ROI',
    color: {
      primary: 'text-purple-700',
      secondary: 'text-purple-600',
      accent: 'bg-purple-600',
      background: 'bg-purple-50',
      border: 'border-purple-500'
    },
    icon: <Crown className="w-8 h-8" />,
    savings: 'Economize R$ 200/mês',
    trial: 'Demo personalizada • ROI garantido'
  }
];

// ✅ DEPOIMENTOS
const testimonials = [
  {
    name: 'Carlos Silva',
    company: 'Supermercado Silva & CIA',
    role: 'Diretor Comercial',
    content: 'Com o PRECIVOX Business, aumentamos nossas vendas em 23% em apenas 2 meses. Os insights da IA Groq são impressionantes!',
    avatar: '👨‍💼',
    plan: 'Business'
  },
  {
    name: 'Ana Costa',
    company: 'Rede Mercados Costa',
    role: 'CEO',
    content: 'O Enterprise mudou completamente nossa estratégia. A IA de preços otimizada nos deu vantagem competitiva real.',
    avatar: '👩‍💻',
    plan: 'Enterprise'
  },
  {
    name: 'João Santos',
    company: 'Consumidor',
    role: 'Usuário',
    content: 'Nunca mais comprei sem comparar preços. O CRUD de listas gratuito já me economizou mais de R$ 500 este mês!',
    avatar: '🙋‍♂️',
    plan: 'Gratuito'
  }
];

// ✅ FAQ
const faqs = [
  {
    question: 'Como funciona o CRUD completo de listas?',
    answer: 'Você pode Criar, Editar, Visualizar e Gerenciar listas de compras inteligentes. Nossa IA otimiza automaticamente rotas, sugere economia e encontra os melhores preços.'
  },
  {
    question: 'O que são os Analytics com IA Groq?',
    answer: 'Nossa IA Groq analisa padrões de comportamento, correlações entre produtos e tendências de mercado para gerar insights dinâmicos que realmente aumentam suas vendas.'
  },
  {
    question: 'Posso mudar de plano a qualquer momento?',
    answer: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. No upgrade, os recursos são ativados imediatamente.'
  },
  {
    question: 'Os dados ficam seguros?',
    answer: 'Absolutamente. Usamos criptografia de ponta e não compartilhamos dados. Seus insights competitivos são exclusivamente seus.'
  },
  {
    question: 'Como funciona o período gratuito?',
    answer: 'O Business tem 7 dias grátis com todos os recursos. O Enterprise inclui demo personalizada. Cancele a qualquer momento.'
  }
];

// ✅ COMPONENTE PRINCIPAL
const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('business');
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // ✅ ANIMAÇÃO DE ENTRADA
  useEffect(() => {
    const cards = document.querySelectorAll('.pricing-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-fade-in');
      }, index * 100);
    });
  }, []);

  // ✅ HANDLER DE SELEÇÃO
  const handleSelectPlan = async (planId: string) => {
    setIsLoading(planId);
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSelectPlan(planId);
      console.log(`✅ Plano selecionado: ${planId}`);
    } catch (error) {
      console.error('❌ Erro ao selecionar plano:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // ✅ COMPONENTE DE FEATURE
  const FeatureItem: React.FC<{ feature: Feature }> = ({ feature }) => (
    <div className={`flex items-start space-x-3 py-2 ${feature.highlight ? 'bg-blue-50 -mx-2 px-2 rounded-lg' : ''}`}>
      {feature.included ? (
        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
          feature.premium ? 'text-purple-600' : 'text-green-500'
        }`} />
      ) : (
        <X className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
      )}
      <div className="flex-1">
        <span className={`text-sm ${
          feature.included ? 'text-gray-900' : 'text-gray-400'
        } ${feature.highlight ? 'font-semibold' : ''}`}>
          {feature.name}
        </span>
        {feature.premium && feature.included && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            IA Premium
          </span>
        )}
        {feature.description && feature.included && (
          <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
        )}
      </div>
    </div>
  );

  // ✅ COMPONENTE DE CARD DO PLANO
  const PlanCard: React.FC<{ plan: Plan; index: number }> = ({ plan, index }) => (
    <div className={`pricing-card relative ${plan.color.background} ${plan.color.border} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
      plan.popular ? 'scale-105 ring-4 ring-blue-200' : ''
    } ${selectedPlan === plan.id ? 'ring-4 ring-blue-300' : ''}`}>
      
      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${plan.color.accent} text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
          {plan.popular && <Star className="w-4 h-4" />}
          {plan.badge}
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${plan.color.accent} rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
            {plan.icon}
          </div>
          <h3 className={`text-2xl font-bold ${plan.color.primary} mb-1`}>{plan.name}</h3>
          <p className={`${plan.color.secondary} text-sm mb-4`}>{plan.subtitle}</p>
          
          {/* Preço */}
          <div className="mb-4">
            <div className="flex items-baseline justify-center">
              <span className={`text-4xl font-bold ${plan.color.primary}`}>
                {plan.currency}{plan.price === 0 ? '' : plan.price.toLocaleString('pt-BR')}
              </span>
              {plan.price === 0 && (
                <span className={`text-4xl font-bold ${plan.color.primary}`}>Grátis</span>
              )}
              {plan.period && (
                <span className={`${plan.color.secondary} text-lg ml-1`}>{plan.period}</span>
              )}
            </div>
            
            {plan.originalPrice && (
              <div className="text-center mt-2">
                <span className="text-gray-500 line-through text-lg">
                  {plan.currency}{plan.originalPrice}
                </span>
                <span className="ml-2 text-green-600 font-semibold">
                  {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                </span>
              </div>
            )}
            
            {plan.savings && (
              <p className="text-green-600 text-sm font-medium mt-1">{plan.savings}</p>
            )}
          </div>

          <p className={`${plan.color.secondary} text-sm leading-relaxed`}>{plan.description}</p>
          
          {plan.trial && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-1">
                <Gift className="w-4 h-4" />
                {plan.trial}
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-1 mb-8">
          {plan.features.map((feature, featureIndex) => (
            <FeatureItem key={featureIndex} feature={feature} />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => handleSelectPlan(plan.id)}
          disabled={isLoading === plan.id}
          className={`w-full ${plan.color.accent} text-white font-semibold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed`}
        >
          {isLoading === plan.id ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processando...
            </>
          ) : (
            <>
              {plan.cta}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {plan.id === 'enterprise' && (
          <p className="text-center text-sm text-gray-600 mt-3">
            Inclui consultoria gratuita de implementação
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* ✅ HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            CRUD Inteligente + Analytics IA
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Escolha seu <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Plano PRECIVOX</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Do CRUD completo gratuito aos analytics de IA que revolucionam supermercados. 
            <br />Sua voz no preço, sua vantagem no mercado.
          </p>

          {/* Benefícios Principais */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">CRUD Completo Grátis</h3>
              <p className="text-gray-600 text-sm">Crie, edite, visualize e gerencie listas inteligentes para sempre</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">IA Groq Integrada</h3>
              <p className="text-gray-600 text-sm">Analytics que realmente aumentam vendas e otimizam decisões</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ROI Comprovado</h3>
              <p className="text-gray-600 text-sm">Clientes aumentaram vendas em até 23% nos primeiros meses</p>
            </div>
          </div>

          {/* Toggle Anual */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`font-medium ${!isYearly ? 'text-blue-600' : 'text-gray-500'}`}>Mensal</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`font-medium ${isYearly ? 'text-blue-600' : 'text-gray-500'}`}>
              Anual 
              <span className="ml-1 text-green-600 text-sm">(20% OFF)</span>
            </span>
          </div>
        </div>

        {/* ✅ CARDS DOS PLANOS */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>

        {/* ✅ COMPARAÇÃO DETALHADA */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comparação Completa</h2>
            <p className="text-gray-600">Veja todos os recursos de cada plano lado a lado</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Recursos</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 ${plan.color.accent} rounded-lg flex items-center justify-center text-white text-xs mb-2`}>
                          {plan.icon}
                        </div>
                        <span className="font-semibold text-gray-900">{plan.name}</span>
                        <span className="text-sm text-gray-500">{plan.currency}{plan.price === 0 ? 'Grátis' : plan.price}{plan.period}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Features mais importantes */}
                {[
                  'CRUD completo de listas',
                  'IA otimiza rotas e economia',
                  'Analytics empresarial',
                  'Chat com IA Groq',
                  'Insights comportamentais',
                  'API personalizada',
                  'Suporte prioritário'
                ].map((featureName, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{featureName}</td>
                    {plans.map(plan => {
                      const feature = plan.features.find(f => f.name === featureName);
                      return (
                        <td key={plan.id} className="py-3 px-4 text-center">
                          {feature?.included ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ DEPOIMENTOS */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">O que nossos clientes dizem</h2>
          <p className="text-gray-600 mb-12">Resultados reais de quem usa PRECIVOX</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{testimonial.avatar}</span>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    <p className="text-gray-500 text-xs">{testimonial.company}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testimonial.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                      testimonial.plan === 'Business' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {testimonial.plan}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm italic">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ FAQ */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-600">Tire suas dúvidas sobre os planos PRECIVOX</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-start gap-2">
                  <span className="text-blue-600 font-bold">Q:</span>
                  {faq.question}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed pl-5">
                  <span className="text-green-600 font-bold">R:</span> {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ CTA FINAL */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para revolucionar suas vendas?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de supermercados que já aumentaram suas vendas com PRECIVOX
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => handleSelectPlan('free')}
              className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Começar Grátis Agora
            </button>
            <button
              onClick={() => handleSelectPlan('business')}
              className="bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl hover:bg-blue-400 transition-colors flex items-center gap-2"
            >
              <Brain className="w-5 h-5" />
              Analytics 7 Dias Grátis
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-green-300" />
              <span className="text-blue-100">Dados 100% seguros</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-green-300" />
              <span className="text-blue-100">Cancele quando quiser</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Headphones className="w-5 h-5 text-green-300" />
              <span className="text-blue-100">Suporte em português</span>
            </div>
          </div>

          <p className="text-blue-200 text-sm mt-6">
            💡 Dica: 89% dos nossos clientes escolhem o plano Business pelos resultados garantidos
          </p>
        </div>

        {/* ✅ GARANTIAS E SEGURANÇA */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sua tranquilidade é nossa prioridade</h3>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Dados Seguros</h4>
              <p className="text-gray-600 text-sm">Criptografia de ponta e servidores no Brasil</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">ROI Garantido</h4>
              <p className="text-gray-600 text-sm">Retorno do investimento em até 30 dias</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Headphones className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Suporte Especializado</h4>
              <p className="text-gray-600 text-sm">Time dedicado para seu sucesso</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">100% Nacional</h4>
              <p className="text-gray-600 text-sm">Desenvolvido no Brasil para o mercado brasileiro</p>
            </div>
          </div>
        </div>

        {/* ✅ FOOTER ADICIONAL */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            🏆 PRECIVOX é líder em analytics para supermercados no Brasil
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              +500 supermercados confiam
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              +23% aumento médio de vendas
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              IA Groq mais avançada
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              +1M produtos monitorados
            </span>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-semibold">Sistema Online e Funcionando</span>
            </div>
            <p className="text-green-600 text-sm">
              🚀 Mais de 50.000 listas criadas hoje • IA processando dados em tempo real
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingPlans;