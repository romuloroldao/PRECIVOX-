import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withAdmin } from '@/lib/api/auth/withAdmin';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['CLIENTE', 'GESTOR', 'ADMIN']).optional(),
});

// GET - Buscar usuário por ID
export const GET = withAdmin(async (request, adminUser) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário não informado' },
        { status: 400 },
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        dataCriacao: true,
        dataAtualizacao: true,
        ultimoLogin: true,
        imagem: true,
        emailVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar usuário
export const PUT = withAdmin(async (request, adminUser) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário não informado' },
        { status: 400 },
      );
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Validar dados
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Se email foi alterado, verificar se já existe
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(validatedData.nome && { nome: validatedData.nome }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.role && { role: validatedData.role }),
        dataAtualizacao: new Date(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        dataCriacao: true,
        dataAtualizacao: true,
        ultimoLogin: true,
        imagem: true,
        emailVerified: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Excluir usuário
export const DELETE = withAdmin(async (request, adminUser) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário não informado' },
        { status: 400 },
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir excluir o próprio usuário
    if (user.id === adminUser.id) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      );
    }

    // Excluir usuário (isso também excluirá as sessões relacionadas devido ao cascade)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

