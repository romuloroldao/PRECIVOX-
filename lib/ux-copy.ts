/**
 * Textos da interface em linguagem simples — jornada do cliente Precivox.
 */

export const UX = {
  busca: {
    titulo: 'Buscar produtos',
    subtitulo: 'Encontre e compare preços nos mercados perto de você',
    placeholder: 'O que você procura?',
    filtros: 'Filtrar e ordenar',
    maisOpcoes: 'Mais opções',
    lista: 'Minha lista',
    recolherLista: 'Recolher lista',
    compararPrecos: 'Comparar preços',
    verLista: 'Ver em lista',
    ordenar: 'Ordenar por',
    ordenacao: {
      hibrido: 'Mais relevantes',
      preco_asc: 'Menor preço',
      nome: 'Nome (A–Z)',
    },
    carregando: 'Buscando produtos…',
    semResultado: 'Nenhum resultado',
    semResultadoDica: 'Tente outro nome ou remova alguns filtros.',
    limparFiltros: 'Limpar filtros',
    resultados: (n: number, total?: number, comparativo?: boolean) => {
      const tipo = comparativo ? 'ofertas' : 'produtos';
      if (total && total > n) return `${n.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} ${tipo}`;
      return `${n.toLocaleString('pt-BR')} ${tipo}`;
    },
    erroTitulo: 'Algo deu errado',
    erroGenerico: 'Estamos com um problema temporário. Tente de novo em instantes.',
    tentarNovamente: 'Tentar de novo',
    carregarMais: 'Carregar mais',
  },
  lista: {
    titulo: 'Lista inteligente',
    subtituloVazia: 'Adicione produtos pela busca',
    itens: (n: number) => (n === 1 ? '1 item' : `${n} itens`),
    continuarComprando: 'Continuar comprando',
    finalizarCompras: 'Ir às compras',
    finalizarComprasDescricao: 'Use a lista no corredor do mercado',
    irCorredorVazio: 'Adicione produtos para ir às compras',
    esvaziar: 'Esvaziar lista',
    renomear: 'Renomear lista',
    trocarLista: 'Trocar lista',
    verTodas: 'Ver todas as listas',
    remover: 'Remover',
    desfazer: 'Desfazer',
    itemRemovido: 'Item removido da lista',
    confirmarEsvaziar: 'Tem certeza que deseja esvaziar a lista?',
    rotaIa: 'Rota e dicas',
    sugestoesIa: 'Sugestões para completar sua cesta',
  },
  catalogo: {
    titulo: 'Mercados disponíveis',
    ofertasRegiao: 'Ofertas na região',
    parceiroRegiao: 'Parceiro da região',
    promocaoDirecionada: 'Promoção especial',
  },
  produto: {
    adicionar: 'Adicionar à lista',
    adicionando: 'Adicionando…',
    adicionado: 'Adicionado!',
    verDetalhes: 'Ver detalhes',
    ocultarDetalhes: 'Ocultar detalhes',
    promocao: 'Promoção',
    menorPreco: 'Menor preço',
  },
  nav: {
    inicio: 'Início',
    buscar: 'Buscar',
    listas: 'Listas',
    despensa: 'Despensa',
    perfil: 'Perfil',
  },
  geral: {
    fechar: 'Fechar',
    salvar: 'Salvar',
    cancelar: 'Cancelar',
    limpar: 'Limpar',
    mais: 'Mais',
  },
} as const;

export type OrdenacaoBusca = 'hibrido' | 'preco_asc' | 'nome';
