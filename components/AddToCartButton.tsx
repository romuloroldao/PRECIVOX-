'use client';

import { useState } from 'react';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import { useLista } from '@/app/context/ListaContext';
import { useToast } from '@/components/ToastContainer';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
  mercadoId?: string;
  mercadoName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  estoqueId?: string;
  imagem?: string;
  categoria?: string;
  marca?: string;
  unidadeId?: string;
  unidadeNome?: string;
}

export default function AddToCartButton({
  productId,
  productName,
  price,
  mercadoId = '',
  mercadoName = '',
  className = '',
  variant = 'default',
  size = 'md',
  estoqueId,
  imagem,
  categoria,
  marca,
  unidadeId = '',
  unidadeNome = '',
}: AddToCartButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { adicionarItem } = useLista();
  const { listaAdicionado } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [adicionado, setAdicionado] = useState(false);

  const handleClick = async () => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${callbackUrl}&action=addToCart`);
      return;
    }

    setIsLoading(true);
    try {
      adicionarItem({
        id: productId,
        estoqueId: estoqueId ?? productId,
        nome: productName,
        preco: price,
        emPromocao: false,
        quantidade: 1,
        imagem,
        categoria,
        marca,
        unidade: {
          id: unidadeId,
          nome: unidadeNome,
          mercado: { id: mercadoId, nome: mercadoName },
        },
      });
      const nomeCurto = productName.length > 40 ? productName.slice(0, 38) + '…' : productName;
      listaAdicionado(`${nomeCurto} adicionado`);
      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 2000);
    } catch {
      listaAdicionado('Erro ao adicionar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyles =
    'flex items-center justify-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantStyles = {
    default: adicionado
      ? 'bg-emerald-600 text-white'
      : 'bg-precivox-blue text-white hover:bg-blue-700',
    outline: adicionado
      ? 'border-2 border-emerald-500 text-emerald-600 bg-emerald-50'
      : 'border-2 border-precivox-blue text-precivox-blue hover:bg-blue-50',
    ghost: adicionado
      ? 'text-emerald-600 bg-emerald-50'
      : 'text-precivox-blue hover:bg-blue-50',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={`Adicionar ${productName} à lista`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Adicionando…</span>
        </>
      ) : adicionado ? (
        <>
          <Check className="w-4 h-4" />
          <span>Adicionado!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          <span>Adicionar à lista</span>
        </>
      )}
    </button>
  );
}
