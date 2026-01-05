/**
 * Event Collector - Coleta eventos do usuário para análise de IA
 * 
 * Princípio: IA consome dados e eventos, não UI
 */

import { prisma } from '@/lib/prisma';
import { UserEvent, UserEventType } from './types';

export class EventCollector {
  /**
   * Registra um evento do usuário
   */
  static async recordEvent(
    userId: string,
    mercadoId: string,
    type: UserEventType,
    metadata: UserEvent['metadata'] = {}
  ): Promise<void> {
    try {
      // Armazenar evento no banco de dados
      await prisma.userEvent.create({
        data: {
          id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          userId,
          mercadoId,
          type,
          metadata: metadata as any,
          timestamp: new Date(),
        },
      });

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('[EventCollector] Evento registrado:', { userId, mercadoId, type, metadata });
      }
    } catch (error) {
      console.error('[EventCollector] Erro ao registrar evento:', error);
      // Não quebrar o fluxo se falhar - eventos são não-críticos
    }
  }

  /**
   * Registra múltiplos eventos em batch
   */
  static async recordEvents(events: Omit<UserEvent, 'id' | 'timestamp'>[]): Promise<void> {
    try {
      await prisma.userEvent.createMany({
        data: events.map(event => ({
          ...event,
          id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date(),
        })),
      });
    } catch (error) {
      console.error('[EventCollector] Erro ao registrar eventos em batch:', error);
    }
  }

  /**
   * Obtém eventos de um usuário em um período
   */
  static async getUserEvents(
    userId: string,
    mercadoId: string,
    inicio: Date,
    fim: Date
  ): Promise<UserEvent[]> {
    try {
      const events = await prisma.userEvent.findMany({
        where: {
          userId,
          mercadoId,
          timestamp: {
            gte: inicio,
            lte: fim,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return events.map(event => ({
        id: event.id,
        userId: event.userId,
        mercadoId: event.mercadoId,
        type: event.type as any,
        timestamp: event.timestamp,
        metadata: event.metadata as any,
      }));
    } catch (error) {
      console.error('[EventCollector] Erro ao buscar eventos:', error);
      return [];
    }
  }

  /**
   * Obtém eventos agregados de um mercado
   */
  static async getMarketEvents(
    mercadoId: string,
    inicio: Date,
    fim: Date,
    type?: UserEventType
  ): Promise<UserEvent[]> {
    try {
      const events = await prisma.userEvent.findMany({
        where: {
          mercadoId,
          timestamp: {
            gte: inicio,
            lte: fim,
          },
          ...(type && { type }),
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return events.map(event => ({
        id: event.id,
        userId: event.userId,
        mercadoId: event.mercadoId,
        type: event.type as any,
        timestamp: event.timestamp,
        metadata: event.metadata as any,
      }));
    } catch (error) {
      console.error('[EventCollector] Erro ao buscar eventos do mercado:', error);
      return [];
    }
  }
}

