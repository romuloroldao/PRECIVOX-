// src/components/SearchPage.tsx - VERSÃO OTIMIZADA COM ZERO REDUNDÂNCIAS
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Grid3x3, List, MapPin, Plus, Eye, Star, 
  ShoppingBag, Loader2, Heart, AlertCircle, CheckCircle 
} from 'lucide-react';

// ✅ TIPOS CENTRALIZADOS (REAPROVEITADOS)
import { 
  Product,
  Lista,
  ListaItem,
  Category
} from '../../types/product';
import { SearchFilters } from '../../types/index';

// ✅ COMPONENTES REUTILIZADOS (ZERO REDUNDÂNCIAS)
import SearchBar from './SearchBar';
import CategoryFilter from '../controls/CategoryFilter';
import AdvancedFilters from '../controls/AdvancedFilters';
import ModalLista from '../list/ModalLista';
import { Toast } from '../common/Toast';
import ProductCard from '../products/ProductCard';
import AutoDiscoveryStatus from '../AutoDiscoveryStatus';


// ✅ HOOKS REUTILIZADOS (CONFORME MAPA) - UPDATED TO AUTO-DISCOVERY
import { useAutoDiscoveryData } from '../../hooks/useAutoDiscoveryData';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { useDebounce } from '../../hooks/useDebounce';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePrice } from '../../hooks/usePrice';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
// ✅ ESTILOS A SEREM REAPROVEITADOS 
// 1. DESIGN SYSTEM (se não estiver global)
import '../../styles/variables.css';

// 2. COMPONENTES BASE (se não estiver global)
import '../../styles/App.styles.css';

// 3. COMPONENTES GLOBAIS NECESSÁRIOS
import '../../styles/ModalLista.styles.css';


// 4. ANIMAÇÕES (se não estiver global)
import '../../styles/animations.css';

// 5. ESTILOS ESPECÍFICOS DA PÁGINA - POR ÚLTIMO
import '../../styles/SearchPage.styles.css';

// ✅ UTILS REUTILIZADOS
import { getCategoryIcon } from '../../utils/categoryIcons';

// ✅ INTERFACE PROPS SIMPLIFICADA
interface SearchPageProps {
  onProductClick: (product: Product) => void;
  currentList?: Lista;
  onAddToList: (product: Product, quantity?: number) => void;
  onSaveList: (name: string) => void;
  onGoToListaCompleta: (lista: Lista) => void;
  onGoToMyLists?: () => void;
  onUpdateList?: (updatedList: Lista) => void;
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  initialQuery?: string;
  maxResults?: number;
  canUseListFeatures?: boolean;
  
  // ✅ Props do sistema de autodescoberta
  totalSources?: number;
  totalMarkets?: number;
  lastLoadTime?: number;
  products?: Product[];
  loading?: boolean;
  error?: string | null;
}

