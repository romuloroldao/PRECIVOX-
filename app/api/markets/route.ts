// API Route: Listar mercados do gestor logado
import { TokenManager } from '@/lib/token-manager';

import { prisma } from '@/lib/prisma';

import { NextRequest, NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


export async function GET(request: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: request.headers,
      cookies: request.cookies,
    });
    const authHeader = request.headers.get('authorization');

    const userRole = user?.role;
    const userId = user?.id;
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
    if (user && userRole === 'ADMIN') {
      return fetchAllActiveMarkets();
    }

    // GESTOR vê apenas seus mercados
    if (user && userRole === 'GESTOR' && userId) {
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
    if (authHeader || !user) {
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

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'GESTOR' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { nome, cnpj, descricao, telefone, emailContato, gestorId, planoId } = body;

    if (!nome || !cnpj) {
      return NextResponse.json(
        { error: 'Nome e CNPJ são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se CNPJ já existe
    const mercadoExistente = await prisma.mercados.findUnique({
      where: { cnpj }
    });

    if (mercadoExistente) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }

    let gestorIdValidado: string | null = null;
    
    // Se GESTOR está criando, usar seu próprio ID
    if (user.role === 'GESTOR') {
      gestorIdValidado = user.id;
    } else if (gestorId) {
      // ADMIN pode especificar um gestor diferente
      const gestor = await prisma.user.findUnique({
        where: { id: gestorId },
        select: { id: true, role: true }
      });

      if (!gestor || gestor.role !== 'GESTOR') {
        return NextResponse.json(
          { error: 'Gestor inválido' },
          { status: 400 }
        );
      }

      gestorIdValidado = gestor.id;
    }

    // Criar mercado
    const mercado = await prisma.mercados.create({
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: mercado
    }, { status: 201 });
  } catch (error) {
    console.error('[API /markets POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
