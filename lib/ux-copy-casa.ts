/**
 * UX Writing — Minha Casa (Raio Familiar)
 * Benefício antes de mecânica. Linguagem do dia a dia.
 */

export const CASA = {
  /** Nome principal na interface */
  titulo: 'Minha Casa',
  subtitulo: 'Compras compartilhadas para quem mora junto',
  /** Termo técnico — só em rodapé ou ajuda */
  termoTecnico: 'Raio familiar',

  beneficios: [
    {
      titulo: 'Lista na mesma página',
      descricao: 'Sua esposa, filho ou colega de república vê o que você adicionou — na hora.',
    },
    {
      titulo: 'Menos compra duplicada',
      descricao: 'Evite levar para casa o que já tem na despensa ou o que outra pessoa vai comprar.',
    },
    {
      titulo: 'Casa organizada',
      descricao: 'Todos sabem o que falta e quem atualizou a lista por último.',
    },
    {
      titulo: 'Sugestões no tamanho certo',
      descricao: 'Cesta e atacado consideram quantas pessoas moram com você.',
    },
  ] as const,

  cenarios: [
    { emoji: '💑', titulo: 'Casais', descricao: 'Dividam a lista do mercado sem mensagem perdida.' },
    { emoji: '👨‍👩‍👧', titulo: 'Famílias', descricao: 'Pais e filhos na mesma lista de compras.' },
    { emoji: '🏠', titulo: 'República', descricao: 'Quem mora junto, compra junto — sem confusão.' },
  ] as const,

  moraSozinho: {
    titulo: 'Mora sozinho?',
    descricao: 'Tudo bem — você pode usar o Precivox normalmente, sem criar uma casa.',
    cta: 'Continuar só com minha conta',
  },

  escolha: {
    criar: {
      titulo: 'Sou quem está organizando a casa',
      descricao: 'Você cuida do convite. Depois manda o código para quem mora com você.',
      cta: 'Criar minha casa',
    },
    entrar: {
      titulo: 'Recebi um convite',
      descricao: 'Alguém da sua casa já criou e te passou um código de 6 letras.',
      cta: 'Entrar na casa de alguém',
    },
  },

  criar: {
    titulo: 'Como sua casa se chama?',
    placeholder: 'Ex: Casa da Maria, Apt 302, Família Silva',
    dica: 'Só para identificar — pode ser apelido, bairro ou sobrenome.',
    cta: 'Criar e gerar convite',
    voltar: 'Voltar',
  },

  entrar: {
    titulo: 'Digite o código do convite',
    placeholder: '6 letras',
    dica: 'Peça o código para quem criou a casa no Precivox.',
    cta: 'Entrar na casa',
    voltar: 'Voltar',
  },

  sucesso: {
    titulo: 'Sua casa foi criada!',
    subtitulo: 'Agora convide quem mora com você.',
    proximos: [
      'Compartilhe o código abaixo',
      'Todos entram pelo app em Minha Casa',
      'A lista sincroniza quando vocês adicionam itens',
      'Ajustem quantas pessoas moram na casa',
    ],
    ctaPrincipal: 'Convidar agora',
    ctaSecundario: 'Ir para minha casa',
  },

  convite: {
    titulo: 'Convidar para a casa',
    copiar: 'Copiar código',
    copiado: 'Código copiado!',
    whatsapp: 'Enviar no WhatsApp',
    whatsappMsg: (nomeCasa: string, codigo: string) =>
      `Oi! Entra na nossa casa "${nomeCasa}" no Precivox.\n\nCódigo: *${codigo}*\n\n1. Abra precivox.com.br\n2. Vá em Minha Casa\n3. Toque em "Recebi um convite" e digite o código`,
    qrAlt: 'QR Code do convite',
    limite: (max: number) => `Até ${max} pessoas na mesma casa`,
  },

  ativo: {
    suaCasa: 'Sua casa',
    administrador: 'Administrador(a)',
    membro: 'Membro',
    membros: 'Quem mora aqui',
    compras: 'Compras compartilhadas',
    listaSync: 'Lista sincronizada',
    listaVazia: 'Ninguém adicionou itens ainda — comece pela busca.',
    ultimaAtualizacao: 'Última atualização',
    por: 'Por',
    itensPendentes: (n: number) => (n === 1 ? '1 item na lista' : `${n} itens na lista`),
    preferencias: 'Preferências da casa',
    preferenciasDesc: 'Valem para todos — ajudam a IA a sugerir tamanho de pacote e cesta.',
    volume: 'Quantas pessoas moram na casa?',
    volumeHint: 'Usado para sugerir atacado e tamanho de embalagem.',
    compartilharLista: 'Sincronizar lista de compras em tempo real',
    salvarPrefs: 'Salvar preferências',
    configuracoes: 'Configurações',
    sair: 'Sair desta casa',
    sairDesc: 'Você deixa de ver a lista compartilhada. Pode entrar de novo com o código.',
  },

  card: {
    inativoTitulo: 'Minha Casa',
    inativoDesc: 'Compartilhe a lista com quem mora com você.',
    ativoBadge: 'Casa ativa',
  },

  perfilLink: 'Minha Casa — listas compartilhadas →',

  banner: {
    titulo: 'Compartilhe a lista com quem mora com você',
    descricao: (n: number) =>
      `Você já tem ${n} ${n === 1 ? 'item' : 'itens'} na lista. Crie sua casa e todos veem as alterações na hora — sem mensagem perdida no WhatsApp.`,
    cta: 'Criar Minha Casa',
    dismiss: 'Agora não',
  },

  transferirAdmin: {
    titulo: 'Passar administração',
    descricao: 'Outra pessoa da casa passa a convidar membros e gerenciar preferências.',
    label: 'Novo administrador(a)',
    cta: 'Transferir administração',
    sucesso: 'Administração transferida!',
  },
} as const;
