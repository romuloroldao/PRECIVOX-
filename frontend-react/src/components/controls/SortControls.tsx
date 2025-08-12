import React from 'react';

// Reutilizando CSS existentes
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';

export interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

interface SortControlsProps {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  options?: SortOption[];
  className?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  direction?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}

export const SortControls: React.FC<SortControlsProps> = ({
  sortBy,
  onSortChange,
  options,
  className = '',
  showLabel = true,
  size = 'medium',
  direction = 'asc',
  onDirectionChange
}) => {
  
  // Opções padrão de ordenação para produtos
  const defaultOptions: SortOption[] = [
    { value: 'relevance', label: 'Relevância', icon: '⭐' },
    { value: 'price_low', label: 'Menor Preço', icon: '💰' },
    { value: 'price_high', label: 'Maior Preço', icon: '💎' },
    { value: 'name', label: 'Nome A-Z', icon: '🔤' },
    { value: 'rating', label: 'Avaliação', icon: '⭐' },
    { value: 'popularity', label: 'Popularidade', icon: '🔥' },
    { value: 'newest', label: 'Mais Recente', icon: '🆕' },
    { value: 'discount', label: 'Maior Desconto', icon: '🏷️' }
  ];

  const sortOptions = options || defaultOptions;

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(event.target.value);
  };

  const handleDirectionToggle = () => {
    if (onDirectionChange) {
      onDirectionChange(direction === 'asc' ? 'desc' : 'asc');
    }
  };

  const getCurrentOption = () => {
    return sortOptions.find(option => option.value === sortBy) || sortOptions[0];
  };

  return (
    <div className={`sort-controls ${size} ${className}`}>
      {showLabel && (
        <label className="sort-label" htmlFor="sort-select">
          Ordenar por:
        </label>
      )}
      
      <div className="sort-controls-wrapper">
        <div className="sort-select-container">
          <select
            id="sort-select"
            value={sortBy}
            onChange={handleSortChange}
            className="sort-select fade-in"
            aria-label="Selecionar ordenação"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon ? `${option.icon} ${option.label}` : option.label}
              </option>
            ))}
          </select>
          
          <span className="sort-icon">
            {getCurrentOption()?.icon || '📋'}
          </span>
        </div>

        {onDirectionChange && (
          <button
            onClick={handleDirectionToggle}
            className={`sort-direction-btn ${direction}`}
            title={direction === 'asc' ? 'Crescente' : 'Decrescente'}
            aria-label={`Ordenação ${direction === 'asc' ? 'crescente' : 'decrescente'}`}
          >
            {direction === 'asc' ? '↑' : '↓'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SortControls;