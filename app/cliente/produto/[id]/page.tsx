'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, MapPin, Clock, ShoppingCart, Plus, Minus, Share2, Eye, TrendingDown, Package, Heart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  store: string;
  savings?: number;
  description?: string;
  distance?: number;
  rating?: number;
  reviews?: number;
  available: boolean;
  deliveryTime?: string;
  isNew?: boolean;
  isBestPrice?: boolean;
  brand?: string;
  weight?: string;
  origin?: string;
  stock?: number;
}

interface ProductDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

const ProductDetails: React.FC<ProductDetailsProps> = async ({ params }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = await params;
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Dados mockados para diferentes produtos baseados no ID
        const productsData: { [key: string]: Product } = {
          '1': {
            id: '1',
            name: 'Cerveja Skol 350ml (lata)',
            price: 3.50,
            category: 'bebidas',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Cerveja+Skol',
            store: 'Mercado do João',
            savings: 0.50,
            description: 'Cerveja Skol 350ml em lata, gelada e refrescante. Perfeita para momentos de descontração.',
            distance: 0.8,
            rating: 4.3,
            reviews: 95,
            available: true,
            deliveryTime: '1-2 dias',
            isNew: false,
            isBestPrice: false,
            brand: 'Skol',
            weight: '350ml',
            origin: 'Brasil',
            stock: 32
          },
          '2': {
            id: '2',
            name: 'Cerveja Skol 350ml (lata)',
            price: 3.20,
            category: 'bebidas',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Cerveja+Skol',
            store: 'Supermercado Central',
            savings: 0.30,
            description: 'Cerveja Skol 350ml em lata, gelada e refrescante. Perfeita para momentos de descontração.',
            distance: 1.2,
            rating: 4.5,
            reviews: 128,
            available: true,
            deliveryTime: '1-2 dias',
            isNew: false,
            isBestPrice: true,
            brand: 'Skol',
            weight: '350ml',
            origin: 'Brasil',
            stock: 45
          },
          '3': {
            id: '3',
            name: 'Cerveja Skol 350ml (lata)',
            price: 3.80,
            category: 'bebidas',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Cerveja+Skol',
            store: 'Mercadinho da Esquina',
            savings: 0,
            description: 'Cerveja Skol 350ml em lata, gelada e refrescante. Perfeita para momentos de descontração.',
            distance: 2.1,
            rating: 4.1,
            reviews: 67,
            available: true,
            deliveryTime: '2-3 dias',
            isNew: false,
            isBestPrice: false,
            brand: 'Skol',
            weight: '350ml',
            origin: 'Brasil',
            stock: 18
          },
          '4': {
            id: '4',
            name: 'Refrigerante Coca-Cola 2L',
            price: 8.50,
            category: 'bebidas',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Coca-Cola',
            store: 'Mercado do João',
            savings: 1.00,
            description: 'Refrigerante Coca-Cola 2 litros, o sabor original que todo mundo conhece.',
            distance: 0.8,
            rating: 4.4,
            reviews: 89,
            available: true,
            deliveryTime: '1-2 dias',
            isNew: false,
            isBestPrice: false,
            brand: 'Coca-Cola',
            weight: '2L',
            origin: 'Brasil',
            stock: 15
          },
          '5': {
            id: '5',
            name: 'Refrigerante Coca-Cola 2L',
            price: 7.50,
            category: 'bebidas',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Coca-Cola',
            store: 'Supermercado Central',
            savings: 0,
            description: 'Refrigerante Coca-Cola 2 litros, o sabor original que todo mundo conhece.',
            distance: 1.2,
            rating: 4.6,
            reviews: 156,
            available: true,
            deliveryTime: '1-2 dias',
            isNew: false,
            isBestPrice: true,
            brand: 'Coca-Cola',
            weight: '2L',
            origin: 'Brasil',
            stock: 22
          },
          '6': {
            id: '6',
            name: 'Refrigerante Coca-Cola 2L',
            price: 8.50,
            category: 'bebidas',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Coca-Cola',
            store: 'Mercado do João',
            savings: 1.00,
            description: 'Refrigerante Coca-Cola 2 litros, o sabor original que todo mundo conhece.',
            distance: 0.8,
            rating: 4.4,
            reviews: 89,
            available: true,
            deliveryTime: '1-2 dias',
            isNew: false,
            isBestPrice: false,
            brand: 'Coca-Cola',
            weight: '2L',
            origin: 'Brasil',
            stock: 15
          },
          '7': {
            id: '7',
            name: 'Leite UHT 1L',
            price: 4.50,
            category: 'laticínios',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Leite+UHT',
            store: 'Mercado do João',
            savings: 0,
            description: 'Leite UHT integral 1 litro, rico em cálcio e vitaminas. Perfeito para o café da manhã.',
            distance: 0.8,
            rating: 4.7,
            reviews: 203,
            available: true,
            deliveryTime: '1 dia',
            isNew: false,
            isBestPrice: true,
            brand: 'Parmalat',
            weight: '1L',
            origin: 'Brasil',
            stock: 28
          },
          '8': {
            id: '8',
            name: 'Feijão Preto Camil 1kg',
            price: 8.50,
            category: 'grãos',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Feijão+Preto',
            store: 'Mercado do João',
            savings: 0,
            description: 'Feijão preto Camil 1kg, selecionado e de alta qualidade. Essencial na mesa brasileira.',
            distance: 0.8,
            rating: 4.8,
            reviews: 312,
            available: true,
            deliveryTime: '1-2 dias',
            isNew: false,
            isBestPrice: true,
            brand: 'Camil',
            weight: '1kg',
            origin: 'Brasil',
            stock: 38
          },
          '9': {
            id: '9',
            name: 'Pão Francês (kg)',
            price: 12.00,
            category: 'padaria',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Pão+Francês',
            store: 'Mercadinho da Esquina',
            savings: 1.50,
            description: 'Pão francês fresco, crocante por fora e macio por dentro. Feito diariamente.',
            distance: 2.1,
            rating: 4.2,
            reviews: 45,
            available: true,
            deliveryTime: '2-3 dias',
            isNew: false,
            isBestPrice: true,
            brand: 'Padaria Local',
            weight: '1kg',
            origin: 'Local',
            stock: 12
          },
          '10': {
            id: '10',
            name: 'Arroz Tio João 5kg',
            price: 25.90,
            category: 'grãos',
            image: 'https://via.placeholder.com/500x500/004A7C/white?text=Arroz+Tio+João',
            store: 'Mercadinho da Esquina',
            savings: 0,
            description: 'Arroz Tio João 5kg, tipo 1, grãos selecionados. O arroz que todo brasileiro conhece.',
            distance: 2.1,
            rating: 4.9,
            reviews: 445,
            available: true,
            deliveryTime: '2-3 dias',
            isNew: false,
            isBestPrice: true,
            brand: 'Tio João',
            weight: '5kg',
            origin: 'Brasil',
            stock: 25
          }
        };

        const productData = productsData[id];
        
        if (productData) {
          setProduct(productData);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  const handleAddToList = () => {
    if (!product) return;
    
    // Obter lista atual do localStorage
    const currentList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    
    // Verificar se o produto já está na lista
    const existingItemIndex = currentList.findIndex((item: any) => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Se já existe, atualizar a quantidade
      currentList[existingItemIndex].quantity = (currentList[existingItemIndex].quantity || 1) + quantity;
    } else {
      // Se não existe, adicionar novo item
      const newItem = {
        ...product,
        quantity: quantity,
        addedAt: new Date().toISOString()
      };
      currentList.push(newItem);
    }
    
    // Salvar no localStorage
    localStorage.setItem('shoppingList', JSON.stringify(currentList));
    
    // Mostrar mensagem de sucesso
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    
    console.log('Produto adicionado à lista:', product.name, 'quantidade:', quantity);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Confira este produto: ${product?.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
          <p className="text-gray-600 mb-6">O produto que você está procurando não existe ou foi removido.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900 text-lg">Detalhes do Produto</h1>
              <p className="text-sm text-gray-600">{product.name}</p>
            </div>
            
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-yellow-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Seção principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Imagem */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-80 lg:h-96 object-cover rounded-xl shadow-md"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.savings && product.savings > 0 && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    Economia: {formatPrice(product.savings)}
                  </div>
                )}
                {product.isBestPrice && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    MELHOR PREÇO
                  </div>
                )}
                {product.isNew && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    NOVO
                  </div>
                )}
              </div>

              <button
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all"
              >
                <Eye className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Informações principais */}
          <div className="space-y-6">
            
            {/* Nome e categoria */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600">{product.category}</p>
              {(product.brand || product.weight) && (
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  {product.brand && <span className="font-medium">{product.brand}</span>}
                  {product.brand && product.weight && <span>•</span>}
                  {product.weight && <span>{product.weight}</span>}
                </div>
              )}
            </div>

            {/* Preço */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl lg:text-6xl font-bold text-green-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.savings && product.savings > 0 && (
                    <span className="text-2xl text-gray-500 line-through">
                      {formatPrice(product.price + product.savings)}
                    </span>
                  )}
                </div>
                
                {product.savings && product.savings > 0 && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full">
                      <TrendingDown className="w-5 h-5" />
                      <span className="font-bold text-lg">Economize {formatPrice(product.savings)}!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disponibilidade */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">📍 {product.store}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {product.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{product.distance.toFixed(1)} km</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{product.deliveryTime || '1-2 dias'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center gap-2 ${
                    product.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      product.available ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span className="font-medium">
                      {product.available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                  {product.stock && (
                    <p className="text-xs text-gray-500 mt-1">{product.stock} em estoque</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quantidade e compra */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">Quantos você quer?</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-6 h-6 text-gray-600" />
                </button>
                
                <div className="flex-1 bg-gray-50 rounded-lg py-3 text-center">
                  <span className="text-2xl font-bold text-gray-900">{quantity}</span>
                  <p className="text-sm text-gray-500">unidade{quantity > 1 ? 's' : ''}</p>
                </div>
                
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-900">
                  Total: {formatPrice(product.price * quantity)}
                </p>
                {quantity > 1 && product.savings && product.savings > 0 && (
                  <p className="text-lg text-green-600 mt-1">
                    Economia total: {formatPrice(product.savings * quantity)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddToList}
                disabled={!product.available}
                className={`w-full font-bold py-4 px-6 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 ${
                  product.available
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {product.available ? 'Adicionar à Lista!' : 'Produto indisponível'}
              </button>
            </div>
          </div>
        </div>

        {/* Informações secundárias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Avaliações */}
          {product.rating && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">⭐ Avaliações</h3>
              
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">{renderStars(product.rating)}</div>
                <span className="text-3xl font-bold text-gray-900">{product.rating.toFixed(1)}</span>
                <p className="text-gray-500 text-sm">
                  {product.reviews || 0} avaliações
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex mb-1">{renderStars(5)}</div>
                  "Ótimo produto!"
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex mb-1">{renderStars(4)}</div>
                  "Boa qualidade"
                </div>
              </div>
            </div>
          )}

          {/* Informações extras */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">📋 Detalhes</h3>
            
            <div className="space-y-3 text-sm">
              {product.description && (
                <div>
                  <span className="font-medium text-gray-700">Descrição:</span>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                </div>
              )}
              
              {product.origin && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Origem:</span>
                  <span className="text-gray-600">{product.origin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">🔗 Ações</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
              
              <button
                onClick={handleToggleFavorite}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isFavorite
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>
            </div>
          </div>
        </div>

        {/* CTAs Finais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => router.back()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar à Busca
          </button>
          
          <button 
            onClick={handleAddToList}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Adicionar à Lista
          </button>
          
          <button 
            onClick={handleShare}
            className="bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {showSuccessMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold">Item adicionado à sua lista!</span>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
