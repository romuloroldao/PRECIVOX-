/**
 * POST /api/savings/record
 * 
 * SQUAD B - Backend
 * 
 * Registra economia real do usuário
 * Chamado quando usuário compra produto com preço melhor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoUnlockBadgesServer } from '@/lib/gamification-server';
import { invalidate } from '@/lib/redis';
import { notifySavingsAlert } from '@/lib/notifications';
import { isAuthResponse, requireApiSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await requireApiSession(request);
  if (isAuthResponse(session)) return session;

  const userId = session.id;

  try {
    const body = await request.json();
    const { listId, productId, pricePaid, avgPrice } = body;

    // Validação
    if (!pricePaid || !avgPrice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'pricePaid e avgPrice são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Calcular economia
    const savings = Math.max(0, avgPrice - pricePaid); // Não permitir economia negativa

    // Salvar no histórico
    const savingsRecord = await prisma.savingsHistory.create({
      data: {
        userId,
        listId: listId || null,
        productId: productId || null,
        pricePaid,
        avgPrice,
        savings,
      },
    });

    // Desbloquear badges de economia
    try {
      await autoUnlockBadgesServer(userId, 'savings_added', savings);
      // Invalidar cache de badges
      await invalidate(`badges:${userId}`);
    } catch (error) {
      console.error('Error unlocking badges:', error);
      // Continuar mesmo se gamificação falhar
    }

    // Invalidar cache de stats globais
    try {
      await invalidate('stats:global');
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }

    // Enviar notificação de economia (se economia significativa)
    if (savings >= 500) { // R$ 5,00 ou mais
      try {
        const product = productId
          ? await prisma.produtos.findUnique({
              where: { id: productId },
              select: { nome: true },
            })
          : null;

        await notifySavingsAlert(
          userId,
          product?.nome || 'Produto',
          savings
        );
      } catch (error) {
        console.error('Error sending savings notification:', error);
        // Continuar mesmo se notificação falhar
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savingsRecord.id,
        savings,
        date: savingsRecord.date.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error recording savings:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erro ao registrar economia',
      },
      { status: 500 }
    );
  }
}

