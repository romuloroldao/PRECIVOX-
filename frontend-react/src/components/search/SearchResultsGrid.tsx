import React from 'react';
import { Product } from '../types';
import { ProductCard } from '../products/ProductCard';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

// ✅ IMPORTAR NOVO CSS MOBILE-FIRST
import '../../styles/mobile-cards.css';
import '../../styles/animations.css';

interface SearchResultsGridProps {
  products: Product[];
  viewMode: 'grid' | 'list' | 'card' | 'compact' | 'table';
  onProductClick: (product: Product) => void;
  onAddToList: (product: Product) => void;
  isLoading?: boolean;
  className?: string;
}

export const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  products,
  viewMode,
  onProductClick,
  onAddToList,
  isLoading = false,
  className = ''
}) => {
  const { user } = useAuth();
  const { canUseListFeatures } = usePermissions();

  console.log('🔍 [SEARCH GRID] Renderizando:', {
    products: products.length,
    viewMode,
    user: user?.name,
    role: user?.role,
    canUseListFeatures
  });

  // ✅ LOADING STATE MOBILE-FIRST
  if (isLoading) {
    return (
      <div className={`mobile-cards-grid ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="mobile-card">
            <div className="mobile-card__image">
              <div className="loading-skeleton" style={{ width: '100%', height: '100%' }}></div>
            </div>
            <div className="mobile-card__content">
              <div className="loading-skeleton" style={{ width: '80%', height: '20px', marginBottom: '8px' }}></div>
              <div className="loading-skeleton" style={{ width: '60%', height: '24px', marginBottom: '8px' }}></div>
              <div className="loading-skeleton" style={{ width: '40%', height: '16px', marginBottom: '12px' }}></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="loading-skeleton" style={{ flex: 1, height: '48px', borderRadius: '12px' }}></div>
                <div className="loading-skeleton" style={{ flex: 1, height: '48px', borderRadius: '12px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ✅ EMPTY STATE
  if (!products || products.length === 0) {
    return (
      <div className="mobile-empty-state">
        <div className="mobile-empty-state__icon">🔍</div>
        <h3 className="mobile-empty-state__title">Nenhum produto encontrado</h3>
        <p className="mobile-empty-state__description">
          Tente ajustar os filtros ou buscar por outros termos
        </p>
      </div>
    );
  }

  return (
    <div className={`mobile-cards-grid ${className}`}>
      {products.map((product, index) => (
        <ProductCard
          key={`${product.id}-${index}`}
          product={product}
          viewMode={viewMode}
          onClick={() => onProductClick(product)}
          onAddToList={() => onAddToList(product)}
          showActions={true}
          className="mobile-search-card"
          personaType={user?.role as 'cliente' | 'gestor' | 'admin'}
        />
      ))}
    </div>
  );
};

export default SearchResultsGrid;