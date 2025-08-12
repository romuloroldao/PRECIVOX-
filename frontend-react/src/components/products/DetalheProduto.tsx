// DetalheProduto.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Clock, ShoppingCart, Plus, Minus, Share2, Eye, TrendingDown, Package } from 'lucide-react';
import ModalLista from '../list/ModalLista';
import { useToast } from '../../hooks/useToast';

interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  subcategoria?: string;
  imagem?: string;
  loja: string;
  lojaId?: string;
  descricao?: string;
  distancia?: number;
  promocao?: {
    ativo?: boolean;
    desconto: number;
    precoOriginal: number;
    validoAte?: string;
  };
  avaliacao?: number;
  numeroAvaliacoes?: number;
  disponivel: boolean;
  tempoEntrega?: string;
  isNovo?: boolean;
  isMelhorPreco?: boolean;
  marca?: string;
  codigo?: string;
  peso?: string;
  origem?: string;
  visualizacoes?: number;
  conversoes?: number;
  estoque?: number;
  endereco?: string;
  telefone?: string;
}

interface DetalheProdutoProps {
  product: Product;
  onBack: () => void;
  onAddToList: (product: Product, quantity?: number) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  onProductSelect?: (product: Product) => void;
  // Props para ModalLista
  currentList?: any;
  onSaveList?: (name: string) => void;
  onGoToListaCompleta?: (lista?: any) => void;
  onGoToMyLists?: () => void;
  onUpdateList?: (updatedList: any) => void;
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onRemoveItem?: (productId: string) => void;
}

