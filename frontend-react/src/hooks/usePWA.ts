// hooks/usePWA.ts - HOOK PARA FUNCIONALIDADES PWA
import { useState, useEffect, useCallback } from 'react';
import { loggingService } from '../services/loggingService';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  registration: ServiceWorkerRegistration | null;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallStats {
  installPromptShown: boolean;
  installResult: 'accepted' | 'dismissed' | 'pending';
  installTime?: number;
  platform?: string;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    installPrompt: null,
    registration: null
  });

  const [installStats, setInstallStats] = useState<PWAInstallStats>({
    installPromptShown: false,
    installResult: 'pending'
  });

  // ✅ DETECTAR SE É PWA STANDALONE
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    setState(prev => ({
      ...prev,
      isStandalone,
      isInstalled
    }));

    if (isStandalone) {
      loggingService.info('PWA', 'Aplicação executando em modo standalone');
    }
  }, []);

  // ✅ DETECTAR PROMPT DE INSTALAÇÃO
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: installEvent
      }));

      loggingService.info('PWA', 'Prompt de instalação disponível', {
        platforms: installEvent.platforms
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ✅ DETECTAR INSTALAÇÃO COMPLETA
  useEffect(() => {
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }));

      localStorage.setItem('pwa-installed', 'true');
      
      setInstallStats(prev => ({
        ...prev,
        installResult: 'accepted',
        installTime: Date.now()
      }));

      loggingService.info('PWA', 'Aplicação instalada com sucesso');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ✅ MONITORAR STATUS ONLINE/OFFLINE
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      loggingService.info('PWA', 'Conexão restaurada');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      loggingService.warn('PWA', 'Aplicação offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ MONITORAR SERVICE WORKER E ATUALIZAÇÕES
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          setState(prev => ({ ...prev, registration }));

          // Verificar por atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updateAvailable: true }));
                  loggingService.info('PWA', 'Atualização disponível');
                }
              });
            }
          });
        })
        .catch((error) => {
          loggingService.error('PWA', 'Erro ao registrar Service Worker', error);
        });

      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'CACHE_UPDATED':
            loggingService.info('PWA', 'Cache atualizado', payload);
            break;
          case 'OFFLINE_FALLBACK':
            loggingService.warn('PWA', 'Usando fallback offline', payload);
            break;
        }
      });
    }
  }, []);

  // ✅ FUNÇÃO PARA INSTALAR PWA
  const installPWA = useCallback(async () => {
    if (!state.installPrompt) {
      throw new Error('Prompt de instalação não disponível');
    }

    try {
      setInstallStats(prev => ({ ...prev, installPromptShown: true }));
      loggingService.info('PWA', 'Iniciando instalação da PWA');

      await state.installPrompt.prompt();
      const choiceResult = await state.installPrompt.userChoice;

      setInstallStats(prev => ({
        ...prev,
        installResult: choiceResult.outcome,
        platform: choiceResult.platform,
        installTime: choiceResult.outcome === 'accepted' ? Date.now() : undefined
      }));

      loggingService.info('PWA', 'Resultado da instalação', {
        outcome: choiceResult.outcome,
        platform: choiceResult.platform
      });

      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null
        }));
      }

      return choiceResult;
    } catch (error) {
      loggingService.error('PWA', 'Erro durante instalação', error);
      throw error;
    }
  }, [state.installPrompt]);

  // ✅ FUNÇÃO PARA APLICAR ATUALIZAÇÃO
  const applyUpdate = useCallback(async () => {
    if (!state.registration || !state.updateAvailable) {
      throw new Error('Atualização não disponível');
    }

    try {
      loggingService.info('PWA', 'Aplicando atualização...');

      const waitingWorker = state.registration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Aguardar o novo worker assumir controle
        await new Promise<void>((resolve) => {
          const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            resolve();
          };
          navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        });

        setState(prev => ({ ...prev, updateAvailable: false }));
        
        loggingService.info('PWA', 'Atualização aplicada, recarregando...');
        window.location.reload();
      }
    } catch (error) {
      loggingService.error('PWA', 'Erro ao aplicar atualização', error);
      throw error;
    }
  }, [state.registration, state.updateAvailable]);

  // ✅ FUNÇÃO PARA COMPARTILHAR
  const share = useCallback(async (data: {
    title?: string;
    text?: string;
    url?: string;
  }) => {
    if (!navigator.share) {
      // Fallback para clipboard se Web Share não estiver disponível
      const shareText = `${data.title || 'PRECIVOX'}\n${data.text || ''}\n${data.url || window.location.href}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        loggingService.info('PWA', 'Conteúdo copiado para clipboard');
        return { shared: false, copied: true };
      } else {
        throw new Error('Compartilhamento não suportado');
      }
    }

    try {
      await navigator.share({
        title: data.title || 'PRECIVOX - Inteligência de Preços',
        text: data.text || 'Compare preços em Franco da Rocha',
        url: data.url || window.location.href
      });

      loggingService.info('PWA', 'Conteúdo compartilhado', data);
      return { shared: true, copied: false };
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        loggingService.error('PWA', 'Erro ao compartilhar', error);
      }
      throw error;
    }
  }, []);

  // ✅ FUNÇÃO PARA LIMPAR CACHE
  const clearCache = useCallback(async () => {
    try {
      loggingService.info('PWA', 'Limpando cache da aplicação...');

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Notificar Service Worker para limpar
      if (state.registration) {
        state.registration.active?.postMessage({ type: 'CLEAR_CACHE' });
      }

      loggingService.info('PWA', 'Cache limpo com sucesso');
    } catch (error) {
      loggingService.error('PWA', 'Erro ao limpar cache', error);
      throw error;
    }
  }, [state.registration]);

  // ✅ FUNÇÃO PARA OBTER INFO DE INSTALAÇÃO
  const getInstallationInfo = useCallback(() => {
    return {
      canInstall: state.isInstallable,
      isInstalled: state.isInstalled,
      isStandalone: state.isStandalone,
      installStats,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' :
                   window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' :
                   window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser',
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }, [state.isInstallable, state.isInstalled, state.isStandalone, installStats]);

  // ✅ FUNÇÃO PARA VERIFICAR RECURSOS OFFLINE
  const checkOfflineCapability = useCallback(async () => {
    if (!('caches' in window)) {
      return { supported: false, cachedPages: [] };
    }

    try {
      const cacheNames = await caches.keys();
      const cachedPages: string[] = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cachedPages.push(...requests.map(req => req.url));
      }

      return {
        supported: true,
        cacheNames,
        cachedPages: [...new Set(cachedPages)],
        totalCached: cachedPages.length
      };
    } catch (error) {
      loggingService.error('PWA', 'Erro ao verificar cache offline', error);
      return { supported: false, error: error as Error };
    }
  }, []);

  return {
    // Estado
    ...state,
    installStats,
    
    // Funções
    installPWA,
    applyUpdate,
    share,
    clearCache,
    getInstallationInfo,
    checkOfflineCapability,
    
    // Helpers
    canInstall: state.isInstallable && !!state.installPrompt,
    canUpdate: state.updateAvailable && !!state.registration,
    canShare: 'share' in navigator || 'clipboard' in navigator,
    isOfflineCapable: 'caches' in window && 'serviceWorker' in navigator
  };
};

export default usePWA;