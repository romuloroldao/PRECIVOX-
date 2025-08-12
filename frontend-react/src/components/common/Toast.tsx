// src/components/common/Toast.tsx
import React, { useEffect, useState } from 'react';
import { useToast, Toast as ToastType } from '../../hooks/useToast';

// ✅ COMPONENTE TOAST INDIVIDUAL
interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Animação de entrada
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Auto-remove com duration
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  // ✅ ESTILOS POR TIPO
  const getToastStyles = () => {
    const baseStyles = `
      transform transition-all duration-300 ease-in-out
      ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
      ring-1 ring-black ring-opacity-5 overflow-hidden
    `;

    const typeStyles = {
      success: 'border-l-4 border-green-500',
      error: 'border-l-4 border-red-500',
      warning: 'border-l-4 border-yellow-500',
      info: 'border-l-4 border-blue-500',
      smart: 'border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50'
    };

    return `${baseStyles} ${typeStyles[toast.type] || typeStyles.info}`;
  };

  // ✅ ÍCONES POR TIPO
  const getIcon = () => {
    const iconStyles = "h-5 w-5 shrink-0";
    
    switch (toast.type) {
      case 'success':
        return <span className={`${iconStyles} text-green-500`}>✅</span>;
      case 'error':
        return <span className={`${iconStyles} text-red-500`}>❌</span>;
      case 'warning':
        return <span className={`${iconStyles} text-yellow-500`}>⚠️</span>;
      case 'info':
        return <span className={`${iconStyles} text-blue-500`}>ℹ️</span>;
      case 'smart':
        return <span className={`${iconStyles} text-purple-500`}>🤖</span>;
      default:
        return <span className={`${iconStyles} text-gray-500`}>📢</span>;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className="text-sm font-medium text-gray-900">
                {toast.title}
              </p>
            )}
            <p className={`text-sm text-gray-500 ${toast.title ? 'mt-1' : ''}`}>
              {toast.message}
            </p>
          </div>
          
          <div className="ml-4 shrink-0">
            <button
              className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={handleRemove}
            >
              <span className="sr-only">Fechar</span>
              <span className="h-5 w-5">✕</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ CONTAINER DE TOASTS
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

// ✅ COMPONENTE TOAST INLINE (Para usar em outros lugares)
interface ToastProps {
  type?: ToastType['type'];
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  className = '' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'smart': return '🤖';
      default: return '📢';
    }
  };

  const getTypeStyles = () => {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      smart: 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-800'
    };
    return styles[type] || styles.info;
  };

  return (
    <div className={`
      border rounded-lg p-4 flex items-start space-x-3
      ${getTypeStyles()}
      ${className}
    `}>
      <span className="text-lg shrink-0">{getIcon()}</span>
      <div className="flex-1">
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 text-current opacity-50 hover:opacity-75"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ✅ EXPORTS
export default ToastContainer;
export { ToastContainer, ToastItem };

// ✅ TIPOS PARA FACILITAR IMPORTS
export type { ToastType };

// ✅ COMPONENT PARA SER USADO NO APP.TSX
export const ToastSystem: React.FC = () => {
  return <ToastContainer />;
};