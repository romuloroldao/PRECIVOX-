// Serviço principal para busca e armazenamento de imagens de produtos
import { ImageSearchService } from './imageSearchService';
import { DatabaseService } from './databaseService';
import { ImagemProduto } from '../types/database';

export interface ProdutoComImagem {
  titulo: string;
  imagemUrl: string;
  mercados: string[];
  origem: string;
  criadoEm: Date;
}

export class ProdutoImageService {
  private imageSearchService: ImageSearchService;
  private databaseService: DatabaseService;

  constructor(database: any) {
    this.imageSearchService = new ImageSearchService();
    this.databaseService = new DatabaseService(database);
  }

  /**
   * Função principal para buscar imagem de produto e armazenar no banco de dados
   */
  async buscarImagemProduto(tituloProduto: string, mercadoId?: string): Promise<string> {
    try {
      // Verifica se já existe imagem salva no banco
      const imagemExistente = await this.databaseService.buscarImagemExistente(tituloProduto);

      if (imagemExistente) {
        console.log(`✅ Reutilizando imagem existente para: ${tituloProduto}`);
        return imagemExistente.url;
      }

      console.log(`🔍 Buscando nova imagem para: ${tituloProduto}`);

      // Se não existir, realiza busca externa
      const imagemUrl = await this.imageSearchService.buscarImagemNaWeb(tituloProduto);

      // Valida se a URL é acessível
      const urlValida = await this.imageSearchService.validarUrlImagem(imagemUrl);
      if (!urlValida) {
        console.warn(`⚠️ URL de imagem inválida para: ${tituloProduto}`);
      }

      // Salva no banco para reutilização futura
      const dadosImagem: Omit<ImagemProduto, 'id' | 'criadoEm' | 'atualizadoEm'> = {
        titulo: tituloProduto.toLowerCase(),
        url: imagemUrl,
        origem: 'busca automática',
        mercado: mercadoId,
        ativo: true
      };

      await this.databaseService.salvarImagem(dadosImagem);

      console.log(`💾 Imagem salva no banco para: ${tituloProduto}`);
      return imagemUrl;

    } catch (error) {
      console.error(`❌ Erro ao buscar imagem para ${tituloProduto}:`, error);
      
      // Retorna imagem placeholder em caso de erro
      return this.getPlaceholderImage(tituloProduto);
    }
  }

  /**
   * Busca múltiplas imagens em lote
   */
  async buscarImagensProdutos(titulosProdutos: string[], mercadoId?: string): Promise<Map<string, string>> {
    const resultados = new Map<string, string>();
    
    console.log(`🔄 Processando ${titulosProdutos.length} produtos...`);

    // Processa em lotes para evitar sobrecarga
    const batchSize = 5;
    for (let i = 0; i < titulosProdutos.length; i += batchSize) {
      const batch = titulosProdutos.slice(i, i + batchSize);
      
      const promises = batch.map(async (titulo) => {
        const imagemUrl = await this.buscarImagemProduto(titulo, mercadoId);
        return { titulo, imagemUrl };
      });

      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          resultados.set(result.value.titulo, result.value.imagemUrl);
        } else {
          console.error(`Erro no produto ${batch[index]}:`, result.reason);
          resultados.set(batch[index], this.getPlaceholderImage(batch[index]));
        }
      });

      // Pequena pausa entre lotes para evitar rate limiting
      if (i + batchSize < titulosProdutos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return resultados;
  }

  /**
   * Renderiza produto com imagem
   */
  renderizarProduto(dados: {
    nome: string;
    imagemUrl: string;
    mercados: string[];
    preco?: number;
    disponivel?: boolean;
  }): ProdutoComImagem {
    return {
      titulo: dados.nome,
      imagemUrl: dados.imagemUrl,
      mercados: dados.mercados,
      origem: 'busca automática',
      criadoEm: new Date()
    };
  }

  /**
   * Obtém estatísticas do sistema de imagens
   */
  async obterEstatisticas(): Promise<{
    totalImagens: number;
    imagensPorOrigem: Record<string, number>;
    imagensRecentes: number;
    economiaProcessamento: string;
  }> {
    const stats = await this.databaseService.obterEstatisticasImagens();
    
    return {
      ...stats,
      economiaProcessamento: `Sistema evita ${stats.totalImagens} buscas desnecessárias por reutilização`
    };
  }

  /**
   * Limpa cache de imagens antigas
   */
  async limparCache(): Promise<number> {
    return await this.databaseService.limparImagensInativas();
  }

  /**
   * Retorna imagem placeholder
   */
  private getPlaceholderImage(tituloProduto: string): string {
    const encodedTitle = encodeURIComponent(tituloProduto);
    return `https://via.placeholder.com/300x300/cccccc/666666?text=${encodedTitle}`;
  }

  /**
   * Valida título do produto
   */
  private validarTituloProduto(titulo: string): boolean {
    if (!titulo || titulo.trim().length === 0) {
      throw new Error('Título do produto não pode ser vazio');
    }

    if (titulo.length > 200) {
      throw new Error('Título do produto muito longo (máximo 200 caracteres)');
    }

    return true;
  }
}
