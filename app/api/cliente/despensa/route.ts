import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { calcularDespensaDigital, parseDespensaManual, type DespensaManualEntry } from '@/lib/despensa-digital';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });
    const manual = parseDespensaManual(dbUser?.perfilPreci);
    const despensa = await calcularDespensaDigital(user.id, mercadoId, manual);

    return NextResponse.json({
      success: true,
      data: {
        ...despensa,
        manual,
      },
    });
  } catch (e) {
    console.error('[despensa GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const acao = body.acao as 'adicionar' | 'remover' | 'substituir' | undefined;
    const entrada = body.entrada as Partial<DespensaManualEntry> | undefined;
    const produtoId = body.produtoId as string | undefined;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });
    const base =
      dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
        ? (dbUser.perfilPreci as Record<string, unknown>)
        : {};

    let manual = parseDespensaManual(base);

    if (acao === 'substituir' && Array.isArray(body.itens)) {
      manual = (body.itens as DespensaManualEntry[]).slice(0, 40).map((i) => ({
        produtoId: String(i.produtoId),
        nome: String(i.nome || 'Produto').slice(0, 120),
        cicloDias: Math.min(60, Math.max(3, Math.round(Number(i.cicloDias) || 14))),
        adicionadoEm: i.adicionadoEm || new Date().toISOString(),
      }));
    } else if (acao === 'adicionar' && entrada?.produtoId) {
      const ciclo = Math.min(60, Math.max(3, Math.round(Number(entrada.cicloDias) || 14)));
      manual = manual.filter((m) => m.produtoId !== entrada.produtoId);
      manual.push({
        produtoId: entrada.produtoId,
        nome: String(entrada.nome || 'Produto').slice(0, 120),
        cicloDias: ciclo,
        adicionadoEm: new Date().toISOString(),
      });
      manual = manual.slice(-40);
    } else if (acao === 'remover' && produtoId) {
      manual = manual.filter((m) => m.produtoId !== produtoId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Informe acao (adicionar|remover|substituir) e dados válidos' },
        { status: 400 }
      );
    }

    base.despensaManual = manual;
    base.atualizadoEm = new Date().toISOString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        perfilPreci: base as Prisma.InputJsonValue,
        dataAtualizacao: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: { manual } });
  } catch (e) {
    console.error('[despensa PATCH]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
