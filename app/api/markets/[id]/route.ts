// API Route: Detalhes, atualizar e deletar mercado específico
import { getServerSession } from 'next-auth';


import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

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

    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId },
      include: {
        unidades: {
          where: { ativa: true },
          orderBy: { dataCriacao: 'desc' }
        },
        planos_de_pagamento: true,
        users: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        _count: {
          select: {
            unidades: true,
            analises_ia: true,
            alertas_ia: true
          }
        }
      }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (userRole === 'GESTOR' && mercado.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mercado
    });

  } catch (error) {
    console.error('Erro ao buscar mercado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mercado' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (userRole === 'GESTOR' && mercado.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, cnpj, descricao, telefone, emailContato, horarioFuncionamento, logo, gestorId, planoId } = body;

    // Se estiver mudando o CNPJ, verificar se já existe
    if (cnpj && cnpj !== mercado.cnpj) {
      const cnpjExistente = await prisma.mercados.findUnique({
        where: { cnpj }
      });

      if (cnpjExistente) {
        return NextResponse.json(
          { success: false, error: 'CNPJ já cadastrado em outro mercado' },
          { status: 409 }
        );
      }
    }

    // Se gestorId foi fornecido, validar se é um gestor válido
    if (gestorId !== undefined) {
      // Apenas ADMIN pode alterar gestor
      if (userRole !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Apenas administradores podem alterar o gestor' },
          { status: 403 }
        );
      }

      // Se gestorId for null ou string vazia, remover gestor
      if (!gestorId || gestorId === '') {
        // Permitir remover gestor
      } else {
        // Validar se o gestor existe e tem role GESTOR
        const gestor = await prisma.usuarios.findUnique({
          where: { id: gestorId },
          select: { id: true, role: true }
        });

        if (!gestor) {
          return NextResponse.json(
            { success: false, error: 'Gestor não encontrado' },
            { status: 404 }
          );
        }

        if (gestor.role !== 'GESTOR') {
          return NextResponse.json(
            { success: false, error: 'Usuário selecionado não é um gestor' },
            { status: 400 }
          );
        }
      }
    }

    // Atualizar mercado
    const mercadoAtualizado = await prisma.mercados.update({
      where: { id: mercadoId },
      data: {
        ...(nome && { nome }),
        ...(cnpj && { cnpj }),
        ...(descricao !== undefined && { descricao }),
        ...(telefone !== undefined && { telefone }),
        ...(emailContato !== undefined && { emailContato }),
        ...(horarioFuncionamento !== undefined && { horarioFuncionamento }),
        ...(logo !== undefined && { logo }),
        ...(gestorId !== undefined && { gestorId: gestorId || null }),
        ...(planoId !== undefined && { planoId: planoId || null }),
        dataAtualizacao: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        planos_de_pagamento: true
      }
    });

    return NextResponse.json({
      success: true,
      data: mercadoAtualizado,
      message: 'Mercado atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar mercado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar mercado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Apenas ADMIN pode deletar mercados
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem deletar mercados' },
        { status: 403 }
      );
    }

    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.mercados.update({
      where: { id: mercadoId },
      data: {
        ativo: false,
        dataAtualizacao: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mercado desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar mercado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar mercado' },
      { status: 500 }
    );
  }
}
