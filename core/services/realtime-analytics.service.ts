/**
 * Realtime Analytics Service - Analytics em tempo real usando WebSockets
 */

import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../ai/utils/logger';
import { prisma } from '../ai/lib/prisma-compat';

export interface AnalyticsEvent {
    type: 'venda' | 'estoque' | 'preco' | 'alerta' | 'analise';
    mercadoId: string;
    unidadeId?: string;
    produtoId?: string;
    data: any;
    timestamp: Date;
}

export interface AnalyticsMetrics {
    mercadoId: string;
    unidadeId?: string;
    vendasHoje: number;
    faturamentoHoje: number;
    produtosVendidos: number;
    alertasAtivos: number;
    estoqueBaixo: number;
    ultimaAtualizacao: Date;
}

export class RealtimeAnalyticsService {
    private io: SocketIOServer | null = null;
    private connectedClients: Map<string, Set<string>> = new Map(); // mercadoId -> Set<socketId>
    private metricsCache: Map<string, AnalyticsMetrics> = new Map();
    private updateInterval: NodeJS.Timeout | null = null;

    /**
     * Inicializa o serviço com servidor Socket.IO
     */
    initialize(io: SocketIOServer): void {
        this.io = io;

        // Configurar eventos de conexão
        io.on('connection', (socket) => {
            logger.info('RealtimeAnalyticsService', 'Cliente conectado', {
                socketId: socket.id
            });

            // Cliente se inscreve em um mercado
            socket.on('subscribe:mercado', (mercadoId: string) => {
                if (!this.connectedClients.has(mercadoId)) {
                    this.connectedClients.set(mercadoId, new Set());
                }
                this.connectedClients.get(mercadoId)!.add(socket.id);
                socket.join(`mercado:${mercadoId}`);

                // Enviar métricas atuais
                const metrics = this.metricsCache.get(mercadoId);
                if (metrics) {
                    socket.emit('metrics:update', metrics);
                }

                logger.info('RealtimeAnalyticsService', 'Cliente inscrito em mercado', {
                    socketId: socket.id,
                    mercadoId
                });
            });

            // Cliente se desinscreve
            socket.on('unsubscribe:mercado', (mercadoId: string) => {
                this.connectedClients.get(mercadoId)?.delete(socket.id);
                socket.leave(`mercado:${mercadoId}`);
            });

            // Desconexão
            socket.on('disconnect', () => {
                logger.info('RealtimeAnalyticsService', 'Cliente desconectado', {
                    socketId: socket.id
                });
                // Limpar de todos os mercados
                this.connectedClients.forEach((clients) => {
                    clients.delete(socket.id);
                });
            });
        });

        // Iniciar atualização periódica de métricas
        this.startMetricsUpdate();
    }

    /**
     * Publica evento em tempo real
     */
    async publishEvent(event: AnalyticsEvent): Promise<void> {
        if (!this.io) {
            logger.warn('RealtimeAnalyticsService', 'Socket.IO não inicializado');
            return;
        }

        try {
            // Enviar para clientes do mercado
            this.io.to(`mercado:${event.mercadoId}`).emit('event', event);

            // Atualizar métricas em cache
            await this.updateMetrics(event.mercadoId, event.unidadeId);

            logger.debug('RealtimeAnalyticsService', 'Evento publicado', {
                type: event.type,
                mercadoId: event.mercadoId
            });
        } catch (error: any) {
            logger.error('RealtimeAnalyticsService', 'Erro ao publicar evento', {
                error: error.message
            });
        }
    }

    /**
     * Atualiza métricas de um mercado
     */
    private async updateMetrics(mercadoId: string, unidadeId?: string): Promise<void> {
        try {
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            // Buscar vendas do dia
            const vendas = await prisma.vendas.findMany({
                where: {
                    unidadeId: unidadeId || undefined,
                    unidades: {
                        mercadoId
                    },
                    dataVenda: {
                        gte: startOfDay
                    }
                },
                select: {
                    quantidade: true,
                    precoTotal: true,
                    produtoId: true
                }
            });

            const vendasHoje = vendas.length;
            const faturamentoHoje = vendas.reduce((sum, v) => sum + Number(v.precoTotal), 0);
            const produtosVendidos = new Set(vendas.map(v => v.produtoId)).size;

            // Buscar alertas ativos
            const alertasAtivos = await prisma.alertas_ia.count({
                where: {
                    mercadoId,
                    unidadeId: unidadeId || undefined,
                    lido: false,
                    expiradoEm: {
                        gte: now
                    }
                }
            });

            // Buscar produtos com estoque baixo
            const estoqueBaixo = await prisma.estoques.count({
                where: {
                    unidades: {
                        mercadoId,
                        id: unidadeId || undefined
                    },
                    quantidade: {
                        lte: 10 // Threshold configurável
                    },
                    disponivel: true
                }
            });

            const metrics: AnalyticsMetrics = {
                mercadoId,
                unidadeId,
                vendasHoje,
                faturamentoHoje,
                produtosVendidos,
                alertasAtivos,
                estoqueBaixo,
                ultimaAtualizacao: now
            };

            // Atualizar cache
            const cacheKey = unidadeId ? `${mercadoId}:${unidadeId}` : mercadoId;
            this.metricsCache.set(cacheKey, metrics);

            // Enviar para clientes
            if (this.io) {
                this.io.to(`mercado:${mercadoId}`).emit('metrics:update', metrics);
            }
        } catch (error: any) {
            logger.error('RealtimeAnalyticsService', 'Erro ao atualizar métricas', {
                mercadoId,
                error: error.message
            });
        }
    }

    /**
     * Inicia atualização periódica de métricas
     */
    private startMetricsUpdate(): void {
        // Atualizar métricas a cada 30 segundos
        this.updateInterval = setInterval(async () => {
            const mercadoIds = Array.from(this.connectedClients.keys());
            
            for (const mercadoId of mercadoIds) {
                await this.updateMetrics(mercadoId);
            }
        }, 30000); // 30 segundos
    }

    /**
     * Para o serviço
     */
    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Obtém métricas atuais de um mercado
     */
    async getMetrics(mercadoId: string, unidadeId?: string): Promise<AnalyticsMetrics | null> {
        const cacheKey = unidadeId ? `${mercadoId}:${unidadeId}` : mercadoId;
        const cached = this.metricsCache.get(cacheKey);

        if (cached) {
            return cached;
        }

        // Se não estiver em cache, atualizar
        await this.updateMetrics(mercadoId, unidadeId);
        return this.metricsCache.get(cacheKey) || null;
    }
}

