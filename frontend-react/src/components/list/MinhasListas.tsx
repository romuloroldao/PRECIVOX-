import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  Star, 
  Share2, 
  Copy, 
  Calendar,
  ShoppingCart,
  Grid3X3,
  List,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';

// Importar estilos customizados
import '../../styles/MinhasListas.styles.css';

interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem?: string;
  loja: string;
  lojaId: string;
}

interface Lista {
  id: string;
  nome: string;
  itens: Array<{
    produto: Product;
    quantidade: number;
  }>;
  dataUltimaEdicao: string;
  dataCriacao: string;
  isFavorita?: boolean;
  cor?: string;
}

interface MinhasListasProps {
  listas: Lista[];
  onBack: () => void;
  onCreateNewList: () => void;
  onEditList: (lista: Lista) => void;
  onDeleteList: (listaId: string) => void;
  onViewList: (lista: Lista) => void;
  onDuplicateList: (lista: Lista) => void;
}

type ViewMode = 'cards' | 'table';

// ✅ COMPONENTE DE TOAST
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-medium animate-slide-in-from-right flex items-center gap-2";
    
    switch (type) {
      case 'success': return `${baseStyles} bg-green-500`;
      case 'error': return `${baseStyles} bg-red-500`;
      case 'warning': return `${baseStyles} bg-orange-500`;
      case 'info': return `${baseStyles} bg-blue-500`;
      default: return `${baseStyles} bg-gray-500`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <Check className="w-5 h-5" />;
      case 'error': return <Trash2 className="w-5 h-5" />;
      case 'warning': return <Star className="w-5 h-5" />;
      case 'info': return <Plus className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ✅ MODAL DE CONFIRMAÇÃO
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700';
      case 'warning': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const MinhasListas: React.FC<MinhasListasProps> = ({
  listas,
  onBack,
  onCreateNewList,
  onEditList,
  onDeleteList,
  onViewList,
  onDuplicateList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'todas' | 'recentes' | 'favoritas'>('todas');
  const [sortBy, setSortBy] = useState<'nome' | 'data' | 'itens' | 'valor'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para toast e confirmação
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    listaName?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // 🔍 DEBUG MELHORADO
  useEffect(() => {
    console.log('🎯 MINHASLISTAS - Estado atual:');
    console.log('📋 Listas recebidas:', listas?.length || 0);
    console.log('🔧 Callbacks recebidos:', {
      onBack: typeof onBack,
      onCreateNewList: typeof onCreateNewList,
      onEditList: typeof onEditList,
      onDeleteList: typeof onDeleteList,
      onViewList: typeof onViewList,
      onDuplicateList: typeof onDuplicateList
    });
    
    if (listas && listas.length > 0) {
      listas.forEach((lista, index) => {
        console.log(`  Lista ${index + 1}: "${lista.nome}" - ${lista.itens?.length || 0} itens`);
      });
    } else {
      console.warn('⚠️ MINHASLISTAS - Nenhuma lista encontrada');
    }
  }, [listas, onBack, onCreateNewList, onEditList, onDeleteList, onViewList, onDuplicateList]);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('cards');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getListTotal = (lista: Lista) => {
    return lista.itens.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
  };

  const getTotalItems = (lista: Lista) => {
    return lista.itens.reduce((total, item) => total + item.quantidade, 0);
  };

  // ✅ HANDLERS CORRIGIDOS COM LOGS E VALIDAÇÕES

  const handleViewClick = (lista: Lista, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('👁️ MINHASLISTAS - Clique em "Ver Lista"');
    console.log('📋 Lista:', {
      id: lista.id,
      nome: lista.nome,
      itens: lista.itens?.length || 0,
      total: getListTotal(lista)
    });

    if (!onViewList) {
      console.error('❌ MINHASLISTAS - onViewList não definido!');
      setToast({
        message: 'Erro: Função de visualização não disponível',
        type: 'error'
      });
      return;
    }

    if (typeof onViewList !== 'function') {
      console.error('❌ MINHASLISTAS - onViewList não é uma função!', typeof onViewList);
      setToast({
        message: 'Erro: Função de visualização inválida',
        type: 'error'
      });
      return;
    }

    try {
      console.log('✅ MINHASLISTAS - Chamando onViewList...');
      onViewList(lista);
      console.log('🚀 MINHASLISTAS - onViewList executado com sucesso');
      
      setToast({
        message: `Abrindo lista "${lista.nome}"...`,
        type: 'info'
      });
    } catch (error) {
      console.error('💥 MINHASLISTAS - Erro ao executar onViewList:', error);
      setToast({
        message: 'Erro ao abrir a lista',
        type: 'error'
      });
    }
  };

  const handleEditClick = (lista: Lista, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('✏️ MINHASLISTAS - Clique em "Editar"');
    console.log('📋 Lista para editar:', lista.nome);

    if (!onEditList) {
      console.error('❌ MINHASLISTAS - onEditList não definido!');
      setToast({
        message: 'Erro: Função de edição não disponível',
        type: 'error'
      });
      return;
    }

    try {
      console.log('✅ MINHASLISTAS - Chamando onEditList...');
      onEditList(lista);
      console.log('🚀 MINHASLISTAS - onEditList executado com sucesso');
      
      setToast({
        message: `Editando lista "${lista.nome}"...`,
        type: 'info'
      });
    } catch (error) {
      console.error('💥 MINHASLISTAS - Erro ao executar onEditList:', error);
      setToast({
        message: 'Erro ao editar a lista',
        type: 'error'
      });
    }
  };

  const handleCreateNewList = () => {
    console.log('➕ MINHASLISTAS - Clique em "Nova Lista"');

    if (!onCreateNewList) {
      console.error('❌ MINHASLISTAS - onCreateNewList não definido!');
      setToast({
        message: 'Erro: Função de criação não disponível',
        type: 'error'
      });
      return;
    }

    try {
      console.log('✅ MINHASLISTAS - Chamando onCreateNewList...');
      onCreateNewList();
      console.log('🚀 MINHASLISTAS - onCreateNewList executado com sucesso');
      
      setToast({
        message: 'Criando nova lista...',
        type: 'success'
      });
    } catch (error) {
      console.error('💥 MINHASLISTAS - Erro ao executar onCreateNewList:', error);
      setToast({
        message: 'Erro ao criar nova lista',
        type: 'error'
      });
    }
  };

  const handleDeleteClick = (lista: Lista, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log(`🗑️ MINHASLISTAS - Solicitação de exclusão: ${lista.nome}`);
    
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Lista',
      message: `Tem certeza que deseja excluir a lista "${lista.nome}"? Esta ação não pode ser desfeita.`,
      listaName: lista.nome,
      onConfirm: () => {
        console.log(`✅ MINHASLISTAS - Exclusão confirmada: ${lista.nome}`);
        
        if (!onDeleteList) {
          console.error('❌ MINHASLISTAS - onDeleteList não definido!');
          setToast({
            message: 'Erro: Função de exclusão não disponível',
            type: 'error'
          });
          return;
        }

        try {
          onDeleteList(lista.id);
          setToast({
            message: `Lista "${lista.nome}" foi excluída com sucesso!`,
            type: 'success'
          });
        } catch (error) {
          console.error('💥 MINHASLISTAS - Erro ao executar onDeleteList:', error);
          setToast({
            message: 'Erro ao excluir a lista',
            type: 'error'
          });
        }
        
        setConfirmModal({
          isOpen: false,
          title: '',
          message: '',
          onConfirm: () => {}
        });
      }
    });
  };

  const handleRowClick = (lista: Lista) => {
    console.log('🖱️ MINHASLISTAS - Clique na linha da tabela');
    handleViewClick(lista);
  };

  const handleDuplicateClick = (lista: Lista, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('📋 MINHASLISTAS - Duplicando lista:', lista.nome);

    if (!onDuplicateList) {
      console.error('❌ MINHASLISTAS - onDuplicateList não definido!');
      setToast({
        message: 'Erro: Função de duplicação não disponível',
        type: 'error'
      });
      return;
    }

    try {
      onDuplicateList(lista);
      setToast({
        message: `Lista "${lista.nome}" duplicada com sucesso!`,
        type: 'success'
      });
    } catch (error) {
      console.error('💥 MINHASLISTAS - Erro ao executar onDuplicateList:', error);
      setToast({
        message: 'Erro ao duplicar a lista',
        type: 'error'
      });
    }
  };

  const handleBackClick = () => {
    console.log('⬅️ MINHASLISTAS - Clique em "Voltar"');

    if (!onBack) {
      console.error('❌ MINHASLISTAS - onBack não definido!');
      setToast({
        message: 'Erro: Função de voltar não disponível',
        type: 'error'
      });
      return;
    }

    try {
      onBack();
      console.log('🚀 MINHASLISTAS - onBack executado com sucesso');
    } catch (error) {
      console.error('💥 MINHASLISTAS - Erro ao executar onBack:', error);
      setToast({
        message: 'Erro ao voltar',
        type: 'error'
      });
    }
  };

  // Funções auxiliares
  const filteredAndSortedListas = listas
    .filter(lista => {
      const matchesSearch = lista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lista.itens.some(item => item.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = 
        filterBy === 'todas' ||
        (filterBy === 'favoritas' && lista.isFavorita) ||
        (filterBy === 'recentes' && new Date(lista.dataUltimaEdicao) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'data':
          comparison = new Date(b.dataUltimaEdicao).getTime() - new Date(a.dataUltimaEdicao).getTime();
          break;
        case 'itens':
          comparison = getTotalItems(b) - getTotalItems(a);
          break;
        case 'valor':
          comparison = getListTotal(b) - getListTotal(a);
          break;
        default:
          return 0;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const shareList = (lista: Lista, event: React.MouseEvent) => {
    event.stopPropagation();
    const text = `Lista: ${lista.nome}\n${getTotalItems(lista)} itens • ${formatPrice(getListTotal(lista))}`;
    
    if (navigator.share) {
      navigator.share({
        title: lista.nome,
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      setToast({
        message: 'Lista copiada para a área de transferência!',
        type: 'info'
      });
    }
  };

  const toggleFavorite = (lista: Lista, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('⭐ Toggle favorite for:', lista.nome);
    
    setToast({
      message: `Lista ${lista.isFavorita ? 'removida dos' : 'adicionada aos'} favoritos!`,
      type: 'info'
    });
  };

  const handleSort = (column: 'nome' | 'data' | 'itens' | 'valor') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getCardColorClass = (cor?: string) => {
    if (!cor) return 'blue';
    
    if (cor.includes('blue')) return 'blue';
    if (cor.includes('green')) return 'green';
    if (cor.includes('purple')) return 'purple';
    if (cor.includes('orange')) return 'orange';
    if (cor.includes('red')) return 'red';
    if (cor.includes('pink')) return 'pink';
    
    return 'blue';
  };

  // ✅ RENDERIZAÇÃO EM CARDS - MOBILE FIRST
  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {filteredAndSortedListas.map((lista, index) => (
        <div
          key={lista.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
        >
          {/* ✅ Header do Card - MOBILE FIRST */}
          <div className="bg-gradient-to-r from-[#004A7C] to-[#0066A3] text-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-sm sm:text-base" title={lista.nome}>
                  {lista.nome}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                    {getTotalItems(lista)} {getTotalItems(lista) === 1 ? 'item' : 'itens'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    {getRelativeTime(lista.dataUltimaEdicao)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => toggleFavorite(lista, e)}
                className={`ml-2 p-1 rounded-lg transition-colors ${
                  lista.isFavorita ? 'text-yellow-300' : 'text-white/70 hover:text-yellow-300'
                }`}
                title={lista.isFavorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${lista.isFavorita ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* ✅ Conteúdo do Card - MOBILE FIRST */}
          <div className="p-4">
            {/* Preview dos Produtos */}
            <div className="mb-4">
              {lista.itens.length > 0 ? (
                <div className="space-y-2">
                  {lista.itens.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="flex-shrink-0 bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                          {item.quantidade}x
                        </span>
                        <span className="text-gray-900 truncate">{item.produto.nome}</span>
                      </div>
                      <span className="text-gray-500 font-medium ml-2">
                        {formatPrice(item.produto.preco * item.quantidade)}
                      </span>
                    </div>
                  ))}
                  {lista.itens.length > 3 && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                      +{lista.itens.length - 3} mais itens...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <span className="text-3xl block mb-2">📋</span>
                  <span className="text-sm">Lista vazia</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-[#004A7C]">
                  {formatPrice(getListTotal(lista))}
                </span>
              </div>
            </div>

            {/* ✅ Ações - MOBILE FIRST */}
            <div className="space-y-3">
              {/* Ações principais */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => handleViewClick(lista, e)}
                  className="flex items-center justify-center gap-2 bg-[#004A7C] text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-[#0066A3] transition-colors"
                  type="button"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button
                  onClick={(e) => handleEditClick(lista, e)}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  type="button"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
              </div>

              {/* Ações secundárias */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => shareList(lista, e)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Compartilhar lista"
                    type="button"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(lista, e)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Duplicar lista"
                    type="button"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(lista, e)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir lista"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // RENDERIZAÇÃO EM TABELA
  const renderTableView = () => (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('nome')}
                className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                type="button"
              >
                Nome da Lista
                {sortBy === 'nome' && (
                  sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('itens')}
                className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                type="button"
              >
                Itens
                {sortBy === 'itens' && (
                  sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('valor')}
                className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                type="button"
              >
                Total
                {sortBy === 'valor' && (
                  sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('data')}
                className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                type="button"
              >
                Última Edição
                {sortBy === 'data' && (
                  sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900">Status</th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredAndSortedListas.map((lista) => (
            <tr 
              key={lista.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleRowClick(lista)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => toggleFavorite(lista, e)}
                    className={`${lista.isFavorita ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
                    type="button"
                  >
                    <Star className={`w-4 h-4 ${lista.isFavorita ? 'fill-current' : ''}`} />
                  </button>
                  <div>
                    <div className="font-medium text-gray-900">{lista.nome}</div>
                    <div className="text-sm text-gray-500">
                      {lista.itens.length > 0 
                        ? `${lista.itens.slice(0, 2).map(item => item.produto.nome).join(', ')}${lista.itens.length > 2 ? '...' : ''}`
                        : 'Lista vazia'
                      }
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 text-gray-900">
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                  {getTotalItems(lista)}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-semibold text-green-600">
                  {formatPrice(getListTotal(lista))}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {getRelativeTime(lista.dataUltimaEdicao)}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                {lista.itens.length > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ativa
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Vazia
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleViewClick(lista, e)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Visualizar"
                    type="button"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleEditClick(lista, e)}
                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Editar"
                    type="button"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => shareList(lista, e)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Compartilhar"
                    type="button"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(lista, e)}
                    className="p-1 text-orange-600 hover:text-orange-800 transition-colors"
                    title="Duplicar"
                    type="button"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(lista, e)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Excluir"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ TOAST */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* ✅ MODAL DE CONFIRMAÇÃO */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        type="danger"
      />

      {/* ✅ Header - MOBILE FIRST */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Stack vertical */}
          <div className="block md:hidden py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleBackClick}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  type="button"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Minhas Listas</h1>
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedListas.length} de {listas.length} {listas.length === 1 ? 'lista' : 'listas'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Nova Lista button - Mobile */}
            <button
              onClick={handleCreateNewList}
              className="w-full bg-[#004A7C] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0066A3] transition-colors flex items-center justify-center gap-2"
              type="button"
            >
              <Plus className="w-5 h-5" />
              Nova Lista
            </button>
          </div>

          {/* Desktop: Layout horizontal */}
          <div className="hidden md:flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBackClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Minhas Listas</h1>
                <p className="text-gray-600">
                  {filteredAndSortedListas.length} de {listas.length} {listas.length === 1 ? 'lista' : 'listas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle de Visualização - Desktop */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  <Grid3X3 className="w-4 h-4" />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  <List className="w-4 h-4" />
                  Lista
                </button>
              </div>

              {/* Nova Lista button - Desktop */}
              <button
                onClick={handleCreateNewList}
                className="bg-[#004A7C] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#0066A3] transition-colors flex items-center gap-2"
                type="button"
              >
                <Plus className="w-5 h-5" />
                Nova Lista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Content - MOBILE FIRST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtros e Busca - MOBILE FIRST */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          {/* Mobile: Stack vertical */}
          <div className="block lg:hidden space-y-4">
            {/* Busca mobile */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar listas ou produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
              />
            </div>

            {/* Filtros mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'todas' | 'recentes' | 'favoritas')}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
              >
                <option value="todas">📋 Todas as Listas</option>
                <option value="recentes">🕒 Recentes (7 dias)</option>
                <option value="favoritas">⭐ Favoritas</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'nome' | 'data' | 'itens' | 'valor')}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#004A7C] focus:border-transparent text-sm"
              >
                <option value="data">📅 Recentes</option>
                <option value="nome">🔤 A-Z</option>
                <option value="itens">📊 + Itens</option>
                <option value="valor">💰 + Valor</option>
              </select>
            </div>
          </div>

          {/* Desktop: Layout com chips responsivos */}
          <div className="hidden lg:block">
            {/* Linha 1: Busca */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar listas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                />
              </div>
            </div>

            {/* Linha 2: Filtros e Ordenação em chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtros como chips */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 mr-2">Filtrar:</span>
                {(['todas', 'recentes', 'favoritas'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterBy(filter)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterBy === filter
                        ? 'bg-[#004A7C] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'todas' && '📋 Todas'}
                    {filter === 'recentes' && '🕒 Recentes'}
                    {filter === 'favoritas' && '⭐ Favoritas'}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Ordenação como chips */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 mr-2">Ordenar:</span>
                {(['data', 'nome', 'itens', 'valor'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => {
                      if (sortBy === sort) {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy(sort);
                        setSortOrder('desc');
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      sortBy === sort
                        ? 'bg-[#004A7C] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={`Ordenar por ${sort === 'data' ? 'data' : sort === 'nome' ? 'nome' : sort === 'itens' ? 'quantidade de itens' : 'valor total'}`}
                  >
                    {sort === 'data' && '📅'}
                    {sort === 'nome' && '🔤'}
                    {sort === 'itens' && '📊'}
                    {sort === 'valor' && '💰'}
                    {sortBy === sort && (
                      sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ✅ Estatísticas - MOBILE FIRST */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {/* Mobile: Grid 2x2 */}
            <div className="grid grid-cols-2 gap-4 sm:hidden">
              <div className="text-center">
                <div className="text-lg font-bold text-[#004A7C]">{listas.length}</div>
                <div className="text-xs text-gray-600">Listas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#B9E937]">
                  {listas.reduce((total, lista) => total + getTotalItems(lista), 0)}
                </div>
                <div className="text-xs text-gray-600">Itens</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(listas.reduce((total, lista) => total + getListTotal(lista), 0))}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-500">
                  {listas.filter(lista => lista.isFavorita).length}
                </div>
                <div className="text-xs text-gray-600">Favoritas</div>
              </div>
            </div>
            
            {/* Desktop: Layout horizontal */}
            <div className="hidden sm:flex justify-center gap-8 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-lg text-[#004A7C]">{listas.length}</div>
                <div>Listas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-[#B9E937]">
                  {listas.reduce((total, lista) => total + getTotalItems(lista), 0)}
                </div>
                <div>Itens</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">
                  {formatPrice(listas.reduce((total, lista) => total + getListTotal(lista), 0))}
                </div>
                <div>Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-yellow-500">
                  {listas.filter(lista => lista.isFavorita).length}
                </div>
                <div>Favoritas</div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Lista de Listas - MOBILE FIRST */}
        {filteredAndSortedListas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterBy !== 'todas' 
                ? 'Nenhuma lista encontrada' 
                : 'Nenhuma lista criada ainda'
              }
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterBy !== 'todas'
                ? 'Tente ajustar os filtros ou busca para encontrar suas listas.'
                : 'Crie sua primeira lista de compras e organize suas compras de forma inteligente.'
              }
            </p>
            {(!searchTerm && filterBy === 'todas') && (
              <button
                onClick={handleCreateNewList}
                className="bg-[#004A7C] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#0066A3] transition-colors flex items-center gap-2 mx-auto"
                type="button"
              >
                <Plus className="w-5 h-5" />
                Criar Primeira Lista
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Renderização baseada no modo de visualização */}
            {viewMode === 'cards' || isMobile ? renderCardsView() : renderTableView()}
          </>
        )}
      </div>
    </div>
  );
};

export default MinhasListas;