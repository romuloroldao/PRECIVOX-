import React, { useState } from 'react';

// Reutilizando CSS existentes
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';

export interface FilterOption {
  key: string;
  label: string;
  icon?: string;
  count?: number;
  active?: boolean;
}

export interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
  multiSelect?: boolean;
  expanded?: boolean;
}

interface FilterControlsProps {
  filters: FilterGroup[];
  onFilterChange: (groupId: string, optionKey: string, active: boolean) => void;
  onClearAll?: () => void;
  className?: string;
  compact?: boolean;
  showCounts?: boolean;
  collapsible?: boolean;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  className = '',
  compact = false,
  showCounts = false,
  collapsible = true
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filters.filter(f => f.expanded !== false).map(f => f.id))
  );

  const toggleGroup = (groupId: string) => {
    if (!collapsible) return;
    
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleFilterToggle = (groupId: string, optionKey: string, currentActive: boolean) => {
    onFilterChange(groupId, optionKey, !currentActive);
  };

  const getActiveFiltersCount = () => {
    return filters.reduce((total, group) => {
      return total + group.options.filter(option => option.active).length;
    }, 0);
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <div className={`filter-controls ${compact ? 'compact' : ''} ${className}`}>
      {/* Header com contador e limpar tudo */}
      <div className="filter-header">
        <h4 className="filter-title">
          Filtros
          {hasActiveFilters && (
            <span className="active-count">({getActiveFiltersCount()})</span>
          )}
        </h4>
        
        {hasActiveFilters && onClearAll && (
          <button 
            onClick={onClearAll}
            className="clear-all-btn"
            title="Limpar todos os filtros"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Grupos de filtros */}
      <div className="filter-groups">
        {filters.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const activeOptions = group.options.filter(opt => opt.active);
          
          return (
            <div key={group.id} className={`filter-group ${isExpanded ? 'expanded' : 'collapsed'} fade-in`}>
              {/* Título do grupo */}
              <div 
                className="group-header"
                onClick={() => toggleGroup(group.id)}
                role={collapsible ? "button" : undefined}
                tabIndex={collapsible ? 0 : undefined}
              >
                <h5 className="group-title">
                  {group.title}
                  {activeOptions.length > 0 && (
                    <span className="group-active-count">({activeOptions.length})</span>
                  )}
                </h5>
                
                {collapsible && (
                  <span className="group-toggle">
                    {isExpanded ? '−' : '+'}
                  </span>
                )}
              </div>

              {/* Opções do grupo */}
              {isExpanded && (
                <div className="group-options">
                  {group.options.map((option) => (
                    <label 
                      key={option.key}
                      className={`filter-option ${option.active ? 'active' : ''}`}
                    >
                      <input
                        type={group.multiSelect === false ? "radio" : "checkbox"}
                        name={group.multiSelect === false ? group.id : undefined}
                        checked={option.active || false}
                        onChange={() => handleFilterToggle(group.id, option.key, option.active || false)}
                        className="filter-input"
                      />
                      
                      <div className="option-content">
                        {option.icon && (
                          <span className="option-icon">{option.icon}</span>
                        )}
                        
                        <span className="option-label">{option.label}</span>
                        
                        {showCounts && option.count !== undefined && (
                          <span className="option-count">({option.count})</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Filtros ativos (modo compacto) */}
      {compact && hasActiveFilters && (
        <div className="active-filters-summary">
          <div className="active-filters-list">
            {filters.map(group => 
              group.options
                .filter(opt => opt.active)
                .map(opt => (
                  <span 
                    key={`${group.id}-${opt.key}`}
                    className="active-filter-tag"
                    onClick={() => handleFilterToggle(group.id, opt.key, true)}
                  >
                    {opt.icon} {opt.label} ×
                  </span>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;