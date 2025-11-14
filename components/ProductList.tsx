'use client';

import { useLista } from '@/app/context/ListaContext';
import { Produto } from '@/app/hooks/useProdutos';
import { useToast } from '@/components/ToastContainer';
import { ShoppingCart } from 'lucide-react';

interface ProductListProps {
  produtos: Produto[];
}

export function ProductList({ produtos }: ProductListProps) {
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
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loja
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {produtos.map((produto) => (
              <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {produto.imagem ? (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-gray-400 text-xl">📦</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {produto.nome}
                      </div>
                      <div className="text-xs text-gray-500">
                        {produto.marca && `Marca: ${produto.marca}`}
                        {produto.marca && produto.categoria && ' • '}
                        {produto.categoria && `Categoria: ${produto.categoria}`}
                      </div>
                      {produto.emPromocao && (
                        <span className="mt-2 inline-block rounded-full bg-promo-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-promo-700">
                          Promoção
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {produto.unidade.mercado.nome}
                  </div>
                  <div className="text-xs text-gray-500">
                    {produto.unidade.nome}
                  </div>
                  <div className="text-xs text-gray-400">
                    {produto.unidade.cidade}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    {produto.emPromocao && produto.precoPromocional ? (
                      <>
                        <span className="text-lg font-bold text-success-600">
                          R$ {produto.precoPromocional.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {produto.disponivel ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-700">
                      Disponível
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Indisponível
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleAdicionar(produto)}
                    disabled={!produto.disponivel}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      produto.disponivel
                        ? 'bg-precivox-blue text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

