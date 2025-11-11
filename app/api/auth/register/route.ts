import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.senha, 12);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        nome: validatedData.nome,
        email: validatedData.email,
        senhaHash: hashedPassword,
        role: 'CLIENTE', // Novo usuário sempre começa como CLIENTE
        dataAtualizacao: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        imagem: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        usuario: newUser,
        redirectUrl: '/cliente/home',
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar cadastro. Tente novamente.' },
      { status: 500 }
    );
  }
}
