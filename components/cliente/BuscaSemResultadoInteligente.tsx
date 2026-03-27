'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProductCard } from '@/components/ProductCard';
import type { Produto } from '@/app/hooks/useProdutos';
import { PackagePlus, Sparkles } from 'lucide-react';

function mapLinhaApi(item: Record<string, unknown>): Produto {
  const u = item.unidade as Produto['unidade'];
  return {
    id: `${item.id}-${u?.id || ''}`,
    estoqueId: String(item.id),
    nome: String(item.nome ?? ''),
    preco: Number(item.preco) || 0,
    precoPromocional: item.precoPromocional ? Number(item.precoPromocional) : undefined,
    emPromocao: Boolean(item.emPromocao),
    disponivel: item.disponivel !== false,
    quantidade: Number(item.quantidade) || 0,
    categoria: String(item.categoria ?? ''),
    marca: String(item.marca ?? ''),
    imagem: (item.imagem as string) || undefined,
    produtoCatalogoId: (item.produto as { id?: string })?.id,
    produto: item.produto as Produto['produto'],
    unidade: u,
  };
}

type Props = {
  busca: string;
  mercadoId: string | null;
  onEquivalenteAdicionado?: () => void;
};

export function BuscaSemResultadoInteligente({ busca, mercadoId, onEquivalenteAdicionado }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [equivalentes, setEquivalentes] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mercadoId || busca.trim().length < 2) {
      setEquivalentes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const q = new URLSearchParams({ mercadoId, busca: busca.trim() });
        const res = await fetch(`/api/cliente/sugestoes-lista?${q.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.equivalentes)) {
          setEquivalentes((data.equivalentes as Record<string, unknown>[]).map(mapLinhaApi));
        }
      } catch {
        if (!cancelled) setEquivalentes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [busca, mercadoId]);

  const pedidoTexto = `Solicitação de produto no catálogo: "${busca.trim()}"`;

  const copyPedido = () => {
    void navigator.clipboard.writeText(pedidoTexto);
  };

  return (
    <div className="space-y-6 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-6 text-left shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Não encontramos exatamente isso</h2>
        <p className="mt-1 text-sm text-gray-600">
          Você pode pedir para o item entrar no mix do seu mercado ou ver sugestões parecidas abaixo.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            copyPedido();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('precivox-nps-prompt', {
                  detail: { gatilho: 'busca_sem_resultado', delayMs: 3500, mercadoId },
                })
              );
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-precivox-blue px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <PackagePlus className="h-5 w-5 shrink-0" />
          Peça para entrar no seu mercado
        </button>
        <p className="text-xs text-gray-500 sm:self-center">
          Copiamos um texto para você colar no WhatsApp ou enviar ao gestor.
        </p>
      </div>

      {role === 'GESTOR' || role === 'ADMIN' ? (
        <Link
          href="/gestor/produtos"
          className="inline-flex text-sm font-semibold text-precivox-blue underline-offset-2 hover:underline"
        >
          Abrir cadastro de produtos (gestor)
        </Link>
      ) : null}

      <div>
        <div className="mb-3 flex items-center gap-2 text-emerald-900">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold">Talvez seja o mesmo produto (nome parecido)</span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Buscando sugestões…</p>
        ) : equivalentes.length === 0 ? (
          <p className="text-sm text-gray-600">
            Nenhum equivalente automático por enquanto. Tente outras palavras ou marcas.
          </p>
        ) : (
          <ProductCard produtos={equivalentes} onAdicionar={() => onEquivalenteAdicionado?.()} />
        )}
      </div>
    </div>
  );
}
