// API Route: Planos de Pagamento
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiSession(request);
    if (isAuthResponse(auth)) return auth;

    const planos = await prisma.planos_de_pagamento.findMany({
      where: { ativo: true },
      orderBy: { valor: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: planos,
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiSession(request, { roles: ['ADMIN'] });
    if (isAuthResponse(auth)) return auth;

    const body = await request.json();
    const { nome, descricao, valor, duracao, limiteUnidades, limiteUploadMb, limiteUsuarios } = body;

    if (!nome || !valor || !duracao) {
      return NextResponse.json(
        { success: false, error: 'Nome, valor e duração são obrigatórios' },
        { status: 400 }
      );
    }

    const novoPlano = await prisma.planos_de_pagamento.create({
      data: {
        id: `plano-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome,
        descricao: descricao || null,
        valor: parseFloat(valor),
        duracao: parseInt(duracao, 10),
        limiteUnidades: limiteUnidades ? parseInt(limiteUnidades, 10) : 1,
        limiteUploadMb: limiteUploadMb ? parseInt(limiteUploadMb, 10) : 10,
        limiteUsuarios: limiteUsuarios ? parseInt(limiteUsuarios, 10) : 5,
        ativo: true,
        dataCriacao: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: novoPlano,
        message: 'Plano criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Erro ao criar plano:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, error: 'Erro ao criar plano', details: message },
      { status: 500 }
    );
  }
}