// ✅ COMPONENTE PRINCIPAL SEARCHPAGE - ZERO REDUNDÂNCIAS
export const SearchPage: React.FC<SearchPageProps> = ({
  onProductClick,
  currentList,
  onAddToList,
  onSaveList,
  onGoToListaCompleta,
  onGoToMyLists,
  onUpdateList,
  onUpdateQuantity,
  onRemoveItem,
  initialQuery = '',
  maxResults = -1, // -1 = sem limite
  canUseListFeatures: propCanUseListFeatures,
  
  // ✅ Props do sistema de autodescoberta
  totalSources = 0,
  totalMarkets = 0,
  lastLoadTime = 0,
  products: propProducts = [],
  loading: propLoading = false,
  error: propError = null
}) => {
  
  // ====================================
  // HOOKS REUTILIZADOS (CONFORME MAPA)
  // ====================================
  
  // ✅ AUTENTICAÇÃO E PERMISSÕES
  const { user, isCliente } = useAuth();
  const canUseListFeatures = propCanUseListFeatures ?? isCliente;

  // ✅ HOOKS DE DADOS - AUTO-DISCOVERY
  const {
    products: hookProducts,
    allProducts: hookAllProducts,
    categories: hookCategories,
    markets: hookMarkets,
    brands: hookBrands,
    loading: hookLoading,
    error: hookError,
    searchProducts,
    loadProducts,
    searchTerm: hookSearchTerm,
    setSearchTerm: setHookSearchTerm
  } = useAutoDiscoveryData();
  
  // ✅ CARREGAMENTO INICIAL REMOVIDO - O HOOK JÁ GERENCIA AUTOMATICAMENTE
  // Removido useEffect redundante que causava race conditions
  
  // ✅ USAR APENAS DADOS DO HOOK INTERNO
  const finalProducts = hookProducts;
  const finalAllProducts = hookAllProducts;
  const finalCategories = hookCategories;
  const finalMarkets = hookMarkets;
  const finalBrands = hookBrands;
  const finalLoading = hookLoading;
  const finalError = hookError;

  // ✅ HOOKS DE INTERFACE
  const { favorites, toggleFavorite } = useFavorites();
  const { searchHistory, addToHistory } = useSearchHistory();
  const { showSuccess, showError, showWarning, showInfo, showSmart } = useToast();
  
  // ✅ FUNÇÃO ADAPTADORA PARA SHOWTOAST
  const showToast = useCallback((message: string, type: string = 'info') => {
    switch (type) {
      case 'success':
        showSuccess(message);
        break;
      case 'error':
        showError(message);
        break;
      case 'warning':
        showWarning(message);
        break;
      case 'smart':
        showSmart(message);
        break;
      case 'info':
      default:
        showInfo(message);
        break;
    }
  }, [showSuccess, showError, showWarning, showInfo, showSmart]);
  
  const { formatPrice } = usePrice();

  // ✅ ESTADOS LOCAIS MÍNIMOS
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✅ SCROLL INFINITO
  const ITEMS_PER_PAGE = 12;
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // ✅ FILTROS AVANÇADOS
  const [filters, setFilters] = useState<SearchFilters>({
    priceMin: '',
    priceMax: '',
    onlyPromotions: false,
    onlyInStock: true,
    maxDistance: '',
    mercado: 'all',
    marca: 'all',
    rating: 0,
    category: '',
    hasPromotion: false,
    isNew: false,
    isBestPrice: false,
    minRating: 0,
    maxRating: 5,
    sortBy: 'relevance',
    orderBy: 'asc'
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ✅ DEBUG LOG (APÓS TODAS AS DECLARAÇÕES)
  console.log('🔍 SearchPage - Estado dos dados:', {
    hookProducts: hookProducts.length,
    hookAllProducts: hookAllProducts.length,
    finalProducts: finalProducts.length,
    hookCategories: hookCategories.length,
    finalMarkets: finalMarkets.length,
    selectedCategory,
    filters,
    sortBy,
    hookLoading,
    finalLoading
  });

  // ====================================
  // COMPUTED VALUES (REAPROVEITANDO LÓGICA)
  // ====================================
  
  // ✅ Lista segura (REUTILIZADA DO MAPA)
  const safeCurrentList = useMemo(() => {
    console.log('🔄 safeCurrentList recalculando:', {
      hasCurrentList: !!currentList,
      itemsLength: currentList?.itens?.length || 0,
      listId: currentList?.id,
      timestamp: currentList?.dataUltimaEdicao,
      forceUpdate: currentList?._forceUpdate,
      firstItemSample: currentList?.itens?.[0] ? {
        id: currentList.itens[0].produto?.id,
        nome: currentList.itens[0].produto?.nome,
        quantidade: currentList.itens[0].quantidade,
        loja: currentList.itens[0].produto?.loja
      } : null
    });
    
    if (!currentList) {
      return {
        id: 'default',
        nome: 'Minha Lista',
        itens: [],
        dataUltimaEdicao: new Date().toISOString(),
        dataCriacao: new Date().toISOString()
      };
    }
    return { ...currentList, itens: currentList.itens || [] };
  }, [currentList]);

  // ✅ Produtos filtrados (LÓGICA REUTILIZADA)
  const filteredProducts = useMemo(() => {
    console.log('🔄 Recalculando filteredProducts:', {
      totalProducts: finalProducts.length,
      selectedCategory,
      filtersActive: Object.values(filters).some(v => v !== '' && v !== false && v !== 'all' && v !== 0)
    });
    
    let filtered = [...finalProducts];

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      const beforeCategoryFilter = filtered.length;
      filtered = filtered.filter(p => 
        p.categoria?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.categoria?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      console.log(`📂 Filtro categoria "${selectedCategory}": ${beforeCategoryFilter} → ${filtered.length} produtos`);
    }

    // Filtros avançados (REUTILIZANDO LÓGICA)
    filtered = filtered.filter(product => {
      if (filters.priceMin && product.preco < parseFloat(filters.priceMin)) return false;
      if (filters.priceMax && product.preco > parseFloat(filters.priceMax)) return false;
      if (filters.onlyPromotions && !product.promocao) return false;
      if (filters.onlyInStock && !product.disponivel) return false;
      if (filters.maxDistance && product.distancia && product.distancia > parseFloat(filters.maxDistance)) return false;
      if (filters.mercado !== 'all' && product.loja !== filters.mercado) return false;
      if (filters.marca !== 'all' && product.marca !== filters.marca) return false;
      if (filters.rating > 0 && (product.avaliacao || 0) < filters.rating) return false;
      if (filters.isBestPrice && !product.isMelhorPreco) return false;
      
      return true;
    });

    // Ordenação (REUTILIZANDO LÓGICA DO MAPA)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.preco - b.preco;
        case 'price_desc':
          return b.preco - a.preco;
        case 'distance':
          return (a.distancia || 999) - (b.distancia || 999);
        case 'rating':
          return (b.avaliacao || 0) - (a.avaliacao || 0);
        case 'discount':
          const aDiscount = a.promocao && typeof a.promocao === 'object' ? a.promocao.desconto : 0;
          const bDiscount = b.promocao && typeof b.promocao === 'object' ? b.promocao.desconto : 0;
          return bDiscount - aDiscount;
        case 'newest':
          return (b.isNovo ? 1 : 0) - (a.isNovo ? 1 : 0);
        case 'popularity':
          return (b.visualizacoes || 0) - (a.visualizacoes || 0);
        case 'relevance':
        default:
          const aScore = (a.promocao ? 100 : 0) + (a.disponivel ? 50 : 0);
          const bScore = (b.promocao ? 100 : 0) + (b.disponivel ? 50 : 0);
          const comparison = bScore - aScore;
          return comparison === 0 ? a.nome.localeCompare(b.nome) : comparison;
      }
    });

    // Se maxResults = -1, mostra todos os produtos sem limite
    const finalFiltered = maxResults > 0 ? filtered.slice(0, maxResults) : filtered;
    console.log(`✅ Produtos filtrados final: ${finalFiltered.length} de ${finalProducts.length} total`);
    
    return finalFiltered;
  }, [finalProducts, selectedCategory, filters, sortBy, maxResults]);

  // ✅ Produtos exibidos
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayedCount);
  }, [filteredProducts, displayedCount]);

  const hasMoreProducts = displayedCount < filteredProducts.length;

  // ✅ FUNÇÃO PARA CARREGAR MAIS PRODUTOS
  const loadMoreProducts = useCallback(async () => {
    if (hasMoreProducts && !finalLoading) {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length));
    }
  }, [hasMoreProducts, finalLoading, filteredProducts.length]);

  // ✅ SCROLL INFINITO
  const infiniteScroll = useInfiniteScroll(
    loadMoreProducts,
    hasMoreProducts,
    finalLoading,
    {
      threshold: 300, // Trigger 300px before bottom
      enabled: true,
      debounceMs: 200
    }
  );

  // ✅ Sugestões inteligentes (MOCKADAS)
  const smartSuggestions = useMemo(() => {
    const baseSuggestions = ['Arroz', 'Feijão', 'Leite', 'Pão', 'Café', 'Óleo', 'Açúcar'];
    if (!searchQuery.trim()) return baseSuggestions;
    
    return finalProducts
      .filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(p => p.nome)
      .concat(baseSuggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
      .slice(0, 8);
  }, [finalProducts, searchQuery]);

  // ====================================
  // HANDLERS (REUTILIZANDO PADRÕES)
  // ====================================
  
  // ✅ Busca (REUTILIZANDO LÓGICA)
  const performSearch = useCallback(async (query: string) => {
    console.log(`🎯 SearchPage performSearch chamado com: "${query}" (length: ${query ? query.length : 0})`);
    if (!query.trim()) {
      console.log(`⏭️ SearchPage performSearch - query vazio, retornando sem fazer nada`);
      return;
    }
    try {
      console.log(`🔍 SearchPage performSearch - iniciando busca real para: "${query}"`);
      addToHistory(query);
      await searchProducts(query);
      setDisplayedCount(ITEMS_PER_PAGE);
    } catch (error) {
      console.error(`❌ SearchPage performSearch - erro:`, error);
      showToast('Erro ao buscar produtos', 'error');
    }
  }, [searchProducts, addToHistory, showToast]);

  const handleSearchSubmit = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // ✅ Filtros (REUTILIZANDO PADRÕES)
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setDisplayedCount(ITEMS_PER_PAGE);
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setDisplayedCount(ITEMS_PER_PAGE);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      priceMin: '', priceMax: '', onlyPromotions: false, onlyInStock: true,
      maxDistance: '', mercado: 'all', marca: 'all', rating: 0, category: '',
      hasPromotion: false, isNew: false, isBestPrice: false, minRating: 0,
      maxRating: 5, sortBy: 'relevance', orderBy: 'asc'
    });
    setSearchQuery('');
    setSelectedCategory('all');
    setDisplayedCount(ITEMS_PER_PAGE);
  }, []);

  // ✅ RESET DO SCROLL INFINITO QUANDO FILTROS MUDAM
  const resetInfiniteScroll = useCallback(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, []); // Removido todas as dependências para evitar loops

  // ✅ Modal e ações (REUTILIZANDO PADRÕES)
  const handleAddToList = useCallback((product: Product) => {
    if (!canUseListFeatures) {
      showToast('Funcionalidade de lista não disponível', 'warning');
      return;
    }
    
    if (onAddToList) {
      onAddToList(product, 1);
      showToast(`${product.nome} adicionado à lista!`, 'success');
    } else {
      showToast('Erro: função de adicionar não disponível', 'error');
    }
  }, [onAddToList, canUseListFeatures, showToast]);

  // ✅ FUNÇÃO INTERNA PARA APLICAR SUGESTÕES (sem useCallback para sempre usar estado atual)
  const applyIASuggestion = (suggestion) => {
    // ✅ USAR SEMPRE A LISTA MAIS ATUALIZADA DO SAFESTATE
    const latestList = safeCurrentList;
    
    console.log('🔍 Estado das listas no handleApplySuggestion:', {
      currentListRef: currentList?.id,
      safeCurrentListRef: safeCurrentList?.id,
      latestListRef: latestList?.id,
      areReferencesEqual: currentList === safeCurrentList,
      currentListItems: currentList?.itens?.length || 0,
      safeListItems: safeCurrentList?.itens?.length || 0
    });
    
    console.log('🎯 handleApplySuggestion iniciado com:', {
      hasSuggestion: !!suggestion,
      hasLatestList: !!latestList,
      hasOnUpdateList: typeof onUpdateList === 'function',
      suggestionType: suggestion?.tipo || suggestion?.type || 'undefined',
      latestListSnapshot: latestList ? {
        id: latestList.id,
        nome: latestList.nome,
        itemsCount: latestList.itens?.length || 0,
        sampleItems: latestList.itens?.slice(0, 2)?.map(item => ({
          id: item.produto?.id,
          nome: item.produto?.nome,
          quantidade: item.quantidade,
          loja: item.produto?.loja
        }))
      } : null
    });
    
    if (!suggestion || !latestList || !onUpdateList) {
      const errorMsg = `Dados insuficientes: suggestion=${!!suggestion}, latestList=${!!latestList}, onUpdateList=${typeof onUpdateList === 'function'}`;
      console.error('❌ Validação falhou:', errorMsg);
      return {
        success: false,
        message: errorMsg
      };
    }
    
    if (!latestList.itens) {
      console.error('❌ latestList.itens é undefined');
      return {
        success: false,
        message: 'Lista não possui itens válidos'
      };
    }

    try {
      console.log('🧠 Aplicando sugestão da IA:', suggestion);
      
      // ✅ CRIAR CÓPIA PROFUNDA PARA GARANTIR REATIVIDADE
      let updatedList = { 
        ...latestList, 
        itens: [...(latestList.itens || [])],
        dataUltimaEdicao: new Date().toISOString()
      };
      
      switch (suggestion.tipo || suggestion.type) {
        case 'substituir_produto':
        case 'substitute_product':
          // Substituir um produto por outro
          if (suggestion.action?.oldProductId && suggestion.action?.newProduct) {
            console.log('🔄 Substituindo produto:', suggestion.action.oldProductId, '→', suggestion.action.newProduct.nome);
            const itemIndex = updatedList.itens.findIndex(item => 
              item?.produto?.id === suggestion.action.oldProductId
            );
            
            if (itemIndex !== -1) {
              updatedList.itens = updatedList.itens.map((item, index) => 
                index === itemIndex 
                  ? { ...item, produto: { ...suggestion.action.newProduct } }
                  : item
              );
              console.log('✅ Produto substituído no índice:', itemIndex);
            } else {
              console.warn('⚠️ Produto não encontrado para substituição:', suggestion.action.oldProductId);
            }
          } else {
            console.warn('⚠️ Dados insuficientes para substituição:', suggestion.action);
          }
          break;

        case 'ajustar_quantidade':
        case 'adjust_quantity':
          // Ajustar quantidade de um produto
          if (suggestion.action?.productId && typeof suggestion.action?.newQuantity === 'number') {
            console.log('🔄 Ajustando quantidade:', suggestion.action.productId, '→', suggestion.action.newQuantity);
            const itemIndex = updatedList.itens.findIndex(item => 
              item?.produto?.id === suggestion.action.productId
            );
            
            if (itemIndex !== -1) {
              updatedList.itens = updatedList.itens.map((item, index) => 
                index === itemIndex 
                  ? { ...item, quantidade: suggestion.action.newQuantity }
                  : item
              );
              console.log('✅ Quantidade ajustada no índice:', itemIndex);
            } else {
              console.warn('⚠️ Produto não encontrado para ajustar quantidade:', suggestion.action.productId);
            }
          } else {
            console.warn('⚠️ Dados insuficientes para ajustar quantidade:', suggestion.action);
          }
          break;

        case 'adicionar_produto':
        case 'add_product':
          // Adicionar um produto complementar
          if (suggestion.action?.newProduct && suggestion.action.newProduct.id) {
            console.log('🔄 Adicionando produto:', suggestion.action.newProduct.nome);
            const newItem = {
              produto: { ...suggestion.action.newProduct },
              quantidade: suggestion.action?.quantity || 1
            };
            updatedList.itens = [...updatedList.itens, newItem];
            console.log('✅ Produto adicionado, total de itens:', updatedList.itens.length);
          } else {
            console.warn('⚠️ Dados insuficientes para adicionar produto:', suggestion.action);
          }
          break;

        case 'remover_produto':
        case 'remove_product':
          // Remover um produto
          if (suggestion.action?.productId) {
            console.log('🔄 Removendo produto:', suggestion.action.productId);
            const originalCount = updatedList.itens.length;
            updatedList.itens = updatedList.itens.filter(item => 
              item?.produto?.id !== suggestion.action.productId
            );
            console.log('✅ Produto removido, itens:', originalCount, '→', updatedList.itens.length);
          } else {
            console.warn('⚠️ ID do produto não fornecido para remoção');
          }
          break;

        case 'store':
        case 'mudar_loja':
        case 'otimizar_rota':
          // Otimização de loja/rota - reorganizar produtos por proximidade
          if (suggestion.action?.optimizedOrder) {
            // Reorganizar itens conforme sugestão da IA
            const optimizedItems = suggestion.action.optimizedOrder.map((orderedId: string) => {
              const foundItem = updatedList.itens.find(item => item.produto.id === orderedId);
              return foundItem ? { ...foundItem, produto: { ...foundItem.produto } } : null;
            }).filter(Boolean);
            updatedList.itens = optimizedItems;
          } else if (suggestion.action?.preferredStore) {
            // Sugerir produtos de uma loja específica
            console.log('🏪 Sugestão de loja preferencial:', suggestion.action.preferredStore);
          } else if (suggestion.action?.productId && suggestion.mercadoSugerido) {
            // ✅ FORMATO LISTACOMPLETA: Mudar loja de um produto específico
            console.log('🔄 Mudando loja do produto:', suggestion.action.productId, '→', suggestion.mercadoSugerido);
            const itemIndex = updatedList.itens.findIndex(item => 
              item?.produto?.id === suggestion.action.productId
            );
            
            if (itemIndex !== -1) {
              updatedList.itens = updatedList.itens.map((item, index) => 
                index === itemIndex 
                  ? { 
                      ...item, 
                      produto: { 
                        ...item.produto, 
                        loja: suggestion.mercadoSugerido,
                        preco: suggestion.precoSugerido || item.produto.preco
                      } 
                    }
                  : item
              );
              console.log('✅ Loja alterada no índice:', itemIndex);
            } else {
              console.warn('⚠️ Produto não encontrado para mudança de loja:', suggestion.action.productId);
            }
          }
          break;

        case 'test':
          // ✅ TESTE: Simplesmente dobrar a quantidade do primeiro item
          if (updatedList.itens.length > 0) {
            console.log('🧪 TESTE: Dobrando quantidade do primeiro item');
            updatedList.itens = updatedList.itens.map((item, index) => 
              index === 0 
                ? { ...item, quantidade: (item.quantidade || 1) * 2 }
                : item
            );
            console.log('✅ TESTE: Primeira quantidade alterada para:', updatedList.itens[0].quantidade);
          }
          break;

        default:
          console.warn('Tipo de sugestão desconhecido:', suggestion.tipo || suggestion.type);
          return {
            success: false,
            message: 'Tipo de sugestão não suportado'
          };
      }

      // Atualizar a lista
      console.log('🔄 Antes de chamar onUpdateList:', {
        originalItems: latestList.itens.length,
        updatedItems: updatedList.itens.length,
        suggestion: suggestion.tipo || suggestion.type,
        updatedListId: updatedList.id,
        timestamp: updatedList.dataUltimaEdicao
      });
      
      // ✅ GARANTIR QUE A REFERÊNCIA MUDE COMPLETAMENTE
      const finalList = {
        ...updatedList,
        id: updatedList.id || `lista-${Date.now()}`,
        _forceUpdate: Date.now() // Flag para forçar re-render
      };
      
      console.log('🚀 Chamando onUpdateList com:', {
        type: typeof onUpdateList,
        finalListId: finalList.id,
        itemsCount: finalList.itens.length,
        forceUpdate: finalList._forceUpdate,
        firstItem: finalList.itens[0] ? {
          id: finalList.itens[0].produto.id,
          nome: finalList.itens[0].produto.nome,
          quantidade: finalList.itens[0].quantidade
        } : null
      });
      
      onUpdateList(finalList);
      
      console.log('✅ onUpdateList executado - aguardando propagação...');
      
      // ✅ FORÇAR RE-RENDER APÓS DELAY
      setTimeout(() => {
        console.log('🔄 Verificando se lista foi atualizada após 100ms:', {
          originalId: latestList?.id,
          newId: finalList.id,
          originalItems: latestList?.itens?.length || 0,
          newItems: finalList.itens.length,
          listsAreEqual: latestList === finalList,
          currentListReference: currentList,
          latestListReference: latestList,
          finalListReference: finalList
        });
        
        // ✅ TESTE: Forçar re-render completo
        console.log('🧪 TESTE: Forçando re-render...');
        setForceRender(prev => prev + 1);
        
        // E também fechar/abrir modal
        setIsModalOpen(false);
        setTimeout(() => {
          setIsModalOpen(true);
          console.log('✅ Modal reaberto com dados atualizados');
        }, 50);
      }, 100);
      
      showToast('🧠 Sugestão da IA aplicada com sucesso!', 'success');
      
      return {
        success: true,
        message: suggestion.mensagem || 'Sugestão aplicada com sucesso!'
      };
      
    } catch (error) {
      console.error('❌ Erro ao aplicar sugestão - DETALHES:', {
        error: error.message,
        stack: error.stack,
        suggestion,
        currentList: currentList ? {
          id: currentList.id,
          itemsCount: currentList.itens?.length || 0
        } : 'null',
        onUpdateListExists: typeof onUpdateList === 'function'
      });
      showToast(`Erro ao aplicar sugestão: ${error.message}`, 'error');
      return {
        success: false,
        message: `Erro interno: ${error.message}`
      };
    }
  };

  // ✅ WRAPPER COM USECALLBACK PARA ESTABILIDADE
  const handleApplySuggestion = useCallback((suggestion) => {
    return applyIASuggestion(suggestion);
  }, []);

  // ✅ TESTE: Função para simular sugestão via console
  const testSuggestion = useCallback(() => {
    console.log('🧪 Iniciando teste de sugestão...');
    const testSuggestionData = {
      tipo: 'test',
      mensagem: 'Teste de dobrar quantidade'
    };
    return handleApplySuggestion(testSuggestionData);
  }, [handleApplySuggestion]);

  // ✅ Expor função para teste no console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testPrecivoxSuggestion = testSuggestion;
      (window as any).debugCurrentList = () => {
        console.log('📋 Estado atual da lista:', {
          currentList: currentList ? {
            id: currentList.id,
            nome: currentList.nome,
            itemsCount: currentList.itens?.length || 0,
            items: currentList.itens?.map(item => ({
              id: item.produto?.id,
              nome: item.produto?.nome,
              quantidade: item.quantidade,
              loja: item.produto?.loja
            }))
          } : null,
          safeCurrentList: {
            id: safeCurrentList.id,
            nome: safeCurrentList.nome,
            itemsCount: safeCurrentList.itens?.length || 0,
            items: safeCurrentList.itens?.map(item => ({
              id: item.produto?.id,
              nome: item.produto?.nome,
              quantidade: item.quantidade,
              loja: item.produto?.loja
            }))
          },
          forceRender
        });
      };
      console.log('🧪 Para testar: window.testPrecivoxSuggestion() ou window.debugCurrentList()');
    }
  }, [testSuggestion, currentList, safeCurrentList, forceRender]);

  const handleProductClick = useCallback((product: Product) => {
    if (typeof onProductClick === 'function') {
      onProductClick(product);
    }
  }, [onProductClick]);

  // ====================================
  // EFFECTS (REUTILIZANDO PADRÕES)
  // ====================================
  
  // REMOVIDO: useEffect com debouncedSearchQuery que causava blur no mobile
  // A busca agora acontece apenas quando o usuário pressiona Enter ou clica no botão
  // useEffect(() => {
  //   if (debouncedSearchQuery.trim()) {
  //     performSearch(debouncedSearchQuery);
  //   }
  // }, [debouncedSearchQuery, performSearch]);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [filters, sortBy, selectedCategory, searchQuery]);

  // Modal debug removed for production

  // ====================================
  // RENDER FUNCTIONS
  // ====================================
  
  const renderResults = () => {
    if (finalLoading) {
      return (
        <div className="text-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto text-[#004A7C] mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Buscando produtos...</p>
        </div>
      );
    }

    if (finalError) {
      return (
        <div className="text-center py-12 px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">Erro ao carregar produtos</h3>
          <p className="text-red-700 mb-6">{finalError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (displayedProducts.length > 0) {
      console.log('🎨 Renderizando produtos:', displayedProducts.length);
      return (
        <div>
          {/* Grid/List de Produtos */}
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-3'
          }`}>
            {displayedProducts.map((product) => {
              const isFavorite = favorites.some(fav => fav.id === product.id);
              
              return (
                <div key={product.id} className="product-item">
                  <ProductCard
                    product={product}
                    viewMode={viewMode}
                    onClick={handleProductClick}
                    onAddToList={handleAddToList}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                    canUseListFeatures={canUseListFeatures}
                    formatPrice={formatPrice}
                  />
                </div>
              );
            })}
          </div>

          {/* Scroll Infinito - Loading Indicator */}
          {infiniteScroll.isNearEnd && hasMoreProducts && (
            <div className="mt-6 sm:mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Carregando mais produtos...</span>
              </div>
            </div>
          )}

          {/* Indicador de fim */}
          {!hasMoreProducts && filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                ✅ Todos os {filteredProducts.length} produtos foram carregados
              </div>
            </div>
          )}

          {/* Progresso do scroll infinito */}
          {hasMoreProducts && displayedCount > ITEMS_PER_PAGE && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-500">
                Mostrando {displayedCount} de {filteredProducts.length} produtos
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2 max-w-xs mx-auto">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((displayedCount / filteredProducts.length) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Empty State
    console.log('😞 Estado vazio - dados:', { 
      finalProducts: finalProducts.length, 
      displayedProducts: displayedProducts.length,
      filteredProducts: filteredProducts.length,
      searchQuery 
    });
    
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {searchQuery ? 'Nenhum produto encontrado' : 'Carregando produtos...'}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {searchQuery 
            ? `Não encontramos produtos para "${searchQuery}". Tente outros termos.`
            : 'Aguardando carregamento dos produtos...'
          }
        </p>
        
        {/* 🔧 DEBUG INFO PARA MOBILE */}
        {typeof window !== 'undefined' && window.innerWidth < 768 && !searchQuery && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 text-left max-w-md mx-auto">
            <h4 className="font-semibold mb-2">📱 Debug Mobile:</h4>
            <p>• Produtos carregados: {displayedProducts.length}</p>
            <p>• Todos produtos: {finalProducts.length}</p>
            <p>• Loading: {finalLoading ? 'Sim' : 'Não'}</p>
            <p>• Erro: {finalError || 'Nenhum'}</p>
            <p>• Host: {window.location.hostname}</p>
            <p>• User Agent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</p>
            <p>• Timestamp: {new Date().toLocaleTimeString()}</p>
          </div>
        )}
        {searchQuery ? (
          <button
            onClick={handleClearFilters}
            className="bg-[#004A7C] text-white px-6 py-3 rounded-lg hover:bg-[#0066A3] transition-colors font-medium"
          >
            Limpar busca
          </button>
        ) : (
          <button
            onClick={() => {
              console.log('🔄 Forçando recarga manual...');
              loadProducts();
            }}
            className="bg-[#004A7C] text-white px-6 py-3 rounded-lg hover:bg-[#0066A3] transition-colors font-medium"
            disabled={finalLoading}
          >
            {finalLoading ? '⏳ Carregando...' : '🔄 Carregar Produtos'}
          </button>
        )}
      </div>
    );
  };

  // ====================================
  // RENDER (REUTILIZANDO COMPONENTES)
  // ====================================
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ✅ Header - MOBILE FIRST */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          {/* Mobile: Stack vertical */}
          <div className="block sm:hidden space-y-4 mb-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">🔍 Buscar Produtos</h1>
              <p className="text-sm text-gray-600 mt-1">
                {`${finalAllProducts.length} produtos disponíveis`}
              </p>
            </div>
            
          </div>

          {/* Desktop: Layout horizontal original */}
          <div className="hidden sm:flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Buscar Produtos</h1>
              <p className="text-gray-600">
                {`${finalAllProducts.length} produtos carregados`}
              </p>
            </div>
            
          </div>


          {/* ✅ SearchBar (REUTILIZANDO COMPONENTE) */}
          <SearchBar
            value={searchQuery}
            onChange={handleSearchInput}
            onSearch={handleSearchSubmit}
            loading={finalLoading}
            suggestions={smartSuggestions}
            recentSearches={searchHistory}
            placeholder="Digite o produto que você procura (ex: carne, arroz, detergente...)"
            showHistory={true}
            onClear={() => setSearchQuery('')}
            variant="default"
            showSmartLabel={true}
          />

          {/* Localização */}
          <div className="flex items-center text-sm text-gray-600 mt-4">
            <MapPin className="h-4 w-4 mr-2 text-[#B9E937]" />
            <span>Buscando em Franco da Rocha, SP</span>
          </div>
        </div>

        {/* ✅ Filtros de categoria (REUTILIZANDO COMPONENTE) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <CategoryFilter
            categories={finalCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            showCounts={false}
            collapsible={true}
            maxVisible={8}
            showIcons={true}
          />
        </div>

        {/* ✅ Filtros e Controles - LAYOUT UNIFICADO */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Filtros avançados - sempre visível */}
          <div className="mb-4 md:mb-0">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              markets={finalMarkets}
              brands={finalBrands}
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
              showDistanceFilter={true}
              showRatingFilter={true}
            />
          </div>
          
          {/* Controles responsivos */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Contador de resultados */}
            <div className="text-sm text-gray-600 text-center md:text-left">
              {filteredProducts.length > 0 && (
                <>📊 {displayedProducts.length} de {filteredProducts.length} produtos</>
              )}
            </div>
            
            {/* Controles de ordenação e visualização */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Ordenação */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Ordenar por:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-[#004A7C] focus:border-transparent min-w-[180px]"
                >
                  <option value="relevancia">🎯 Relevância</option>
                  <option value="preco_asc">💰 Menor preço</option>
                  <option value="preco_desc">💎 Maior preço</option>
                  <option value="distancia">📍 Mais próximo</option>
                  <option value="rating">⭐ Melhor avaliado</option>
                  <option value="discount">🏷️ Maior desconto</option>
                  <option value="newest">🆕 Mais novos</option>
                  <option value="popularity">🔥 Mais visualizados</option>
                </select>
              </div>

              {/* Visualização */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Visualização:
                </label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden flex-1 sm:flex-none">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors flex-1 sm:flex-none ${
                      viewMode === 'grid' 
                        ? 'bg-[#004A7C] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors flex-1 sm:flex-none ${
                      viewMode === 'list' 
                        ? 'bg-[#004A7C] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Status do carregamento e produtos */}
        {renderResults()}
      </div>

      {/* ✅ Modal da lista CORRIGIDO - PROPS CORRETOS */}
      {canUseListFeatures && isModalOpen && (() => {
        console.log('🎯 Renderizando ModalLista com:', {
          itemsCount: safeCurrentList?.itens?.length || 0,
          listName: safeCurrentList?.nome,
          items: safeCurrentList?.itens?.slice(0, 3).map(item => ({
            id: item.produto?.id,
            nome: item.produto?.nome,
            quantidade: item.quantidade
          }))
        });
        
        return (
          <ModalLista
            key={`modal-${forceRender}-${safeCurrentList?.id}-${safeCurrentList?._forceUpdate}`}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            listItems={safeCurrentList?.itens || []}
            currentListName={safeCurrentList?.nome || 'Minha Lista'}
            onUpdateQuantity={(productId, newQuantity) => {
              if (onUpdateQuantity) {
                onUpdateQuantity(productId, newQuantity);
              }
            }}
            onRemoveItem={(productId) => {
              if (onRemoveItem) {
                onRemoveItem(productId);
              }
            }}
            onApplySuggestion={handleApplySuggestion}
            onSaveList={onSaveList}
            onUpdateList={onUpdateList}
            onGoToListaCompleta={onGoToListaCompleta}
            onGoToMyLists={onGoToMyLists}
            viewMode={viewMode}
            user={user}
            isGuest={!user}
          />
        );
      })()}
      
      {/* ✅ Botão Flutuante da Lista - Oculto quando modal está aberto */}
      {canUseListFeatures && !isModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#B9E937] text-[#004A7C] w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:bg-[#A3CC30] transition-all duration-300 flex items-center justify-center group"
          title={`Minha Lista (${safeCurrentList?.itens?.length || 0} itens)`}
        >
          <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          {(safeCurrentList?.itens?.length || 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {safeCurrentList?.itens?.length || 0}
            </span>
          )}
        </button>
      )}

      {/* Wishlist persistente - Desabilitado temporariamente */}
      {/* {favorites.length > 0 && (
        <WishlistManager favorites={favorites} onRemoveFavorite={handleRemoveFavorite} />
      )} */}
    </div>
  );
};

export default SearchPage;
