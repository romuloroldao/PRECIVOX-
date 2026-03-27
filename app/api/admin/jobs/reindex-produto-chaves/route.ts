import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeCamposChaveProduto } from '@/lib/produtos-chaves';
import { withAdmin } from '@/lib/api/auth/withAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Recalcula nome_chave e chave_insight para todos os produtos (admin). */
export const POST = withAdmin(async (_req: NextRequest) => {
  const rows = await prisma.produtos.findMany({
    select: {
      id: true,
      nome: true,
      codigoBarras: true,
      marca: true,
      categoria: true,
    },
  });

  let atualizados = 0;
  for (const p of rows) {
    const chaves = computeCamposChaveProduto({
      nome: p.nome,
      codigoBarras: p.codigoBarras,
      marca: p.marca,
      categoria: p.categoria,
    });
    await prisma.produtos.update({
      where: { id: p.id },
      data: {
        nomeChave: chaves.nomeChave,
        chaveInsight: chaves.chaveInsight,
        dataAtualizacao: new Date(),
      },
    });
    atualizados++;
  }

  return NextResponse.json({ success: true, atualizados });
});
