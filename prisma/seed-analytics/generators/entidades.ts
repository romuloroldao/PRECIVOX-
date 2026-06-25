import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { CONFIG, MERCADOS_TEMPLATES, CIDADES_BR, PerfilMercado } from '../config';
import { seedId, gerarCnpj, randomInt, randomFloat, pick, addDays } from '../lib/utils';
import type { SeedLogger } from '../lib/logger';

const GESTORES_DATA = [
  { nome: 'Ricardo Almeida Silva', email: 'ricardo.almeida@precivox-seed.com', cargo: 'Gerente Comercial', telefone: '(11) 98765-4321', nivel: 'admin' },
  { nome: 'Fernanda Costa Oliveira', email: 'fernanda.costa@precivox-seed.com', cargo: 'Diretora de Operações', telefone: '(21) 97654-3210', nivel: 'admin' },
  { nome: 'Marcos Pereira Santos', email: 'marcos.pereira@precivox-seed.com', cargo: 'Supervisor Regional', telefone: '(31) 96543-2109', nivel: 'operacional' },
  { nome: 'Juliana Rodrigues Lima', email: 'juliana.rodrigues@precivox-seed.com', cargo: 'Analista de Pricing', telefone: '(41) 95432-1098', nivel: 'analista' },
];

const NOMES_CONSUMIDORES = [
  'Ana Paula Mendes', 'Carlos Eduardo Souza', 'Mariana Ferreira', 'João Pedro Alves',
  'Beatriz Nascimento', 'Lucas Henrique Rocha', 'Camila Duarte', 'Pedro Augusto Martins',
  'Larissa Gomes', 'Rafael Barbosa', 'Patricia Cavalcanti', 'Thiago Nunes',
  'Amanda Vieira', 'Bruno Carvalho', 'Isabela Teixeira', 'Gabriel Monteiro',
  'Helena Pires', 'Diego Araújo', 'Natália Freitas', 'Felipe Correa',
];

export interface MercadoCriado {
  id: string;
  nome: string;
  perfil: PerfilMercado;
  flagship: boolean;
  unidadeIds: string[];
  gestorId: string | null;
}

export async function criarPlanos(prisma: PrismaClient, logger: SeedLogger) {
  const planos = [
    { id: seedId('plano-basico'), nome: 'Básico Seed', valor: 299.9, duracao: 30, limiteUnidades: 1, limiteUsuarios: 3 },
    { id: seedId('plano-inter'), nome: 'Intermediário Seed', valor: 599.9, duracao: 30, limiteUnidades: 3, limiteUsuarios: 8 },
    { id: seedId('plano-avancado'), nome: 'Avançado Seed', valor: 1299.9, duracao: 30, limiteUnidades: 10, limiteUsuarios: 25 },
    { id: seedId('plano-enterprise'), nome: 'Enterprise Seed', valor: 2499.9, duracao: 30, limiteUnidades: 50, limiteUsuarios: 100 },
  ];

  for (const p of planos) {
    await prisma.planos_de_pagamento.upsert({
      where: { id: p.id },
      create: { ...p, descricao: `Plano ${p.nome} — seed analítico`, limiteUploadMb: 50, ativo: true },
      update: { nome: p.nome, valor: p.valor },
    });
  }
  logger.ok(`${planos.length} planos de pagamento criados/atualizados`);
  return planos;
}

export async function criarGestores(prisma: PrismaClient, logger: SeedLogger, senhaHash: string) {
  const gestores: { id: string; email: string }[] = [];
  const now = new Date();

  for (let i = 0; i < CONFIG.gestores; i++) {
    const g = GESTORES_DATA[i];
    const id = seedId(`gestor-${i}`);
    await prisma.user.upsert({
      where: { email: g.email },
      create: {
        id,
        nome: g.nome,
        email: g.email,
        role: Role.GESTOR,
        senhaHash,
        emailVerified: now,
        dataCriacao: addDays(now, -randomInt(30, 365)),
        dataAtualizacao: now,
        ultimoLogin: addDays(now, -randomInt(0, 7)),
        perfilPreci: {
          cargo: g.cargo,
          telefone: g.telefone,
          nivelAcesso: g.nivel,
          permissoes: g.nivel === 'admin' ? ['full'] : g.nivel === 'operacional' ? ['estoque', 'vendas', 'relatorios'] : ['relatorios', 'pricing'],
          metricasUso: { logins30d: randomInt(15, 90), acoesGestor: randomInt(50, 500), relatoriosExportados: randomInt(5, 40) },
        },
      },
      update: {
        nome: g.nome,
        senhaHash,
        emailVerified: now,
        ultimoLogin: addDays(now, -randomInt(0, 3)),
      },
    });
    gestores.push({ id, email: g.email });
  }
  logger.ok(`${gestores.length} gestores criados`);
  return gestores;
}

export async function criarConsumidores(prisma: PrismaClient, logger: SeedLogger, senhaHash: string) {
  const consumidores: { id: string; nome: string }[] = [];
  const now = new Date();

  for (let i = 0; i < CONFIG.consumidores; i++) {
    const nome = NOMES_CONSUMIDORES[i];
    const email = `consumidor${i + 1}@precivox-seed.com`;
    const id = seedId(`cliente-${i}`);
    await prisma.user.upsert({
      where: { email },
      create: {
        id,
        nome,
        email,
        role: Role.CLIENTE,
        senhaHash,
        emailVerified: now,
        dataCriacao: addDays(now, -randomInt(7, 400)),
        dataAtualizacao: now,
        ultimoLogin: addDays(now, -randomInt(0, 14)),
        perfilPreci: {
          preferencias: pick([['economico'], ['premium'], ['organico'], ['rapido'], ['economico', 'organico']]),
          raioFamiliar: randomInt(1, 5),
          frequenciaCompra: pick(['semanal', 'quinzenal', 'diaria', 'mensal']),
        },
      },
      update: { nome, senhaHash, emailVerified: now },
    });
    consumidores.push({ id, nome });
  }
  logger.ok(`${consumidores.length} consumidores (clientes) criados`);
  return consumidores;
}

function horarioPorPerfil(perfil: PerfilMercado): string {
  const map: Record<PerfilMercado, string> = {
    premium: 'Seg-Sáb 7h-22h, Dom 8h-20h',
    atacarejo: 'Seg-Sáb 6h-23h, Dom 7h-21h',
    bairro: 'Seg-Sáb 7h-21h, Dom 7h-13h',
    conveniencia: '24 horas',
  };
  return map[perfil];
}

export async function criarMercados(
  prisma: PrismaClient,
  logger: SeedLogger,
  gestores: { id: string }[],
  planos: { id: string }[],
): Promise<MercadoCriado[]> {
  const mercados: MercadoCriado[] = [];
  const now = new Date();

  for (let i = 0; i < MERCADOS_TEMPLATES.length; i++) {
    const tmpl = MERCADOS_TEMPLATES[i];
    const cidade = CIDADES_BR[i % CIDADES_BR.length];
    const mercadoId = seedId(`mercado-${i}`);
    const gestorId = gestores[i % gestores.length].id;
    const planoId = tmpl.flagship ? planos[2].id : planos[i % 3].id;

    await prisma.mercados.upsert({
      where: { id: mercadoId },
      create: {
        id: mercadoId,
        nome: tmpl.nome,
        cnpj: gerarCnpj(1000 + i),
        descricao: `${tmpl.segmento} — ${tmpl.publicoAlvo}. Perfil: ${tmpl.perfil}. Volume: ${tmpl.volumeVendas}.`,
        telefone: `(${randomInt(11, 99)}) ${randomInt(3000, 9999)}-${randomInt(1000, 9999)}`,
        emailContato: `contato@${tmpl.nome.toLowerCase().replace(/\s+/g, '')}.com.br`,
        horarioFuncionamento: horarioPorPerfil(tmpl.perfil),
        ativo: true,
        dataCriacao: addDays(now, -randomInt(180, 730)),
        dataAtualizacao: now,
        planoId,
        gestorId,
        parceiroTier: tmpl.flagship ? randomInt(2, 3) : 1,
        parceiroSlaContrato: {
          syncHoras: tmpl.flagship ? 4 : 24,
          uptimeMin: tmpl.flagship ? 99.5 : 98,
          segmento: tmpl.segmento,
        },
        syncAgendado: { ativo: tmpl.flagship, cron: '0 6 * * *' },
      },
      update: { nome: tmpl.nome, gestorId, planoId, dataAtualizacao: now },
    });

    const unidadeIds: string[] = [];
    for (let u = 0; u < tmpl.unidades; u++) {
      const bairro = pick(cidade.bairros);
      const unidadeId = seedId(`unidade-${i}-${u}`);
      const lat = cidade.lat + randomFloat(-0.05, 0.05, 6);
      const lng = cidade.lng + randomFloat(-0.05, 0.05, 6);

      await prisma.unidades.upsert({
        where: { id: unidadeId },
        create: {
          id: unidadeId,
          nome: u === 0 ? `${tmpl.nome} — Matriz` : `${tmpl.nome} — Filial ${bairro}`,
          endereco: `Rua ${pick(['das Flores', 'Principal', 'Comercial', 'São João', 'Brasil'])}, ${randomInt(100, 2500)}`,
          bairro,
          cidade: cidade.cidade,
          estado: cidade.estado,
          cep: `${randomInt(10000, 99999)}-${randomInt(100, 999)}`,
          telefone: `(${randomInt(11, 99)}) ${randomInt(3000, 9999)}-${randomInt(1000, 9999)}`,
          horarioFuncionamento: horarioPorPerfil(tmpl.perfil),
          latitude: lat,
          longitude: lng,
          ativa: true,
          dataCriacao: addDays(now, -randomInt(90, 600)),
          dataAtualizacao: now,
          mercadoId,
        },
        update: { nome: `${tmpl.nome} — ${u === 0 ? 'Matriz' : `Filial ${bairro}`}`, dataAtualizacao: now },
      });
      unidadeIds.push(unidadeId);
    }

    mercados.push({
      id: mercadoId,
      nome: tmpl.nome,
      perfil: tmpl.perfil,
      flagship: tmpl.flagship,
      unidadeIds,
      gestorId,
    });
    logger.info(`Mercado ${i + 1}/${MERCADOS_TEMPLATES.length}: ${tmpl.nome} (${tmpl.unidades} unidade(s))`);
  }

  logger.ok(`${mercados.length} mercados e ${mercados.reduce((s, m) => s + m.unidadeIds.length, 0)} unidades criados`);
  return mercados;
}
