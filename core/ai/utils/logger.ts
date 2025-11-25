/**
 * AI Logger - Sistema de logs detalhados para engines de IA
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    engine: string;
    message: string;
    metadata?: any;
}

class AILogger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000;
    private enableConsole = true;

    /**
     * Log genérico
     */
    log(level: LogLevel, engine: string, message: string, metadata?: any) {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            engine,
            message,
            metadata
        };

        this.logs.push(entry);

        // Manter apenas os últimos N logs em memória
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        if (this.enableConsole) {
            const prefix = `[${entry.timestamp.toISOString()}] [${engine}] [${level.toUpperCase()}]`;
            const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';

            const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
            logFn(`${prefix} ${message}${metaStr}`);
        }
    }

    /**
     * Log de informação
     */
    info(engine: string, message: string, metadata?: any) {
        this.log('info', engine, message, metadata);
    }

    /**
     * Log de aviso
     */
    warn(engine: string, message: string, metadata?: any) {
        this.log('warn', engine, message, metadata);
    }

    /**
     * Log de erro
     */
    error(engine: string, message: string, metadata?: any) {
        this.log('error', engine, message, metadata);
    }

    /**
     * Log de debug
     */
    debug(engine: string, message: string, metadata?: any) {
        this.log('debug', engine, message, metadata);
    }

    /**
     * Recupera logs filtrados
     */
    getLogs(engine?: string, level?: LogLevel, limit?: number): LogEntry[] {
        let filtered = [...this.logs];

        if (engine) {
            filtered = filtered.filter(log => log.engine === engine);
        }

        if (level) {
            filtered = filtered.filter(log => log.level === level);
        }

        if (limit) {
            filtered = filtered.slice(-limit);
        }

        return filtered;
    }

    /**
     * Limpa todos os logs
     */
    clear() {
        this.logs = [];
    }

    /**
     * Habilita/desabilita output no console
     */
    setConsoleOutput(enabled: boolean) {
        this.enableConsole = enabled;
    }

    /**
     * Retorna estatísticas dos logs
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {} as Record<LogLevel, number>,
            byEngine: {} as Record<string, number>
        };

        this.logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            stats.byEngine[log.engine] = (stats.byEngine[log.engine] || 0) + 1;
        });

        return stats;
    }
}

// Singleton instance
export const logger = new AILogger();
