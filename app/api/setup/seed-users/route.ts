import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * POST /api/setup/seed-users
 *
 * Cria/atualiza usuários de teste (Admin, Gestor, Cliente) com e-mail verificado.
 * Só funciona se SEED_SECRET estiver definido e o request enviar o mesmo valor.
 *
 * Uso em produção (https://precivox.com.br):
 * 1. Defina no servidor: SEED_SECRET=uma_senha_forte_secreta
 * 2. Chame uma vez (browser ou curl):
 *    https://precivox.com.br/api/setup/seed-users
 *    Body (JSON): { "secret": "uma_senha_forte_secreta" }
 *    ou Header: X-Seed-Secret: uma_senha_forte_secreta
 */
const USERS = [
  { email: 'admin@precivox.com', nome: 'Administrador', role: 'ADMIN' as const },
  { email: 'gestor@precivox.com', nome: 'Gestor', role: 'GESTOR' as const },
  { email: 'cliente@precivox.com', nome: 'Cliente', role: 'CLIENTE' as const },
];
const PASSWORD = 'senha123';

function getSecret(req: NextRequest): string | null {
  const header = req.headers.get('x-seed-secret');
  if (header) return header;
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('secret');
    if (q) return q;
  } catch {
    // ignore
  }
  return null;
}

export async function GET(request: NextRequest) {
  const secret = getSecret(request);
  const expected = process.env.SEED_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado. Defina SEED_SECRET no servidor e envie o mesmo valor.' },
      { status: 401 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(PASSWORD, 12);
    const now = new Date();
    const results: string[] = [];

    for (const u of USERS) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        await prisma.user.update({
          where: { email: u.email },
          data: {
            nome: u.nome,
            role: u.role,
            senhaHash: hashedPassword,
            emailVerified: now,
            dataAtualizacao: now,
          },
        });
        results.push(`Atualizado: ${u.email} (${u.role})`);
      } else {
        await prisma.user.create({
          data: {
            id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            email: u.email,
            nome: u.nome,
            role: u.role,
            senhaHash: hashedPassword,
            emailVerified: now,
            dataCriacao: now,
            dataAtualizacao: now,
          },
        });
        results.push(`Criado: ${u.email} (${u.role})`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuários de teste criados/atualizados com e-mail verificado.',
      results,
      credentials: {
        admin: 'admin@precivox.com / senha123',
        gestor: 'gestor@precivox.com / senha123',
        cliente: 'cliente@precivox.com / senha123',
      },
    });
  } catch (error) {
    console.error('[seed-users] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuários. Verifique os logs do servidor.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let secret = getSecret(request);
  if (!secret) {
    try {
      const body = await request.json();
      secret = typeof body?.secret === 'string' ? body.secret : null;
    } catch {
      // ignore
    }
  }

  const expected = process.env.SEED_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado. Envie { "secret": "valor do SEED_SECRET" } no body ou header X-Seed-Secret.' },
      { status: 401 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(PASSWORD, 12);
    const now = new Date();
    const results: string[] = [];

    for (const u of USERS) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        await prisma.user.update({
          where: { email: u.email },
          data: {
            nome: u.nome,
            role: u.role,
            senhaHash: hashedPassword,
            emailVerified: now,
            dataAtualizacao: now,
          },
        });
        results.push(`Atualizado: ${u.email} (${u.role})`);
      } else {
        await prisma.user.create({
          data: {
            id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            email: u.email,
            nome: u.nome,
            role: u.role,
            senhaHash: hashedPassword,
            emailVerified: now,
            dataCriacao: now,
            dataAtualizacao: now,
          },
        });
        results.push(`Criado: ${u.email} (${u.role})`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuários de teste criados/atualizados com e-mail verificado.',
      results,
      credentials: {
        admin: 'admin@precivox.com / senha123',
        gestor: 'gestor@precivox.com / senha123',
        cliente: 'cliente@precivox.com / senha123',
      },
    });
  } catch (error) {
    console.error('[seed-users] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuários. Verifique os logs do servidor.' },
      { status: 500 }
    );
  }
}
