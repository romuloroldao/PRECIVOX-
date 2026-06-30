// API Route: Gerenciar unidades
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sincronizarGeocodificacaoUnidade } from '@/lib/unidade-geocode';
import { requireApiUser } from '@/lib/gestor-api-mercado';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;

    const { searchParams } = request.nextUrl;
    const mercadoId = searchParams.get('mercadoId');

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

    if (user.role === 'CLIENTE') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    if (user.role === 'GESTOR' && mercado.gestorId !== user.id) {
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;

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

    if (user.role === 'CLIENTE') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    if (user.role === 'GESTOR' && mercado.gestorId !== user.id) {
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

    void sincronizarGeocodificacaoUnidade(novaUnidade.id).catch((err) =>
      console.warn('[unidades POST] geocodificação:', err)
    );

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
