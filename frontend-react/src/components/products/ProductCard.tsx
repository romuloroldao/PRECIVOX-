import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

// ✅ USANDO CSS EXISTENTE - REFORMULADO
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';
import '../../styles/mobile-cards.css';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list' | 'card' | 'compact' | 'table';
  onClick?: (product: Product) => void;
  onAddToList?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  canUseListFeatures?: boolean;
  formatPrice?: (price: number) => string;
  showActions?: boolean;
  className?: string;
  personaType?: 'cliente' | 'gestor' | 'admin';
}

// ✅ HOOK PARA IMAGENS SEM ERRO 404
const useProductImage = (productName: string) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const generateValidImage = () => {
      // Gera um ID baseado no nome do produto
      let hash = 0;
      for (let i = 0; i < productName.length; i++) {
        const char = productName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const productId = Math.abs(hash) % 1000;

      // URLs que FUNCIONAM (sem 404)
      const validUrls = [
        `https://picsum.photos/300/300?random=${productId}`,
        `https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=${encodeURIComponent(productName.slice(0, 15))}`,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(productName.slice(0, 2))}&size=300&background=4A90E2&color=fff`
      ];

      return validUrls[0]; // Usa Picsum (funciona sempre)
    };

    if (productName) {
      setIsLoading(true);
      const url = generateValidImage();
      setImageUrl(url);
      setIsLoading(false);
    }
  }, [productName]);

  return { imageUrl, isLoading, hasError };
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'grid',
  onClick,
  onAddToList,
  onToggleFavorite,
  isFavorite = false,
  canUseListFeatures = false,
  formatPrice: propFormatPrice,
  showActions = true,
  className = '',
  personaType
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ USAR HOOK DE IMAGEM SEM ERRO 404
  const { imageUrl, isLoading: imageLoading } = useProductImage(product.nome);


  // ✅ FORMATAR PREÇO BRASILEIRO
  const formatPrice = propFormatPrice || ((price: number | string): string => {
    const numPrice = typeof price === 'string' ? 
      parseFloat(price.replace(/[^\d,.-]/g, '').replace(',', '.')) : price;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(numPrice || 0);
  });

  // ✅ HANDLERS OTIMIZADOS
  const handleViewDetails = () => {
    onClick?.(product);
  };

  const handleAddToList = async () => {
    if (!canUseListFeatures || !onAddToList) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddToList?.(product);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CALCULAR DESCONTO
  const discount = product.precoOriginal && product.preco ? 
    Math.round(((parseFloat(product.precoOriginal.toString()) - parseFloat(product.preco.toString())) / parseFloat(product.precoOriginal.toString())) * 100) : 0;

  // ✅ DETECTAR SE DEVE MOSTRAR BOTÃO ADICIONAR
  const showAddButton = canUseListFeatures && onAddToList;

  // ✅ FALLBACK DE IMAGEM (SEM 404)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/300x300/cccccc/666666?text=${encodeURIComponent(product.nome.slice(0, 10))}`;
  };

  // Renderização para modo lista
  if (viewMode === 'list') {
    return (
      <div className={`product-list-item ${className}`}>
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          {/* Imagem menor */}
          <div className="flex-shrink-0 w-20 h-20 relative">
            {imageLoading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                <span>📦</span>
              </div>
            ) : (
              <img 
                src={imageUrl}
                alt={product.nome}
                className="w-full h-full object-cover rounded-lg"
                onError={handleImageError}
              />
            )}
            {discount > 5 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                -{discount}%
              </div>
            )}
          </div>

          {/* Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600" onClick={handleViewDetails}>
                  {product.nome}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{product.loja || 'Loja Online'}</p>
                {product.avaliacao && (
                  <span className="text-sm text-yellow-500">⭐ {product.avaliacao}</span>
                )}
              </div>
              
              {/* Preço */}
              <div className="text-right ml-4">
                <div className="font-bold text-green-600 text-lg">
                  {formatPrice(product.preco)}
                </div>
                {product.precoOriginal && discount > 5 && (
                  <div className="text-sm text-gray-400 line-through">
                    {formatPrice(product.precoOriginal)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          {showActions && (
            <div className="flex gap-2 ml-4">
              <button 
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleViewDetails}
              >
                👁️ Ver
              </button>
              {showAddButton && (
                <button 
                  className={`px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-50' : ''}`}
                  onClick={handleAddToList}
                  disabled={isLoading}
                >
                  {isLoading ? '⏳' : '➕'} {isLoading ? 'Aguarde' : 'Adicionar'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização padrão para grid/card
  return (
    <div className={`mobile-card ${className}`}>
      {/* 🖼️ IMAGEM DO PRODUTO - SEM ERRO 404 */}
      <div className="mobile-card__image" onClick={handleViewDetails}>
        {imageLoading ? (
          <div className="mobile-card__img-loading">
            <div className="mobile-card__img-skeleton">
              <span>📦</span>
            </div>
          </div>
        ) : (
          <img 
            src={imageUrl || `https://via.placeholder.com/300x300/e0e0e0/666666?text=${encodeURIComponent(product.nome.slice(0, 10))}`}
            alt={product.nome}
            className="mobile-card__img"
            loading="lazy"
            onError={handleImageError}
          />
        )}
        
        {/* 🏷️ BADGE DE DESCONTO */}
        {discount > 5 && (
          <div className="mobile-card__badge">
            -{discount}%
          </div>
        )}
      </div>

      {/* 📝 CONTEÚDO DO CARD */}
      <div className="mobile-card__content">
        {/* 🏪 LOJA E AVALIAÇÃO */}
        <div className="mobile-card__store">
          <span className="mobile-card__store-name">{product.loja || 'Loja Online'}</span>
          {product.avaliacao && (
            <span className="mobile-card__rating">
              ⭐ {product.avaliacao}
            </span>
          )}
        </div>

        {/* 📛 NOME DO PRODUTO */}
        <h3 className="mobile-card__title" onClick={handleViewDetails}>
          {product.nome}
        </h3>

        {/* 💰 PREÇO DESTACADO */}
        <div className="mobile-card__price">
          <span className="mobile-card__current-price">
            {formatPrice(product.preco)}
          </span>
          {product.precoOriginal && discount > 5 && (
            <span className="mobile-card__original-price">
              {formatPrice(product.precoOriginal)}
            </span>
          )}
        </div>

        {/* 🎯 APENAS 2 BOTÕES */}
        {showActions && (
          <div className="mobile-card__actions">
            {/* 👁️ VER DETALHES - SEMPRE VISÍVEL */}
            <button 
              className="mobile-btn mobile-btn--secondary"
              onClick={handleViewDetails}
              aria-label={`Ver detalhes de ${product.nome}`}
            >
              <span className="mobile-btn__icon">👁️</span>
              <span className="mobile-btn__text">Detalhes</span>
            </button>

            {/* ➕ ADICIONAR - APENAS PARA CLIENTES */}
            {showAddButton && (
              <button 
                className={`mobile-btn mobile-btn--primary ${isLoading ? 'mobile-btn--loading' : ''}`}
                onClick={handleAddToList}
                disabled={isLoading}
                aria-label={`Adicionar ${product.nome} à lista`}
              >
                {isLoading ? (
                  <>
                    <span className="mobile-btn__icon">⏳</span>
                    <span className="mobile-btn__text">Aguarde...</span>
                  </>
                ) : (
                  <>
                    <span className="mobile-btn__icon">➕</span>
                    <span className="mobile-btn__text">Adicionar</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;