// API Route: Planos de Pagamento
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const planos = await prisma.planos_de_pagamento.findMany({
      where: { ativo: true },
      orderBy: { valor: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: planos
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;

    // Apenas ADMIN pode criar planos
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem criar planos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, descricao, valor, duracao, limiteUnidades, limiteUploadMb, limiteUsuarios } = body;

    // Validações básicas
    if (!nome || !valor || !duracao) {
      return NextResponse.json(
        { success: false, error: 'Nome, valor e duração são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar plano
    const novoPlano = await prisma.planos_de_pagamento.create({
      data: {
        id: `plano-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome,
        descricao: descricao || null,
        valor: parseFloat(valor),
        duracao: parseInt(duracao),
        limiteUnidades: limiteUnidades ? parseInt(limiteUnidades) : 1,
        limiteUploadMb: limiteUploadMb ? parseInt(limiteUploadMb) : 10,
        limiteUsuarios: limiteUsuarios ? parseInt(limiteUsuarios) : 5,
        ativo: true,
        dataCriacao: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: novoPlano,
      message: 'Plano criado com sucesso'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar plano', details: error.message },
      { status: 500 }
    );
  }
}
