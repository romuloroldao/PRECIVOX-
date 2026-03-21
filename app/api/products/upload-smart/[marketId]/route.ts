import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { prisma } from '@/lib/prisma';
import { processarUpload } from '@/lib/upload-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  try {
    const { marketId } = params;

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'Market ID ausente na rota.' },
        { status: 400 }
      );
    }

    const { user } = await requireAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado ou sem permissão' },
        { status: 401 }
      );
    }

    const allowedRoles = ['ADMIN', 'GESTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const mercado = await prisma.mercados.findUnique({
      where: { id: marketId },
      include: { unidades: { where: { ativa: true }, select: { id: true, nome: true } } },
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    if (user.role === 'GESTOR' && mercado.gestorId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado a este mercado' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const unidadeId = formData.get('unidadeId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não fornecido. Envie um arquivo no campo "file".' },
        { status: 400 }
      );
    }

    if (!unidadeId) {
      return NextResponse.json(
        { success: false, error: 'Selecione uma unidade de destino (unidadeId).' },
        { status: 400 }
      );
    }

    const unidadeValida = mercado.unidades.some(u => u.id === unidadeId);
    if (!unidadeValida) {
      return NextResponse.json(
        { success: false, error: 'Unidade não encontrada ou não pertence a este mercado.' },
        { status: 400 }
      );
    }

    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `Formato não suportado: ${ext}. Use CSV, XLSX ou JSON.` },
        { status: 400 }
      );
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo excede o limite de 50MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resultado = await processarUpload(
      buffer,
      file.name,
      file.size,
      marketId,
      unidadeId,
    );

    const mensagem = `Upload concluído: ${resultado.sucesso} produtos importados`
      + (resultado.erros > 0 ? `, ${resultado.erros} erros` : '')
      + (resultado.duplicados > 0 ? `, ${resultado.duplicados} atualizados` : '');

    return NextResponse.json({
      success: true,
      message: mensagem,
      data: {
        resultado: {
          totalLinhas: resultado.totalLinhas,
          sucesso: resultado.sucesso,
          erros: resultado.erros,
          duplicados: resultado.duplicados,
        },
        detalhesErros: resultado.detalhesErros.length > 0
          ? resultado.detalhesErros.slice(0, 20)
          : undefined,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[upload-smart] Erro:', message);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar upload', message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
