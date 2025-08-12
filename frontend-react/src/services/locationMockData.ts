// services/locationMockData.ts
export interface LojaLocation {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  coords: {
    lat: number;
    lng: number;
  };
  telefone?: string;
  horarios?: string;
}

export interface ProdutoComLocalizacao {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
  lojaId: string;
  loja: string;
  descricao: string;
  promocao?: {
    desconto: number;
    precoOriginal: number;
    validoAte: string;
  };
}

// Lojas próximas a Franco da Rocha, SP (-23.3319, -46.7278)
export const lojasComLocalizacao: LojaLocation[] = [
  // Franco da Rocha
  {
    id: 'carrefour-franco-rocha',
    nome: 'Carrefour Franco da Rocha',
    endereco: 'Av. São Paulo, 1234 - Centro',
    cidade: 'Franco da Rocha',
    estado: 'São Paulo',
    coords: { lat: -23.3250, lng: -46.7300 },
    telefone: '(11) 4444-5555',
    horarios: '07:00 - 22:00'
  },
  {
    id: 'pao-acucar-franco-rocha',
    nome: 'Pão de Açúcar Franco da Rocha',
    endereco: 'R. Coronel Oliveira Lima, 567',
    cidade: 'Franco da Rocha',
    estado: 'São Paulo',
    coords: { lat: -23.3280, lng: -46.7250 },
    telefone: '(11) 4444-6666',
    horarios: '06:00 - 23:00'
  },
  
  // Caieiras (cidade vizinha - ~8km)
  {
    id: 'extra-caieiras',
    nome: 'Extra Caieiras',
    endereco: 'Av. dos Três Poderes, 890',
    cidade: 'Caieiras',
    estado: 'São Paulo',
    coords: { lat: -23.3600, lng: -46.7400 },
    telefone: '(11) 4605-1234',
    horarios: '07:00 - 22:00'
  },
  {
    id: 'atacadao-caieiras',
    nome: 'Atacadão Caieiras',
    endereco: 'R. Fortunato Ferraz, 321',
    cidade: 'Caieiras',
    estado: 'São Paulo',
    coords: { lat: -23.3580, lng: -46.7350 },
    telefone: '(11) 4605-5678',
    horarios: '07:00 - 21:00'
  },

  // Francisco Morato (~12km)
  {
    id: 'big-francisco-morato',
    nome: 'Big Francisco Morato',
    endereco: 'Av. Edgard Facó, 1500',
    cidade: 'Francisco Morato',
    estado: 'São Paulo',
    coords: { lat: -23.2800, lng: -46.7450 },
    telefone: '(11) 4489-7890',
    horarios: '08:00 - 22:00'
  },

  // Mairiporã (~15km)
  {
    id: 'carrefour-mairipora',
    nome: 'Carrefour Mairiporã',
    endereco: 'Estrada de Mairiporã, 2000',
    cidade: 'Mairiporã',
    estado: 'São Paulo',
    coords: { lat: -23.3180, lng: -46.5870 },
    telefone: '(11) 4419-9999',
    horarios: '07:00 - 22:00'
  },

  // Campo Limpo Paulista (~18km)
  {
    id: 'walmart-campo-limpo',
    nome: 'Walmart Campo Limpo Paulista',
    endereco: 'Av. Doutor Cardoso de Melo, 800',
    cidade: 'Campo Limpo Paulista',
    estado: 'São Paulo',
    coords: { lat: -23.2050, lng: -46.7850 },
    telefone: '(11) 4812-3456',
    horarios: '07:00 - 23:00'
  },

  // Jundiaí (~25km)
  {
    id: 'tenda-jundiai',
    nome: 'Tenda Jundiaí',
    endereco: 'R. Barão de Jundiaí, 1800',
    cidade: 'Jundiaí',
    estado: 'São Paulo',
    coords: { lat: -23.1864, lng: -46.8842 },
    telefone: '(11) 4521-7890',
    horarios: '07:00 - 22:00'
  },

  // São Paulo - Zona Norte (~35km)
  {
    id: 'carrefour-santana',
    nome: 'Carrefour Santana',
    endereco: 'Av. Cruzeiro do Sul, 3000',
    cidade: 'São Paulo',
    estado: 'São Paulo',
    coords: { lat: -23.5089, lng: -46.6288 },
    telefone: '(11) 2222-1111',
    horarios: '06:00 - 24:00'
  }
];

