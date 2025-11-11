// API Route: Listar mercados do gestor logado
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
    const authHeader = request.headers.get('authorization');

    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const baseInclude = {
      gestor: {
        select: {
          id: true,
          nome: true,
          email: true
        }
      },
      planos_de_pagamento: {
        select: {
          id: true,
          nome: true,
          valor: true
        }
      },
      _count: {
        select: { unidades: true }
      }
    };

    const fetchAllActiveMarkets = async () => {
      const mercados = await prisma.mercados.findMany({
        where: { ativo: true },
        include: baseInclude,
        orderBy: { dataCriacao: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: mercados
      });
    };

    // ADMIN vê todos os mercados
    if (userRole === 'ADMIN') {
      return fetchAllActiveMarkets();
    }

    // GESTOR vê apenas seus mercados
    if (userRole === 'GESTOR' && userId) {
      const mercados = await prisma.mercados.findMany({
        where: {
          gestorId: userId,
          ativo: true
        },
        include: baseInclude,
        orderBy: { dataCriacao: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: mercados
      });
    }

    // Fallback: permitir leitura (somente mercados ativos) quando existir token legado
    // Acesso somente leitura para requisições sem sessão (ex: dashboards legados)
    if (authHeader || !session) {
      return fetchAllActiveMarkets();
    }

    // CLIENTE sem permissão explícita
    return NextResponse.json(
      { success: false, error: 'Acesso negado' },
      { status: 403 }
    );

  } catch (error) {
    console.error('Erro ao buscar mercados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mercados' },
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

    // Apenas ADMIN pode criar mercados
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem criar mercados' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, cnpj, descricao, telefone, emailContato, gestorId, planoId } = body;

    // Validações básicas
    if (!nome || !cnpj) {
      return NextResponse.json(
        { success: false, error: 'Nome e CNPJ são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se CNPJ já existe
    const mercadoExistente = await prisma.mercados.findUnique({
      where: { cnpj }
    });

    if (mercadoExistente) {
      return NextResponse.json(
        { success: false, error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }

    let gestorIdValidado: string | null = null;
    if (gestorId) {
      const gestor = await prisma.user.findUnique({
        where: { id: gestorId },
        select: { id: true, role: true }
      });

      if (!gestor) {
        return NextResponse.json(
          { success: false, error: 'Gestor informado não existe' },
          { status: 404 }
        );
      }

      if (gestor.role !== 'GESTOR') {
        return NextResponse.json(
          { success: false, error: 'Usuário informado não possui o papel de gestor' },
          { status: 400 }
        );
      }

      gestorIdValidado = gestor.id;
    }

    // Criar mercado
    const novoMercado = await prisma.mercados.create({
      data: {
        id: `mercado-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome,
        cnpj,
        descricao,
        telefone,
        emailContato,
        gestorId: gestorIdValidado,
        planoId: planoId || null,
        ativo: true,
        dataAtualizacao: new Date()
      },
      include: {
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        _count: {
          select: { unidades: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: novoMercado,
      message: 'Mercado criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar mercado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar mercado' },
      { status: 500 }
    );
  }
}
