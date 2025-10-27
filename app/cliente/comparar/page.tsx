'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Product {
  id: string;
  nome: string;
  preco: number;
  mercado: string;
  imagem?: string;
  promoção?: boolean;
  economia?: number;
}

export default function CompararPrecosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Mock data para demonstração
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        nome: 'Arroz Branco Tipo 1 - 5kg',
        preco: 18.99,
        mercado: 'Mercado Central',
        promoção: true,
        economia: 3.40,
      },
      {
        id: '2',
        nome: 'Feijão Preto - 1kg',
        preco: 7.99,
        mercado: 'Super Mega',
        promoção: false,
      },
      {
        id: '3',
        nome: 'Óleo de Soja - 900ml',
        preco: 6.99,
        mercado: 'Atacadão',
        promoção: true,
        economia: 1.50,
      },
      {
        id: '4',
        nome: 'Açúcar Cristal - 1kg',
        preco: 4.99,
        mercado: 'Mercado Central',
        promoção: false,
      },
      {
        id: '5',
        nome: 'Café em Pó - 500g',
        preco: 16.99,
        mercado: 'Super Mega',
        promoção: true,
        economia: 2.85,
      },
    ];
    setProducts(mockProducts);
  }, []);

  const filteredProducts = products.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEconomia = products
    .filter(p => p.promoção)
    .reduce((sum, p) => sum + (p.economia || 0), 0);

  return (
    <DashboardLayout role="CLIENTE">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🔍 Comparar Preços</h1>
              <p className="text-lg opacity-90">
                Encontre os melhores preços em toda a cidade
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Economia Total</p>
              <p className="text-4xl font-bold">R$ {totalEconomia.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos (ex: Arroz, Feijão, Óleo...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Buscar
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Ordenar por: Menor Preço</option>
            <option>Ordenar por: Maior Preço</option>
            <option>Ordenar por: Maior Economia</option>
            <option>Ordenar por: Alfabética</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all transform hover:scale-105 ${
                product.promoção ? 'ring-2 ring-green-400' : ''
              }`}
            >
              {/* Promoção Badge */}
              {product.promoção && (
                <div className="bg-green-500 text-white px-4 py-2 text-center font-semibold">
                  🎉 Promoção!
                </div>
              )}

              {/* Product Image */}
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-6xl">🛒</div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {product.nome}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{product.mercado}</p>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-gray-900">
                    R$ {product.preco.toFixed(2)}
                  </span>
                  {product.promoção && (
                    <span className="text-sm text-gray-500 line-through">
                      R$ {(product.preco + (product.economia || 0)).toFixed(2)}
                    </span>
                  )}
                </div>

                {product.promoção && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-green-800">
                      💰 Economize R$ {product.economia?.toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Ver Detalhes
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    ❤️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600">
              Tente buscar por outros termos ou explore nossas categorias
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}