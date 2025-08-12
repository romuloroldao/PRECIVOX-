// CategoryFilter.tsx - VERSÃO SEM DUPLICATAS
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Tag, X } from 'lucide-react';
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryIcons';

interface Category {
  id: string;
  label: string;
  icon?: string;
  count: number;
  subcategories?: Category[];
  color?: string;
  description?: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  showCounts?: boolean;
  collapsible?: boolean;
  maxVisible?: number;
  showIcons?: boolean;
  className?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  showCounts = false,
  collapsible = true,
  maxVisible = 8,
  showIcons = true,
  className = ''
}) => {
  console.log('🎛️ CategoryFilter recebeu:', {
    categoriesCount: categories.length,
    selectedCategory,
    amostra: categories.slice(0, 3)
  });
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ DETECTAR MOBILE E CONFIGURAR SCROLL
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ VERIFICAR SE PODE SCROLLAR
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  // ✅ FUNÇÕES DE SCROLL
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // ✅ PREPARAR CATEGORIAS - REMOVENDO DUPLICATAS
  const prepareCategories = () => {
    console.log('🔧 prepareCategories - entrada:', {
      categoriesLength: categories.length,
      amostra: categories.slice(0, 5).map(cat => ({ id: cat.id, label: cat.label, count: cat.count }))
    });

    // Filtrar categorias duplicadas (remover qualquer "Todas" existente) e validar dados
    const filteredCategories = categories.filter(cat => 
      cat && 
      cat.id && 
      cat.label &&
      cat.id !== 'all' && 
      cat.id !== 'todas' && 
      cat.label.toLowerCase() !== 'todas'
    ).map(cat => ({
      ...cat,
      count: typeof cat.count === 'number' ? cat.count : 0
    }));

    console.log('🔧 prepareCategories - filtradas:', {
      filteredLength: filteredCategories.length,
      amostra: filteredCategories.slice(0, 5).map(cat => ({ id: cat.id, label: cat.label, count: cat.count }))
    });

    // Criar categoria "Todas" única
    const totalCount = filteredCategories.reduce((sum, cat) => sum + (cat.count || 0), 0);
    const allCategory = { 
      id: 'all', 
      label: 'Todas', 
      count: totalCount,
      icon: '🛒',
      color: '#004A7C'
    };

    console.log('🔧 prepareCategories - resultado final:', {
      totalCategories: [allCategory, ...filteredCategories].length,
      allCategoryCount: allCategory.count,
      primeira5: [allCategory, ...filteredCategories].slice(0, 5).map(cat => ({ id: cat.id, label: cat.label, count: cat.count }))
    });

    return [allCategory, ...filteredCategories];
  };

  const allCategories = prepareCategories();

  const displayedCategories = isMobile || showAll 
    ? allCategories 
    : allCategories.slice(0, maxVisible);

  const hiddenCount = allCategories.length - maxVisible;

  // ✅ FUNÇÃO PARA RENDERIZAR CHIP DE CATEGORIA
  const renderCategoryChip = (category: any) => {
    const isSelected = selectedCategory === category.id;
    const icon = showIcons ? (category.icon || getCategoryIcon(category.label)) : null;
    
    // ✅ CORES MELHORADAS BASEADAS NA ANÁLISE
    const getChipStyles = () => {
      if (isSelected) {
        return {
          background: 'linear-gradient(135deg, #004A7C 0%, #0066A3 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 74, 124, 0.3)',
          transform: 'translateY(-1px)',
          border: '2px solid transparent'
        };
      }

      // ✅ CORES ESPECÍFICAS POR CATEGORIA
      const categoryColors: { [key: string]: string } = {
        'all': 'from-blue-100 to-blue-200 text-blue-700 border-blue-200',
        'bebidas': 'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
        'graos': 'from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200',
        'limpeza': 'from-purple-50 to-purple-100 text-purple-700 border-purple-200',
        'carnes': 'from-red-50 to-red-100 text-red-700 border-red-200',
        'higiene': 'from-pink-50 to-pink-100 text-pink-700 border-pink-200',
        'laticinios': 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
        'frutas': 'from-orange-50 to-orange-100 text-orange-700 border-orange-200',
        'verduras': 'from-green-50 to-green-100 text-green-700 border-green-200',
        'doces': 'from-pink-50 to-pink-100 text-pink-700 border-pink-200',
        'massas': 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
        'cafe': 'from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200',
        'acucar': 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
        'oleos': 'from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200',
        'biscoitos': 'from-orange-50 to-orange-100 text-orange-700 border-orange-200',
        'paes': 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
        'congelados': 'from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200',
        'temperos': 'from-green-50 to-green-100 text-green-700 border-green-200',
        'enlatados': 'from-gray-50 to-gray-100 text-gray-700 border-gray-200',
        'cereais': 'from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200',
        'petiscos': 'from-orange-50 to-orange-100 text-orange-700 border-orange-200',
        'hortifruti': 'from-green-50 to-green-100 text-green-700 border-green-200',
        'pereciveis': 'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
        'panificacao': 'from-amber-50 to-amber-100 text-amber-700 border-amber-200'
      };

      const colorClass = categoryColors[category.id] || 
                        categoryColors[category.label?.toLowerCase()] || 
                        'from-gray-50 to-gray-100 text-gray-600 border-gray-200';

      return {
        className: `bg-gradient-to-br ${colorClass} hover:from-gray-100 hover:to-gray-200 border-2 hover:border-[#004A7C]/30`
      };
    };

    const chipStyles = getChipStyles();

    return (
      <button
        key={category.id}
        onClick={() => onCategoryChange(category.id)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 
          whitespace-nowrap flex-shrink-0 min-w-fit
          ${isSelected 
            ? 'text-white shadow-lg' 
            : chipStyles.className || 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
          ${isMobile ? 'text-sm' : 'text-base'}
          group hover:scale-105 active:scale-95
        `}
        style={isSelected ? chipStyles : undefined}
        title={`${category.label} - ${category.count} produtos`}
      >
        {/* Ícone */}
        {icon && (
          <span className={`
            text-lg transition-transform duration-300 
            ${isSelected ? 'animate-pulse' : 'group-hover:scale-110'}
          `}>
            {icon}
          </span>
        )}
        
        {/* Label e Count */}
        <div className="flex flex-col items-start">
          <span className="font-medium leading-tight">
            {category.label}
          </span>
          {showCounts && (
            <span className={`
              text-xs leading-tight
              ${isSelected ? 'text-white/80' : 'text-gray-500'}
            `}>
              {category.count > 0 ? `${category.count}` : '0'}
            </span>
          )}
        </div>

        {/* Badge para categoria ativa */}
        {isSelected && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />
        )}
      </button>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* ✅ HEADER MELHORADO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#004A7C]" />
            <span>Categorias</span>
          </h3>
          
          {/* Badge de filtro ativo */}
          {selectedCategory !== 'all' && (
            <div className="flex items-center gap-2 bg-[#004A7C] text-white px-3 py-1 rounded-full text-sm font-medium">
              <span>Filtro ativo</span>
              <button
                onClick={() => onCategoryChange('all')}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                title="Limpar filtro"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* ✅ BOTÃO "VER MAIS" MELHORADO (só no desktop) */}
        {!isMobile && collapsible && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#004A7C] hover:bg-blue-50 rounded-lg transition-colors font-medium"
          >
            {showAll ? (
              <>
                <span>Ver menos</span>
                <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
              </>
            ) : (
              <>
                <span>Ver mais ({hiddenCount})</span>
                <ChevronDown className="w-4 h-4 transition-transform" />
              </>
            )}
          </button>
        )}
      </div>

      {/* ✅ CONTAINER PRINCIPAL - MOBILE vs DESKTOP */}
      {isMobile ? (
        // 📱 MOBILE: Scroll horizontal com botões
        <div className="relative">
          {/* Botão Scroll Left */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ marginLeft: '-12px' }}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Container scrollável */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitScrollbar: { display: 'none' }
            }}
          >
            {allCategories.map(renderCategoryChip)}
          </div>

          {/* Botão Scroll Right */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ marginRight: '-12px' }}
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Gradient indicators */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-5" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-5" />
          )}
        </div>
      ) : (
        // 🖥️ DESKTOP: Grid flexível
        <div className="flex flex-wrap gap-3">
          {displayedCategories.map(renderCategoryChip)}
        </div>
      )}

      {/* ✅ RESUMO DO FILTRO ATIVO */}
      {selectedCategory !== 'all' && (
        <div className="bg-gradient-to-r from-[#004A7C]/10 to-blue-50 border border-[#004A7C]/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#004A7C] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">
                  {allCategories.find(cat => cat.id === selectedCategory)?.icon || '🏷️'}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  Filtrando por: {allCategories.find(cat => cat.id === selectedCategory)?.label}
                </div>
                <div className="text-sm text-gray-600">
                  {allCategories.find(cat => cat.id === selectedCategory)?.count || 0} produtos encontrados
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onCategoryChange('all')}
              className="bg-white text-[#004A7C] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-[#004A7C]/20"
            >
              Limpar filtro
            </button>
          </div>
        </div>
      )}

      {/* ✅ CSS PERSONALIZADO PARA SCROLLBAR */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;