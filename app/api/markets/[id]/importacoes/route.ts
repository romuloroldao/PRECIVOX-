// API Route: Gerenciar importações de um mercado específico
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

    // Buscar importações do mercado
    const importacoes = await prisma.logs_importacao.findMany({
      where: {
        mercadoId
      },
      orderBy: { dataInicio: 'desc' },
      take: 50 // Limitar a 50 importações mais recentes
    });

    return NextResponse.json({
      success: true,
      data: importacoes
    });
  } catch (error) {
    console.error('Erro ao buscar importações:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar importações' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();
    const {
      nomeArquivo,
      tipoArquivo,
      tamanhoArquivo,
      dados
    } = body;

    // Validações
    if (!nomeArquivo || !dados) {
      return NextResponse.json(
        { success: false, error: 'Nome do arquivo e dados são obrigatórios' },
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

    // Criar importação
    const novaImportacao = await prisma.logs_importacao.create({
      data: {
        id: `importacao-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        mercadoId,
        nomeArquivo,
        tamanhoBytes: tamanhoArquivo || 0,
        status: 'PROCESSANDO',
        dataInicio: new Date(),
        linhasSucesso: 0,
        linhasErro: 0,
        linhasDuplicadas: 0,
        totalLinhas: Array.isArray(dados) ? dados.length : 0
      }
    });

    return NextResponse.json({
      success: true,
      data: novaImportacao,
      message: 'Importação iniciada com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar importação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar importação' },
      { status: 500 }
    );
  }
}
