// Serviço para operações no banco de dados
import { ImagemProduto, Mercado, ProdutoMercado } from '../types/database';

export class DatabaseService {
  private db: any; // Substitua pelo seu ORM/banco de dados

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Busca imagem existente no banco de dados
   */
  async buscarImagemExistente(tituloProduto: string): Promise<ImagemProduto | null> {
    try {
      const imagem = await this.db.imagens.findUnique({
        where: { 
          titulo: tituloProduto.toLowerCase(),
          ativo: true
        }
      });

      return imagem;
    } catch (error) {
      console.error('Erro ao buscar imagem existente:', error);
      return null;
    }
  }

  /**
   * Salva nova imagem no banco de dados
   */
  async salvarImagem(dadosImagem: Omit<ImagemProduto, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ImagemProduto> {
    try {
      const imagem = await this.db.imagens.create({
        data: {
          ...dadosImagem,
          titulo: dadosImagem.titulo.toLowerCase(),
          criadoEm: new Date(),
          ativo: true
        }
      });

      return imagem;
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      throw new Error('Falha ao salvar imagem no banco de dados');
    }
  }

  /**
   * Atualiza imagem existente
   */
  async atualizarImagem(id: string, dadosAtualizacao: Partial<ImagemProduto>): Promise<ImagemProduto> {
    try {
      const imagem = await this.db.imagens.update({
        where: { id },
        data: {
          ...dadosAtualizacao,
          atualizadoEm: new Date()
        }
      });

      return imagem;
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      throw new Error('Falha ao atualizar imagem no banco de dados');
    }
  }

  /**
   * Busca imagens por mercado
   */
  async buscarImagensPorMercado(mercadoId: string): Promise<ImagemProduto[]> {
    try {
      const imagens = await this.db.imagens.findMany({
        where: {
          mercado: mercadoId,
          ativo: true
        },
        orderBy: {
          criadoEm: 'desc'
        }
      });

      return imagens;
    } catch (error) {
      console.error('Erro ao buscar imagens por mercado:', error);
      return [];
    }
  }

  /**
   * Busca estatísticas de uso das imagens
   */
  async obterEstatisticasImagens(): Promise<{
    totalImagens: number;
    imagensPorOrigem: Record<string, number>;
    imagensRecentes: number;
  }> {
    try {
      const totalImagens = await this.db.imagens.count({
        where: { ativo: true }
      });

      const imagensPorOrigem = await this.db.imagens.groupBy({
        by: ['origem'],
        where: { ativo: true },
        _count: true
      });

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 7); // Últimos 7 dias

      const imagensRecentes = await this.db.imagens.count({
        where: {
          ativo: true,
          criadoEm: {
            gte: dataLimite
          }
        }
      });

      return {
        totalImagens,
        imagensPorOrigem: imagensPorOrigem.reduce((acc: Record<string, number>, item: any) => {
          acc[item.origem] = item._count;
          return acc;
        }, {}),
        imagensRecentes
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalImagens: 0,
        imagensPorOrigem: {},
        imagensRecentes: 0
      };
    }
  }

  /**
   * Remove imagens inativas ou duplicadas
   */
  async limparImagensInativas(): Promise<number> {
    try {
      const resultado = await this.db.imagens.deleteMany({
        where: {
          ativo: false
        }
      });

      return resultado.count;
    } catch (error) {
      console.error('Erro ao limpar imagens inativas:', error);
      return 0;
    }
  }
}
