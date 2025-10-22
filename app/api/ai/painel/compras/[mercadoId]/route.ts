// API Route: Módulo de Compras e Reposição Inteligente
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { mercadoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const mercadoId = params.mercadoId;
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Verificar acesso ao mercado
    const mercado = await prisma.mercados.findUnique({
      where: { id: mercadoId }
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    if (userRole === 'GESTOR' && mercado.gestorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Buscar produtos em risco de ruptura
    // TODO: Implementar lógica de IA para calcular demanda prevista e dias restantes
    // Por enquanto, usando SQL para buscar produtos com estoque baixo

    const produtosEmRuptura = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.nome,
        u.nome as unidade,
        e.quantidade as estoqueAtual,
        COALESCE(p.demandaPrevista7d, 10) as demandaSemanal,
        COALESCE(p.pontoReposicao, 20) as pontoReposicao,
        CASE 
          WHEN COALESCE(p.demandaPrevista7d, 0) > 0 
          THEN CAST(e.quantidade AS FLOAT) / (CAST(p.demandaPrevista7d AS FLOAT) / 7.0)
          ELSE 7
        END as diasRestantes,
        CASE 
          WHEN COALESCE(p.demandaPrevista7d, 0) > 0 
          THEN GREATEST(COALESCE(p.pontoReposicao, 20) - e.quantidade, 0)
          ELSE 0
        END as quantidadeRepor
      FROM estoques e
      INNER JOIN produtos p ON e."produtoId" = p.id
      INNER JOIN unidades u ON e."unidadeId" = u.id
      WHERE u."mercadoId" = ${mercadoId}
        AND u.ativa = true
        AND p.ativo = true
        AND e.quantidade < COALESCE(p."pontoReposicao", 20)
      ORDER BY diasRestantes ASC
      LIMIT 10
    `;

    // Processar dados para o formato esperado pelo frontend
    const produtosProcessados = produtosEmRuptura.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      unidade: produto.unidade,
      estoqueAtual: produto.estoqueAtual,
      demandaDiaria: Number((produto.demandaSemanal / 7).toFixed(1)),
      diasRestantes: Number(produto.diasRestantes.toFixed(1)),
      quantidadeRepor: Math.ceil(produto.quantidadeRepor),
      prioridade: produto.diasRestantes < 1 ? 'CRITICA' : produto.diasRestantes < 3 ? 'ALTA' : 'MEDIA'
    }));

    return NextResponse.json({
      success: true,
      data: {
        produtosEmRuptura: produtosProcessados,
        resumo: {
          totalProdutos: produtosProcessados.length,
          criticos: produtosProcessados.filter((p) => p.prioridade === 'CRITICA').length,
          altos: produtosProcessados.filter((p) => p.prioridade === 'ALTA').length
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de compras:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de compras' },
      { status: 500 }
    );
  }
}






