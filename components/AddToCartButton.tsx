'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
  mercadoId?: string;
  mercadoName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente de botão "Adicionar ao Carrinho" com autenticação sob demanda
 * 
 * Comportamento:
 * - Se usuário não autenticado: mostra modal/redireciona para login
 * - Se usuário autenticado: adiciona produto ao carrinho
 */
export default function AddToCartButton({
  productId,
  productName,
  price,
  mercadoId,
  mercadoName,
  className = '',
  variant = 'default',
  size = 'md',
}: AddToCartButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = async () => {
    // Verificar autenticação
    if (status === 'loading') {
      return; // Aguardar carregamento
    }

    if (status === 'unauthenticated' || !session) {
      // Usuário não autenticado: solicitar login
      setShowLoginPrompt(true);
      
      // Opção 1: Redirecionar para login com callback
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${callbackUrl}&action=addToCart`);
      
      // Opção 2: Mostrar modal (descomente se preferir modal)
      // setShowLoginPrompt(true);
      return;
    }

    // Usuário autenticado: adicionar ao carrinho
    await addToCart();
  };

  const addToCart = async () => {
    try {
      setIsLoading(true);

      // Chamar API para adicionar ao carrinho
      const response = await fetch('/api/lists/add-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          productName,
          price,
          mercadoId,
          mercadoName,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar ao carrinho');
      }

      // Sucesso: mostrar feedback
      // Você pode usar um toast aqui
      alert(`${productName} adicionado ao carrinho!`);
      
      // Opcional: redirecionar para carrinho
      // router.push('/cliente/listas');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      alert('Erro ao adicionar produto ao carrinho. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Estilos baseados em variant e size
  const baseStyles = 'flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        aria-label={`Adicionar ${productName} ao carrinho`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Adicionando...</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>Adicionar ao Carrinho</span>
          </>
        )}
      </button>

      {/* Modal de login (opcional - descomente se preferir modal em vez de redirect) */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Login Necessário</h3>
            <p className="text-gray-600 mb-6">
              Para adicionar produtos ao carrinho, você precisa estar logado.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  router.push('/login');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fazer Login
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

