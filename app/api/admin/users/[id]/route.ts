import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['CLIENTE', 'GESTOR', 'ADMIN']).optional(),
});

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação via NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado - Apenas administradores' },
        { status: 403 }
      );
    }

    // Buscar usuário
    const user = await prisma.usuarios.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true,
        data_atualizacao: true,
        ultimo_login: true,
        imagem: true,
        email_verified: true,
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
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação via NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado - Apenas administradores' },
        { status: 403 }
      );
    }

    // Verificar se usuário existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { id: params.id }
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
      const emailExists = await prisma.usuarios.findUnique({
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
    const updatedUser = await prisma.usuarios.update({
      where: { id: params.id },
      data: {
        ...(validatedData.nome && { nome: validatedData.nome }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.role && { role: validatedData.role }),
        data_atualizacao: new Date(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true,
        data_atualizacao: true,
        ultimo_login: true,
        imagem: true,
        email_verified: true,
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
}

// DELETE - Excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação via NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado - Apenas administradores' },
        { status: 403 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.usuarios.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir excluir o próprio usuário
    if (user.id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      );
    }

    // Excluir usuário (isso também excluirá as sessões relacionadas devido ao cascade)
    await prisma.usuarios.delete({
      where: { id: params.id }
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
}
