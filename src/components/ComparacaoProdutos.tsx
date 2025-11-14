// Componente de Comparação de Produtos
'use client';

import { useState, useEffect } from 'react';

interface ProdutoComparacao {
  id: string;
  preco: number;
  precoPromocional?: number;
  emPromocao: boolean;
  disponivel: boolean;
  quantidade: number;
  unidade: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    mercado: {
      id: string;
      nome: string;
    };
  };
  produto: {
    id: string;
    nome: string;
    descricao?: string;
    categoria?: string;
    marca?: string;
    codigoBarras?: string;
  };
}

interface ComparacaoProps {
  produtos: ProdutoComparacao[];
  onClose: () => void;
}

export default function ComparacaoProdutos({ produtos, onClose }: ComparacaoProps) {
  const [produtosComparacao, setProdutosComparacao] = useState<ProdutoComparacao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (produtos.length > 0) {
      carregarComparacao();
    }
  }, [produtos]);

  const carregarComparacao = async () => {
    try {
      setLoading(true);
      const produtoIds = produtos.map(p => p.id);
      
      const response = await fetch('/api/produtos/comparar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ produtoIds }),
      });

      if (response.ok) {
        const resultado = await response.json();
        setProdutosComparacao(resultado);
      }
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEconomia = (produto: ProdutoComparacao) => {
    const precoAtual = produto.emPromocao && produto.precoPromocional 
      ? produto.precoPromocional 
      : produto.preco;
    
    const menorPreco = Math.min(...produtosComparacao.map(p => 
      p.emPromocao && p.precoPromocional ? p.precoPromocional : p.preco
    ));
    
    return precoAtual - menorPreco;
  };

  const encontrarMenorPreco = () => {
    if (produtosComparacao.length === 0) return null;
    
    return produtosComparacao.reduce((menor, atual) => {
      const precoAtual = atual.emPromocao && atual.precoPromocional 
        ? atual.precoPromocional 
        : atual.preco;
      const precoMenor = menor.emPromocao && menor.precoPromocional 
        ? menor.precoPromocional 
        : menor.preco;
      
      return precoAtual < precoMenor ? atual : menor;
    });
  };

  const menorPreco = encontrarMenorPreco();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Comparando produtos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Comparação de Produtos</h2>
              <p className="text-blue-100 mt-1">
                {produtosComparacao.length} produto(s) encontrado(s)
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {produtosComparacao.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 mb-2">Nenhum produto para comparar</p>
              <p className="text-sm text-gray-400">Selecione produtos para comparar preços</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo da Comparação */}
              {menorPreco && (
                <div className="rounded-lg border border-success-200 bg-success-50 p-4">
                  <div className="flex items-center">
                    <svg className="mr-3 h-6 w-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-success-700">Melhor Preço Encontrado!</h3>
                      <p className="text-success-600">
                        {menorPreco.unidade.mercado.nome} - {menorPreco.unidade.nome}
                      </p>
                      <p className="text-success-600">
                        R$ {menorPreco.emPromocao && menorPreco.precoPromocional 
                          ? menorPreco.precoPromocional.toFixed(2)
                          : menorPreco.preco.toFixed(2)
                        }
                        {menorPreco.emPromocao && (
                          <span className="ml-2 rounded-full bg-promo-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-promo-700">
                            Promoção
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela de Comparação */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mercado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localização
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Economia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produtosComparacao.map((produto) => {
                      const precoAtual = produto.emPromocao && produto.precoPromocional 
                        ? produto.precoPromocional 
                        : produto.preco;
                      const economia = calcularEconomia(produto);
                      const isMenorPreco = menorPreco?.id === produto.id;

                      return (
                        <tr key={produto.id} className={isMenorPreco ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {produto.produto.nome}
                              </div>
                              {produto.produto.marca && (
                                <div className="text-sm text-gray-500">
                                  {produto.produto.marca}
                                </div>
                              )}
                              {produto.produto.categoria && (
                                <div className="text-sm text-gray-500">
                                  {produto.produto.categoria}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {produto.unidade.mercado.nome}
                            </div>
                            <div className="text-sm text-gray-500">
                              {produto.unidade.nome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {produto.unidade.cidade}
                            </div>
                            <div className="text-sm text-gray-500">
                              {produto.unidade.estado}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-lg font-bold text-gray-900">
                                  R$ {precoAtual.toFixed(2)}
                                </div>
                                {produto.emPromocao && produto.precoPromocional && (
                                  <div className="text-sm text-gray-500 line-through">
                                    R$ {produto.preco.toFixed(2)}
                                  </div>
                                )}
                              </div>
                              {produto.emPromocao && (
                                <span className="ml-2 rounded-full bg-promo-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-promo-700">
                                  Promoção
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {economia > 0 ? (
                              <div className="text-sm font-semibold text-success-600">
                                +R$ {economia.toFixed(2)}
                              </div>
                            ) : economia === 0 ? (
                              <div className="text-sm font-semibold text-success-600">
                                Melhor preço!
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                produto.disponivel 
                                  ? 'bg-success-100 text-success-700' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {produto.disponivel ? 'Disponível' : 'Indisponível'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {produto.quantidade} unidades
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Análise de Preços */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Análise de Preços</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Menor Preço:</span>
                    <div className="text-blue-800">
                      R$ {menorPreco ? (menorPreco.emPromocao && menorPreco.precoPromocional 
                        ? menorPreco.precoPromocional.toFixed(2)
                        : menorPreco.preco.toFixed(2)
                      ) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Maior Preço:</span>
                    <div className="text-blue-800">
                      R$ {Math.max(...produtosComparacao.map(p => 
                        p.emPromocao && p.precoPromocional ? p.precoPromocional : p.preco
                      )).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Diferença:</span>
                    <div className="text-blue-800">
                      R$ {(Math.max(...produtosComparacao.map(p => 
                        p.emPromocao && p.precoPromocional ? p.precoPromocional : p.preco
                      )) - (menorPreco ? (menorPreco.emPromocao && menorPreco.precoPromocional 
                        ? menorPreco.precoPromocional 
                        : menorPreco.preco
                      ) : 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Fechar
            </button>
            <button
              onClick={() => {/* Implementar exportar comparação */}}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Exportar Comparação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
