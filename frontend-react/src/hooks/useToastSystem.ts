// hooks/useToastSystem.ts - HOOK PRINCIPAL DO SISTEMA DE TOASTS
import { useState, useCallback, useRef } from 'react';
import { Toast } from '../components/common/ToastContainer';

interface ToastOptions {
  title?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: boolean;
  position?: 'top' | 'bottom';
}

export const useToastSystem = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Gerar ID único para toast
  const generateId = useCallback(() => {
    return `toast-${++toastIdRef.current}-${Date.now()}`;
  }, []);

  // Adicionar toast
  const addToast = useCallback((
    type: Toast['type'],
    message: string,
    options: ToastOptions = {}
  ) => {
    const id = generateId();
    
    const newToast: Toast = {
      id,
      type,
      message,
      title: options.title,
      duration: options.duration,
      persistent: options.persistent,
      action: options.action,
      progress: options.progress ?? true,
      position: options.position ?? 'bottom'
    };

    setToasts(prev => [newToast, ...prev]);
    
    return id;
  }, [generateId]);

  // Remover toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Limpar todos os toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Atualizar toast existente
  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  // Helpers para tipos específicos de toast
  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    return addToast('success', message, {
      duration: 4000,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    return addToast('error', message, {
      duration: 8000,
      persistent: true, // Erros ficam até serem fechados manualmente
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    return addToast('warning', message, {
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    return addToast('info', message, {
      duration: 5000,
      ...options
    });
  }, [addToast]);

  const showSmart = useCallback((message: string, options?: ToastOptions) => {
    return addToast('smart', message, {
      duration: 6000,
      title: '🧠 IA',
      ...options
    });
  }, [addToast]);

  const showLoading = useCallback((message: string, options?: ToastOptions) => {
    return addToast('loading', message, {
      persistent: true,
      progress: false,
      ...options
    });
  }, [addToast]);

  // Helpers avançados
  const showActionToast = useCallback((
    type: Toast['type'],
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    options?: Omit<ToastOptions, 'action'>
  ) => {
    return addToast(type, message, {
      ...options,
      action: {
        label: actionLabel,
        onClick: actionCallback
      }
    });
  }, [addToast]);

  const showTemporaryLoading = useCallback((
    message: string,
    promise: Promise<any>,
    successMessage?: string,
    errorMessage?: string
  ) => {
    const loadingId = showLoading(message);
    
    promise
      .then((result) => {
        removeToast(loadingId);
        if (successMessage) {
          showSuccess(successMessage);
        }
        return result;
      })
      .catch((error) => {
        removeToast(loadingId);
        if (errorMessage) {
          showError(errorMessage);
        } else {
          showError('Ops! Algo deu errado. Tente novamente.');
        }
        throw error;
      });
    
    return loadingId;
  }, [showLoading, removeToast, showSuccess, showError]);

  // Context helpers para diferentes situações
  const showNetworkError = useCallback((retryCallback?: () => void) => {
    return showActionToast(
      'error',
      'Sem conexão com internet. Verifique sua rede.',
      'Tentar novamente',
      retryCallback || (() => window.location.reload()),
      {
        title: 'Erro de Conexão',
        persistent: true
      }
    );
  }, [showActionToast]);

  const showUnavailableFeature = useCallback((featureName: string) => {
    return showWarning(
      `${featureName} não está disponível no seu plano atual.`,
      {
        title: 'Recurso Indisponível',
        action: {
          label: 'Ver Planos',
          onClick: () => {
            // Navegar para página de planos
            window.location.href = '/planos';
          }
        }
      }
    );
  }, [showWarning]);

  const showLocationPermissionDenied = useCallback(() => {
    return showWarning(
      'Permissão de localização negada. Você pode ativar nas configurações.',
      {
        title: 'Localização',
        action: {
          label: 'Configurações',
          onClick: () => {
            // Abrir configurações do navegador (limitado)
            showInfo('Acesse as configurações do seu navegador para ativar a localização.');
          }
        }
      }
    );
  }, [showWarning, showInfo]);

  const showAuthenticationError = useCallback(() => {
    return showError(
      'Sua sessão expirou. Por favor, faça login novamente.',
      {
        title: 'Sessão Expirada',
        action: {
          label: 'Fazer Login',
          onClick: () => {
            window.location.href = '/login';
          }
        }
      }
    );
  }, [showError]);

  const showMaintenanceMode = useCallback(() => {
    return showInfo(
      'Sistema em manutenção. Voltaremos em breve!',
      {
        title: 'Manutenção',
        persistent: true,
        progress: false
      }
    );
  }, [showInfo]);

  // Estatísticas dos toasts
  const getToastStats = useCallback(() => {
    return {
      total: toasts.length,
      byType: toasts.reduce((acc, toast) => {
        acc[toast.type] = (acc[toast.type] || 0) + 1;
        return acc;
      }, {} as Record<Toast['type'], number>),
      persistent: toasts.filter(t => t.persistent).length,
      loading: toasts.filter(t => t.type === 'loading').length
    };
  }, [toasts]);

  return {
    // Estado
    toasts,
    
    // Ações básicas
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    
    // Helpers por tipo
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSmart,
    showLoading,
    
    // Helpers avançados
    showActionToast,
    showTemporaryLoading,
    
    // Context helpers
    showNetworkError,
    showUnavailableFeature,
    showLocationPermissionDenied,
    showAuthenticationError,
    showMaintenanceMode,
    
    // Utilitários
    getToastStats
  };
};