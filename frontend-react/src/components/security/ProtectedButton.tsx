// src/components/security/ProtectedButton.tsx - Botão Universal com Proteção
import React from 'react';
import { useSecurityGuard } from '../../hooks/useSecurityGuard';

interface ProtectedButtonProps {
  children: React.ReactNode;
  feature: 'lists' | 'analytics' | 'markets' | 'admin';
  onClick?: () => void;
  className?: string;
  fallbackMessage?: string;
  showFallback?: boolean;
  disabled?: boolean;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  children,
  feature,
  onClick,
  className = '',
  fallbackMessage,
  showFallback = true,
  disabled = false
}) => {
  const { canUseFeature, getBlockMessage } = useSecurityGuard();

  const canAccess = canUseFeature(feature);
  const blockMessage = fallbackMessage || getBlockMessage(feature);

  // ✅ Se pode acessar - renderizar botão normal
  if (canAccess) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`transition-colors ${className} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {children}
      </button>
    );
  }

  // ✅ Se não pode acessar - mostrar fallback ou nada
  if (!showFallback) {
    return null;
  }

  return (
    <div className={`text-center py-2 px-4 text-sm text-gray-500 italic border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
      {blockMessage}
    </div>
  );
};