// API Route: Gerenciar unidades de um mercado específico
import { getServerSession } from 'next-auth';


import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/prisma';
import { sincronizarGeocodificacaoUnidade } from '@/lib/unidade-geocode';

import { NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const mercadoId = params.id;
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Iniciando criação de unidade...');
    
    const mercadoId = params.id;
    console.log('📋 Mercado ID:', mercadoId);

    const body = await request.json();
    console.log('📝 Dados recebidos:', body);
    
    const {
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
    if (!nome) {
      console.log('❌ Nome é obrigatório');
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se mercado existe
    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      console.log('❌ Mercado não encontrado:', mercadoId);
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Mercado encontrado:', mercado.nome);

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

    console.log('✅ Unidade criada com sucesso:', novaUnidade.id);

    void sincronizarGeocodificacaoUnidade(novaUnidade.id).catch((err) =>
      console.warn('[markets/unidades POST] geocodificação:', err)
    );

    return NextResponse.json({
      success: true,
      data: novaUnidade,
      message: 'Unidade criada com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar unidade:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar unidade',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
