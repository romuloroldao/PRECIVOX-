// API Route: Gerenciar unidades
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

    const { searchParams } = new URL(request.url);
    const mercadoId = searchParams.get('mercadoId');
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (!mercadoId) {
      return NextResponse.json(
        { success: false, error: 'mercadoId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar acesso ao mercado
    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    if (userRole === 'GESTOR' && mercado.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Buscar unidades
    const unidades = await prisma.unidades.findMany({
      where: {
        mercadoId,
        ativa: true
      },
      include: {
        _count: {
          select: {
            estoques: true,
            analises_ia: true,
            alertas_ia: true
          }
        }
      },
      orderBy: { dataCriacao: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: unidades
    });
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar unidades' },
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
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      mercadoId,
      nome,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      telefone,
      horarioFuncionamento
    } = body;

    // Validações
    if (!mercadoId || !nome) {
      return NextResponse.json(
        { success: false, error: 'mercadoId e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar acesso ao mercado
    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    if (userRole === 'GESTOR' && mercado.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Criar unidade
    const novaUnidade = await prisma.unidades.create({
      data: {
        id: `unidade-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        mercadoId,
        nome,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        telefone,
        horarioFuncionamento,
        ativa: true,
        dataAtualizacao: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: novaUnidade,
      message: 'Unidade criada com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar unidade:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar unidade' },
      { status: 500 }
    );
  }
}
