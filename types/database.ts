// Tipos para o banco de dados de imagens de produtos
export interface ImagemProduto {
  id: string;
  titulo: string;
  url: string;
  origem: string;
  criadoEm: Date;
  atualizadoEm?: Date;
  mercado?: string;
  ativo: boolean;
}

export interface Mercado {
  id: string;
  nome: string;
  logo?: string;
  ativo: boolean;
}

export interface ProdutoMercado {
  id: string;
  produtoId: string;
  mercadoId: string;
  preco: number;
  disponivel: boolean;
  imagemUrl?: string;
}
