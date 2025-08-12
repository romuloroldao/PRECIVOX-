import React, { useState } from 'react';
import { Product } from '../types';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useFavorites } from '../../hooks/useFavorites';

// ✅ USANDO APENAS CSS EXISTENTES
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';
// ❌ REMOVIDO: import '../../styles/premium-cards.css'; // Não existe

interface ProductActionsProps {
  product: Product;
  onAddToList?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onCompare?: (product: Product) => void;
  onShare?: (product: Product) => void;
  variant?: 'full' | 'compact' | 'minimal';
  layout?: 'horizontal' | 'vertical' | 'grid';
  showLabels?: boolean;
  className?: string;
}

export const ProductActions: React.FC<ProductActionsProps> = ({
  product,
  onAddToList,
  onViewDetails,
  onCompare,
  onShare,
  variant = 'full',
  layout = 'horizontal',
  showLabels = true,
  className = ''
}) => {
  const { user } = useAuth();
  const { canUseListFeatures } = usePermissions();
  const { favorites, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  console.log('🎬 [PRODUCT ACTIONS] Renderizando para produto:', product.nome);
  console.log('📋 [PRODUCT ACTIONS] Favorites:', favorites?.length || 0);
  console.log('🔐 [PRODUCT ACTIONS] Can use lists:', canUseListFeatures);

  // ✅ VERIFICAR SE PRODUTO ESTÁ NOS FAVORITOS - CORRIGIDO
  const isProductFavorite = Array.isArray(favorites) && favorites.some(fav => fav.id === product.id);

  console.log('❤️ [PRODUCT ACTIONS] Is favorite:', isProductFavorite);

  // ✅ FUNÇÃO canUseFeature SIMPLIFICADA
  const canUseFeature = (feature: string): boolean => {
    switch (feature) {
      case 'compare': return true; // Todos podem comparar
      case 'share': return true; // Todos podem compartilhar
      default: return false;
    }
  };

  // Handlers com loading
  const handleAction = async (actionType: string, action: () => void | Promise<void>) => {
    setIsLoading(actionType);
    try {
      await action();
    } finally {
      setIsLoading(null);
    }
  };

  const handleAddToList = () => {
    if (!canUseListFeatures) {
      console.log('🚫 [PRODUCT ACTIONS] Não pode usar listas');
      return;
    }
    console.log('📝 [PRODUCT ACTIONS] Adicionando à lista:', product.nome);
    handleAction('list', () => onAddToList?.(product));
  };

  const handleToggleFavorite = () => {
    console.log('❤️ [PRODUCT ACTIONS] Toggle favorite:', product.nome);
    handleAction('favorite', () => toggleFavorite(product));
  };

  const handleViewDetails = () => {
    console.log('👁️ [PRODUCT ACTIONS] Ver detalhes:', product.nome);
    handleAction('details', () => onViewDetails?.(product));
  };

  const handleCompare = () => {
    if (!canUseFeature('compare')) return;
    console.log('⚖️ [PRODUCT ACTIONS] Comparar:', product.nome);
    handleAction('compare', () => onCompare?.(product));
  };

  const handleShare = () => {
    console.log('📤 [PRODUCT ACTIONS] Compartilhar:', product.nome);
    handleAction('share', () => {
      if (navigator.share) {
        navigator.share({
          title: product.nome,
          text: `Confira este produto: ${product.nome} por R$ ${product.preco}`,
          url: window.location.href
        });
      } else {
        onShare?.(product);
      }
    });
  };

  // Definir ações disponíveis baseado no variant
  const getAvailableActions = () => {
    const actions = [];

    // Ação principal - Ver detalhes (sempre disponível)
    actions.push({
      key: 'details',
      label: 'Ver Detalhes',
      icon: '👁️',
      handler: handleViewDetails,
      primary: true,
      available: true
    });

    // Favoritos (sempre disponível)
    actions.push({
      key: 'favorite',
      label: isProductFavorite ? 'Remover Favorito' : 'Favoritar',
      icon: isProductFavorite ? '❤️' : '🤍',
      handler: handleToggleFavorite,
      available: true,
      active: isProductFavorite
    });

    if (variant !== 'minimal') {
      // Adicionar à lista (apenas clientes)
      actions.push({
        key: 'list',
        label: 'Adicionar à Lista',
        icon: '📝',
        handler: handleAddToList,
        available: canUseListFeatures,
        protected: true
      });

      // Comparar (feature premium)
      actions.push({
        key: 'compare',
        label: 'Comparar',
        icon: '⚖️',
        handler: handleCompare,
        available: canUseFeature('compare')
      });
    }

    if (variant === 'full') {
      // Compartilhar
      actions.push({
        key: 'share',
        label: 'Compartilhar',
        icon: '📤',
        handler: handleShare,
        available: true
      });
    }

    return actions;
  };

  const actions = getAvailableActions();

  // Renderizar botão de ação
  const renderActionButton = (action: any) => {
    const isLoadingThis = isLoading === action.key;
    const isDisabled = !action.available || isLoadingThis;

    return (
      <button
        key={action.key}
        onClick={action.handler}
        disabled={isDisabled}
        className={`
          mobile-btn
          ${action.primary ? 'mobile-btn--primary' : 'mobile-btn--secondary'}
          ${action.active ? 'active' : ''}
          ${action.protected ? 'protected' : ''}
          ${isLoadingThis ? 'mobile-btn--loading' : ''}
        `}
        title={action.label}
        aria-label={action.label}
      >
        <span className="mobile-btn__icon">
          {isLoadingThis ? '⏳' : action.icon}
        </span>
        {showLabels && (
          <span className="mobile-btn__text">{action.label}</span>
        )}
      </button>
    );
  };

  // Renderizar botão protegido com fallback
  const renderProtectedButton = (action: any) => {
    if (action.available) {
      return renderActionButton(action);
    }

    return (
      <button
        key={action.key}
        className="mobile-btn mobile-btn--secondary disabled"
        title={`${action.label} - Apenas para clientes`}
        disabled
      >
        <span className="mobile-btn__icon">🔒</span>
        {showLabels && (
          <span className="mobile-btn__text">
            {user?.role === 'admin' ? 'Privado' : 'Premium'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`mobile-card__actions ${variant} ${layout} ${className}`}>
      <div className="actions-container">
        {actions.map(action => 
          action.protected 
            ? renderProtectedButton(action)
            : renderActionButton(action)
        )}
      </div>

      {/* Contador de favoritos (variant full) */}
      {variant === 'full' && (
        <div className="actions-info">
          <span className="favorites-count">
            {Array.isArray(favorites) ? favorites.length : 0} favoritos
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductActions;