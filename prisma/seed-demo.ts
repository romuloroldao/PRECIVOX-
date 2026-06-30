/**
 * Seed de DEMONSTRAÇÃO — Precivox
 *
 * Diferente do seed analítico (volume pesado, credenciais *@precivox-seed.com),
 * este seed gera um cenário ENXUTO e COERENTE em que as CONTAS DE LOGIN reais
 * são donas dos dados:
 *
 *   - gestor@precivox.com   → dono do mercado flagship "Supermercado Precivox Centro"
 *                             (dashboard, IA, vendas, métricas populados)
 *   - cliente@precivox.com  → tem listas, economia, streak e badges
 *   - admin@precivox.com    → acesso total
 *
 * Catálogo realista replicado em 3 mercados com preços variados, então a
 * comparação de preço do cliente e a página /cliente/produto/[id] funcionam.
 *
 * Idempotente: remove os dados com prefixo `demo-` antes de reinserir.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." npm run db:seed:demo
 */

import 'dotenv/config';
import { PrismaClient, Role, EstoqueFonte } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('❌ Defina DATABASE_URL (.env / .env.local) e rode: npm run db:seed:demo');
  process.exit(1);
}

const prisma = new PrismaClient();
const PASSWORD = 'senha123';
const PREFIX = 'demo-';
const now = new Date();

