// contexts/ToastContext.tsx - CONTEXTO GLOBAL DO SISTEMA DE TOASTS
import React, { createContext, useContext, ReactNode } from 'react';
import { useToastSystem } from '../hooks/useToastSystem';
import ToastContainer from '../components/common/ToastContainer';

interface ToastContextType {
  showSuccess: (message: string, options?: any) => string;
  showError: (message: string, options?: any) => string;
  showWarning: (message: string, options?: any) => string;
  showInfo: (message: string, options?: any) => string;
  showSmart: (message: string, options?: any) => string;
  showLoading: (message: string, options?: any) => string;
  showActionToast: (type: any, message: string, actionLabel: string, actionCallback: () => void, options?: any) => string;
  showTemporaryLoading: (message: string, promise: Promise<any>, successMessage?: string, errorMessage?: string) => string;
  showNetworkError: (retryCallback?: () => void) => string;
  showUnavailableFeature: (featureName: string) => string;
  showLocationPermissionDenied: () => string;
  showAuthenticationError: () => string;
  showMaintenanceMode: () => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  getToastStats: () => any;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top' | 'bottom';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'bottom',
  maxToasts = 5 
}) => {
  const toastSystem = useToastSystem();

  return (
    <ToastContext.Provider value={toastSystem}>
      {children}
      <ToastContainer
        toasts={toastSystem.toasts}
        onRemove={toastSystem.removeToast}
        position={position}
        maxToasts={maxToasts}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Hook alternativo que não quebra se não estiver dentro do provider
export const useToastOptional = (): ToastContextType | null => {
  return useContext(ToastContext) || null;
};

// HOC para componentes que precisam de toasts
export const withToast = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { toast?: ToastContextType }> => {
  return (props: P & { toast?: ToastContextType }) => {
    const toast = useToastOptional();
    return <Component {...props} toast={toast} />;
  };
};