'use client';

import { useLista } from '@/app/context/ListaContext';
import { Produto } from '@/app/hooks/useProdutos';
import { useToast } from '@/components/ToastContainer';
import { ShoppingCart } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface ProductCardProps {
  produtos: Produto[];
}

export function ProductCard({ produtos }: ProductCardProps) {
  const { adicionarItem } = useLista();
  const { success } = useToast();

  const handleAdicionar = (produto: Produto) => {
    adicionarItem({
      id: produto.id,
      estoqueId: produto.estoqueId,
      nome: produto.nome,
      preco: produto.preco,
      precoPromocional: produto.precoPromocional,
      emPromocao: produto.emPromocao,
      quantidade: produto.quantidade,
      imagem: produto.imagem,
      categoria: produto.categoria,
      marca: produto.marca,
      unidade: produto.unidade,
    });
    success(`${produto.nome} adicionado à lista!`);
  };

  if (produtos.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-text-secondary text-base md:text-lg">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {produtos.map((produto) => (
        <Card
          key={produto.id}
          variant="elevated"
          hover
          className="overflow-hidden"
        >
          {/* Imagem do produto */}
          <div className="relative h-48 bg-gray-100 flex items-center justify-center">
            {produto.imagem ? (
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-4xl">📦</div>
            )}
            {produto.emPromocao && (
              <div className="absolute top-2 right-2 rounded-full bg-promo-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                Promoção
              </div>
            )}
          </div>

          {/* Conteúdo do card */}
          <div className="p-4 md:p-6">
            <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 text-sm md:text-base">
              {produto.nome}
            </h3>

            <div className="mb-3">
              {produto.marca && (
                <p className="text-xs text-text-secondary mb-1">Marca: {produto.marca}</p>
              )}
              {produto.categoria && (
                <p className="text-xs text-text-secondary">Categoria: {produto.categoria}</p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                {produto.emPromocao && produto.precoPromocional ? (
                  <>
                    <span className="text-xl md:text-2xl font-bold text-success-600">
                      R$ {produto.precoPromocional.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-text-tertiary line-through">
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                ) : (
                  <span className="text-xl md:text-2xl font-bold text-text-primary">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Loja:</span> {produto.unidade.mercado.nome}
              </p>
              <p className="text-xs text-text-tertiary">
                {produto.unidade.nome} - {produto.unidade.cidade}
              </p>
            </div>

            <Button
              variant={produto.disponivel ? 'primary' : 'ghost'}
              size="md"
              icon={ShoppingCart}
              onClick={() => handleAdicionar(produto)}
              disabled={!produto.disponivel}
              className="w-full"
            >
              {produto.disponivel ? 'Adicionar à lista' : 'Indisponível'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

