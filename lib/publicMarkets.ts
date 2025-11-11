import { prisma } from '@/lib/prisma';

export interface PublicMarketUnit {
  id: string;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  endereco?: string | null;
  ativa: boolean;
}

export interface PublicMarket {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  verificado?: boolean | null;
  cidade?: string | null;
  estado?: string | null;
  unidades: PublicMarketUnit[];
}

type GetPublicMarketsParams = {
  ativo?: string | null;
};

export async function getPublicMarkets(
  { ativo }: GetPublicMarketsParams = {}
): Promise<PublicMarket[]> {
  const onlyActive = ativo === 'true';

  const mercados = await prisma.mercados.findMany({
    where: onlyActive ? { ativo: true } : undefined,
    include: {
      unidades: {
        where: {
          ativa: true,
        },
        select: {
          id: true,
          nome: true,
          cidade: true,
          estado: true,
          endereco: true,
          ativa: true,
        },
      },
    },
    orderBy: {
      nome: 'asc',
    },
    take: 200,
  });

  return (mercados ?? []).map((mercado) => {
    const mercadoAny = mercado as any;

    return {
      id: mercado.id,
      nome:
        mercadoAny.nome ||
        mercadoAny.nomeFantasia ||
        mercadoAny.slug ||
        'Mercado sem nome',
      slug: mercadoAny.slug || mercado.id,
      ativo: mercadoAny.ativo ?? true,
      verificado: mercadoAny.verificado ?? null,
      cidade: mercadoAny.cidade ?? null,
      estado: mercadoAny.estado ?? null,
      unidades: (mercado.unidades ?? [])
        .filter((unidade) => Boolean(unidade && unidade.id))
        .map((unidade) => ({
          id: unidade!.id,
          nome: unidade!.nome || 'Unidade',
          cidade: unidade!.cidade ?? null,
          estado: unidade!.estado ?? null,
          endereco: unidade!.endereco ?? null,
          ativa: unidade!.ativa ?? false,
        })),
    };
  });
}

