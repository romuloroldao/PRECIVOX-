// API Route: Listar mercados do gestor logado
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    // ADMIN vê todos os mercados
    if (userRole === 'ADMIN') {
      const mercados = await prisma.mercados.findMany({
        where: { ativo: true },
        include: {
          _count: {
            select: { unidades: true }
          }
        },
        orderBy: { dataCriacao: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: mercados
      });
    }

    // GESTOR vê apenas seus mercados
    if (userRole === 'GESTOR') {
      const mercados = await prisma.mercados.findMany({
        where: {
          gestorId: userId,
          ativo: true
        },
        include: {
          _count: {
            select: { unidades: true }
          }
        },
        orderBy: { dataCriacao: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: mercados
      });
    }

    // CLIENTE não tem acesso
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

    // Criar mercado
    const novoMercado = await prisma.mercados.create({
      data: {
        id: `mercado-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome,
        cnpj,
        descricao,
        telefone,
        emailContato,
        gestorId: gestorId || null,
        planoId: planoId || null,
        ativo: true,
        dataAtualizacao: new Date()
      },
      include: {
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






