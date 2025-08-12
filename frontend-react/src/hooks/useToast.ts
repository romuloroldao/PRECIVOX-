// src/hooks/useToast.ts - SISTEMA DE TOASTS INTEGRADO E ATUALIZADO
import { useContext } from 'react';
import { ToastProvider as NewToastProvider } from '../contexts/ToastContext';

interface ToastContextType {
  addToast: (toast: { type: string; title?: string; message: string; duration?: number }) => void;
}

// Re-exportar o novo provider como default
export const ToastProvider = NewToastProvider;

// Re-exportar tipos
export type { Toast } from '../components/common/ToastContainer';

// Hook principal que usa o novo contexto
export { useToast } from '../contexts/ToastContext';

// ✅ HELPERS EXTRAS: Como useAppState tem helpers
export const createToastHelpers = (addToast: ToastContextType['addToast']) => ({
  // ✅ LISTA: Toasts específicos para listas
  listItemAdded: (itemName: string) => 
    addToast({ 
      type: 'success', 
      title: 'Item Adicionado',
      message: `${itemName} foi adicionado à sua lista` 
    }),
    
  listItemRemoved: (itemName: string) =>
    addToast({ 
      type: 'info', 
      title: 'Item Removido',
      message: `${itemName} foi removido da sua lista` 
    }),
    
  listSaved: (listName: string) =>
    addToast({ 
      type: 'success', 
      title: 'Lista Salva',
      message: `"${listName}" foi salva com sucesso` 
    }),

  // ✅ IA: Toasts específicos para IA
  aiAnalysisComplete: (savings: string) =>
    addToast({ 
      type: 'smart', 
      title: '🤖 Análise IA Concluída',
      message: `Encontrei ${savings} em economia potencial!`,
      duration: 6000
    }),
    
  aiSuggestionApplied: (description: string) =>
    addToast({ 
      type: 'smart', 
      title: '✨ Sugestão IA Aplicada',
      message: description 
    }),
    
  aiAllSuggestionsApplied: (count: number, totalSavings: string) =>
    addToast({ 
      type: 'smart', 
      title: '🎉 Todas Sugestões Aplicadas',
      message: `${count} otimizações aplicadas! Economia total: ${totalSavings}`,
      duration: 8000
    }),
    
  aiSuggestionsReverted: () =>
    addToast({ 
      type: 'info', 
      title: '🔄 Lista Revertida',
      message: 'Todas as otimizações IA foram revertidas' 
    }),

  // ✅ SISTEMA: Toasts do sistema
  locationDetected: (location: string) =>
    addToast({ 
      type: 'info', 
      title: '📍 Localização Detectada',
      message: `Buscando preços em ${location}` 
    }),
    
  networkError: () =>
    addToast({ 
      type: 'error', 
      title: 'Erro de Conexão',
      message: 'Verifique sua conexão com a internet' 
    }),
    
  dataLoaded: (source: string) =>
    addToast({ 
      type: 'success', 
      title: 'Dados Carregados',
      message: `Produtos carregados do ${source}` 
    }),

  // ✅ USUARIO: Toasts de autenticação
  loginSuccess: (userName: string) =>
    addToast({ 
      type: 'success', 
      title: 'Login Realizado',
      message: `Bem-vindo(a), ${userName}!` 
    }),
    
  permissionDenied: (feature: string) =>
    addToast({ 
      type: 'warning', 
      title: 'Acesso Restrito',
      message: `${feature} disponível apenas no plano Business` 
    })
});

// Re-export useToast as default
export { useToast as default } from '../contexts/ToastContext';