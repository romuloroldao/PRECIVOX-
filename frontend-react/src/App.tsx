// App.tsx - PROPS CORRIGIDAS PARA MINHASLISTAS + SISTEMA TOAST
import React, { useEffect } from 'react';
import './App.css';
import './styles/App.styles.css';

// ✅ SISTEMA DE TOAST ADICIONADO
import { ToastProvider } from './hooks/useToast';
import { ToastSystem } from './components/common/Toast';

// ✅ COMPONENTES REAIS MANTIDOS
import { Navigation } from './components/Navigation';
import { SearchPage } from './components/search/SearchPage'; // ✅ CORRIGIDO: SearchPage exportado como named export
import PricingPlans from './pages/PricingPlans';  
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';  
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
// import SearchStats from './components/SearchStats'; // Commented out if not used
import DetalheProduto from './components/products/DetalheProduto';
import ListaCompleta from './components/list/ListaCompleta';
import MinhasListas from './components/list/MinhasListas'; // ✅ MinhasListas está em components
// MultiSourceDemo removed for production
// AITestComponent removed for production

// ✅ TIPOS E UTILS REAIS MANTIDOS - USANDO TIPOS PORTUGUESES
import { Product, Lista, ListaItem } from './types/product';
import { formatPrice, formatDate } from './utils/helpers';

