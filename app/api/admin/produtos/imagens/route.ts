import { NextRequest, NextResponse } from 'next/server';
import type { ImagemStatus } from '@prisma/client';
import { withRole } from '@/lib/api/auth/withRole';
import { listarProdutosComImagens } from '@/lib/imagens/produto-imagem-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lista produtos com metadados de imagem para gestão admin. */
export const GET = withRole(['ADMIN', 'GESTOR'], async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') as ImagemStatus | null;
  const busca = searchParams.get('busca') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const result = await listarProdutosComImagens({
    status: status || undefined,
    busca,
    page,
    limit,
  });

  return NextResponse.json({
    success: true,
    data: result.items,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  });
});
