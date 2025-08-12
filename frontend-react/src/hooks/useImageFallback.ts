// src/hooks/useImageFallback.ts
// ✅ HOOK PARA TRATAR ERROS 404 DAS IMAGENS
import { useState, useCallback } from 'react';

interface UseImageFallbackProps {
  fallbackText?: string;
  fallbackBg?: string;
  fallbackColor?: string;
}

export const useImageFallback = ({
  fallbackText = 'Produto',
  fallbackBg = 'e0e0e0',
  fallbackColor = '666666'
}: UseImageFallbackProps = {}) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const getFallbackUrl = useCallback((text: string, width: number = 300, height: number = 300) => {
    const encodedText = encodeURIComponent(text.slice(0, 8));
    return `https://via.placeholder.com/${width}x${height}/${fallbackBg}/${fallbackColor}?text=${encodedText}`;
  }, [fallbackBg, fallbackColor]);

  const getImageUrl = useCallback((originalUrl: string | undefined, productName: string) => {
    if (!originalUrl || failedImages.has(originalUrl)) {
      return getFallbackUrl(productName);
    }
    return originalUrl;
  }, [failedImages, getFallbackUrl]);

  const handleImageError = useCallback((originalUrl: string, productName: string) => {
    return (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement;
      if (!failedImages.has(originalUrl)) {
        setFailedImages(prev => new Set(prev).add(originalUrl));
        target.src = getFallbackUrl(productName);
      }
    };
  }, [failedImages, getFallbackUrl]);

  return {
    getImageUrl,
    handleImageError,
    getFallbackUrl
  };
};

export default useImageFallback;