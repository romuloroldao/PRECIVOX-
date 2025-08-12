import React from 'react';
import { 
  Flame, 
  Zap, 
  Award, 
  Star, 
  Package, 
  Clock, 
  Tag,
  Truck,
  Shield,
  Heart
} from 'lucide-react';

export type BadgeType = 
  | 'discount'
  | 'new' 
  | 'best-price' 
  | 'featured'
  | 'out-of-stock'
  | 'limited-time'
  | 'bestseller'
  | 'premium'
  | 'free-shipping'
  | 'express'
  | 'guarantee'
  | 'favorite';

interface ProductBadgeProps {
  type: BadgeType;
  value?: string | number;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  animated?: boolean;
  className?: string;
}

// ✅ CONFIGURAÇÃO COMPLETA DOS BADGES
const badgeConfig = {
  discount: {
    bg: 'bg-red-500',
    text: 'text-white',
    icon: Tag,
    content: (value?: string | number) => value ? `-${value}% OFF` : 'DESCONTO'
  },
  new: {
    bg: 'bg-green-500',
    text: 'text-white',
    icon: Star,
    content: () => 'NOVO'
  },
  'best-price': {
    bg: 'bg-orange-500',
    text: 'text-white',
    icon: Award,
    content: () => 'MELHOR PREÇO'
  },
  featured: {
    bg: 'bg-purple-500',
    text: 'text-white',
    icon: Star,
    content: () => 'DESTAQUE'
  },
  'out-of-stock': {
    bg: 'bg-gray-500',
    text: 'text-white',
    icon: Package,
    content: () => 'INDISPONÍVEL'
  },
  'limited-time': {
    bg: 'bg-red-600',
    text: 'text-white',
    icon: Clock,
    content: () => 'OFERTA RELÂMPAGO'
  },
  bestseller: {
    bg: 'bg-yellow-500',
    text: 'text-white',
    icon: Flame,
    content: () => 'MAIS VENDIDO'
  },
  premium: {
    bg: 'bg-gradient-to-r from-purple-600 to-blue-600',
    text: 'text-white',
    icon: Award,
    content: () => 'PREMIUM'
  },
  'free-shipping': {
    bg: 'bg-blue-500',
    text: 'text-white',
    icon: Truck,
    content: () => 'FRETE GRÁTIS'
  },
  express: {
    bg: 'bg-indigo-500',
    text: 'text-white',
    icon: Zap,
    content: () => 'ENTREGA EXPRESSA'
  },
  guarantee: {
    bg: 'bg-green-600',
    text: 'text-white',
    icon: Shield,
    content: () => 'GARANTIA'
  },
  favorite: {
    bg: 'bg-pink-500',
    text: 'text-white',
    icon: Heart,
    content: () => 'FAVORITO'
  }
};

const ProductBadge: React.FC<ProductBadgeProps> = ({
  type,
  value,
  size = 'md',
  position = 'top-left',
  animated = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div 
      className={`
        absolute ${positionClasses[position]} z-10 
        ${config.bg} ${config.text} 
        ${sizeClasses[size]} 
        rounded-full font-bold shadow-lg 
        flex items-center gap-1
        ${animated ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span className="whitespace-nowrap">{config.content(value)}</span>
    </div>
  );
};

// ✅ COMPONENTE PARA MÚLTIPLOS BADGES
interface MultipleBadgesProps {
  badges: Array<{
    type: BadgeType;
    value?: string | number;
    animated?: boolean;
  }>;
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  className?: string;
}

export const MultipleBadges: React.FC<MultipleBadgesProps> = ({
  badges,
  size = 'md',
  maxVisible = 3,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;

  return (
    <div className={`absolute top-2 left-2 z-10 flex flex-col gap-1 ${className}`}>
      {visibleBadges.map((badge, index) => {
        const config = badgeConfig[badge.type];
        const Icon = config.icon;
        
        return (
          <div
            key={`${badge.type}-${index}`}
            className={`
              ${config.bg} ${config.text}
              ${sizeClasses[size]}
              rounded-full font-bold shadow-lg
              flex items-center gap-1
              ${badge.animated ? 'animate-pulse' : ''}
            `}
          >
            <Icon className={iconSizes[size]} />
            <span className="whitespace-nowrap">
              {config.content(badge.value)}
            </span>
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div className={`
          bg-gray-600 text-white
          ${sizeClasses[size]}
          rounded-full font-bold shadow-lg
          flex items-center justify-center
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// ✅ HELPER FUNCTIONS PARA DETECTAR BADGES AUTOMATICAMENTE
export const getBadgesFromProduct = (product: any): Array<{type: BadgeType, value?: string | number, animated?: boolean}> => {
  const badges: Array<{type: BadgeType, value?: string | number, animated?: boolean}> = [];

  // Verificar desconto
  if (product.precoOriginal && product.preco) {
    const discount = Math.round(((product.precoOriginal - product.preco) / product.precoOriginal) * 100);
    if (discount > 5) {
      badges.push({
        type: 'discount',
        value: discount,
        animated: discount > 30
      });
    }
  }

  // Verificar se é novo (menos de 30 dias)
  if (product.dataAdicionado) {
    const daysDiff = Math.floor((Date.now() - new Date(product.dataAdicionado).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 30) {
      badges.push({ type: 'new' });
    }
  }

  // Verificar se é mais vendido
  if (product.vendas && product.vendas > 100) {
    badges.push({ type: 'bestseller', animated: true });
  }

  // Verificar avaliação alta
  if (product.avaliacao && product.avaliacao >= 4.5) {
    badges.push({ type: 'featured' });
  }

  // Verificar estoque
  if (product.estoque === 0) {
    badges.push({ type: 'out-of-stock' });
  }

  // Verificar frete grátis
  if (product.freteGratis) {
    badges.push({ type: 'free-shipping' });
  }

  return badges;
};

// ✅ COMPONENTE SMART BADGE QUE DETECTA AUTOMATICAMENTE
interface SmartBadgeProps {
  product: any;
  maxBadges?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SmartBadge: React.FC<SmartBadgeProps> = ({
  product,
  maxBadges = 2,
  size = 'md',
  className = ''
}) => {
  const badges = getBadgesFromProduct(product);
  
  if (badges.length === 0) return null;

  if (badges.length === 1) {
    const badge = badges[0];
    return (
      <ProductBadge
        type={badge.type}
        value={badge.value}
        size={size}
        animated={badge.animated}
        className={className}
      />
    );
  }

  return (
    <MultipleBadges
      badges={badges}
      maxVisible={maxBadges}
      size={size}
      className={className}
    />
  );
};

export default ProductBadge;