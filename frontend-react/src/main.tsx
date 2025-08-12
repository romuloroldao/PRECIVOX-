import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile-cards-scroll.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { performanceService } from './services/performanceService'
import { loggingService } from './services/loggingService'

// ✅ INICIALIZAR LOGGING E MONITORAMENTO - SPRINT 3
loggingService.info('SYSTEM', 'Aplicação PRECIVOX iniciando...', {
  version: '1.0.0',
  environment: 'production',
  timestamp: Date.now()
});

// ✅ INICIALIZAR PERFORMANCE MONITORING
performanceService.startPerformanceMonitoring();

// ✅ REGISTRAR SERVICE WORKER PARA CACHE OFFLINE
if ('serviceWorker' in navigator) {
  (performanceService.constructor as any).registerServiceWorker()
    .then(() => loggingService.info('SYSTEM', 'Service Worker registrado com sucesso'))
    .catch((error: any) => loggingService.error('SYSTEM', 'Falha ao registrar Service Worker', error));
}

// ✅ PRELOAD DE RECURSOS CRÍTICOS (removido placeholder que não existe)
const criticalResources: string[] = [
  // Recursos críticos serão adicionados quando necessário
];

if (criticalResources.length > 0) {
  performanceService.preloadImages(criticalResources)
    .then(() => loggingService.info('PERFORMANCE', 'Recursos críticos pré-carregados'))
    .catch((error) => loggingService.warn('PERFORMANCE', 'Falha no preload de recursos', error));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)