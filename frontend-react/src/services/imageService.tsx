// src/services/imageService.ts
// Serviço para gerar URLs de imagem válidas

interface ProductImageConfig {
    width?: number;
    height?: number;
    quality?: number;
    fallback?: boolean;
  }
  
  class ImageService {
    private baseUrl = 'https://picsum.photos'; // Serviço gratuito de imagens
    
    /**
     * Gera URL de imagem válida para produto
     */
    getProductImage(
      productName: string, 
      config: ProductImageConfig = {}
    ): string {
      const { width = 300, height = 300, quality = 80 } = config;
      
      // Gera um ID baseado no nome do produto
      const productId = this.generateProductId(productName);
      
      // URLs válidas que funcionam
      const providers = [
        `${this.baseUrl}/${width}/${height}?random=${productId}`,
        `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=${encodeURIComponent(productName.slice(0, 20))}`,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&size=${width}&background=4A90E2&color=fff`
      ];
      
      return providers[0];
    }
    
    /**
     * Gera ID único baseado no nome do produto
     */
    private generateProductId(productName: string): number {
      let hash = 0;
      for (let i = 0; i < productName.length; i++) {
        const char = productName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash) % 1000; // ID entre 0-999
    }
    
    /**
     * Gera múltiplas variações de imagem
     */
    getProductImageVariations(productName: string): string[] {
      return [
        this.getProductImage(productName, { width: 300, height: 300 }),
        this.getProductImage(productName, { width: 150, height: 150 }),
        this.getProductImage(productName, { width: 600, height: 400 })
      ];
    }
    
    /**
     * Verifica se uma URL de imagem está funcionando
     */
    async checkImageUrl(url: string): Promise<boolean> {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }
  }
  
  export const imageService = new ImageService();
  
  // Hook para usar no React
  export const useProductImage = (productName: string) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
      const loadImage = async () => {
        setIsLoading(true);
        setHasError(false);
        
        try {
          const url = imageService.getProductImage(productName);
          const isValid = await imageService.checkImageUrl(url);
          
          if (isValid) {
            setImageUrl(url);
          } else {
            // Fallback para placeholder
            setImageUrl(`https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=${encodeURIComponent(productName.slice(0, 15))}`);
          }
        } catch (error) {
          setHasError(true);
          setImageUrl('https://via.placeholder.com/300x300/cccccc/666666?text=Sem+Imagem');
        } finally {
          setIsLoading(false);
        }
      };
      
      if (productName) {
        loadImage();
      }
    }, [productName]);
    
    return { imageUrl, isLoading, hasError };
  };
  
  // Componente de imagem com fallback automático
  export const ProductImage: React.FC<{
    productName: string;
    className?: string;
    width?: number;
    height?: number;
  }> = ({ productName, className, width = 300, height = 300 }) => {
    const { imageUrl, isLoading, hasError } = useProductImage(productName);
    
    if (isLoading) {
      return (
        <div className={`bg-gray-200 animate-pulse ${className}`} style={{ width, height }}>
          <div className="flex items-center justify-center h-full text-gray-400">
            Carregando...
          </div>
        </div>
      );
    }
    
    return (
      <img
        src={imageUrl}
        alt={productName}
        className={className}
        style={{ width, height }}
        onError={(e) => {
          // Fallback final se a imagem falhar
          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
        }}
      />
    );
  };