// src/components/products/ProductSecureButton.tsx - Botão Seguro para Produtos
import React from 'react';
import { ShoppingCart, Plus, Eye } from 'lucide-react';
import { useSecurityGuard } from '../../hooks/useSecurityGuard';

interface Product {
  id: string;
  nome: string;
  preco: number;
  [key: string]: any;
}

interface ProductSecureButtonProps {
  // Dados do produto
  product: Product;
  
  // Tipo de botão
  variant: 'add-to-list' | 'view-details' | 'both';
  
  // Layout
  layout: 'horizontal' | 'vertical' | 'compact';
  
  // Actions
  onAddToList?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  
  // Customização
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductSecureButton: React.FC<ProductSecureButtonProps> = ({
  product,
  variant,
  layout,
  onAddToList,
  onViewDetails,
  className = '',
  size = 'md'
}) => {
  const { canUseFeature, getBlockMessage, userRole } = useSecurityGuard();
  
  const canAddToList = canUseFeature('lists');
  
  // ✅ Configurações de tamanho
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // ✅ Botão Ver Detalhes (sempre visível)
  const ViewDetailsButton = () => (
    <button
      onClick={() => onViewDetails?.(product)}
      className={`
        flex items-center justify-center gap-2 
        bg-gray-100 text-gray-700 rounded-lg 
        hover:bg-gray-200 transition-colors font-medium
        ${sizeClasses[size]} ${className}
      `}
    >
      <Eye className={iconSizes[size]} />
      {layout !== 'compact' && 'Ver Detalhes'}
    </button>
  );

  // ✅ Botão Adicionar à Lista (protegido)
  const AddToListButton = () => {
    if (canAddToList) {
      return (
        <button
          onClick={() => onAddToList?.(product)}
          className={`
            flex items-center justify-center gap-2 
            bg-[#B9E937] text-[#004A7C] rounded-lg 
            hover:bg-[#A8D326] transition-colors font-medium
            ${sizeClasses[size]} ${className}
          `}
        >
          <Plus className={iconSizes[size]} />
          {layout !== 'compact' && 'Adicionar à Lista'}
        </button>
      );
    }

    // ✅ Fallback para usuários sem permissão
    return (
      <div className={`
        flex items-center justify-center gap-2 
        bg-gray-100 text-gray-500 rounded-lg text-center
        ${sizeClasses[size]} ${className}
      `}>
        {layout === 'compact' ? (
          '🔒'
        ) : (
          <>
            {userRole === 'admin' && '🔒 Admin'}
            {userRole === 'gestor' && '📊 Gestor'}
            {!userRole && 'Login'}
          </>
        )}
      </div>
    );
  };

  // ✅ Renderização baseada no variant e layout
  
  // Apenas Ver Detalhes
  if (variant === 'view-details') {
    return <ViewDetailsButton />;
  }
  
  // Apenas Adicionar à Lista
  if (variant === 'add-to-list') {
    return <AddToListButton />;
  }
  
  // Ambos os botões
  if (variant === 'both') {
    if (layout === 'horizontal') {
      return (
        <div className="flex items-center gap-2">
          <ViewDetailsButton />
          <AddToListButton />
        </div>
      );
    }
    
    if (layout === 'vertical') {
      return (
        <div className="space-y-2">
          <ViewDetailsButton />
          <AddToListButton />
        </div>
      );
    }
    
    if (layout === 'compact') {
      return (
        <div className="flex items-center gap-1">
          <ViewDetailsButton />
          <AddToListButton />
        </div>
      );
    }
  }

  return null;
};