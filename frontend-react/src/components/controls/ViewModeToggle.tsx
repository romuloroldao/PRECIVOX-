import React from 'react';
import { useViewMode } from '../../hooks/useViewMode';

// Reutilizando CSS existentes
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';

interface ViewModeToggleProps {
  className?: string;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  className = '',
  showLabels = false,
  size = 'medium'
}) => {
  const { viewMode, setViewMode, availableModes } = useViewMode();

  // Ícones para cada modo (usando os ícones já existentes no projeto)
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'grid':
        return '⊞'; // Grid
      case 'list':
        return '☰'; // List
      case 'card':
        return '▦'; // Card
      case 'compact':
        return '▤'; // Compact
      case 'table':
        return '▦'; // Table
      default:
        return '⊞';
    }
  };

  // Labels amigáveis
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'grid':
        return 'Grade';
      case 'list':
        return 'Lista';
      case 'card':
        return 'Cards';
      case 'compact':
        return 'Compacto';
      case 'table':
        return 'Tabela';
      default:
        return mode;
    }
  };

  const handleModeChange = (mode: string) => {
    setViewMode(mode as any);
  };

  return (
    <div className={`view-mode-toggle ${size} ${className}`}>
      {showLabels && (
        <span className="toggle-label">Visualização:</span>
      )}
      
      <div className="mode-buttons">
        {availableModes.map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`mode-button ${viewMode === mode ? 'active' : ''} fade-in`}
            title={`Visualizar como ${getModeLabel(mode)}`}
            aria-label={`Modo ${getModeLabel(mode)}`}
          >
            <span className="mode-icon">{getModeIcon(mode)}</span>
            {showLabels && (
              <span className="mode-text">{getModeLabel(mode)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewModeToggle;