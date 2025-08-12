// hooks/useMonitoring.ts - HOOK DE MONITORAMENTO E ANALYTICS
import { useEffect, useCallback, useRef, useState } from 'react';
import { loggingService, useLogging } from '../services/loggingService';

interface MonitoringState {
  isActive: boolean;
  sessionId: string;
  startTime: number;
  pageViews: number;
  userActions: number;
  errors: number;
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    apiCalls: number;
    cacheHitRate: number;
  };
}

interface UserBehavior {
  clicks: number;
  scrolls: number;
  timeOnPage: number;
  interactions: Array<{
    type: string;
    timestamp: number;
    element?: string;
    data?: any;
  }>;
}

export const useMonitoring = () => {
  const [state, setState] = useState<MonitoringState>({
    isActive: true,
    sessionId: '',
    startTime: Date.now(),
    pageViews: 0,
    userActions: 0,
    errors: 0,
    performanceMetrics: {
      loadTime: 0,
      renderTime: 0,
      apiCalls: 0,
      cacheHitRate: 0
    }
  });

  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    clicks: 0,
    scrolls: 0,
    timeOnPage: 0,
    interactions: []
  });

  const logging = useLogging();
  const startTimeRef = useRef(Date.now());
  const pageStartTimeRef = useRef(Date.now());
  const lastScrollTimeRef = useRef(0);

  // ✅ INICIALIZAÇÃO DO MONITORAMENTO
  useEffect(() => {
    setState(prev => ({
      ...prev,
      sessionId: Date.now().toString(),
      startTime: Date.now()
    }));

    logging.info('MONITORING', 'Sistema de monitoramento iniciado');

    // Monitorar visibilidade da página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logging.info('MONITORING', 'Página ficou invisível');
        flushData();
      } else {
        logging.info('MONITORING', 'Página ficou visível');
        pageStartTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const timeOnPage = Date.now() - pageStartTimeRef.current;
      logging.info('MONITORING', 'Sessão finalizada', {
        duration: timeOnPage,
        userBehavior: userBehavior
      });
    };
  }, []);

  // ✅ MONITORAR CLIQUES
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.substring(0, 50)
      };

      setUserBehavior(prev => ({
        ...prev,
        clicks: prev.clicks + 1,
        interactions: [...prev.interactions.slice(-49), {
          type: 'click',
          timestamp: Date.now(),
          element: `${elementInfo.tagName}.${elementInfo.className}#${elementInfo.id}`,
          data: elementInfo
        }]
      }));

      setState(prev => ({ ...prev, userActions: prev.userActions + 1 }));

      logging.logUserAction('click', elementInfo);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [logging]);

  // ✅ MONITORAR SCROLL (THROTTLED)
  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTimeRef.current > 1000) { // Throttle: 1 segundo
        lastScrollTimeRef.current = now;
        
        setUserBehavior(prev => ({
          ...prev,
          scrolls: prev.scrolls + 1,
          interactions: [...prev.interactions.slice(-49), {
            type: 'scroll',
            timestamp: now,
            data: {
              scrollY: window.scrollY,
              scrollPercent: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
            }
          }]
        }));

        logging.debug('MONITORING', 'Scroll detectado', {
          scrollY: window.scrollY,
          scrollPercent: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [logging]);

  // ✅ MONITORAR PERFORMANCE DE RENDERIZAÇÃO
  const measureRender = useCallback((componentName: string) => {
    return {
      start: () => {
        const startTime = performance.now();
        return {
          end: () => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            setState(prev => ({
              ...prev,
              performanceMetrics: {
                ...prev.performanceMetrics,
                renderTime: duration
              }
            }));

            logging.logPerformance(`render-${componentName}`, duration);
            return duration;
          }
        };
      }
    };
  }, [logging]);

  // ✅ MONITORAR CHAMADAS DE API
  const trackApiCall = useCallback((
    method: string,
    url: string,
    startTime: number,
    endTime: number,
    status?: number,
    error?: any
  ) => {
    const duration = endTime - startTime;
    
    setState(prev => ({
      ...prev,
      performanceMetrics: {
        ...prev.performanceMetrics,
        apiCalls: prev.performanceMetrics.apiCalls + 1
      }
    }));

    logging.logApiCall(method, url, duration, status, error);
  }, [logging]);

  // ✅ MONITORAR ERROS
  const trackError = useCallback((error: Error, context?: string) => {
    setState(prev => ({ ...prev, errors: prev.errors + 1 }));
    logging.captureError(error, context);
  }, [logging]);

  // ✅ MONITORAR NAVEGAÇÃO
  const trackNavigation = useCallback((from: string, to: string) => {
    const now = Date.now();
    const timeOnPreviousPage = now - pageStartTimeRef.current;
    
    setState(prev => ({ ...prev, pageViews: prev.pageViews + 1 }));
    
    setUserBehavior(prev => ({
      ...prev,
      timeOnPage: timeOnPreviousPage
    }));

    logging.logNavigation(from, to, timeOnPreviousPage);
    pageStartTimeRef.current = now;
  }, [logging]);

  // ✅ MONITORAR BUSCA
  const trackSearch = useCallback((
    query: string,
    results: number,
    duration: number,
    source?: string
  ) => {
    logging.logSearch(query, results, duration, source);
    
    setUserBehavior(prev => ({
      ...prev,
      interactions: [...prev.interactions.slice(-49), {
        type: 'search',
        timestamp: Date.now(),
        data: { query, results, duration, source }
      }]
    }));
  }, [logging]);

  // ✅ MONITORAR CACHE
  const trackCacheEvent = useCallback((type: 'hit' | 'miss', key: string) => {
    logging.debug('CACHE', `Cache ${type}: ${key}`);
    
    setState(prev => {
      const metrics = prev.performanceMetrics;
      const totalCacheEvents = (metrics.cacheHitRate * metrics.apiCalls) + 1;
      const newHits = type === 'hit' ? totalCacheEvents : totalCacheEvents - 1;
      
      return {
        ...prev,
        performanceMetrics: {
          ...metrics,
          cacheHitRate: newHits / (totalCacheEvents + 1)
        }
      };
    });
  }, [logging]);

  // ✅ MONITORAR TEMPO EM ELEMENTOS
  const trackElementTime = useCallback((elementId: string) => {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logging.debug('MONITORING', `Tempo em elemento: ${elementId}`, {
        elementId,
        duration
      });
      
      return duration;
    };
  }, [logging]);

  // ✅ FLUSH MANUAL DOS DADOS
  const flushData = useCallback(() => {
    const sessionData = {
      state,
      userBehavior: {
        ...userBehavior,
        timeOnPage: Date.now() - pageStartTimeRef.current
      },
      performanceMetrics: loggingService.getPerformanceMetrics()
    };

    logging.info('MONITORING', 'Flush de dados de monitoramento', sessionData);
    logging.flush();
    
    return sessionData;
  }, [state, userBehavior, logging]);

  // ✅ OBTER RELATÓRIO DE SESSÃO
  const getSessionReport = useCallback(() => {
    const currentTime = Date.now();
    const sessionDuration = currentTime - startTimeRef.current;
    const pageTime = currentTime - pageStartTimeRef.current;

    return {
      session: {
        id: state.sessionId,
        duration: sessionDuration,
        startTime: startTimeRef.current,
        pageViews: state.pageViews,
        userActions: state.userActions,
        errors: state.errors
      },
      currentPage: {
        timeOnPage: pageTime,
        url: window.location.href,
        title: document.title
      },
      userBehavior: {
        ...userBehavior,
        timeOnPage: pageTime,
        avgTimePerAction: state.userActions > 0 ? sessionDuration / state.userActions : 0
      },
      performance: {
        ...state.performanceMetrics,
        ...loggingService.getPerformanceMetrics()
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled
      }
    };
  }, [state, userBehavior]);

  // ✅ ATIVAR/DESATIVAR MONITORAMENTO
  const toggleMonitoring = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, isActive: active }));
    logging.info('MONITORING', `Monitoramento ${active ? 'ativado' : 'desativado'}`);
  }, [logging]);

  return {
    // Estado
    ...state,
    userBehavior,
    
    // Funções de tracking
    measureRender,
    trackApiCall,
    trackError,
    trackNavigation,
    trackSearch,
    trackCacheEvent,
    trackElementTime,
    
    // Controles
    flushData,
    getSessionReport,
    toggleMonitoring,
    
    // Acesso direto ao logging
    logging
  };
};

// ✅ HOC PARA MONITORAMENTO AUTOMÁTICO
export const withMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const { measureRender } = useMonitoring();
    
    useEffect(() => {
      const measure = measureRender(componentName);
      const timer = measure.start();
      
      return () => {
        timer.end();
      };
    }, [measureRender]);
    
    return <Component {...props} />;
  };
};

export default useMonitoring;