import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
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

export async function GET(req: NextRequest) {
  try {
    // Passar request para validar token do header Authorization
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: role ? { role: role as 'CLIENTE' | 'GESTOR' | 'ADMIN' } : undefined,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        dataCriacao: true,
        ultimoLogin: true
      },
      orderBy: { dataCriacao: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('[API /admin/users GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
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
    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome: validatedData.nome,
        email: validatedData.email,
        senhaHash: hashedPassword,
        role: validatedData.role,
        dataAtualizacao: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        dataCriacao: true
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

    console.error('[API /admin/users POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
