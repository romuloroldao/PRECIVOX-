// services/loggingService.ts - SISTEMA DE LOGS E MONITORAMENTO
interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  stackTrace?: string;
}

interface LogConfig {
  enableConsole: boolean;
  enableLocalStorage: boolean;
  enableRemote: boolean;
  maxLocalEntries: number;
  bufferSize: number;
  flushInterval: number;
  minLevel: LogEntry['level'];
  remoteEndpoint?: string;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCalls: number;
  errors: number;
  cacheHits: number;
  cacheMisses: number;
  timestamp: number;
}

class LoggingService {
  private config: LogConfig = {
    enableConsole: true,
    enableLocalStorage: true,
    enableRemote: false,
    maxLocalEntries: 1000,
    bufferSize: 50,
    flushInterval: 30000, // 30 segundos
    minLevel: 'info',
    remoteEndpoint: '/api/logs'
  };

  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    timestamp: Date.now()
  };

  private logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeLogging();
  }

  // ✅ MÉTODOS PRINCIPAIS DE LOG
  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, error?: Error | any, data?: any): void {
    const logData = {
      ...(data || {}),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };

    this.log('error', category, message, logData, error?.stack);
    this.performanceMetrics.errors++;
  }

  critical(category: string, message: string, error?: Error | any, data?: any): void {
    const logData = {
      ...(data || {}),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };

    this.log('critical', category, message, logData, error?.stack);
    this.performanceMetrics.errors++;
    
    // Logs críticos são enviados imediatamente
    this.flushLogs();
  }

  // ✅ LOG ESPECÍFICOS POR CATEGORIA
  logApiCall(method: string, url: string, duration: number, status?: number, error?: any): void {
    this.performanceMetrics.apiCalls++;
    
    const message = `${method} ${url} - ${duration}ms`;
    const data = { method, url, duration, status };

    if (error || (status && status >= 400)) {
      this.error('API', message, error, data);
    } else {
      this.info('API', message, data);
    }
  }

  logUserAction(action: string, details?: any): void {
    this.info('USER', `Ação: ${action}`, {
      action,
      ...details,
      timestamp: Date.now()
    });
  }

  logPerformance(operation: string, duration: number, details?: any): void {
    this.info('PERFORMANCE', `${operation}: ${duration}ms`, {
      operation,
      duration,
      ...details
    });

    if (operation.includes('render')) {
      this.performanceMetrics.renderTime += duration;
    } else if (operation.includes('load')) {
      this.performanceMetrics.loadTime = duration;
    }
  }

  logCacheEvent(type: 'hit' | 'miss', key: string, details?: any): void {
    if (type === 'hit') {
      this.performanceMetrics.cacheHits++;
    } else {
      this.performanceMetrics.cacheMisses++;
    }

    this.debug('CACHE', `Cache ${type}: ${key}`, {
      type,
      key,
      ...details
    });
  }

  logNavigation(from: string, to: string, duration?: number): void {
    this.info('NAVIGATION', `${from} → ${to}`, {
      from,
      to,
      duration,
      timestamp: Date.now()
    });
  }

  logSearch(query: string, results: number, duration: number, source?: string): void {
    this.info('SEARCH', `Busca: "${query}" - ${results} resultados`, {
      query,
      results,
      duration,
      source,
      timestamp: Date.now()
    });
  }

  logAuthentication(action: 'login' | 'logout' | 'register', userId?: string, success?: boolean): void {
    const level = success === false ? 'warn' : 'info';
    this.log(level, 'AUTH', `${action} ${success === false ? 'falhou' : 'sucesso'}`, {
      action,
      userId: userId || 'unknown',
      success,
      timestamp: Date.now()
    });
  }

  // ✅ CAPTURA AUTOMÁTICA DE ERROS
  captureError(error: Error, context?: string): void {
    this.critical('ERROR', `Erro não tratado${context ? ` em ${context}` : ''}`, error, {
      context,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  // ✅ MONITORAMENTO DE PERFORMANCE
  startPerformanceMonitoring(): void {
    // Performance Observer para métricas de navegação
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            this.logPerformance('page-load', nav.loadEventEnd - nav.loadEventStart, {
              type: 'navigation',
              domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
              domInteractive: nav.domInteractive - nav.navigationStart
            });
          } else if (entry.entryType === 'measure') {
            this.logPerformance(entry.name, entry.duration, {
              type: 'measure'
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'measure'] });
    }

    // Monitorar uso de memória
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.debug('MEMORY', 'Uso de memória', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        });
      }, 60000); // A cada minuto
    }
  }

  // ✅ MÉTODOS DE CONTROLE
  flush(): Promise<void> {
    return this.flushLogs();
  }

  clearLogs(): void {
    this.logBuffer = [];
    localStorage.removeItem('precivox_logs');
    this.info('SYSTEM', 'Logs limpos');
  }

  getLogs(level?: LogEntry['level'], category?: string, limit?: number): LogEntry[] {
    let logs = this.getStoredLogs();

    if (level) {
      const minLevelNum = this.logLevels[level];
      logs = logs.filter(log => this.logLevels[log.level] >= minLevelNum);
    }

    if (category) {
      logs = logs.filter(log => log.category === category);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.performanceMetrics,
      timestamp: Date.now()
    };
  }

  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      performanceMetrics: this.getPerformanceMetrics(),
      logs
    }, null, 2);
  }

  // ✅ CONFIGURAÇÃO
  configure(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar timer de flush se intervalo mudou
    if (newConfig.flushInterval && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.startFlushTimer();
    }

    this.info('SYSTEM', 'Configuração de logs atualizada', newConfig);
  }

  getConfig(): LogConfig {
    return { ...this.config };
  }

  // ✅ MÉTODOS PRIVADOS
  private log(
    level: LogEntry['level'],
    category: string,
    message: string,
    data?: any,
    stackTrace?: string
  ): void {
    // Verificar se deve logar este nível
    if (this.logLevels[level] < this.logLevels[this.config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace
    };

    // Console
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer
    this.logBuffer.push(entry);

    // Flush se buffer está cheio
    if (this.logBuffer.length >= this.config.bufferSize) {
      this.flushLogs();
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.category}] ${new Date(entry.timestamp).toLocaleTimeString()}`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data);
        break;
      case 'info':
        console.info(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'error':
      case 'critical':
        console.error(message, entry.data, entry.stackTrace);
        break;
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Local Storage
    if (this.config.enableLocalStorage) {
      this.storeLogsLocally(logsToFlush);
    }

    // Remote
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await this.sendLogsRemotely(logsToFlush);
      } catch (error) {
        console.warn('⚠️ Falha ao enviar logs remotamente:', error);
        // Recolocar logs no buffer em caso de falha
        this.logBuffer.unshift(...logsToFlush);
      }
    }
  }

  private storeLogsLocally(logs: LogEntry[]): void {
    try {
      const existing = this.getStoredLogs();
      const combined = [...existing, ...logs];
      
      // Manter apenas as entradas mais recentes
      const trimmed = combined.slice(-this.config.maxLocalEntries);
      
      localStorage.setItem('precivox_logs', JSON.stringify(trimmed));
    } catch (error) {
      console.warn('⚠️ Falha ao salvar logs localmente:', error);
    }
  }

  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('precivox_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private async sendLogsRemotely(logs: LogEntry[]): Promise<void> {
    const response = await fetch(this.config.remoteEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        logs,
        performanceMetrics: this.getPerformanceMetrics()
      })
    });

    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.status}`);
    }
  }

  private initializeLogging(): void {
    // Capturar erros globais
    window.addEventListener('error', (event) => {
      this.captureError(event.error, 'global-error-handler');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(event.reason),
        'unhandled-promise-rejection'
      );
    });

    // Iniciar timer de flush
    this.startFlushTimer();

    // Iniciar monitoramento de performance
    this.startPerformanceMonitoring();

    this.info('SYSTEM', 'Sistema de logging inicializado', {
      sessionId: this.sessionId,
      config: this.config
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ✅ INSTANCE SINGLETON
export const loggingService = new LoggingService();

// ✅ HOOK PARA USO EM COMPONENTES
export const useLogging = () => {
  return {
    debug: (category: string, message: string, data?: any) =>
      loggingService.debug(category, message, data),
    info: (category: string, message: string, data?: any) =>
      loggingService.info(category, message, data),
    warn: (category: string, message: string, data?: any) =>
      loggingService.warn(category, message, data),
    error: (category: string, message: string, error?: any, data?: any) =>
      loggingService.error(category, message, error, data),
    critical: (category: string, message: string, error?: any, data?: any) =>
      loggingService.critical(category, message, error, data),
    
    // Logs específicos
    logApiCall: (method: string, url: string, duration: number, status?: number, error?: any) =>
      loggingService.logApiCall(method, url, duration, status, error),
    logUserAction: (action: string, details?: any) =>
      loggingService.logUserAction(action, details),
    logPerformance: (operation: string, duration: number, details?: any) =>
      loggingService.logPerformance(operation, duration, details),
    logNavigation: (from: string, to: string, duration?: number) =>
      loggingService.logNavigation(from, to, duration),
    logSearch: (query: string, results: number, duration: number, source?: string) =>
      loggingService.logSearch(query, results, duration, source),
    
    // Controle
    flush: () => loggingService.flush(),
    clearLogs: () => loggingService.clearLogs(),
    getLogs: (level?: any, category?: string, limit?: number) =>
      loggingService.getLogs(level, category, limit),
    getPerformanceMetrics: () => loggingService.getPerformanceMetrics(),
    exportLogs: () => loggingService.exportLogs(),
    configure: (config: any) => loggingService.configure(config)
  };
};

export default loggingService;