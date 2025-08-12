// frontend-react/src/components/HomePage.tsx - FLUXO DE BUSCA CORRIGIDO
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Users, 
  Store, 
  ArrowRight,
  Star,
  Clock,
  Target,
  Zap,
  Shield,
  Smartphone,
  BarChart3,
  Sparkles
} from 'lucide-react';

// ✅ IMPORTS DOS COMPONENTES E HOOKS NECESSÁRIOS 
import SearchBar from './search/SearchBar';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useMultiSourceData } from '../hooks/useMultiSourceData';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onSearch?: (query: string) => void; // ✅ FUNÇÃO PARA EXECUTAR BUSCA REAL
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ HOOKS PARA FUNCIONALIDADE INTELIGENTE DO SEARCHBAR
  const { searchHistory } = useSearchHistory();
  const { getSmartSuggestions, loading } = useMultiSourceData();

  // ✅ GERAR SUGESTÕES INTELIGENTES BASEADAS NA QUERY
  const smartSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) {
      // Retornar sugestões populares quando não há query
      return [
        'leite', 'pão', 'arroz', 'feijão', 'açúcar', 'óleo', 'macarrão', 'café',
        'detergente', 'sabão', 'amaciante', 'papel higiênico', 'shampoo',
        'carne bovina', 'frango', 'presunto', 'queijo', 'iogurte', 'manteiga',
        'refrigerante', 'suco', 'água', 'cerveja', 'biscoito', 'chocolate'
      ];
    }
    return getSmartSuggestions(searchQuery);
  }, [searchQuery, getSmartSuggestions]);

  const quickSearches = [
    '🥛 Leite', '🍞 Pão', '🥕 Banana', '🧽 Detergente', 
    '🥩 Carne', '🍚 Arroz', '☕ Café', '🧻 Papel higiênico'
  ];

  const features = [
    {
      icon: MapPin,
      title: 'Geolocalização Inteligente',
      description: 'Encontre os melhores preços próximos a você',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics Premium',
      description: 'Insights valiosos para mercados parceiros',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Zap,
      title: 'Busca Instantânea',
      description: 'Resultados em tempo real de todos os mercados',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Preços Verificados',
      description: 'Informações confiáveis e atualizadas',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Consumidora',
      text: 'Economizo muito tempo e dinheiro com o PRECIVOX!',
      rating: 5
    },
    {
      name: 'João Santos',
      role: 'Dono do Mercado Central',
      text: 'Os insights ajudaram a aumentar nossas vendas em 30%',
      rating: 5
    },
    {
      name: 'Ana Costa',
      role: 'Compradora',
      text: 'Sempre encontro as melhores ofertas perto de casa',
      rating: 5
    }
  ];

  const stats = [
    { label: 'Mercados Parceiros', value: '150+', icon: Store },
    { label: 'Produtos Monitorados', value: '50K+', icon: Target },
    { label: 'Usuários Ativos', value: '25K+', icon: Users },
    { label: 'Economia Média', value: 'R$ 120', icon: TrendingUp }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // ✅ HANDLER PARA BUSCA RÁPIDA (BOTÕES) - CORRIGIDO
  const handleQuickSearch = (query: string) => {
    const cleanQuery = query.replace(/[🥛🍞🥕🧽🥩🍚☕🧻]/g, '').trim();
    // ✅ EXECUTAR BUSCA PRIMEIRO, DEPOIS NAVEGAR
    if (onSearch) {
      onSearch(cleanQuery);
    }
    
    // ✅ DELAY PEQUENO PARA GARANTIR QUE A BUSCA SEJA EXECUTADA
    setTimeout(() => {
      // Navigation debug removed for production
      onNavigate('search');
    }, 100);
  };

  // ✅ HANDLER PRINCIPAL PARA SUBMISSÃO DE BUSCA - CORRIGIDO
  const handleSearchSubmit = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      console.warn('⚠️ HOMEPAGE - Query vazia, não executando busca');
      return;
    }

    console.log('🔍 HOMEPAGE - Search Submit:', trimmedQuery);
    
    // ✅ PRIMEIRO: EXECUTAR A BUSCA
    if (onSearch && typeof onSearch === 'function') {
      console.log('📡 HOMEPAGE - Executando função onSearch...');
      onSearch(trimmedQuery);
    } else {
      console.error('❌ HOMEPAGE - onSearch não é uma função válida:', typeof onSearch);
    }
    
    // ✅ SEGUNDO: PEQUENO DELAY E NAVEGAR
    setTimeout(() => {
      console.log('🔄 HOMEPAGE - Navegando para search page...');
      onNavigate('search');
    }, 150); // Delay para garantir que a busca seja processada
  };

  // ✅ HANDLER PARA MUDANÇA NO INPUT - ATUALIZADO
  const handleSearchChange = (value: string) => {
    console.log('✏️ HOMEPAGE - Search input changed:', value);
    setSearchQuery(value);
  };

  // ✅ HANDLER PARA LIMPAR BUSCA
  const handleClearSearch = () => {
    console.log('🧹 HOMEPAGE - Clearing search');
    setSearchQuery('');
  };

  // ✅ HANDLER PARA NAVEGAR DIRETO PARA BUSCA
  const handleGoToSearch = () => {
    console.log('➡️ HOMEPAGE - Going to search page directly');
    onNavigate('search');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#004A7C] via-[#0066A3] to-[#004A7C]">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            
            {/* Logo e Título Principal */}
            <div className="mb-8">
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4">
                PRECI<span className="text-[#B9E937]">VOX</span>
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 font-medium">
                Sua voz no preço. Sua vantagem no mercado.
              </p>
            </div>

            {/* Descrição */}
            <p className="text-lg text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Encontre os melhores preços de supermercados próximos a você. 
              Para consumidores: busca gratuita. Para mercados: analytics que aumentam vendas.
            </p>

            {/* ✅ BARRA DE BUSCA INTELIGENTE - REUTILIZANDO SEARCHBAR */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white rounded-2xl p-3 shadow-2xl">
                <SearchBar
                  value={searchQuery}
                  onSearch={handleSearchSubmit} // ✅ HANDLER CORRIGIDO
                  loading={loading}
                  suggestions={smartSuggestions}
                  recentSearches={searchHistory}
                  placeholder="Buscar produtos (ex: leite, pão, detergente...)"
                  autoFocus={false}
                  showHistory={true}
                  onClear={handleClearSearch}
                  className="w-full"
                  variant="hero"
                  showSmartLabel={true}
                />
              </div>

              {/* ✅ INFO SOBRE BUSCA INTELIGENTE */}
              <div className="text-xs text-blue-200 flex items-center justify-center gap-2 mt-3">
                <Sparkles className="w-4 h-4" />
                <span>
                  Busca inteligente: encontra sinônimos, variações e palavras relacionadas
                </span>
              </div>
            </div>

            {/* Buscas Rápidas */}
            <div className="mb-12">
              <p className="text-blue-200 mb-4">Buscas populares:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {quickSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(item)}
                    className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-opacity-30 transition-all duration-200 text-sm font-medium"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoToSearch} // ✅ HANDLER ESPECÍFICO
                className="bg-[#B9E937] text-[#004A7C] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#A5D632] transition-colors flex items-center justify-center space-x-2"
              >
                <span>Começar Busca</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#004A7C] transition-colors"
              >
                Ver Analytics Premium
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[#B9E937] rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-white rounded-full opacity-10 animate-bounce"></div>
      </section>

      {/* Estatísticas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-r from-[#004A7C] to-[#0066A3] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-[#004A7C] mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#004A7C] mb-4">
              Por que escolher o PRECIVOX?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnologia avançada para conectar consumidores e mercados de forma inteligente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#004A7C] mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seção de Busca Inteligente Destacada */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
              <h2 className="text-4xl font-bold text-white">
                Busca Inteligente com IA
              </h2>
            </div>
            <p className="text-xl text-emerald-100 mb-8">
              Nossa IA encontra produtos mesmo quando você não sabe o nome exato
            </p>
          </div>

          {/* Exemplos de Busca Inteligente */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🥛</div>
              <h3 className="font-bold text-white mb-2">Digite "leite"</h3>
              <p className="text-emerald-100 text-sm">
                Encontra: leite integral, desnatado, condensado, em pó...
              </p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🧽</div>
              <h3 className="font-bold text-white mb-2">Digite "limpeza"</h3>
              <p className="text-emerald-100 text-sm">
                Encontra: detergente, desinfetante, sabão, amaciante...
              </p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🥩</div>
              <h3 className="font-bold text-white mb-2">Digite "carne"</h3>
              <p className="text-emerald-100 text-sm">
                Encontra: carne bovina, frango, suína, linguiça...
              </p>
            </div>
          </div>

          <button
            onClick={handleGoToSearch} // ✅ HANDLER ESPECÍFICO
            className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center mx-auto gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Experimentar Busca Inteligente
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#004A7C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-blue-200 mb-12 text-lg">
            Histórias reais de economia e sucesso
          </p>

          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-center mb-4">
                {Array.from({ length: testimonials[currentSlide].rating }).map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-800 mb-6 italic">
                "{testimonials[currentSlide].text}"
              </blockquote>
              <div>
                <div className="font-bold text-[#004A7C] text-lg">
                  {testimonials[currentSlide].name}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentSlide].role}
                </div>
              </div>
            </div>

            {/* Indicadores */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-[#B9E937]' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modelo de Negócio */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#004A7C] mb-4">
              Para todos os públicos
            </h2>
            <p className="text-xl text-gray-600">
              Soluções personalizadas para consumidores e mercados
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Para Consumidores */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <Users className="h-12 w-12 text-[#004A7C] mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-[#004A7C]">Para Consumidores</h3>
                  <p className="text-blue-600 font-medium">100% Gratuito</p>
                </div>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Busca inteligente com IA</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Comparação de preços em tempo real</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Direcionamento para mercados próximos</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Histórico e sugestões personalizadas</span>
                </li>
              </ul>
              <button
                onClick={handleGoToSearch} // ✅ HANDLER ESPECÍFICO
                className="mt-6 bg-[#004A7C] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0066A3] transition-colors"
              >
                Começar a Buscar
              </button>
            </div>

            {/* Para Mercados */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border-2 border-[#B9E937]">
              <div className="flex items-center mb-6">
                <Store className="h-12 w-12 text-[#004A7C] mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-[#004A7C]">Para Mercados</h3>
                  <p className="text-green-600 font-medium">R$ 99-199/mês</p>
                </div>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Analytics de comportamento do consumidor</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Insights de otimização de preços</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Correlações entre produtos</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[#B9E937] rounded-full mr-3"></div>
                  <span>Dashboard com métricas acionáveis</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('dashboard')}
                className="mt-6 bg-[#B9E937] text-[#004A7C] px-6 py-3 rounded-xl font-bold hover:bg-[#A5D632] transition-colors"
              >
                Ver Analytics Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-20 bg-gradient-to-r from-[#004A7C] to-[#0066A3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para economizar e vender mais?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de usuários que já descobriram o poder do PRECIVOX
          </p>
          
          {/* ✅ SEARCHBAR ADICIONAL NO CTA - CORRIGIDO */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-2 shadow-xl">
              <SearchBar
                value=""
                onSearch={handleSearchSubmit} // ✅ MESMO HANDLER
                loading={loading}
                suggestions={smartSuggestions.slice(0, 5)}
                recentSearches={searchHistory.slice(0, 3)}
                placeholder="Busque um produto aqui também..."
                autoFocus={false}
                showHistory={true}
                className="w-full"
                variant="compact"
                showSmartLabel={false}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoToSearch} // ✅ HANDLER ESPECÍFICO
              className="bg-[#B9E937] text-[#004A7C] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#A5D632] transition-colors"
            >
              Começar Agora - Grátis
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#004A7C] transition-colors"
            >
              Conhecer Planos Premium
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};