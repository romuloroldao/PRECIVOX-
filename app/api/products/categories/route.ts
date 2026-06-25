import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripDiacritics } from '@/lib/produtos-nome-normalize';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/** Chave para agrupar grafias equivalentes ("Graos" ≈ "Grãos"). */
function chaveCategoria(nome: string): string {
  return stripDiacritics(nome).toLowerCase().replace(/\s+/g, ' ').trim();
}

function tituloCase(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

const temAcento = (s: string) => /[\u00C0-\u024F]/.test(s);

interface GrupoCategoria {
  variantes: string[];
  count: number;
}

/**
 * GET /api/products/categories
 * Retorna categorias com grafias equivalentes mescladas, rótulo limpo e
 * ordenadas por volume de produtos (mais relevantes primeiro).
 */
export async function GET(_request: NextRequest) {
  try {
    // Uma única query: grupos + contagem por categoria.
    const categoriasRaw = await prisma.produtos.groupBy({
      by: ['categoria'],
      where: {
        ativo: true,
        categoria: { not: null },
      },
      _count: { _all: true },
    });

    // Mesclar grafias equivalentes (acentos/caixa) somando contagens.
    const grupos = new Map<string, GrupoCategoria>();
    for (const item of categoriasRaw) {
      const nome = item.categoria?.trim();
      if (!nome) continue;
      const count = item._count?._all ?? 0;
      if (count <= 0) continue;

      const chave = chaveCategoria(nome);
      const grupo = grupos.get(chave) ?? { variantes: [], count: 0 };
      grupo.variantes.push(nome);
      grupo.count += count;
      grupos.set(chave, grupo);
    }

    const categoriasComContagem = Array.from(grupos.values())
      .map((grupo) => {
        // Rótulo: preferir variante acentuada e de maior volume.
        const rotuloBase = [...grupo.variantes].sort((a, b) => {
          const acentoDiff = Number(temAcento(b)) - Number(temAcento(a));
          if (acentoDiff !== 0) return acentoDiff;
          return b.length - a.length;
        })[0];

        return {
          nome: tituloCase(rotuloBase),
          // Todas as grafias reais — o filtro de busca aceita lista separada por vírgula.
          valor: grupo.variantes.join(','),
          count: grupo.count,
        };
      })
      .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, 'pt-BR'));

    return NextResponse.json({
      success: true,
      data: categoriasComContagem,
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar categorias:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar categorias',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