// ✅ TODOS OS HOOKS MANTIDOS
import { useAppState } from './hooks/useAppState';
import { useApiServices } from './hooks/useApiServices';
import { useLocation } from './hooks/useLocation';
import { useAutoDiscoveryData } from './hooks/useAutoDiscoveryData';
import { useProductFilters } from './hooks/useProductFilters';
import { useSearchHistory } from './hooks/useSearchHistory';
import { useViewMode } from './hooks/useViewMode';
import { useFavorites } from './hooks/useFavorites';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { saveToStorage, getFromStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';

// ✅ SISTEMA DE AUTENTICAÇÃO E PERMISSÕES
import { useAuth, usePermissions } from './hooks/useAuth';

function App() {
  // ✅ AUTENTICAÇÃO
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    logout,
    updateProfile
  } = useAuth();

  // ✅ PERMISSÕES
  const { canAccessAdminPanel } = usePermissions();

  // ✅ DERIVAÇÕES COMPATÍVEIS
  const isCliente = user?.role === 'cliente';
  const isGestor = user?.role === 'gestor';
  const isAdmin = user?.role === 'admin';
  const userRole = user?.role || 'guest';
  const userName = user?.name || 'Usuário';

  // ✅ DERIVAÇÕES PARA COMPATIBILIDADE
  const userPlan = user?.plan || 'free';
  const userStore = (user as any)?.store || null;
  const canAccessDashboard = isGestor || isAdmin;
  const canCreateLists = isCliente;

  // ✅ SISTEMA DE PERMISSÕES SIMPLIFICADO
  const permissions: string[] = [];
  const can = (permission: string) => false;
  const needsUpgrade = () => false;

  // ✅ TODOS OS HOOKS EXISTENTES MANTIDOS
  const { 
    currentPage, 
    setCurrentPage, 
    currentList,
    allLists,
    addProductToCurrentList,
    updateProductQuantityInCurrentList,
    removeProductFromCurrentList,
    updateListInAllLists,
    duplicateList,
    deleteList,
    goToMyLists,
    goToListCompleta,
    goToListDetails,
    goToEditList,
    createNewEmptyList,
    selectedListForView
  } = useAppState();

  // ✅ Estados adicionais compatíveis
  const loading = false;
  const error = null;
  
  const { 
    isConnected: apiConnected,
    analyticsData,
    locationData,
    loading: apiLoading,
    error: apiError,
    chatMessages,
    sendChatMessage: sendMessage
  } = useApiServices();
  
  const { 
    searchProducts: performSearch,
    products, 
    searchTerm, 
    setSearchTerm, 
    loadProducts,
    allProducts,
    loading: productsLoading,
    error: productsError,
    categories,
    markets,
    brands,
    totalSources,
    totalMarkets,
    lastLoadTime
  } = useAutoDiscoveryData();
  
  const { 
    location, 
    refreshLocation, 
    forceRefresh, 
    isCacheValid, 
    cacheAge,
    loading: locationLoading,
    displayName: locationDisplay
  } = useLocation();
  
  const { 
    filters, 
    applyFilters, 
    clearFilters,
    updateFilter,
    generateFilterStats,
    getUniqueOptions,
    hasActiveFilters
  } = useProductFilters();
  
  const { searchHistory, addToHistory } = useSearchHistory();
  const { viewMode, setViewMode } = useViewMode();
  const { favorites, toggleFavorite } = useFavorites();
  const infiniteScroll = useInfiniteScroll(() => {}, false, false);
  const scrollLoading = infiniteScroll.isExecuting || false;
  const keyboardNav = useKeyboardNavigation();
  const { selectedIndex } = keyboardNav;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ GERENCIAMENTO DE PÁGINAS COM HASH - CORRIGIDO PARA EVITAR LOOPS
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'search';
      setCurrentPage(hash);
    };

    // Configurar listener apenas uma vez
    window.addEventListener('hashchange', handleHashChange);
    
    // Aplicar hash inicial apenas na primeira carga
    const initialHash = window.location.hash.replace('#', '') || 'search';
    setCurrentPage(initialHash);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // ✅ DEPENDÊNCIAS VAZIAS PARA EVITAR LOOPS

  // ✅ REDIRECIONAMENTO BASEADO NO ESTADO DE AUTENTICAÇÃO - CORRIGIDO
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      if (currentPage !== 'login' && currentPage !== 'register') {
        handlePageChange('login');
      }
      return;
    }

    if (isAuthenticated && user && (currentPage === 'login' || currentPage === 'register')) {
      let targetPage = 'search';
      if (isGestor || isAdmin) {
        targetPage = 'dashboard';
      }
      
      handlePageChange(targetPage);
      
      // 🔧 FIX MOBILE: Carregar produtos automaticamente no mobile
      if (window.innerWidth < 768 && loadProducts && !allProducts.length) {
        setTimeout(() => {
          loadProducts();
        }, 500);
      }
    }

  }, [isAuthenticated, authLoading, user, isGestor, isAdmin, currentPage]);

  // ✅ HANDLER SIMPLIFICADO
  const handleLogin = (loginData: any) => {
    // Login callback debug removed for production
  };

  // ✅ NAVEGAÇÃO POR TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Implementação básica de navegação por teclado
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ✅ HANDLERS MANTIDOS - CORRIGIDO PARA EVITAR REDUNDÂNCIA
  const handlePageChange = (page: string) => {
    // Evitar mudanças desnecessárias
    if (page === currentPage) return;
    
    setCurrentPage(page);
    // O hash será atualizado automaticamente, mas garantimos consistência
    if (window.location.hash.replace('#', '') !== page) {
      window.location.hash = page;
    }
    saveToStorage('currentPage', page);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('login');
      window.location.hash = 'login';
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  // ✅ BUSCA INTELIGENTE CORRIGIDA
  const handleSearchFromSearchPage = async (term: string) => {
    try {
      // Iniciando busca inteligente
      
      if (!term.trim()) {
        setSearchTerm('');
        return;
      }
      
      setSearchTerm(term);
      
      addToHistory(term);
      
      if (performSearch) {
        const results = await performSearch(term);
        // Busca concluída
        
        if (results && results.length > 0) {
          // Resultados encontrados
        } else {
          console.warn(`Busca por "${term}" não retornou resultados`);
        }
      } else {
        console.error('❌ [APP] performSearch não está disponível');
        
        if (allProducts && allProducts.length > 0) {
          console.log('🔄 [APP] Usando fallback de busca local');
          const filtered = allProducts.filter((product: any) => 
            (product.nome || product.name || '').toLowerCase().includes(term.toLowerCase()) ||
            (product.categoria || product.category || '').toLowerCase().includes(term.toLowerCase()) ||
            (product.marca || product.brand || '').toLowerCase().includes(term.toLowerCase()) ||
            (product.loja || product.store || '').toLowerCase().includes(term.toLowerCase())
          );
          console.log(`✅ [APP] Busca local: ${filtered.length} resultados encontrados`);
        }
      }
      
    } catch (error) {
      console.error('❌ [APP] Erro na busca inteligente:', error);
    }
  };

  const handleProductSelect = (product: Product) => {
    const productName = (product as any).nome || (product as any).name || 'Produto';
    console.log('🔍 Produto selecionado:', productName);
    saveToStorage('selectedProduct', product);
    handlePageChange('produto');
  };

  const handleAddToList = (product: Product, quantity: number = 1) => {
    if (!canCreateLists) {
      console.log('🚫 Usuário não pode criar listas');
      return;
    }
    
    console.log(`➕ Adicionando ${(product as any).nome || (product as any).name || 'produto'} à lista (${quantity}x)`);
    addProductToCurrentList(product, quantity);
  };

  const handleSaveList = (listName: string) => {
    if (!canCreateLists) return;
    
    console.log(`💾 Salvando lista: ${listName}`);
    const updatedList = {
      ...currentList,
      name: listName,
      updatedAt: new Date()
    };
    updateListInAllLists(updatedList);
  };

  const generateStats = () => {
    const stats = typeof generateFilterStats === 'function' ? generateFilterStats(products as any) : {
      filteredProducts: products.length,
      totalProducts: products.length,
      promotionsCount: 0,
      priceRange: { min: 0, max: 0 },
      newProductsCount: 0,
      averagePrice: 0,
      storesCount: 0,
      brandsCount: 0
    };
    
    return {
      total: stats.filteredProducts,
      totalAll: stats.totalProducts,
      inPromotion: stats.promotionsCount,
      bestPrice: stats.priceRange.min,
      newProducts: stats.newProductsCount,
      available: products.filter(p => (p as any).disponivel || (p as any).available).length,
      totalViews: products.reduce((sum, p) => sum + ((p as any).visualizacoes || (p as any).views || 0), 0),
      avgPrice: stats.averagePrice,
      maxPrice: stats.priceRange.max,
      minPrice: stats.priceRange.min,
      totalValue: products.reduce((sum, p) => sum + ((p as any).preco || (p as any).price || 0), 0),
      uniqueMarkets: stats.storesCount,
      uniqueBrands: stats.brandsCount
    };
  };

  // ✅ PROPS COMUNS MANTIDOS
  const commonProps = {
    products,
    favorites,
    location: location?.city || 'Franco da Rocha',
    viewMode,
    onViewModeChange: setViewMode,
    onProductSelect: handleProductSelect,
    onToggleFavorite: toggleFavorite,
    loading: loading || scrollLoading || locationLoading || productsLoading,
    currentList,
    onAddToList: handleAddToList,
    onSaveList: handleSaveList,
    onGoToListaCompleta: goToListCompleta,
    onGoToMyLists: goToMyLists,
    onUpdateQuantity: updateProductQuantityInCurrentList,
    onRemoveItem: removeProductFromCurrentList,
    onUpdateList: (updatedList: Lista) => {
      console.log('📝 [APP] Atualizando lista atual via IA:', (updatedList as any).nome || (updatedList as any).name);
      updateListInAllLists(updatedList as any);
    },
    user,
    isAuthenticated,
    permissions,
    canCreateLists,
    canAccessDashboard
  };

  // ✅ LOADING DE AUTENTICAÇÃO
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Carregando PRECIVOX...</p>
          <small className="text-gray-600">Verificando autenticação...</small>
        </div>
      </div>
    );
  }

  // ✅ PÁGINA DE LOGIN
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        {currentPage === 'register' ? (
          <RegisterPage 
            onRegister={handleLogin}
            onBackToLogin={() => {
              setCurrentPage('login');
              window.location.hash = 'login';
            }}
          />
        ) : (
          <LoginPage 
            onLogin={handleLogin}
            onGoToRegister={() => {
              setCurrentPage('register');
              window.location.hash = 'register';
            }}
          />
        )}
        <ToastSystem />
      </ToastProvider>
    );
  }

  // ✅ RENDERIZAÇÃO CONDICIONAL MANTIDA
  const renderCurrentPage = () => {
    
    console.log('🔍 [APP] Renderizando página:', currentPage);
    
    switch (currentPage) {
      case 'search':
      default:
        return (
          <SearchPage 
            onProductClick={handleProductSelect}
            currentList={currentList}
            onAddToList={handleAddToList}
            onSaveList={handleSaveList}
            onGoToListaCompleta={goToListCompleta}
            onGoToMyLists={goToMyLists}
            onUpdateList={(updatedList) => {
              updateListInAllLists(updatedList);
            }}
            onUpdateQuantity={updateProductQuantityInCurrentList}
            onRemoveItem={removeProductFromCurrentList}
            initialQuery={searchTerm}
            canUseListFeatures={canCreateLists}
          />
        );
      
      case 'pricing':
        return (
          <PricingPlans 
            onSelectPlan={() => {}}
          />
        );
      
      case 'dashboard':
      case 'analytics':
        if (!canAccessDashboard) {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
                <p className="text-gray-600 mb-8">Você não tem permissão para acessar o dashboard.</p>
                <button 
                  onClick={() => handlePageChange('pricing')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📊 Ver Planos
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <DashboardPage />
        );

      case 'profile':
        return (
          <ProfilePage />
        );

      case 'admin':
        return (
          <AdminDashboardPage 
            onNavigate={handlePageChange}
          />
        );

      // ✅ CASO PRINCIPAL: MINHASLISTAS COM PROPS CORRETAS
      case 'listas':
        if (!canCreateLists) {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Funcionalidade Não Disponível</h2>
                <p className="text-gray-600 mb-8">Criação de listas disponível apenas para clientes.</p>
                <button 
                  onClick={() => handlePageChange('search')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🏠 Voltar ao Início
                </button>
              </div>
            </div>
          );
        }
        
        console.log('📋 RENDERIZANDO MINHASLISTAS COM PROPS:');
        console.log('- listas:', allLists?.length || 0);
        console.log('- callbacks disponíveis: onBack, onCreateNewList, onEditList, onDeleteList, onViewList, onDuplicateList');
        
        return (
          <MinhasListas 
            listas={(allLists as any) || []} // ✅ GARANTIR ARRAY COM TYPE ASSERTION
            onBack={() => {
              console.log('🔙 App.tsx - Callback onBack executado');
              handlePageChange('search');
            }}
            onCreateNewList={() => {
              console.log('➕ App.tsx - Callback onCreateNewList executado');
              try {
                const newList = createNewEmptyList();
                console.log('📝 Nova lista criada:', (newList as any).nome || (newList as any).name);
                
                // ✅ NAVEGAR PARA BUSCA PARA EDITAR
                handlePageChange('search');
                
                console.log('✅ Navegação para edição concluída');
              } catch (error) {
                console.error('❌ Erro ao criar nova lista:', error);
              }
            }}
            onEditList={(lista: any) => {
              console.log('✏️ App.tsx - Callback onEditList executado para:', (lista as any).nome || (lista as any).name);
              try {
                goToEditList(lista as any);
                handlePageChange('search');
                console.log('✅ Lista definida para edição');
              } catch (error) {
                console.error('❌ Erro ao editar lista:', error);
              }
            }}
            onDeleteList={(listaId: string) => {
              console.log('🗑️ App.tsx - Callback onDeleteList executado para ID:', listaId);
              try {
                deleteList(listaId);
                console.log('✅ Lista excluída com sucesso');
              } catch (error) {
                console.error('❌ Erro ao excluir lista:', error);
              }
            }}
            onViewList={(lista: any) => {
              console.log('👁️ App.tsx - Callback onViewList executado para:', (lista as any).nome || (lista as any).name);
              console.log('📋 Lista recebida:', {
                id: lista.id,
                nome: (lista as any).nome || (lista as any).name,
                itens: (lista as any).itens?.length || (lista as any).items?.length || 0
              });
              
              try {
                // ✅ SEMPRE NAVEGAR - NUNCA VERIFICAR SE LISTA ESTÁ VAZIA
                console.log('✅ Navegando para visualização da lista');
                goToListDetails(lista as any);
                handlePageChange('lista-completa');
                console.log('✅ Navegação concluída');
              } catch (error) {
                console.error('❌ Erro ao visualizar lista:', error);
              }
            }}
            onDuplicateList={(lista: any) => {
              console.log('📄 App.tsx - Callback onDuplicateList executado para:', (lista as any).nome || (lista as any).name);
              try {
                const duplicatedList = duplicateList(lista as any);
                console.log('✅ Lista duplicada:', (duplicatedList as any).nome || (duplicatedList as any).name);
              } catch (error) {
                console.error('❌ Erro ao duplicar lista:', error);
              }
            }}
          />
        );
      
      case 'lista-completa':
        console.log('🔍 [APP] Renderizando lista-completa');
        console.log('📋 [APP] selectedListForView:', selectedListForView);
        console.log('📋 [APP] currentList:', currentList);
        
        if (!canCreateLists) {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
                <p className="text-gray-600 mb-8">Visualização de listas disponível apenas para clientes.</p>
                <button 
                  onClick={() => handlePageChange('search')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🏠 Voltar ao Início
                </button>
              </div>
            </div>
          );
        }
        
        // ✅ BUSCAR LISTA DE MÚLTIPLAS FONTES
        let selectedList = null;
        
        console.log('🔍 [APP] Buscando lista em múltiplas fontes...');
        
        if (selectedListForView) {
          selectedList = selectedListForView;
          console.log('✅ [APP] Lista encontrada no selectedListForView:', (selectedList as any).nome || (selectedList as any).name);
        }
        
        if (!selectedList) {
          try {
            const storedList = localStorage.getItem('selectedList');
            if (storedList) {
              const parsedList = JSON.parse(storedList);
              if (parsedList) {
                selectedList = parsedList;
                console.log('✅ [APP] Lista encontrada no localStorage:', (selectedList as any).nome || (selectedList as any).name);
              }
            }
          } catch (error) {
            console.warn('⚠️ [APP] Erro ao ler localStorage:', error);
          }
        }
        
        if (!selectedList && currentList) {
          selectedList = currentList;
          console.log('✅ [APP] Usando currentList:', (selectedList as any).nome || (selectedList as any).name);
        }
        
        if (!selectedList && allLists && allLists.length > 0) {
          selectedList = allLists[0];
          console.log('✅ [APP] Usando primeira lista disponível:', (selectedList as any).nome || (selectedList as any).name);
          try {
            localStorage.setItem('selectedList', JSON.stringify(selectedList));
          } catch (error) {
            console.warn('⚠️ Erro ao salvar lista:', error);
          }
        }
        
        console.log('📊 [APP] Lista final selecionada:', selectedList);
        console.log('🛒 [APP] Itens na lista:', (selectedList as any)?.itens?.length || selectedList?.items?.length || 0);
        
        // ✅ SE NÃO TEM LISTA, CRIAR UMA LISTA DEMO
        if (!selectedList) {
          console.log('📝 [APP] Criando lista demo para visualização');
          selectedList = {
            id: 'demo-lista',
            nome: 'Lista Demo',
            itens: [
              {
                produto: {
                  id: 'demo-1',
                  nome: 'Arroz Branco 5kg',
                  preco: 15.90,
                  categoria: 'Grãos',
                  loja: 'Supermercado Demo',
                  lojaId: 'demo-loja',
                  disponivel: true,
                  imagem: '/api/placeholder/300/200'
                },
                quantidade: 2
              }
            ],
            dataUltimaEdicao: new Date().toISOString(),
            dataCriacao: new Date().toISOString()
          };
        }
        
        console.log('✅ [APP] Renderizando ListaCompleta com lista:', (selectedList as any).nome || (selectedList as any).name);
        return (
          <ListaCompleta 
            lista={selectedList as any}
            onBack={() => handlePageChange('listas')}
            onUpdateList={(updatedList) => {
              console.log('📝 [APP] Lista atualizada:', updatedList);
              updateListInAllLists(updatedList as any);
              localStorage.setItem('selectedList', JSON.stringify(updatedList));
            }}
            onProductClick={handleProductSelect as any}
          />
        );
      
      case 'produto':
        const selectedProduct = getFromStorage('selectedProduct');
        
        return selectedProduct ? (
          <DetalheProduto 
            product={selectedProduct as any}
            onBack={() => handlePageChange('search')}
            onToggleFavorite={toggleFavorite as any}
            isFavorite={favorites.some(f => f.id === selectedProduct.id)}
            onAddToList={handleAddToList as any}
            onProductSelect={handleProductSelect as any}
          />
        ) : (
          <div className="error-message min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
              <button 
                onClick={() => handlePageChange('search')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔍 Voltar à Busca
              </button>
            </div>
          </div>
        );

      case 'markets':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mercados Parceiros</h2>
              <p className="text-gray-600 mb-8">Funcionalidade em desenvolvimento</p>
              <button 
                onClick={() => handlePageChange('search')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔍 Buscar Produtos
              </button>
            </div>
          </div>
        );

      case 'multi-source-demo':
        // Multi-source demo removed for production
        return null;

      case 'ai-test':
        // AI test component removed for production
        return null;
    }
  };

  // ✅ TRATAMENTO DE ERRO MANTIDO
  if (error || productsError || authError) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-900 mb-4">Erro no PRECIVOX</h2>
            <p className="text-red-700 mb-8">{error || productsError || authError}</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Recarregar
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Limpar Cache
              </button>
              {isAuthenticated && (
                <button 
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔓 Sair
                </button>
              )}
            </div>
          </div>
        </div>
        <ToastSystem />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="App">
        <Navigation 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
        />
        
        <main className="main-content">
          {renderCurrentPage()}
        </main>
        
        {/* ✅ LOADING OVERLAY OTIMIZADO PARA MOBILE */}
        {(authLoading || (productsLoading && searchTerm)) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Carregando PRECIVOX...</p>
              <small className="text-gray-600">
                {authLoading ? 'Verificando autenticação...' : 
                 productsLoading ? 'Buscando produtos...' :
                 'Processando dados...'}
              </small>
              {isAuthenticated && (
                <div className="mt-2 text-xs text-gray-500">
                  Logado como: {userName} ({userRole})
                </div>
                )}
                </div>
              </div>
            )}
            
            
            {/* ✅ SISTEMA DE TOAST - ADICIONADO */}
            <ToastSystem />
          </div>
        </ToastProvider>
      );
    }
    
    export default App;