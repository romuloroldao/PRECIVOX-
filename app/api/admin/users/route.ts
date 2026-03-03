import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// CRÍTICO: Prisma requer runtime nodejs, não edge
export const runtime = 'nodejs';
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
    let user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    // Fallback: sessão NextAuth JWT
    if (!user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email && (session.user as { role?: string }).role === 'ADMIN') {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, email: true, role: true, nome: true },
        });
        if (dbUser) user = { id: dbUser.id, email: dbUser.email, role: dbUser.role as 'ADMIN' | 'GESTOR' | 'CLIENTE', nome: dbUser.nome };
      }
    }

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
    console.error('[API /admin/users GET] Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    // Erro de conexão com banco
    if (error instanceof Error && (
      error.message.includes('Can\'t reach database') ||
      error.message.includes('P1001') ||
      error.message.includes('connection')
    )) {
      return NextResponse.json(
        { error: 'Erro de conexão com banco de dados', code: 'DATABASE_ERROR' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });

    // Fallback: sessão NextAuth JWT
    if (!user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email && (session.user as { role?: string }).role === 'ADMIN') {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, email: true, role: true, nome: true },
        });
        if (dbUser) user = { id: dbUser.id, email: dbUser.email, role: dbUser.role as 'ADMIN' | 'GESTOR' | 'CLIENTE', nome: dbUser.nome };
      }
    }

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