const DetalheProduto: React.FC<DetalheProdutoProps> = ({ 
  product, 
  onBack, 
  onAddToList,
  onToggleFavorite,
  isFavorite = false,
  onProductSelect,
  // Props do ModalLista
  currentList,
  onSaveList,
  onGoToListaCompleta,
  onGoToMyLists,
  onUpdateList,
  onUpdateQuantity,
  onRemoveItem
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showSuccess } = useToast();

  useEffect(() => {
    console.log('🔍 DETALHEPRODUTO - Props recebidas:', {
      produto: product?.nome,
      disponivel: product?.disponivel,
      onBack: typeof onBack,
      onAddToList: typeof onAddToList,
      onProductSelect: typeof onProductSelect
    });
  }, [product, onBack, onAddToList, onProductSelect]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  const handleAddToList = () => {
    console.log('➕ DETALHEPRODUTO - Adicionando à lista:', product.nome, 'quantidade:', quantity);
    onAddToList(product, quantity);
    showSuccess(`${product.nome} adicionado à lista!`);
  };

  const handleToggleFavorite = () => {
    console.log('⭐ DETALHEPRODUTO - Toggle favorito:', product.nome);
    if (onToggleFavorite) {
      onToggleFavorite(product);
    }
  };

  const handleAddSimilarToList = (similarProduct: Product, quantity: number = 1) => {
    console.log('➕ DETALHEPRODUTO - Adicionando produto similar à lista:', similarProduct.nome);
    onAddToList(similarProduct, quantity);
    showSuccess(`${similarProduct.nome} adicionado à lista!`);
  };

  // ✅ Lista segura para o modal
  const safeCurrentList = currentList ? {
    ...currentList,
    itens: currentList.itens || []
  } : {
    id: 'default',
    nome: 'Minha Lista',
    itens: [],
    dataUltimaEdicao: new Date().toISOString(),
    dataCriacao: new Date().toISOString()
  };

  // ✅ CALCULAR DADOS DE PROMOÇÃO CORRETAMENTE
  const hasPromotion = product.promocao && product.promocao.precoOriginal > product.preco;
  const economia = hasPromotion ? product.promocao!.precoOriginal - product.preco : 0;
  const percentualDesconto = hasPromotion ? 
    Math.round(((product.promocao!.precoOriginal - product.preco) / product.promocao!.precoOriginal) * 100) : 0;

  // Simular histórico de preços
  const historico = [
    { dia: 'Seg', preco: hasPromotion ? product.promocao!.precoOriginal : product.preco * 1.1 },
    { dia: 'Ter', preco: hasPromotion ? product.promocao!.precoOriginal * 0.95 : product.preco * 1.05 },
    { dia: 'Qua', preco: hasPromotion ? product.promocao!.precoOriginal * 0.9 : product.preco * 1.02 },
    { dia: 'Qui', preco: product.preco * 1.15 },
    { dia: 'Sex', preco: product.preco * 1.05 },
    { dia: 'Sáb', preco: product.preco },
    { dia: 'Dom', preco: product.preco }
  ];

  const maxPrice = Math.max(...historico.map(h => h.preco));
  const minPrice = Math.min(...historico.map(h => h.preco));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                console.log('⬅️ DETALHEPRODUTO - Botão voltar clicado');
                onBack();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900 text-lg">Detalhes do Produto</h1>
              <p className="text-sm text-gray-600">{product.nome}</p>
            </div>
            
            {/* Botão Favorito no Header */}
            {onToggleFavorite && (
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-yellow-500'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* 1. SEÇÃO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* IMAGEM */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="relative">
              <img
                src={product.imagem || '/api/placeholder/500/500'}
                alt={product.nome}
                className={`w-full h-80 lg:h-96 object-cover rounded-xl shadow-md transition-all duration-300 ${
                  imageZoomed ? 'scale-105' : 'scale-100'
                }`}
                onClick={() => setImageZoomed(!imageZoomed)}
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {hasPromotion && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    -{percentualDesconto}% OFF
                  </div>
                )}
                {product.isMelhorPreco && (
                  <div className="bg-[#B9E937] text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    MELHOR PREÇO
                  </div>
                )}
                {product.isNovo && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    NOVO
                  </div>
                )}
              </div>

              <button
                onClick={() => setImageZoomed(!imageZoomed)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all"
              >
                <Eye className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* INFO PRINCIPAL */}
          <div className="space-y-6">
            
            {/* Nome e categoria */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{product.nome}</h1>
              <p className="text-lg text-gray-600">{product.categoria}</p>
              {(product.marca || product.peso) && (
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  {product.marca && <span className="font-medium">{product.marca}</span>}
                  {product.marca && product.peso && <span>•</span>}
                  {product.peso && <span>{product.peso}</span>}
                </div>
              )}
            </div>

            {/* PREÇO - MOBILE FIRST */}
            <div className="bg-gradient-to-r from-green-50 to-[#B9E937]/10 rounded-2xl p-4 sm:p-6">
              <div className="space-y-3">
                {/* Mobile: Stack vertical */}
                <div className="block sm:hidden text-center space-y-2">
                  <span className="block text-3xl font-bold text-green-600">
                    {formatPrice(product.preco)}
                  </span>
                  {hasPromotion && (
                    <span className="block text-lg text-gray-500 line-through">
                      De: {formatPrice(product.promocao!.precoOriginal)}
                    </span>
                  )}
                </div>

                {/* Desktop: Layout horizontal */}
                <div className="hidden sm:flex items-baseline gap-4">
                  <span className="text-5xl lg:text-6xl font-bold text-green-600">
                    {formatPrice(product.preco)}
                  </span>
                  {hasPromotion && (
                    <span className="text-2xl text-gray-500 line-through">
                      {formatPrice(product.promocao!.precoOriginal)}
                    </span>
                  )}
                </div>
                
                {economia > 0 && (
                  <div className="flex justify-center sm:justify-start">
                    <div className="inline-flex items-center gap-2 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-full">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-bold text-sm sm:text-lg">Economize {formatPrice(economia)}!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DISPONIBILIDADE - MOBILE FIRST */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              {/* Mobile: Stack vertical */}
              <div className="block sm:hidden space-y-3">
                <h3 className="font-semibold text-gray-900 text-lg text-center">📍 {product.loja}</h3>
                
                <div className="flex justify-center">
                  <div className={`flex items-center gap-2 ${
                    product.disponivel ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`w-4 h-4 rounded-full ${
                      product.disponivel ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span className="font-medium text-lg">
                      {product.disponivel ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-6 text-sm text-gray-600">
                  {product.distancia && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{product.distancia.toFixed(1)} km</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{product.tempoEntrega || '1-2 dias'}</span>
                  </div>
                </div>

                {product.estoque && (
                  <p className="text-xs text-gray-500 text-center">{product.estoque} em estoque</p>
                )}
              </div>

              {/* Desktop: Layout horizontal original */}
              <div className="hidden sm:flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">📍 {product.loja}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {product.distancia && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{product.distancia.toFixed(1)} km</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{product.tempoEntrega || '1-2 dias'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center gap-2 ${
                    product.disponivel ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      product.disponivel ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span className="font-medium">
                      {product.disponivel ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                  {product.estoque && (
                    <p className="text-xs text-gray-500 mt-1">{product.estoque} em estoque</p>
                  )}
                </div>
              </div>
            </div>

            {/* QUANTIDADE E COMPRA */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">Quantos você quer?</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-6 h-6 text-gray-600" />
                </button>
                
                <div className="flex-1 bg-gray-50 rounded-lg py-3 text-center">
                  <span className="text-2xl font-bold text-gray-900">{quantity}</span>
                  <p className="text-sm text-gray-500">unidade{quantity > 1 ? 's' : ''}</p>
                </div>
                
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-900">
                  Total: {formatPrice(product.preco * quantity)}
                </p>
                {quantity > 1 && economia > 0 && (
                  <p className="text-lg text-green-600 mt-1">
                    Economia total: {formatPrice(economia * quantity)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddToList}
                disabled={!product.disponivel}
                className={`w-full font-bold py-4 px-6 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 ${
                  product.disponivel
                    ? 'bg-gradient-to-r from-[#B9E937] to-green-500 hover:from-green-500 hover:to-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {product.disponivel ? 'Quero esse na minha lista!' : 'Produto indisponível'}
              </button>
            </div>
          </div>
        </div>

        {/* 2. INFORMAÇÕES SECUNDÁRIAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Histórico de Preços */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
              📊 Histórico de preços
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-end h-20 gap-1 mb-3">
                {historico.map((item, index) => {
                  const height = ((item.preco - minPrice) / (maxPrice - minPrice)) * 60 + 10;
                  const isToday = index === historico.length - 1;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs text-gray-600 font-medium">
                        {formatPrice(item.preco)}
                      </div>
                      <div 
                        className={`w-full rounded-t ${isToday ? 'bg-green-500' : 'bg-blue-400'} transition-all duration-500`}
                        style={{ height: `${height}px` }}
                      />
                      <div className="text-xs text-gray-500">{item.dia}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-sm text-green-600 font-medium">
                📉 Menor preço dos últimos 7 dias!
              </p>
            </div>
          </div>

          {/* Avaliações */}
          {product.avaliacao && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">⭐ Avaliações</h3>
              
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">{renderStars(product.avaliacao)}</div>
                <span className="text-3xl font-bold text-gray-900">{product.avaliacao.toFixed(1)}</span>
                <p className="text-gray-500 text-sm">
                  {product.numeroAvaliacoes || 0} avaliações
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex mb-1">{renderStars(5)}</div>
                  "Ótimo produto!"
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex mb-1">{renderStars(4)}</div>
                  "Boa qualidade"
                </div>
              </div>
            </div>
          )}

          {/* Informações Extras */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">📋 Detalhes</h3>
            
            <div className="space-y-3 text-sm">
              {product.descricao && (
                <div>
                  <span className="font-medium text-gray-700">Descrição:</span>
                  <p className="text-gray-600 mt-1">{product.descricao}</p>
                </div>
              )}
              
              {product.codigo && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Código:</span>
                  <span className="text-gray-600">{product.codigo}</span>
                </div>
              )}
              
              {product.origem && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Origem:</span>
                  <span className="text-gray-600">{product.origem}</span>
                </div>
              )}

              {(product.visualizacoes || product.conversoes) && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    {product.visualizacoes && (
                      <span>👁️ {product.visualizacoes} views</span>
                    )}
                    {product.conversoes && (
                      <span>✅ {product.conversoes} vendas</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. PRODUTOS SIMILARES - CORRIGIDO */}
        <ProdutosSimilares 
          produto={product} 
          onProductClick={(similarProduct) => {
            console.log('🔄 DETALHEPRODUTO - Navegando para produto similar:', similarProduct.nome);
            
            // ✅ CORREÇÃO: Usar onProductSelect se disponível, senão usar onBack
            if (onProductSelect) {
              onProductSelect(similarProduct);
            } else {
              console.log('⚠️ onProductSelect não disponível, voltando para busca');
              onBack();
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddToList={handleAddSimilarToList}
        />

        {/* CTAs Finais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              console.log('⬅️ DETALHEPRODUTO - Botão voltar final clicado');
              onBack();
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar à Busca
          </button>
          
          <button 
            onClick={handleAddToList}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Adicionar à Lista
          </button>
          
          <button className="bg-white border-2 border-gray-200 hover:border-[#B9E937] hover:bg-green-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {showSuccessMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold">Item adicionado à sua lista!</span>
        </div>
      )}

      {/* ✅ Modal da lista - INTEGRAÇÃO COMPLETA */}
      {isModalOpen && (
        <ModalLista
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          listItems={safeCurrentList?.itens || []}
          currentListName={safeCurrentList?.nome || 'Minha Lista'}
          
          onUpdateQuantity={(productId, newQuantity) => {
            console.log('🔄 DetalheProduto - Atualizando quantidade:', productId, newQuantity);
            if (onUpdateQuantity) {
              onUpdateQuantity(productId, newQuantity);
            }
          }}
          
          onRemoveItem={(productId) => {
            console.log('🗑️ DetalheProduto - Removendo item:', productId);
            if (onRemoveItem) {
              onRemoveItem(productId);
            }
          }}
          
          onSaveList={(listName, items) => {
            console.log('💾 DetalheProduto - Salvando lista:', listName, items.length, 'itens');
            if (onSaveList) {
              onSaveList(listName);
            }
          }}
          
          onGoToListaCompleta={(listaCompleta) => {
            console.log('📋 DetalheProduto - Indo para lista completa:', listaCompleta);
            if (onGoToListaCompleta) {
              onGoToListaCompleta(listaCompleta);
            }
            setIsModalOpen(false);
          }}
          
          onGoToMyLists={() => {
            console.log('📋 DetalheProduto - Indo para minhas listas');
            if (onGoToMyLists) {
              onGoToMyLists();
            }
            setIsModalOpen(false);
          }}
          
          onApplySuggestion={(suggestion) => {
            console.log('🎯 DetalheProduto - Aplicando sugestão IA:', suggestion);
            
            if (!onUpdateList || !currentList) {
              console.warn('❌ onUpdateList ou currentList não disponível');
              return {
                success: false,
                message: 'Não é possível modificar a lista no momento'
              };
            }
            
            try {
              const updatedList = { ...currentList };
              
              switch (suggestion.action?.type) {
                case 'change_store':
                  console.log(`🏪 Mudando ${suggestion.item} de ${suggestion.mercadoAtual} para ${suggestion.mercadoSugerido}`);
                  
                  const storeItemIndex = updatedList.itens.findIndex(item => 
                    item.produto.id === suggestion.action?.productId
                  );
                  
                  if (storeItemIndex !== -1) {
                    updatedList.itens[storeItemIndex] = {
                      ...updatedList.itens[storeItemIndex],
                      produto: {
                        ...updatedList.itens[storeItemIndex].produto,
                        loja: suggestion.mercadoSugerido,
                        preco: suggestion.precoSugerido
                      }
                    };
                    
                    onUpdateList(updatedList);
                    console.log('✅ Lista atualizada com nova loja');
                  }
                  
                  return {
                    success: true,
                    message: `✅ ${suggestion.item} transferido para ${suggestion.mercadoSugerido}! Economia: R$ ${suggestion.economia.toFixed(2)}`
                  };
                
                case 'increase_quantity':
                  console.log(`📦 Aumentando quantidade de ${suggestion.item} para ${suggestion.action.newQuantity}`);
                  
                  const quantityItemIndex = updatedList.itens.findIndex(item => 
                    item.produto.id === suggestion.action?.productId
                  );
                  
                  if (quantityItemIndex !== -1 && suggestion.action?.newQuantity) {
                    updatedList.itens[quantityItemIndex] = {
                      ...updatedList.itens[quantityItemIndex],
                      quantidade: suggestion.action.newQuantity,
                      produto: {
                        ...updatedList.itens[quantityItemIndex].produto,
                        preco: suggestion.precoSugerido
                      }
                    };
                    
                    onUpdateList(updatedList);
                    console.log('✅ Lista atualizada com nova quantidade');
                  }
                  
                  return {
                    success: true,
                    message: `✅ Quantidade de ${suggestion.item} otimizada! Economia: R$ ${suggestion.economia.toFixed(2)}`
                  };
                
                case 'add_product':
                  console.log(`➕ Adicionando produto complementar: ${suggestion.item}`);
                  
                  if (suggestion.action?.newProduct) {
                    const newItem = {
                      produto: suggestion.action.newProduct,
                      quantidade: 1
                    };
                    
                    updatedList.itens.push(newItem);
                    onUpdateList(updatedList);
                    console.log('✅ Produto complementar adicionado à lista');
                  }
                  
                  return {
                    success: true,
                    message: `✅ Produto ${suggestion.item} adicionado à lista!`
                  };
                
                case 'optimize_route':
                  console.log(`🗺️ Otimizando rota de compras`);
                  updatedList.itens.sort((a, b) => {
                    const lojaA = typeof a.produto.loja === 'string' ? a.produto.loja : a.produto.loja.nome;
                    const lojaB = typeof b.produto.loja === 'string' ? b.produto.loja : b.produto.loja.nome;
                    return lojaA.localeCompare(lojaB);
                  });
                  
                  onUpdateList(updatedList);
                  return {
                    success: true,
                    message: `✅ Rota de compras otimizada! Itens reordenados por loja.`
                  };
                
                default:
                  console.warn('⚠️ Tipo de ação não reconhecido:', suggestion.action?.type);
                  return {
                    success: false,
                    message: `Tipo de sugestão "${suggestion.action?.type}" não suportado ainda`
                  };
              }
            } catch (error) {
              console.error('❌ DetalheProduto - Erro ao aplicar sugestão:', error);
              return {
                success: false,
                message: 'Erro inesperado ao aplicar sugestão'
              };
            }
          }}
        />
      )}
    </div>
  );
};

// ✅ COMPONENTE PRODUTOS SIMILARES - CORRIGIDO
interface ProdutosSimilaresProps {
  produto: Product;
  onProductClick: (product: Product) => void;
  onAddToList: (product: Product, quantity?: number) => void;
}

const ProdutosSimilares: React.FC<ProdutosSimilaresProps> = ({ produto, onProductClick, onAddToList }) => {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // ✅ CARREGAR PRODUTOS SIMILARES - CORRIGIDO
  useEffect(() => {
    const carregarProdutosSimilares = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Carregando produtos similares para:', produto.nome);
        
        // ✅ CORREÇÃO: Usar caminho correto
        const response = await fetch('/produtos-mock.json');
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const todosProdutos = data.produtos || [];
        
        console.log(`📦 Total de produtos no JSON: ${todosProdutos.length}`);
        
        // ✅ CORREÇÃO: Filtrar produtos similares com transformação correta
        const similares = todosProdutos
          .filter((p: any) => {
            // Não incluir o produto atual
            if (String(p.id) === String(produto.id)) return false;
            
            // Buscar por categoria similar
            if (p.categoria === produto.categoria) return true;
            
            // Buscar por marca similar
            if (produto.marca && p.marca === produto.marca) return true;
            
            // Buscar por palavras-chave no nome
            const nomeAtual = produto.nome.toLowerCase();
            const nomeSimilar = p.nome.toLowerCase();
            const palavrasChave = nomeAtual.split(' ').filter(palavra => palavra.length > 3);
            
            return palavrasChave.some(palavra => nomeSimilar.includes(palavra));
          })
          .slice(0, 6) // Limitar a 6 produtos
          .map((p: any) => {
            // ✅ CORREÇÃO: Transformar dados JSON corretamente
            const estoque = p.estoque || 0;
            const disponivel = p.disponivel !== undefined 
              ? Boolean(p.disponivel) 
              : estoque > 0;

            const precoNumerico = typeof p.preco === 'string' ? parseFloat(p.preco) : (p.preco || 0);
            const desconto = p.desconto || 0;
            const temPromocao = p.promocao === true || desconto > 0;
            const precoOriginal = temPromocao && desconto > 0
              ? precoNumerico / (1 - desconto / 100)
              : precoNumerico;

            return {
              id: String(p.id),
              nome: p.nome || 'Produto sem nome',
              preco: precoNumerico,
              categoria: p.categoria || 'outros',
              subcategoria: p.subcategoria,
              imagem: p.imagem || `/api/placeholder/300/300?text=${encodeURIComponent(p.nome || 'Produto')}`,
              loja: p.loja || 'Loja não informada',
              lojaId: String(p.id),
              distancia: p.distancia || (Math.random() * 5 + 0.5),
              promocao: temPromocao ? {
                ativo: true,
                desconto: desconto,
                precoOriginal: precoOriginal
              } : undefined,
              avaliacao: p.avaliacao || (Math.random() * 2 + 3),
              numeroAvaliacoes: p.numeroAvaliacoes || Math.floor(Math.random() * 100 + 10),
              disponivel: disponivel, // ✅ CORREÇÃO PRINCIPAL
              marca: p.marca,
              peso: p.peso,
              origem: p.origem || 'Nacional',
              estoque: estoque,
              isNovo: p.isNovo || Math.random() > 0.8,
              isMelhorPreco: p.isMelhorPreco || false
            } as Product;
          });
        
        // Se não encontrar similares suficientes, pegar produtos aleatórios da mesma loja
        if (similares.length < 3) {
          const produtosMesmaLoja = todosProdutos
            .filter((p: any) => 
              p.loja === produto.loja && 
              String(p.id) !== String(produto.id) &&
              !similares.find(s => String(s.id) === String(p.id))
            )
            .slice(0, 3 - similares.length)
            .map((p: any) => {
              const estoque = p.estoque || 0;
              const disponivel = p.disponivel !== undefined ? Boolean(p.disponivel) : estoque > 0;
              const precoNumerico = typeof p.preco === 'string' ? parseFloat(p.preco) : (p.preco || 0);
              
              return {
                id: String(p.id),
                nome: p.nome || 'Produto sem nome',
                preco: precoNumerico,
                categoria: p.categoria || 'outros',
                loja: p.loja || 'Loja não informada',
                disponivel: disponivel,
                imagem: p.imagem || `/api/placeholder/300/300?text=${encodeURIComponent(p.nome || 'Produto')}`,
                distancia: Math.random() * 5 + 0.5,
                marca: p.marca,
                avaliacao: p.avaliacao || (Math.random() * 2 + 3)
              } as Product;
            });
          
          similares.push(...produtosMesmaLoja);
        }
        
        console.log(`✅ Produtos similares encontrados: ${similares.length}`);
        console.log('📊 Status de disponibilidade:', {
          disponiveis: similares.filter(p => p.disponivel).length,
          indisponiveis: similares.filter(p => !p.disponivel).length
        });
        
        setProdutos(similares);
      } catch (err) {
        console.error('❌ Erro ao carregar produtos similares:', err);
        setError('Não foi possível carregar produtos similares');
      } finally {
        setLoading(false);
      }
    };

    carregarProdutosSimilares();
  }, [produto.id, produto.categoria, produto.marca, produto.loja]);

  const handleProductClick = (produtoSimilar: Product) => {
    console.log('🔄 Clique em produto similar:', produtoSimilar.nome, 'disponível:', produtoSimilar.disponivel);
    onProductClick(produtoSimilar);
  };

  const handleQueroEsse = (e: React.MouseEvent, produtoSimilar: Product) => {
    e.stopPropagation();
    console.log('➕ Adicionar produto similar:', produtoSimilar.nome);
    onAddToList(produtoSimilar, 1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 text-xl mb-6">💝 Outros produtos que você pode gostar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-32 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 text-xl mb-6">💝 Outros produtos que você pode gostar</h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-500">Erro ao carregar produtos similares.</p>
          <p className="text-sm text-gray-400 mt-2">Tente recarregar a página.</p>
        </div>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 text-xl mb-6">💝 Outros produtos que você pode gostar</h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500">Nenhum produto similar encontrado no momento.</p>
          <p className="text-sm text-gray-400 mt-2">Tente navegar pelas categorias para descobrir mais produtos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900 text-xl">💝 Outros produtos que você pode gostar</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {produtos.length} produto{produtos.length > 1 ? 's' : ''} encontrado{produtos.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos.map((produtoSimilar) => {
          const temPromocao = produtoSimilar.promocao && 
            produtoSimilar.promocao.precoOriginal > produtoSimilar.preco;
          const economia = temPromocao ? 
            produtoSimilar.promocao!.precoOriginal - produtoSimilar.preco : 0;

          return (
            <div 
              key={produtoSimilar.id} 
              onClick={() => handleProductClick(produtoSimilar)}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Imagem do produto */}
              <div className="relative mb-3">
                <img
                  src={produtoSimilar.imagem || '/api/placeholder/200/150'}
                  alt={produtoSimilar.nome}
                  className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 space-y-1">
                  {temPromocao && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-md">
                      -{Math.round(((produtoSimilar.promocao!.precoOriginal - produtoSimilar.preco) / produtoSimilar.promocao!.precoOriginal) * 100)}%
                    </div>
                  )}
                  {produtoSimilar.isMelhorPreco && (
                    <div className="bg-[#B9E937] text-gray-900 px-2 py-1 rounded text-xs font-bold shadow-md">
                      MELHOR
                    </div>
                  )}
                  {produtoSimilar.isNovo && (
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold shadow-md">
                      NOVO
                    </div>
                  )}
                </div>

                {/* ✅ CORREÇÃO: Indicador de disponibilidade correto */}
                <div className="absolute bottom-2 right-2">
                  <div className={`w-3 h-3 rounded-full shadow-sm ${
                    produtoSimilar.disponivel ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 min-h-[2.5rem]">
                  {produtoSimilar.nome}
                </h4>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="truncate">{produtoSimilar.loja}</span>
                  <span>•</span>
                  <span>{produtoSimilar.distancia?.toFixed(1) || '1.2'}km</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-green-600 text-lg">
                      {formatPrice(produtoSimilar.preco)}
                    </p>
                    {temPromocao && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(produtoSimilar.promocao!.precoOriginal)}
                      </span>
                    )}
                  </div>
                  
                  {economia > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Economize {formatPrice(economia)}
                    </p>
                  )}
                </div>

                {/* ✅ CORREÇÃO: Status correto */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    produtoSimilar.disponivel 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {produtoSimilar.disponivel ? 'Disponível' : 'Indisponível'}
                  </span>
                  
                  {produtoSimilar.avaliacao && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-gray-600">{produtoSimilar.avaliacao.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* ✅ CORREÇÃO: Botões de ação */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={(e) => handleQueroEsse(e, produtoSimilar)}
                    disabled={!produtoSimilar.disponivel}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      produtoSimilar.disponivel
                        ? 'bg-[#B9E937] hover:bg-green-500 text-gray-900 hover:text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {produtoSimilar.disponivel ? '+ Adicionar' : 'Indisponível'}
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(produtoSimilar);
                    }}
                    className="px-3 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                    title="Ver detalhes"
                  >
                    👁️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer com ação para ver mais */}
      {produtos.length >= 3 && (
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all inline-flex items-center gap-2">
            <span>Ver mais produtos similares</span>
            <span className="transform transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>Produtos em estoque</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Mesma região</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            <span>Categoria similar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalheProduto;