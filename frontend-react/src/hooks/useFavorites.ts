import { useEffect, useState, useMemo } from 'react';
import { Product } from '../types';
import { getFromStorage, saveToStorage } from './useLocalStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>([]);

  // ✅ Carrega favoritos do localStorage na inicialização
  useEffect(() => {
    const stored = getFromStorage('favorites');
    if (stored) setFavorites(stored);
  }, []);

  // ✅ Salva favoritos sempre que mudar
  useEffect(() => {
    saveToStorage('favorites', favorites);
  }, [favorites]);

  // ✅ Alterna favorito
  const toggleFavorite = (product: Product) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === product.id);
      if (exists) {
        return prev.filter(f => f.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // ✅ Estatísticas memorizadas
  const stats = useMemo(() => {
    const favoriteCount = favorites.length;
    const favoriteCategories = [...new Set(favorites.map(f => f.category))];
    const totalFavoriteValue = favorites.reduce((sum, f) => sum + f.price, 0);
    return { favoriteCount, favoriteCategories, totalFavoriteValue };
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    getFavoriteStats: () => stats // ✅ acessado via função
  };
}
