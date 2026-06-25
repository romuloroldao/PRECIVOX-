import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/api/auth/withAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/demo-requests
 * Lista solicitações de demonstração com filtros e paginação.
 */
export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.demoRequest.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limit,
    }),
    prisma.demoRequest.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/**
 * PATCH /api/admin/demo-requests
 * Atualiza status/notas de uma solicitação.
 */
export const PATCH = withAdmin(async (req) => {
  let body: { id?: string; status?: string; notas?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 });
  }

  const validStatuses = ['novo', 'contatado', 'agendado', 'concluido', 'descartado'];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ success: false, error: 'Status inválido' }, { status: 400 });
  }

  const updated = await prisma.demoRequest.update({
    where: { id: body.id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
});