// Produtos com localização específica
export const produtosComLocalizacao: ProdutoComLocalizacao[] = [
  // Produtos do Carrefour Franco da Rocha
  {
    id: 'arroz-tio-joao-1',
    nome: 'Arroz Tio João 5kg',
    preco: 18.90,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-franco-rocha',
    loja: 'Carrefour Franco da Rocha',
    descricao: 'Arroz branco tipo 1, pacote 5kg'
  },
  {
    id: 'feijao-camil-1',
    nome: 'Feijão Camil Carioca 1kg',
    preco: 7.50,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-franco-rocha',
    loja: 'Carrefour Franco da Rocha',
    descricao: 'Feijão carioca especial'
  },
  {
    id: 'detergente-ype-1',
    nome: 'Detergente Ypê Neutro 500ml',
    preco: 2.35,
    categoria: 'Limpeza',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-franco-rocha',
    loja: 'Carrefour Franco da Rocha',
    descricao: 'Detergente concentrado'
  },

  // Produtos do Pão de Açúcar Franco da Rocha
  {
    id: 'arroz-tio-joao-2',
    nome: 'Arroz Tio João 5kg',
    preco: 19.90,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'pao-acucar-franco-rocha',
    loja: 'Pão de Açúcar Franco da Rocha',
    descricao: 'Arroz branco premium',
    promocao: {
      desconto: 10,
      precoOriginal: 22.10,
      validoAte: '2025-06-15'
    }
  },
  {
    id: 'leite-italac-1',
    nome: 'Leite Italac Integral 1L',
    preco: 4.80,
    categoria: 'Bebidas',
    imagem: '/api/placeholder/200/200',
    lojaId: 'pao-acucar-franco-rocha',
    loja: 'Pão de Açúcar Franco da Rocha',
    descricao: 'Leite integral UHT'
  },
  {
    id: 'sabonete-dove-1',
    nome: 'Sabonete Dove Original 90g',
    preco: 3.20,
    categoria: 'Higiene',
    imagem: '/api/placeholder/200/200',
    lojaId: 'pao-acucar-franco-rocha',
    loja: 'Pão de Açúcar Franco da Rocha',
    descricao: 'Sabonete hidratante'
  },

  // Produtos do Extra Caieiras
  {
    id: 'arroz-tio-joao-3',
    nome: 'Arroz Tio João 5kg',
    preco: 17.50,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'extra-caieiras',
    loja: 'Extra Caieiras',
    descricao: 'Arroz branco tipo 1',
    promocao: {
      desconto: 15,
      precoOriginal: 20.60,
      validoAte: '2025-06-12'
    }
  },
  {
    id: 'oleo-liza-1',
    nome: 'Óleo de Soja Liza 900ml',
    preco: 6.90,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'extra-caieiras',
    loja: 'Extra Caieiras',
    descricao: 'Óleo de soja refinado'
  },
  {
    id: 'shampoo-seda-1',
    nome: 'Shampoo Seda Reconstrução 325ml',
    preco: 8.50,
    categoria: 'Higiene',
    imagem: '/api/placeholder/200/200',
    lojaId: 'extra-caieiras',
    loja: 'Extra Caieiras',
    descricao: 'Shampoo hidratante'
  },

  // Produtos do Atacadão Caieiras
  {
    id: 'arroz-tio-joao-4',
    nome: 'Arroz Tio João 5kg',
    preco: 16.80,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'atacadao-caieiras',
    loja: 'Atacadão Caieiras',
    descricao: 'Arroz branco atacado'
  },
  {
    id: 'acucar-uniao-1',
    nome: 'Açúcar União Cristal 1kg',
    preco: 4.20,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'atacadao-caieiras',
    loja: 'Atacadão Caieiras',
    descricao: 'Açúcar cristal especial'
  },
  {
    id: 'papel-higienico-scott-1',
    nome: 'Papel Higiênico Scott 12 rolos',
    preco: 18.90,
    categoria: 'Higiene',
    imagem: '/api/placeholder/200/200',
    lojaId: 'atacadao-caieiras',
    loja: 'Atacadão Caieiras',
    descricao: 'Papel higiênico folha dupla'
  },

  // Produtos do Big Francisco Morato
  {
    id: 'feijao-camil-2',
    nome: 'Feijão Camil Carioca 1kg',
    preco: 6.90,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'big-francisco-morato',
    loja: 'Big Francisco Morato',
    descricao: 'Feijão carioca selecionado'
  },
  {
    id: 'cafe-pilao-1',
    nome: 'Café Pilão Tradicional 500g',
    preco: 12.50,
    categoria: 'Bebidas',
    imagem: '/api/placeholder/200/200',
    lojaId: 'big-francisco-morato',
    loja: 'Big Francisco Morato',
    descricao: 'Café torrado e moído'
  },
  {
    id: 'amaciante-comfort-1',
    nome: 'Amaciante Comfort Concentrado 2L',
    preco: 9.80,
    categoria: 'Limpeza',
    imagem: '/api/placeholder/200/200',
    lojaId: 'big-francisco-morato',
    loja: 'Big Francisco Morato',
    descricao: 'Amaciante concentrado'
  },

  // Produtos do Carrefour Mairiporã
  {
    id: 'macarrao-barilla-1',
    nome: 'Macarrão Barilla Penne 500g',
    preco: 7.80,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-mairipora',
    loja: 'Carrefour Mairiporã',
    descricao: 'Massa italiana premium'
  },
  {
    id: 'molho-tomate-quero-1',
    nome: 'Molho de Tomate Quero 340g',
    preco: 3.50,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-mairipora',
    loja: 'Carrefour Mairiporã',
    descricao: 'Molho de tomate tradicional'
  },
  {
    id: 'desodorante-rexona-1',
    nome: 'Desodorante Rexona Aerosol 150ml',
    preco: 8.90,
    categoria: 'Higiene',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-mairipora',
    loja: 'Carrefour Mairiporã',
    descricao: 'Desodorante antitranspirante'
  },

  // Produtos do Walmart Campo Limpo Paulista
  {
    id: 'biscoito-bauducco-1',
    nome: 'Biscoito Bauducco Wafer Chocolate 140g',
    preco: 4.50,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'walmart-campo-limpo',
    loja: 'Walmart Campo Limpo Paulista',
    descricao: 'Wafer recheado com chocolate'
  },
  {
    id: 'refrigerante-coca-1',
    nome: 'Refrigerante Coca-Cola 2L',
    preco: 7.20,
    categoria: 'Bebidas',
    imagem: '/api/placeholder/200/200',
    lojaId: 'walmart-campo-limpo',
    loja: 'Walmart Campo Limpo Paulista',
    descricao: 'Refrigerante de cola'
  },
  {
    id: 'creme-dental-colgate-1',
    nome: 'Creme Dental Colgate Total 12 90g',
    preco: 5.80,
    categoria: 'Higiene',
    imagem: '/api/placeholder/200/200',
    lojaId: 'walmart-campo-limpo',
    loja: 'Walmart Campo Limpo Paulista',
    descricao: 'Creme dental com flúor'
  },

  // Produtos do Tenda Jundiaí
  {
    id: 'iogurte-danone-1',
    nome: 'Iogurte Danone Morango 170g',
    preco: 2.80,
    categoria: 'Bebidas',
    imagem: '/api/placeholder/200/200',
    lojaId: 'tenda-jundiai',
    loja: 'Tenda Jundiaí',
    descricao: 'Iogurte natural com polpa'
  },
  {
    id: 'sabao-em-po-omo-1',
    nome: 'Sabão em Pó Omo Multiação 1kg',
    preco: 11.90,
    categoria: 'Limpeza',
    imagem: '/api/placeholder/200/200',
    lojaId: 'tenda-jundiai',
    loja: 'Tenda Jundiaí',
    descricao: 'Sabão em pó concentrado'
  },
  {
    id: 'margarina-qualy-1',
    nome: 'Margarina Qualy com Sal 500g',
    preco: 6.40,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'tenda-jundiai',
    loja: 'Tenda Jundiaí',
    descricao: 'Margarina cremosa'
  },

  // Produtos do Carrefour Santana (São Paulo)
  {
    id: 'queijo-minas-1',
    nome: 'Queijo Minas Frescal 300g',
    preco: 8.50,
    categoria: 'Alimentação',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-santana',
    loja: 'Carrefour Santana',
    descricao: 'Queijo minas frescal'
  },
  {
    id: 'pao-forma-wickbold-1',
    nome: 'Pão de Forma Wickbold Integral 400g',
    preco: 5.90,
    categoria: 'Padaria',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-santana',
    loja: 'Carrefour Santana',
    descricao: 'Pão integral fatiado'
  },
  {
    id: 'condicionador-tresemme-1',
    nome: 'Condicionador TRESemmé Hidratação 400ml',
    preco: 12.90,
    categoria: 'Higiene',
    imagem: '/api/placeholder/200/200',
    lojaId: 'carrefour-santana',
    loja: 'Carrefour Santana',
    descricao: 'Condicionador hidratante'
  }
];