function rint(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rfloat(min: number, max: number, dec = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 86400000);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// --- Catálogo de demonstração (preço-base de referência) ---
interface ProdutoDemo {
  nome: string;
  categoria: string;
  marca: string;
  unidade: string;
  preco: number;
  abc: 'A' | 'B' | 'C';
}

const CATALOGO: ProdutoDemo[] = [
  // Bebidas
  { nome: 'Cerveja Pilsen Lata 350ml', categoria: 'Bebidas', marca: 'Skol', unidade: '350ml', preco: 3.49, abc: 'A' },
  { nome: 'Refrigerante Cola 2L', categoria: 'Bebidas', marca: 'Coca-Cola', unidade: '2L', preco: 9.9, abc: 'A' },
  { nome: 'Suco de Laranja Integral 1L', categoria: 'Bebidas', marca: 'Do Bem', unidade: '1L', preco: 12.5, abc: 'B' },
  { nome: 'Água Mineral sem Gás 1,5L', categoria: 'Bebidas', marca: 'Crystal', unidade: '1,5L', preco: 2.99, abc: 'A' },
  { nome: 'Café Torrado e Moído 500g', categoria: 'Bebidas', marca: 'Pilão', unidade: '500g', preco: 18.9, abc: 'A' },
  // Laticínios
  { nome: 'Leite UHT Integral 1L', categoria: 'Laticínios', marca: 'Itambé', unidade: '1L', preco: 5.49, abc: 'A' },
  { nome: 'Queijo Mussarela Fatiado 150g', categoria: 'Laticínios', marca: 'Tirolez', unidade: '150g', preco: 11.9, abc: 'B' },
  { nome: 'Iogurte Natural 170g', categoria: 'Laticínios', marca: 'Nestlé', unidade: '170g', preco: 3.29, abc: 'B' },
  { nome: 'Manteiga com Sal 200g', categoria: 'Laticínios', marca: 'Aviação', unidade: '200g', preco: 13.9, abc: 'B' },
  { nome: 'Requeijão Cremoso 200g', categoria: 'Laticínios', marca: 'Catupiry', unidade: '200g', preco: 8.49, abc: 'B' },
  // Grãos e Cereais
  { nome: 'Arroz Branco Tipo 1 5kg', categoria: 'Grãos e Cereais', marca: 'Tio João', unidade: '5kg', preco: 27.9, abc: 'A' },
  { nome: 'Feijão Carioca 1kg', categoria: 'Grãos e Cereais', marca: 'Camil', unidade: '1kg', preco: 8.99, abc: 'A' },
  { nome: 'Macarrão Espaguete 500g', categoria: 'Grãos e Cereais', marca: 'Renata', unidade: '500g', preco: 4.79, abc: 'A' },
  { nome: 'Açúcar Refinado 1kg', categoria: 'Grãos e Cereais', marca: 'União', unidade: '1kg', preco: 4.29, abc: 'A' },
  { nome: 'Farinha de Trigo 1kg', categoria: 'Grãos e Cereais', marca: 'Dona Benta', unidade: '1kg', preco: 5.59, abc: 'B' },
  // Mercearia
  { nome: 'Óleo de Soja 900ml', categoria: 'Mercearia', marca: 'Liza', unidade: '900ml', preco: 7.49, abc: 'A' },
  { nome: 'Molho de Tomate 340g', categoria: 'Mercearia', marca: 'Quero', unidade: '340g', preco: 2.99, abc: 'B' },
  { nome: 'Sal Refinado 1kg', categoria: 'Mercearia', marca: 'Cisne', unidade: '1kg', preco: 2.49, abc: 'C' },
  { nome: 'Biscoito Recheado 130g', categoria: 'Mercearia', marca: 'Trakinas', unidade: '130g', preco: 3.19, abc: 'B' },
  { nome: 'Atum em Lata 170g', categoria: 'Mercearia', marca: 'Gomes da Costa', unidade: '170g', preco: 9.49, abc: 'C' },
  // Padaria
  { nome: 'Pão de Forma Integral 500g', categoria: 'Padaria', marca: 'Pullman', unidade: '500g', preco: 8.9, abc: 'B' },
  { nome: 'Pão Francês (kg)', categoria: 'Padaria', marca: 'Padaria', unidade: 'kg', preco: 14.9, abc: 'A' },
  // Hortifruti
  { nome: 'Banana Prata (kg)', categoria: 'Hortifruti', marca: 'Hortifruti', unidade: 'kg', preco: 5.99, abc: 'A' },
  { nome: 'Tomate (kg)', categoria: 'Hortifruti', marca: 'Hortifruti', unidade: 'kg', preco: 7.49, abc: 'A' },
  { nome: 'Batata Inglesa (kg)', categoria: 'Hortifruti', marca: 'Hortifruti', unidade: 'kg', preco: 4.99, abc: 'B' },
  { nome: 'Cebola (kg)', categoria: 'Hortifruti', marca: 'Hortifruti', unidade: 'kg', preco: 4.49, abc: 'B' },
  // Açougue
  { nome: 'Patinho Bovino (kg)', categoria: 'Açougue', marca: 'Friboi', unidade: 'kg', preco: 39.9, abc: 'A' },
  { nome: 'Peito de Frango (kg)', categoria: 'Açougue', marca: 'Sadia', unidade: 'kg', preco: 16.9, abc: 'A' },
  { nome: 'Linguiça Toscana (kg)', categoria: 'Açougue', marca: 'Seara', unidade: 'kg', preco: 19.9, abc: 'B' },
  // Congelados
  { nome: 'Pizza Congelada Mussarela 460g', categoria: 'Congelados', marca: 'Sadia', unidade: '460g', preco: 18.5, abc: 'B' },
  { nome: 'Batata Palito Congelada 1,05kg', categoria: 'Congelados', marca: 'McCain', unidade: '1,05kg', preco: 16.9, abc: 'C' },
  // Limpeza
  { nome: 'Detergente Líquido 500ml', categoria: 'Limpeza', marca: 'Ypê', unidade: '500ml', preco: 2.79, abc: 'A' },
  { nome: 'Sabão em Pó 1kg', categoria: 'Limpeza', marca: 'Omo', unidade: '1kg', preco: 14.9, abc: 'A' },
  { nome: 'Água Sanitária 2L', categoria: 'Limpeza', marca: 'Qboa', unidade: '2L', preco: 6.49, abc: 'B' },
  { nome: 'Papel Higiênico 12 rolos', categoria: 'Limpeza', marca: 'Neve', unidade: '12un', preco: 19.9, abc: 'A' },
  // Higiene
  { nome: 'Sabonete em Barra 90g', categoria: 'Higiene', marca: 'Dove', unidade: '90g', preco: 3.49, abc: 'B' },
  { nome: 'Creme Dental 90g', categoria: 'Higiene', marca: 'Colgate', unidade: '90g', preco: 4.99, abc: 'B' },
  { nome: 'Shampoo 350ml', categoria: 'Higiene', marca: 'Seda', unidade: '350ml', preco: 12.9, abc: 'C' },
  { nome: 'Desodorante Aerosol 150ml', categoria: 'Higiene', marca: 'Rexona', unidade: '150ml', preco: 13.9, abc: 'C' },
];

// 3 mercados: flagship (gestor@) + 2 concorrentes. Multiplicadores de preço por perfil.
const MERCADOS = [
  {
    id: `${PREFIX}mercado-precivox`,
    nome: 'Supermercado Precivox Centro',
    perfil: 'flagship' as const,
    mult: 1.0,
    cnpj: '11222333000181',
    cidade: 'São Paulo',
    estado: 'SP',
    bairro: 'Centro',
    lat: -23.5505,
    lng: -46.6333,
    isOwner: true,
  },
  {
    id: `${PREFIX}mercado-economico`,
    nome: 'Atacarejo Economia Total',
    perfil: 'atacarejo' as const,
    mult: 0.9,
    cnpj: '22333444000172',
    cidade: 'São Paulo',
    estado: 'SP',
    bairro: 'Tatuapé',
    lat: -23.5402,
    lng: -46.5766,
    isOwner: false,
  },
  {
    id: `${PREFIX}mercado-bairro`,
    nome: 'Mercadinho do Bairro',
    perfil: 'bairro' as const,
    mult: 1.12,
    cnpj: '33444555000163',
    cidade: 'São Paulo',
    estado: 'SP',
    bairro: 'Pinheiros',
    lat: -23.5617,
    lng: -46.7019,
    isOwner: false,
  },
];

async function ensureUser(email: string, nome: string, role: Role, senhaHash: string) {
  return prisma.user.upsert({
    where: { email },
    create: {
      id: `${PREFIX}user-${role.toLowerCase()}`,
      email,
      nome,
      role,
      senhaHash,
      emailVerified: now,
      dataCriacao: addDays(now, -180),
      dataAtualizacao: now,
      ultimoLogin: now,
    },
    update: { nome, role, senhaHash, emailVerified: now, dataAtualizacao: now },
  });
}

async function limparDemo(clienteId: string) {
  // Ordem segura: filhos antes de pais (cascade cobre o resto).
  await prisma.savingsHistory.deleteMany({ where: { OR: [{ userId: clienteId }, { id: { startsWith: PREFIX } }] } });
  await prisma.user_badges.deleteMany({ where: { userId: clienteId } });
  await prisma.userStreak.deleteMany({ where: { userId: clienteId } });
  await prisma.itens_lista.deleteMany({ where: { listas_compras: { usuarioId: clienteId } } });
  await prisma.listas_compras.deleteMany({ where: { usuarioId: clienteId } });
  await prisma.vendas.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.movimentacoes_estoque.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.alertas_ia.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.analises_ia.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.metricas_dashboard.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.estoques.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.produtos.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.unidades.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.mercados.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.badges.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.planos_de_pagamento.deleteMany({ where: { id: { startsWith: PREFIX } } });
}

async function main() {
  console.log('🌱 Seed de DEMONSTRAÇÃO Precivox iniciando...');
  const senhaHash = await bcrypt.hash(PASSWORD, 12);

  const admin = await ensureUser('admin@precivox.com', 'Administrador Precivox', Role.ADMIN, senhaHash);
  const gestor = await ensureUser('gestor@precivox.com', 'Gestor Demo', Role.GESTOR, senhaHash);
  const cliente = await ensureUser('cliente@precivox.com', 'Cliente Demo', Role.CLIENTE, senhaHash);
  console.log('✅ Usuários de login garantidos (admin/gestor/cliente@precivox.com)');

  await limparDemo(cliente.id);

  // Plano
  const planoId = `${PREFIX}plano`;
  await prisma.planos_de_pagamento.create({
    data: {
      id: planoId,
      nome: 'Plano Demo Enterprise',
      descricao: 'Plano de demonstração com todos os recursos',
      valor: 1299.9,
      duracao: 30,
      limiteUnidades: 10,
      limiteUsuarios: 25,
      limiteUploadMb: 100,
      ativo: true,
    },
  });

  // Mercados + unidades
  const unidadePorMercado = new Map<string, string>();
  for (const m of MERCADOS) {
    await prisma.mercados.create({
      data: {
        id: m.id,
        nome: m.nome,
        cnpj: m.cnpj,
        descricao: `${m.nome} — cenário de demonstração Precivox`,
        telefone: `(11) ${rint(3000, 9999)}-${rint(1000, 9999)}`,
        emailContato: `contato@${m.nome.toLowerCase().replace(/[^a-z]/g, '')}.com.br`,
        horarioFuncionamento: 'Seg-Sáb 8h-22h, Dom 8h-20h',
        ativo: true,
        dataCriacao: addDays(now, -365),
        dataAtualizacao: now,
        planoId,
        gestorId: m.isOwner ? gestor.id : null,
        parceiroTier: m.perfil === 'flagship' ? 3 : 1,
      },
    });

    const unidadeId = `${PREFIX}unidade-${m.id.slice(-8)}`;
    await prisma.unidades.create({
      data: {
        id: unidadeId,
        nome: `${m.nome} — Matriz`,
        endereco: `Av. ${pick(['Paulista', 'Brasil', 'Central', 'das Nações'])}, ${rint(100, 2500)}`,
        bairro: m.bairro,
        cidade: m.cidade,
        estado: m.estado,
        cep: `${rint(10000, 99999)}-${rint(100, 999)}`,
        telefone: `(11) ${rint(3000, 9999)}-${rint(1000, 9999)}`,
        horarioFuncionamento: 'Seg-Sáb 8h-22h, Dom 8h-20h',
        latitude: m.lat + rfloat(-0.01, 0.01, 6),
        longitude: m.lng + rfloat(-0.01, 0.01, 6),
        ativa: true,
        dataCriacao: addDays(now, -300),
        dataAtualizacao: now,
        mercadoId: m.id,
      },
    });
    unidadePorMercado.set(m.id, unidadeId);
  }
  console.log(`✅ ${MERCADOS.length} mercados + unidades (flagship dono: gestor@precivox.com)`);

  // Produtos (catálogo global)
  const produtoIds: { id: string; ref: ProdutoDemo }[] = [];
  for (let i = 0; i < CATALOGO.length; i++) {
    const p = CATALOGO[i];
    const id = `${PREFIX}prod-${String(i).padStart(3, '0')}`;
    await prisma.produtos.create({
      data: {
        id,
        nome: p.nome,
        descricao: `${p.nome} — ${p.marca}. Produto de demonstração.`,
        categoria: p.categoria,
        codigoBarras: `789${String(1000000000 + i).padStart(10, '0')}`,
        marca: p.marca,
        unidadeMedida: p.unidade,
        ativo: true,
        dataCriacao: addDays(now, -200),
        dataAtualizacao: now,
        giroEstoqueMedio: rfloat(2, 12),
        elasticidadePreco: rfloat(-2.2, -0.6),
        demandaPrevista7d: rint(20, 200),
        demandaPrevista30d: rint(80, 800),
        pontoReposicao: rint(10, 50),
        categoriaABC: p.abc,
        scoreSazonalidade: rfloat(0.2, 0.8),
        ultimaAtualizacaoIA: now,
      },
    });
    produtoIds.push({ id, ref: p });
  }
  console.log(`✅ ${produtoIds.length} produtos no catálogo`);

  // Estoques — todos os produtos em todos os mercados, preços variados
  let estoqueCount = 0;
  for (const m of MERCADOS) {
    const unidadeId = unidadePorMercado.get(m.id)!;
    for (const { id: produtoId, ref } of produtoIds) {
      // concorrentes podem não ter ~10% do catálogo
      if (!m.isOwner && Math.random() < 0.1) continue;

      const ruido = rfloat(0.95, 1.08);
      const preco = round2(ref.preco * m.mult * ruido);
      const emPromo = Math.random() < (m.perfil === 'atacarejo' ? 0.18 : 0.08);
      const precoPromo = emPromo ? round2(preco * rfloat(0.78, 0.92)) : null;

      await prisma.estoques.create({
        data: {
          id: `${PREFIX}est-${m.id.slice(-6)}-${produtoId.slice(-3)}`,
          quantidade: rint(0, 120),
          preco,
          precoPromocional: precoPromo,
          emPromocao: emPromo,
          disponivel: Math.random() > 0.03,
          atualizadoEm: addDays(now, -rint(0, 5)),
          fonte: m.isOwner ? EstoqueFonte.UPLOAD_GESTOR : pick([EstoqueFonte.API_PARCEIRO, EstoqueFonte.CROWD]),
          confianca: rint(70, 98),
          verificadoEm: addDays(now, -rint(0, 10)),
          unidadeId,
          produtoId,
        },
      });
      estoqueCount++;
    }
  }
  console.log(`✅ ${estoqueCount} registros de estoque (comparação de preço cross-mercado)`);

  // Vendas do flagship — 45 dias
  const flagship = MERCADOS.find((m) => m.isOwner)!;
  const flagshipUnidade = unidadePorMercado.get(flagship.id)!;
  const topProdutos = produtoIds.filter((p) => p.ref.abc === 'A');
  const midProdutos = produtoIds.filter((p) => p.ref.abc === 'B');
  const vendasData: { id: string; produtoId: string; unidadeId: string; quantidade: number; precoUnitario: number; precoTotal: number; desconto: number; formaPagamento: string; clienteId: string | null; dataVenda: Date }[] = [];
  const FORMAS = ['credito', 'debito', 'pix', 'dinheiro'];

  for (let dia = 45; dia >= 0; dia--) {
    const dataBase = addDays(now, -dia);
    const vendasDia = rint(8, 22);
    for (let v = 0; v < vendasDia; v++) {
      const dataVenda = new Date(dataBase);
      dataVenda.setHours(pick([8, 9, 11, 12, 13, 17, 18, 19, 20]), rint(0, 59));
      const itens = rint(1, 4);
      const pool = [...topProdutos, ...topProdutos, ...midProdutos];
      for (let it = 0; it < itens; it++) {
        const { id: produtoId, ref } = pick(pool);
        const qtd = rint(1, 5);
        const emPromo = Math.random() < 0.1;
        const precoUnit = round2(ref.preco * (emPromo ? 0.85 : 1));
        vendasData.push({
          id: `${PREFIX}venda-${dia}-${v}-${it}-${produtoId.slice(-3)}`,
          produtoId,
          unidadeId: flagshipUnidade,
          quantidade: qtd,
          precoUnitario: precoUnit,
          precoTotal: round2(precoUnit * qtd),
          desconto: emPromo ? round2(ref.preco - precoUnit) : 0,
          formaPagamento: pick(FORMAS),
          clienteId: Math.random() > 0.5 ? cliente.id : null,
          dataVenda,
        });
      }
    }
  }
  // dedup por id (colisões improváveis, mas garante createMany)
  const vendasUnicas = Array.from(new Map(vendasData.map((v) => [v.id, v])).values());
  await prisma.vendas.createMany({ data: vendasUnicas, skipDuplicates: true });
  console.log(`✅ ${vendasUnicas.length} vendas (45 dias) no flagship`);

  // Métricas dashboard — 60 dias flagship
  const metricas: Parameters<typeof prisma.metricas_dashboard.createMany>[0]['data'] = [];
  for (let dia = 60; dia >= 0; dia--) {
    const baseFat = rfloat(18000, 65000);
    metricas.push({
      id: `${PREFIX}met-${dia}`,
      mercadoId: flagship.id,
      data: addDays(now, -dia),
      periodo: 'DIARIO',
      giroEstoqueGeral: rfloat(3, 10),
      taxaRuptura: rfloat(0.01, 0.06),
      valorEstoque: rfloat(120000, 320000),
      diasCobertura: rfloat(8, 20),
      produtosAtivos: produtoIds.length,
      produtosInativos: rint(0, 4),
      ticketMedio: rfloat(45, 130),
      quantidadeVendas: Math.round(baseFat / rfloat(50, 80)),
      faturamentoDia: baseFat,
      margemLiquida: rfloat(0.06, 0.14),
      margemBruta: rfloat(0.2, 0.34),
      taxaConversao: rfloat(0.15, 0.32),
      taxaRecompra: rfloat(0.3, 0.6),
      clientesAtivos: rint(80, 350),
      clientesNovos: rint(5, 30),
      nps: rfloat(7, 9.3),
      churnRate: rfloat(0.02, 0.09),
    });
  }
  await prisma.metricas_dashboard.createMany({ data: metricas, skipDuplicates: true });
  console.log(`✅ ${metricas.length} métricas de dashboard (60 dias)`);

  // Análises IA + alertas no flagship
  const analises: Parameters<typeof prisma.analises_ia.createMany>[0]['data'] = [];
  const alertas: Parameters<typeof prisma.alertas_ia.createMany>[0]['data'] = [];
  const amostraIA = produtoIds.slice(0, 14);
  for (const { id: produtoId, ref } of amostraIA) {
    analises.push({
      id: `${PREFIX}analise-${produtoId.slice(-3)}`,
      mercadoId: flagship.id,
      unidadeId: flagshipUnidade,
      produtoId,
      tipo: pick(['DEMANDA', 'PRECO', 'ESTOQUE', 'SAZONALIDADE']),
      categoria: ref.categoria,
      resultado: {
        demandaPrevista: rint(50, 400),
        elasticidade: rfloat(-2, -0.6),
        recomendacaoPreco: round2(ref.preco * rfloat(0.95, 1.08)),
        confianca: rfloat(0.7, 0.95),
      },
      recomendacao: pick([
        'Aumentar estoque em 15% para a próxima semana',
        'Reduzir preço em 5% para estimular demanda',
        'Ativar promoção cruzada com produtos complementares',
        'Antecipar reposição — risco de ruptura em 3 dias',
      ]),
      prioridade: pick(['ALTA', 'MEDIA', 'BAIXA']),
      impactoEstimado: rfloat(500, 12000),
      status: pick(['PENDENTE', 'ACEITA', 'EXECUTADA']),
      criadoEm: addDays(now, -rint(0, 20)),
    });

    if (Math.random() < 0.5) {
      alertas.push({
        id: `${PREFIX}alerta-${produtoId.slice(-3)}`,
        mercadoId: flagship.id,
        unidadeId: flagshipUnidade,
        produtoId,
        tipo: pick(['RUPTURA', 'PRECO', 'DEMANDA', 'VALIDADE']),
        titulo: `Alerta: ${ref.nome}`,
        descricao: pick([
          'Estoque abaixo do mínimo',
          'Pico de demanda detectado',
          'Concorrente reduziu preço',
          'Validade próxima — 3 dias',
        ]),
        prioridade: pick(['ALTA', 'MEDIA', 'BAIXA']),
        acaoRecomendada: 'Revisar política de reposição',
        lido: Math.random() > 0.6,
        lidoEm: null,
        criadoEm: addDays(now, -rint(0, 10)),
      });
    }
  }
  await prisma.analises_ia.createMany({ data: analises, skipDuplicates: true });
  await prisma.alertas_ia.createMany({ data: alertas, skipDuplicates: true });
  console.log(`✅ ${analises.length} análises IA + ${alertas.length} alertas no flagship`);

  // --- Lado CLIENTE: listas, economia, streak, badges ---
  const lista1 = await prisma.listas_compras.create({
    data: { id: `${PREFIX}lista-mensal`, nome: 'Compras do Mês', usuarioId: cliente.id, ativo: true },
  });
  const lista2 = await prisma.listas_compras.create({
    data: { id: `${PREFIX}lista-churrasco`, nome: 'Churrasco de Sábado', usuarioId: cliente.id, ativo: true },
  });

  const itensLista1 = produtoIds.slice(0, 8);
  const itensLista2 = produtoIds.filter((p) => ['Açougue', 'Bebidas'].includes(p.ref.categoria)).slice(0, 5);
  await prisma.itens_lista.createMany({
    data: [
      ...itensLista1.map((p, idx) => ({ id: `${PREFIX}item1-${idx}`, listaId: lista1.id, produtoId: p.id, quantidade: rint(1, 4), comprado: idx < 3 })),
      ...itensLista2.map((p, idx) => ({ id: `${PREFIX}item2-${idx}`, listaId: lista2.id, produtoId: p.id, quantidade: rint(1, 6), comprado: false })),
    ],
    skipDuplicates: true,
  });

  // Economia (centavos)
  const savings: Parameters<typeof prisma.savingsHistory.createMany>[0]['data'] = [];
  for (let i = 0; i < 20; i++) {
    const p = pick(produtoIds);
    const avg = Math.round(p.ref.preco * 100 * rfloat(1.15, 1.35));
    const paid = Math.round(p.ref.preco * 100 * rfloat(0.75, 0.92));
    savings.push({
      id: `${PREFIX}saving-${i}`,
      userId: cliente.id,
      listId: i % 2 === 0 ? lista1.id : lista2.id,
      productId: p.id,
      pricePaid: paid,
      avgPrice: avg,
      savings: Math.max(0, avg - paid),
      date: addDays(now, -rint(0, 60)),
    });
  }
  await prisma.savingsHistory.createMany({ data: savings, skipDuplicates: true });
  const totalSavings = savings.reduce((s, x) => s + x.savings, 0);

  // Streak
  await prisma.userStreak.create({
    data: {
      id: `${PREFIX}streak-cliente`,
      userId: cliente.id,
      currentStreak: 7,
      longestStreak: 21,
      lastLogin: now,
    },
  });

  // Badges (definições) + desbloqueios
  const BADGES = [
    { id: `${PREFIX}badge-first-list`, name: 'Primeira Lista', description: 'Criou sua primeira lista de compras', icon: '📝', category: 'listas', points: 10, requirementType: 'TOTAL_LISTS', requirementValue: 1 },
    { id: `${PREFIX}badge-saver`, name: 'Economista', description: 'Economizou mais de R$ 50', icon: '💰', category: 'economia', points: 25, requirementType: 'TOTAL_SAVINGS', requirementValue: 5000 },
    { id: `${PREFIX}badge-streak-7`, name: 'Semana Fiel', description: '7 dias consecutivos de uso', icon: '🔥', category: 'engajamento', points: 30, requirementType: 'CONSECUTIVE_DAYS', requirementValue: 7 },
    { id: `${PREFIX}badge-referral`, name: 'Embaixador', description: 'Indicou um amigo', icon: '🤝', category: 'social', points: 40, requirementType: 'TOTAL_REFERRALS', requirementValue: 1 },
  ];
  await prisma.badges.createMany({ data: BADGES, skipDuplicates: true });

  // Desbloqueia os 3 que o cliente já satisfaz (lista, economia, streak)
  await prisma.user_badges.createMany({
    data: [
      { id: `${PREFIX}ub-1`, userId: cliente.id, badgeId: `${PREFIX}badge-first-list`, progress: 2, unlockedAt: addDays(now, -30) },
      { id: `${PREFIX}ub-2`, userId: cliente.id, badgeId: `${PREFIX}badge-saver`, progress: totalSavings, unlockedAt: addDays(now, -10) },
      { id: `${PREFIX}ub-3`, userId: cliente.id, badgeId: `${PREFIX}badge-streak-7`, progress: 7, unlockedAt: now },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Cliente: 2 listas, ${savings.length} economias (R$ ${(totalSavings / 100).toFixed(2)}), streak 7d, 3 badges`);

  console.log('');
  console.log('📋 Credenciais de demonstração (senha: senha123):');
  console.log('   Admin:   admin@precivox.com');
  console.log('   Gestor:  gestor@precivox.com   → dono do "Supermercado Precivox Centro"');
  console.log('   Cliente: cliente@precivox.com  → listas, economia e badges');
  console.log('');
  console.log('✅ Seed de demonstração concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed de demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
