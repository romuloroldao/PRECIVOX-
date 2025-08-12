// components/common/ToastContainer.tsx - SISTEMA DE TOASTS OTIMIZADO PARA MOBILE
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X,
  Sparkles,
  Zap,
  Bell,
  Loader2
} from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'smart' | 'loading';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: boolean;
  position?: 'top' | 'bottom';
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position?: 'top' | 'bottom';
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  position = 'bottom',
  maxToasts = 5
}) => {
  const [visibleToasts, setVisibleToasts] = useState<Toast[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ [key: string]: number }>({});

  // Gerenciar toasts visíveis
  useEffect(() => {
    const newVisible = toasts.slice(0, maxToasts);
    setVisibleToasts(newVisible);
  }, [toasts, maxToasts]);

  // Auto-dismiss toasts
  useEffect(() => {
    visibleToasts.forEach(toast => {
      if (!toast.persistent && toast.type !== 'loading') {
        const duration = toast.duration || getDefaultDuration(toast.type);
        const timer = setTimeout(() => {
          onRemove(toast.id);
        }, duration);

        return () => clearTimeout(timer);
      }
    });
  }, [visibleToasts, onRemove]);

  const getDefaultDuration = (type: Toast['type']): number => {
    switch (type) {
      case 'success': return 4000;
      case 'error': return 8000;
      case 'warning': return 6000;
      case 'info': return 5000;
      case 'smart': return 6000;
      case 'loading': return 0; // Não remove automaticamente
      default: return 5000;
    }
  };

  const getToastIcon = (type: Toast['type']) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 text-blue-600" />;
      case 'smart':
        return <Sparkles {...iconProps} className="w-5 h-5 text-purple-600" />;
      case 'loading':
        return <Loader2 {...iconProps} className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-600" />;
    }
  };

  const getToastStyles = (type: Toast['type']) => {
    const baseStyles = "border-l-4 shadow-lg backdrop-blur-sm";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50/95 border-green-500 text-green-900`;
      case 'error':
        return `${baseStyles} bg-red-50/95 border-red-500 text-red-900`;
      case 'warning':
        return `${baseStyles} bg-yellow-50/95 border-yellow-500 text-yellow-900`;
      case 'info':
        return `${baseStyles} bg-blue-50/95 border-blue-500 text-blue-900`;
      case 'smart':
        return `${baseStyles} bg-purple-50/95 border-purple-500 text-purple-900`;
      case 'loading':
        return `${baseStyles} bg-blue-50/95 border-blue-500 text-blue-900`;
      default:
        return `${baseStyles} bg-gray-50/95 border-gray-500 text-gray-900`;
    }
  };

  // Gesture handling para mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, toastId: string) => {
    setIsDragging(toastId);
    setDragOffset({ ...dragOffset, [toastId]: 0 });
  }, [dragOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent, toastId: string) => {
    if (isDragging !== toastId) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const currentX = touch.clientX;
    const offset = currentX - startX;
    
    setDragOffset({ ...dragOffset, [toastId]: offset });
  }, [isDragging, dragOffset]);

  const handleTouchEnd = useCallback((toastId: string) => {
    if (isDragging !== toastId) return;
    
    const offset = dragOffset[toastId] || 0;
    
    // Se arrastou mais de 100px, remove o toast
    if (Math.abs(offset) > 100) {
      onRemove(toastId);
    } else {
      // Volta à posição original
      setDragOffset({ ...dragOffset, [toastId]: 0 });
    }
    
    setIsDragging(null);
  }, [isDragging, dragOffset, onRemove]);

  const renderToast = (toast: Toast, index: number) => {
    const offset = dragOffset[toast.id] || 0;
    const isBeingDragged = isDragging === toast.id;
    
    return (
      <div
        key={toast.id}
        className={`
          toast-item relative rounded-lg p-4 mb-3 transform transition-all duration-300
          ${getToastStyles(toast.type)}
          ${isBeingDragged ? 'scale-105 shadow-xl' : 'hover:shadow-lg'}
          cursor-pointer select-none
        `}
        style={{
          transform: `translateX(${offset}px) ${isBeingDragged ? 'scale(1.02)' : ''}`,
          opacity: Math.max(0.3, 1 - Math.abs(offset) / 200),
          zIndex: 1000 + visibleToasts.length - index
        }}
        onTouchStart={(e) => handleTouchStart(e, toast.id)}
        onTouchMove={(e) => handleTouchMove(e, toast.id)}
        onTouchEnd={() => handleTouchEnd(toast.id)}
        onClick={() => !isBeingDragged && onRemove(toast.id)}
      >
        {/* Progress bar para toasts com duração */}
        {toast.progress && !toast.persistent && toast.type !== 'loading' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 rounded-t-lg overflow-hidden">
            <div 
              className="h-full bg-current opacity-30 transition-all ease-linear"
              style={{
                animation: `toast-progress ${toast.duration || getDefaultDuration(toast.type)}ms linear`,
                animationFillMode: 'forwards'
              }}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className="flex-shrink-0 mt-0.5">
            {getToastIcon(toast.type)}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="font-medium text-sm mb-1 truncate">
                {toast.title}
              </h4>
            )}
            <p className="text-sm leading-relaxed">
              {toast.message}
            </p>
            
            {/* Ação opcional */}
            {toast.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.action?.onClick();
                }}
                className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Botão fechar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(toast.id);
            }}
            className="flex-shrink-0 text-current/60 hover:text-current/90 transition-colors p-1 -m-1 rounded-full hover:bg-current/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador de swipe para mobile */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
        </div>
      </div>
    );
  };

  if (visibleToasts.length === 0) return null;

  const containerElement = document.getElementById('toast-root') || document.body;

  return createPortal(
    <>
      {/* CSS animations */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes toast-slide-in-bottom {
          from { 
            transform: translateY(100%) scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes toast-slide-in-top {
          from { 
            transform: translateY(-100%) scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        .toast-item {
          animation: ${position === 'bottom' ? 'toast-slide-in-bottom' : 'toast-slide-in-top'} 0.3s ease-out;
        }
        
        @media (max-width: 375px) {
          .toast-container {
            left: 0.5rem !important;
            right: 0.5rem !important;
            width: auto !important;
          }
          
          .toast-item {
            margin-bottom: 0.5rem !important;
          }
        }
      `}</style>

      {/* Container de toasts */}
      <div
        className={`
          toast-container fixed z-[9999] pointer-events-none
          ${position === 'bottom' 
            ? 'bottom-6 sm:bottom-8' 
            : 'top-6 sm:top-8'
          }
          left-4 right-4 sm:left-8 sm:right-8 
          max-w-sm sm:max-w-md mx-auto
        `}
        style={{
          // Ajustar posição para mobile com navigation bar
          bottom: position === 'bottom' ? '5rem' : undefined,
        }}
      >
        <div className="space-y-2 pointer-events-auto">
          {visibleToasts.map((toast, index) => renderToast(toast, index))}
        </div>

        {/* Contador de toasts não exibidos */}
        {toasts.length > maxToasts && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-900/80 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
              <Bell className="w-3 h-3" />
              +{toasts.length - maxToasts} notificações
            </div>
          </div>
        )}
      </div>
    </>,
    containerElement
  );
};

export default ToastContainer;