// Função para buscar produtos por localização
export const buscarProdutosPorLocalizacao = (
  termoBusca: string,
  userLocation: { lat: number; lng: number },
  distanciaMaxima: number = 25
): ProdutoComLocalizacao[] => {
  // Calcular distância usando fórmula simplificada
  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filtrar produtos por termo de busca
  const produtosFiltrados = produtosComLocalizacao.filter(produto =>
    produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Adicionar distância e filtrar por proximidade
  const produtosComDistancia = produtosFiltrados
    .map(produto => {
      const loja = lojasComLocalizacao.find(l => l.id === produto.lojaId);
      if (!loja) return null;
      
      const distancia = calcularDistancia(
        userLocation.lat,
        userLocation.lng,
        loja.coords.lat,
        loja.coords.lng
      );
      
      return {
        ...produto,
        distancia: Math.round(distancia * 10) / 10,
        lojaInfo: loja
      };
    })
    .filter(produto => produto && produto.distancia <= distanciaMaxima)
    .sort((a, b) => a!.distancia - b!.distancia);

  return produtosComDistancia.filter(p => p) as any[];
};

// Função para obter lojas próximas
export const obterLojasProximas = (
  userLocation: { lat: number; lng: number },
  distanciaMaxima: number = 25
): LojaLocation[] => {
  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return lojasComLocalizacao
    .map(loja => ({
      ...loja,
      distancia: calcularDistancia(
        userLocation.lat,
        userLocation.lng,
        loja.coords.lat,
        loja.coords.lng
      )
    }))
    .filter(loja => loja.distancia <= distanciaMaxima)
    .sort((a, b) => a.distancia - b.distancia) as any[];
};