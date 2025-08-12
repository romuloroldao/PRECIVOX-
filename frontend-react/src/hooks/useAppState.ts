// src/hooks/useAppState.ts - VERSÃO CORRIGIDA - NAVEGAÇÃO FUNCIONANDO
import { useState, useEffect, useCallback } from 'react';
import { Product, Lista, ListaItem } from '../types/product';
import { getFromStorage, saveToStorage } from './useLocalStorage';

export const useAppState = () => {
  // ====================================
  // ESTADOS PRINCIPAIS DE NAVEGAÇÃO
  // ====================================
  const [currentPage, setCurrentPage] = useState(() => {
    // Load from localStorage or default to 'search'
    const savedPage = getFromStorage('currentPage');
    return savedPage || 'search';
  });
  const [userPlan, setUserPlan] = useState('free');

  // ====================================
  // ESTADOS DE PRODUTOS E LISTAS
  // ====================================
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [currentList, setCurrentList] = useState<Lista>({
    id: 'lista-atual',
    nome: 'Minha Lista',
    itens: [],
    dataUltimaEdicao: new Date().toISOString(),
    dataCriacao: new Date().toISOString(),
    isFavorita: false,
    cor: 'bg-gradient-to-r from-blue-500 to-purple-600'
  });
  
  const [allLists, setAllLists] = useState<Lista[]>([]);

  // ====================================
  // ESTADOS DE NAVEGAÇÃO DAS LISTAS
  // ====================================
  const [minhasListasView, setMinhasListasView] = useState<'lista' | 'detalhes'>('lista');
  const [selectedListForView, setSelectedListForView] = useState<Lista | null>(null);

  // ====================================
  // EFFECTS PARA DEBUGGING E PERSISTÊNCIA
  // ====================================
  
  // ✅ PERSISTÊNCIA NO LOCALSTORAGE
  useEffect(() => {
    // Load saved page from localStorage on mount
    const savedPage = getFromStorage('currentPage');
    if (savedPage && savedPage !== currentPage) {
      setCurrentPage(savedPage);
    }
  }, []);

  // ✅ PERSISTÊNCIA NO LOCALSTORAGE
  useEffect(() => {
    if (currentList.itens.length > 0) {
      try {
        localStorage.setItem('precivox-current-list', JSON.stringify(currentList));
      } catch (error) {
        console.warn('⚠️ Erro ao salvar lista atual:', error);
      }
    }
  }, [currentList]);

  useEffect(() => {
    if (allLists.length > 0) {
      try {
        localStorage.setItem('precivox-all-lists', JSON.stringify(allLists));
      } catch (error) {
        console.warn('⚠️ Erro ao salvar todas as listas:', error);
      }
    }
  }, [allLists]);

  useEffect(() => {
    try {
      const savedCurrentList = localStorage.getItem('precivox-current-list');
      if (savedCurrentList) {
        const parsedList = JSON.parse(savedCurrentList);
        if (parsedList.itens && parsedList.itens.length > 0) {
          setCurrentList(parsedList);
        }
      }

      const savedAllLists = localStorage.getItem('precivox-all-lists');
      if (savedAllLists) {
        const parsedLists = JSON.parse(savedAllLists);
        if (Array.isArray(parsedLists) && parsedLists.length > 0) {
          setAllLists(parsedLists);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados salvos:', error);
    }
  }, []);

  // ====================================
  // FUNÇÕES AUXILIARES
  // ====================================
  
  const getTotalItemsInCurrentList = useCallback(() => {
    return currentList.itens.reduce((total, item) => total + item.quantidade, 0);
  }, [currentList.itens]);

  const getTotalPriceInCurrentList = useCallback(() => {
    return currentList.itens.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
  }, [currentList.itens]);

  const clearCurrentList = useCallback(() => {
    setCurrentList(prev => ({
      ...prev,
      itens: [],
      dataUltimaEdicao: new Date().toISOString()
    }));
  }, []);

  const addProductToCurrentList = useCallback((product: Product, quantity: number = 1) => {
    setCurrentList(prev => {
      const existingItemIndex = prev.itens.findIndex(item => item.produto.id === product.id);
      
      if (existingItemIndex >= 0) {
        const newItens = [...prev.itens];
        const novaQuantidade = newItens[existingItemIndex].quantidade + quantity;
        
        if (novaQuantidade <= 0) {
          newItens.splice(existingItemIndex, 1);
        } else {
          newItens[existingItemIndex] = {
            ...newItens[existingItemIndex],
            quantidade: novaQuantidade
          };
        }
        
        return {
          ...prev,
          itens: newItens,
          dataUltimaEdicao: new Date().toISOString()
        };
      } else if (quantity > 0) {
        const novoItem: ListaItem = {
          produto: product,
          quantidade: quantity,
          adicionadoEm: new Date().toISOString(),
          comprado: false,
          prioridadade: 'media'
        };
        
        return {
          ...prev,
          itens: [...prev.itens, novoItem],
          dataUltimaEdicao: new Date().toISOString()
        };
      }
      
      return prev;
    });
  }, []);

  const removeProductFromCurrentList = useCallback((productId: string) => {
    setCurrentList(prev => ({
      ...prev,
      itens: prev.itens.filter(item => item.produto.id !== productId),
      dataUltimaEdicao: new Date().toISOString()
    }));
  }, []);

  const updateProductQuantityInCurrentList = useCallback((productId: string, newQuantity: number) => {
    setCurrentList(prev => {
      const newItens = prev.itens.map(item => {
        if (item.produto.id === productId) {
          return {
            ...item,
            quantidade: Math.max(0, newQuantity)
          };
        }
        return item;
      }).filter(item => item.quantidade > 0);

      return {
        ...prev,
        itens: newItens,
        dataUltimaEdicao: new Date().toISOString()
      };
    });
  }, []);

  const duplicateList = useCallback((lista: Lista) => {
    const duplicatedList: Lista = {
      ...lista,
      id: `lista-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nome: `Cópia de ${lista.nome}`,
      dataCriacao: new Date().toISOString(),
      dataUltimaEdicao: new Date().toISOString()
    };
    
    setAllLists(prev => [duplicatedList, ...prev]);
    return duplicatedList;
  }, []);

  const deleteList = useCallback((listaId: string) => {
    setAllLists(prev => prev.filter(lista => lista.id !== listaId));
  }, []);

  const updateListInAllLists = useCallback((updatedList: Lista) => {
    setAllLists(prev => {
      const existingIndex = prev.findIndex(lista => lista.id === updatedList.id);
      if (existingIndex >= 0) {
        const newLists = [...prev];
        newLists[existingIndex] = updatedList;
        return newLists;
      } else {
        return [updatedList, ...prev];
      }
    });
  }, []);

  // ====================================
  // ✅ FUNÇÕES DE NAVEGAÇÃO CORRIGIDAS
  // ====================================
  
  const navigateToPage = useCallback((page: string) => {
    console.log(`🔄 useAppState - Navegando para: ${page}`);
    setCurrentPage(page);
  }, []);

  const goToProductDetail = useCallback((product: Product) => {
    console.log(`🔍 useAppState - Indo para detalhes do produto: ${product.nome}`);
    setSelectedProduct(product);
    setCurrentPage('produto');
  }, []);

  // ✅ FUNÇÃO CORRIGIDA - goToListCompleta
  const goToListCompleta = useCallback((lista?: Lista) => {
    console.log('🧠 useAppState - Indo para Lista Completa');
    
    let targetList = lista;
    
    // ✅ CORREÇÃO: Se não tem lista passada, usar currentList
    if (!targetList) {
      targetList = currentList;
      console.log('📋 Usando currentList como target');
    }
    
    console.log('📋 Lista target:', targetList);
    console.log('🛒 Itens na lista:', targetList.itens?.length || 0);
    console.log('📝 Detalhes da lista:', targetList);
    
    // ✅ SEMPRE DEFINIR selectedListForView
    setSelectedListForView(targetList);
    
    // ✅ SEMPRE SALVAR NO LOCALSTORAGE
    try {
      localStorage.setItem('selectedList', JSON.stringify(targetList));
      localStorage.setItem('precivox-current-list', JSON.stringify(targetList));
      console.log('💾 Lista salva no localStorage com', targetList.itens?.length || 0, 'itens');
    } catch (error) {
      console.error('❌ Erro ao salvar lista selecionada:', error);
    }
    
    console.log('🔄 Definindo currentPage para lista-completa...');
    setCurrentPage('lista-completa');
    
    // Salvar também no localStorage para debug
    try {
      saveToStorage('currentPage', 'lista-completa');
      console.log('💾 currentPage salvo no localStorage: lista-completa');
    } catch (error) {
      console.error('❌ Erro ao salvar currentPage:', error);
    }
    
    console.log('✅ Navegação para lista-completa concluída - currentPage deve ser:', 'lista-completa');
  }, [currentList]);

  const goToMyLists = useCallback(() => {
    console.log('📋 useAppState - Indo para Minhas Listas');
    setMinhasListasView('lista');
    setSelectedListForView(null);
    setCurrentPage('listas');
  }, []);

  // ✅ CORREÇÃO PRINCIPAL: Função para ver lista específica
  const goToListDetails = useCallback((lista: Lista) => {
    console.log(`👁️ useAppState - VISUALIZANDO lista: ${lista.nome}`);
    console.log('📋 Lista recebida:', lista);
    console.log('🛒 Itens:', lista.itens?.length || 0);
    
    if (!lista.itens || lista.itens.length === 0) {
      console.warn('⚠️ Lista vazia, redirecionando para edição');
      // Se lista vazia, vai para tela de edição (busca)
      setCurrentPage('search');
      return;
    }
    
    // ✅ SALVAR LISTA NO LOCALSTORAGE
    try {
      localStorage.setItem('selectedList', JSON.stringify(lista));
      console.log('💾 Lista salva no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar lista:', error);
    }
    
    // ✅ DEFINIR ESTADOS
    setSelectedListForView(lista);
    setMinhasListasView('detalhes');
    
    // ✅ NAVEGAR PARA PÁGINA CORRETA
    setCurrentPage('lista-completa');
    
    console.log('✅ Navegação para visualização de lista concluída');
  }, []);

  // ✅ NOVA FUNÇÃO: Para editar lista (ir para busca)
  const goToEditList = useCallback((lista: Lista) => {
    console.log(`✏️ useAppState - EDITANDO lista: ${lista.nome}`);
    
    // Setar como lista atual para edição
    setCurrentList(lista);
    
    // Salvar no localStorage
    try {
      localStorage.setItem('precivox-current-list', JSON.stringify(lista));
    } catch (error) {
      console.error('❌ Erro ao salvar lista para edição:', error);
    }
    
    // Ir para página de busca/edição
    setCurrentPage('search');
    
    console.log('✅ Lista definida para edição, indo para busca');
  }, []);

  // ✅ NOVA FUNÇÃO: Para criar lista vazia
  const createNewEmptyList = useCallback(() => {
    console.log('➕ useAppState - Criando nova lista vazia');
    
    const novaListaVazia: Lista = {
      id: `lista-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nome: `Nova Lista ${new Date().toLocaleDateString('pt-BR')}`,
      itens: [], // ✅ LISTA VAZIA
      dataUltimaEdicao: new Date().toISOString(),
      dataCriacao: new Date().toISOString(),
      isFavorita: false,
      cor: 'bg-gradient-to-r from-blue-500 to-purple-600'
    };
    
    // ✅ ADICIONAR À LISTA DE TODAS AS LISTAS
    setAllLists(prev => [novaListaVazia, ...prev]);
    
    // ✅ DEFINIR COMO LISTA ATUAL
    setCurrentList(novaListaVazia);
    
    // ✅ SALVAR NO LOCALSTORAGE
    try {
      localStorage.setItem('precivox-current-list', JSON.stringify(novaListaVazia));
      localStorage.setItem('selectedList', JSON.stringify(novaListaVazia));
    } catch (error) {
      console.error('❌ Erro ao salvar nova lista:', error);
    }
    
    console.log('✅ Nova lista vazia criada:', novaListaVazia);
    return novaListaVazia;
  }, []);

  // ✅ NOVA FUNÇÃO: Para ir para busca com empty state
  const goToSearchWithEmptyState = useCallback(() => {
    console.log('🔍 useAppState - Indo para busca com empty state');
    
    // Ir para página de busca
    setCurrentPage('search');
    
    console.log('✅ Navegação para busca concluída');
  }, []);

  // ✅ FUNÇÃO UTILITÁRIA DE DEBUG
  const debugCurrentState = useCallback(() => {
    console.group('🔍 useAppState - DEBUG STATE');
    console.log('currentList:', currentList);
    console.log('currentList.itens:', currentList?.itens?.length || 0);
    console.log('selectedListForView:', selectedListForView);
    console.log('selectedListForView.itens:', selectedListForView?.itens?.length || 0);
    console.log('allLists:', allLists?.length || 0);
    console.groupEnd();
  }, [currentList, selectedListForView, allLists]);

  // ====================================
  // RETURN COM TODAS AS FUNCIONALIDADES
  // ====================================
  
  return {
    // ✅ ESTADOS BÁSICOS
    currentPage,
    userPlan,
    selectedProduct,
    currentList,
    allLists,
    minhasListasView,
    selectedListForView,
    
    // ✅ SETTERS BÁSICOS
    setCurrentPage,
    setUserPlan,
    setSelectedProduct,
    setCurrentList,
    setAllLists,
    setMinhasListasView,
    setSelectedListForView,
    
    // ✅ FUNÇÕES AUXILIARES
    getTotalItemsInCurrentList,
    getTotalPriceInCurrentList,
    clearCurrentList,
    
    // ✅ FUNÇÕES DE MANIPULAÇÃO DE LISTA
    addProductToCurrentList,
    removeProductFromCurrentList,
    updateProductQuantityInCurrentList,
    duplicateList,
    deleteList,
    updateListInAllLists,
    
    // ✅ FUNÇÕES DE NAVEGAÇÃO CORRIGIDAS
    navigateToPage,
    goToProductDetail,
    goToListCompleta, // ✅ FUNÇÃO CORRIGIDA
    goToMyLists,
    goToListDetails, // ✅ PARA VER LISTA
    goToEditList,    // ✅ PARA EDITAR LISTA
    createNewEmptyList, // ✅ CRIAR LISTA VAZIA
    goToSearchWithEmptyState, // ✅ IR PARA BUSCA COM EMPTY STATE
    debugCurrentState // ✅ DEBUG
  };
};