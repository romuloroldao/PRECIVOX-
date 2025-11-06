import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import bcrypt from 'bcryptjs';

import { z } from 'zod';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


const createUserSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(['CLIENTE', 'GESTOR', 'ADMIN']),
});

export async function GET(request: NextRequest) {
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

    // Buscar parâmetro de filtro por role
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // Construir where clause
    const where: any = {};
    if (roleFilter) {
      where.role = roleFilter;
    }

    // IMPORTANTE: Se for buscar GESTOR, buscar da tabela users (para compatibilidade com mercados.gestorId)
    // Caso contrário, buscar da tabela usuarios (NextAuth)
    if (roleFilter === 'GESTOR') {
      const gestores = await prisma.users.findMany({
        where,
        orderBy: { dataCriacao: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          dataCriacao: true
        }
      });
      return NextResponse.json(gestores);
    }

    // Buscar usuários da tabela usuarios (NextAuth)
    const users = await prisma.usuarios.findMany({
      where,
      orderBy: { data_criacao: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true,
        ultimo_login: true
      }
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validar dados
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar se email já existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.senha, 12);

    // Criar usuário
    const newUser = await prisma.usuarios.create({
      data: {
        id: `user-${Date.now()}`,
        nome: validatedData.nome,
        email: validatedData.email,
        senha_hash: hashedPassword,
        role: validatedData.role,
        data_atualizacao: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        data_criacao: true
      }
    });

    return NextResponse.json({
      success: true,
      data: newUser
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
