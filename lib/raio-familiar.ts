/**
 * Raio familiar — conta compartilhada (listas + preferências da casa) — Épico 8.4
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

import {
  RAIO_FAMILIAR_MAX_MEMBROS,
  RAIO_FAMILIAR_CODIGO_LEN,
} from '@/lib/raio-familiar-constants';

export { RAIO_FAMILIAR_MAX_MEMBROS, RAIO_FAMILIAR_CODIGO_LEN } from '@/lib/raio-familiar-constants';

export type RaioFamiliarRole = 'admin' | 'membro';

export type RaioFamiliarMembro = {
  userId: string;
  nome: string;
  role: RaioFamiliarRole;
  entrouEm: string;
};

export type PreferenciasCasa = {
  volumeFamiliar: number;
  mercadoPreferidoId: string | null;
  compartilharListas: boolean;
};

export type ItemListaCompartilhada = {
  id: string;
  produtoCatalogoId?: string;
  estoqueId: string;
  nome: string;
  preco: number;
  precoPromocional?: number;
  emPromocao: boolean;
  quantidade: number;
  imagem?: string;
  categoria?: string;
  marca?: string;
  unidade: {
    id: string;
    nome: string;
    mercado: { id: string; nome: string };
  };
};

export type ListaCompartilhadaSnapshot = {
  itens: ItemListaCompartilhada[];
  atualizadoEm: string;
  atualizadoPor: string;
  atualizadoPorNome: string;
};

export type RaioFamiliarCircle = {
  circleId: string;
  nomeCasa: string;
  codigoConvite: string;
  adminUserId: string;
  membros: RaioFamiliarMembro[];
  preferencias: PreferenciasCasa;
  listaCompartilhada: ListaCompartilhadaSnapshot | null;
  criadoEm: string;
};

export type RaioFamiliarMembership = {
  circleId: string;
  adminUserId: string;
  role: RaioFamiliarRole;
};

const DEFAULT_PREFS: PreferenciasCasa = {
  volumeFamiliar: 3,
  mercadoPreferidoId: null,
  compartilharListas: true,
};

function gerarCodigoConvite(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(RAIO_FAMILIAR_CODIGO_LEN);
  let out = '';
  for (let i = 0; i < RAIO_FAMILIAR_CODIGO_LEN; i++) {
    out += chars[bytes[i]! % chars.length];
  }
  return out;
}

function parseCircle(perfilPreci: unknown): RaioFamiliarCircle | null {
  if (!perfilPreci || typeof perfilPreci !== 'object') return null;
  const c = (perfilPreci as { raioFamiliarCircle?: RaioFamiliarCircle }).raioFamiliarCircle;
  if (!c?.circleId || !c.codigoConvite) return null;
  return c;
}

function parseMembership(perfilPreci: unknown): RaioFamiliarMembership | null {
  if (!perfilPreci || typeof perfilPreci !== 'object') return null;
  const m = (perfilPreci as { raioFamiliarMembership?: RaioFamiliarMembership })
    .raioFamiliarMembership;
  if (!m?.circleId || !m.adminUserId) return null;
  return m;
}

async function salvarPerfil(
  userId: string,
  patch: Record<string, unknown>,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  const base =
    dbUser?.perfilPreci && typeof dbUser.perfilPreci === 'object'
      ? { ...(dbUser.perfilPreci as Record<string, unknown>) }
      : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete base[k];
    else base[k] = v;
  }
  await db.user.update({
    where: { id: userId },
    data: {
      perfilPreci: base as Prisma.InputJsonValue,
      dataAtualizacao: new Date(),
    },
  });
}

async function buscarAdminPorCodigo(codigo: string): Promise<string | null> {
  const normalizado = codigo.trim().toUpperCase();
  if (normalizado.length < 4) return null;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM usuarios
    WHERE UPPER(perfil_preci->'raioFamiliarCircle'->>'codigoConvite') = ${normalizado}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function nomeUsuario(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { nome: true, email: true },
  });
  if (u?.nome?.trim()) return u.nome.trim();
  if (u?.email) return u.email.split('@')[0] ?? 'Membro';
  return 'Membro';
}

export async function obterRaioFamiliar(userId: string): Promise<{
  ativo: boolean;
  circle: RaioFamiliarCircle | null;
  membership: RaioFamiliarMembership | null;
  meuRole: RaioFamiliarRole | null;
}> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { perfilPreci: true },
  });
  const ownCircle = parseCircle(dbUser?.perfilPreci);
  if (ownCircle) {
    return {
      ativo: true,
      circle: ownCircle,
      membership: {
        circleId: ownCircle.circleId,
        adminUserId: ownCircle.adminUserId,
        role: 'admin',
      },
      meuRole: 'admin',
    };
  }

  const membership = parseMembership(dbUser?.perfilPreci);
  if (!membership) {
    return { ativo: false, circle: null, membership: null, meuRole: null };
  }

  const admin = await prisma.user.findUnique({
    where: { id: membership.adminUserId },
    select: { perfilPreci: true },
  });
  const circle = parseCircle(admin?.perfilPreci);
  if (!circle || circle.circleId !== membership.circleId) {
    return { ativo: false, circle: null, membership, meuRole: null };
  }

  const membro = circle.membros.find((m) => m.userId === userId);
  return {
    ativo: Boolean(membro),
    circle,
    membership,
    meuRole: membro?.role ?? 'membro',
  };
}

export async function criarRaioFamiliar(
  userId: string,
  nomeCasa: string
): Promise<RaioFamiliarCircle> {
  const existente = await obterRaioFamiliar(userId);
  if (existente.ativo) {
    throw new Error('Você já participa de um raio familiar');
  }

  const nome = nomeCasa.trim().slice(0, 40) || 'Minha casa';
  const circleId = `rf-${randomBytes(8).toString('hex')}`;
  const codigoConvite = gerarCodigoConvite();
  const agora = new Date().toISOString();
  const displayNome = await nomeUsuario(userId);

  const circle: RaioFamiliarCircle = {
    circleId,
    nomeCasa: nome,
    codigoConvite,
    adminUserId: userId,
    membros: [
      {
        userId,
        nome: displayNome,
        role: 'admin',
        entrouEm: agora,
      },
    ],
    preferencias: { ...DEFAULT_PREFS },
    listaCompartilhada: null,
    criadoEm: agora,
  };

  await salvarPerfil(userId, {
    raioFamiliarCircle: circle,
    raioFamiliarMembership: undefined,
  });

  return circle;
}

export async function entrarRaioFamiliar(
  userId: string,
  codigo: string
): Promise<RaioFamiliarCircle> {
  const existente = await obterRaioFamiliar(userId);
  if (existente.ativo) {
    throw new Error('Saia do raio atual antes de entrar em outro');
  }

  const adminId = await buscarAdminPorCodigo(codigo);
  if (!adminId) throw new Error('Código de convite inválido');
  if (adminId === userId) throw new Error('Você já é o administrador deste raio');

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { perfilPreci: true },
  });
  const circle = parseCircle(admin?.perfilPreci);
  if (!circle) throw new Error('Raio familiar não encontrado');

  if (circle.membros.length >= RAIO_FAMILIAR_MAX_MEMBROS) {
    throw new Error(`Este raio já atingiu o limite de ${RAIO_FAMILIAR_MAX_MEMBROS} pessoas`);
  }
  if (circle.membros.some((m) => m.userId === userId)) {
    throw new Error('Você já faz parte deste raio');
  }

  const displayNome = await nomeUsuario(userId);
  const novoMembro: RaioFamiliarMembro = {
    userId,
    nome: displayNome,
    role: 'membro',
    entrouEm: new Date().toISOString(),
  };

  const circleAtualizado: RaioFamiliarCircle = {
    ...circle,
    membros: [...circle.membros, novoMembro],
  };

  await salvarPerfil(adminId, { raioFamiliarCircle: circleAtualizado });
  await salvarPerfil(userId, {
    raioFamiliarMembership: {
      circleId: circle.circleId,
      adminUserId: adminId,
      role: 'membro',
    },
    raioFamiliarCircle: undefined,
  });

  return circleAtualizado;
}

export async function sairRaioFamiliar(userId: string): Promise<void> {
  const estado = await obterRaioFamiliar(userId);
  if (!estado.ativo || !estado.circle) return;

  if (estado.meuRole === 'admin') {
    const outros = estado.circle.membros.filter((m) => m.userId !== userId);
    if (outros.length === 0) {
      await salvarPerfil(userId, {
        raioFamiliarCircle: undefined,
        raioFamiliarMembership: undefined,
      });
      return;
    }
    const novoAdmin = outros[0]!;
    const circleSemAdmin: RaioFamiliarCircle = {
      ...estado.circle,
      adminUserId: novoAdmin.userId,
      membros: outros.map((m) =>
        m.userId === novoAdmin.userId ? { ...m, role: 'admin' as const } : m
      ),
    };
    await salvarPerfil(userId, {
      raioFamiliarCircle: undefined,
      raioFamiliarMembership: undefined,
    });
    await salvarPerfil(novoAdmin.userId, {
      raioFamiliarCircle: circleSemAdmin,
      raioFamiliarMembership: undefined,
    });
    for (const m of outros) {
      if (m.userId === novoAdmin.userId) continue;
      await salvarPerfil(m.userId, {
        raioFamiliarMembership: {
          circleId: circleSemAdmin.circleId,
          adminUserId: novoAdmin.userId,
          role: 'membro',
        },
      });
    }
    return;
  }

  const adminId = estado.membership?.adminUserId;
  if (!adminId) {
    await salvarPerfil(userId, { raioFamiliarMembership: undefined });
    return;
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { perfilPreci: true },
  });
  const circle = parseCircle(admin?.perfilPreci);
  if (circle) {
    await salvarPerfil(adminId, {
      raioFamiliarCircle: {
        ...circle,
        membros: circle.membros.filter((m) => m.userId !== userId),
      },
    });
  }
  await salvarPerfil(userId, { raioFamiliarMembership: undefined });
}

/** Admin transfere a casa para outro membro (circle migra para o perfil do novo admin). */
export async function transferirAdministracaoCasa(
  userId: string,
  novoAdminUserId: string
): Promise<RaioFamiliarCircle> {
  const estado = await obterRaioFamiliar(userId);
  if (!estado.ativo || !estado.circle) {
    throw new Error('Você não está em uma casa');
  }
  if (estado.meuRole !== 'admin') {
    throw new Error('Só quem administra a casa pode transferir');
  }
  if (novoAdminUserId === userId) {
    throw new Error('Escolha outro membro');
  }

  const alvo = estado.circle.membros.find((m) => m.userId === novoAdminUserId);
  if (!alvo) {
    throw new Error('Membro não encontrado nesta casa');
  }

  const circleAtualizado: RaioFamiliarCircle = {
    ...estado.circle,
    adminUserId: novoAdminUserId,
    membros: estado.circle.membros.map((m) => {
      if (m.userId === novoAdminUserId) return { ...m, role: 'admin' as const };
      if (m.userId === userId) return { ...m, role: 'membro' as const };
      return m;
    }),
  };

  await prisma.$transaction(async (tx) => {
    await salvarPerfil(
      novoAdminUserId,
      {
        raioFamiliarCircle: circleAtualizado,
        raioFamiliarMembership: undefined,
      },
      tx
    );

    await salvarPerfil(
      userId,
      {
        raioFamiliarCircle: undefined,
        raioFamiliarMembership: {
          circleId: circleAtualizado.circleId,
          adminUserId: novoAdminUserId,
          role: 'membro',
        },
      },
      tx
    );

    for (const m of circleAtualizado.membros) {
      if (m.userId === novoAdminUserId || m.userId === userId) continue;
      await salvarPerfil(
        m.userId,
        {
          raioFamiliarMembership: {
            circleId: circleAtualizado.circleId,
            adminUserId: novoAdminUserId,
            role: 'membro',
          },
        },
        tx
      );
    }
  });

  return circleAtualizado;
}

export async function atualizarPreferenciasCasa(
  userId: string,
  prefs: Partial<PreferenciasCasa>
): Promise<PreferenciasCasa> {
  const estado = await obterRaioFamiliar(userId);
  if (!estado.ativo || !estado.circle) {
    throw new Error('Você não está em um raio familiar');
  }

  const adminId =
    estado.meuRole === 'admin' ? userId : estado.membership?.adminUserId ?? userId;

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { perfilPreci: true },
  });
  const circle = parseCircle(admin?.perfilPreci);
  if (!circle) throw new Error('Raio não encontrado');

  const volume =
    typeof prefs.volumeFamiliar === 'number'
      ? Math.min(12, Math.max(1, Math.round(prefs.volumeFamiliar)))
      : circle.preferencias.volumeFamiliar;

  const preferencias: PreferenciasCasa = {
    volumeFamiliar: volume,
    mercadoPreferidoId:
      prefs.mercadoPreferidoId !== undefined
        ? prefs.mercadoPreferidoId
        : circle.preferencias.mercadoPreferidoId,
    compartilharListas:
      prefs.compartilharListas !== undefined
        ? Boolean(prefs.compartilharListas)
        : circle.preferencias.compartilharListas,
  };

  await salvarPerfil(adminId, {
    raioFamiliarCircle: { ...circle, preferencias },
  });

  return preferencias;
}

export async function sincronizarListaCompartilhada(
  userId: string,
  itens: ItemListaCompartilhada[]
): Promise<ListaCompartilhadaSnapshot> {
  const estado = await obterRaioFamiliar(userId);
  if (!estado.ativo || !estado.circle) {
    throw new Error('Raio familiar inativo');
  }
  if (!estado.circle.preferencias.compartilharListas) {
    throw new Error('Compartilhamento de listas desativado neste raio');
  }

  const adminId =
    estado.meuRole === 'admin' ? userId : estado.membership?.adminUserId ?? userId;

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { perfilPreci: true },
  });
  const circle = parseCircle(admin?.perfilPreci);
  if (!circle) throw new Error('Raio não encontrado');

  const snapshot: ListaCompartilhadaSnapshot = {
    itens: itens.slice(0, 80),
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: userId,
    atualizadoPorNome: await nomeUsuario(userId),
  };

  await salvarPerfil(adminId, {
    raioFamiliarCircle: { ...circle, listaCompartilhada: snapshot },
  });

  return snapshot;
}

/** Preferências efetivas: casa sobrescreve volumeFamiliar no perfil individual. */
export function mesclarPerfilComCasa(
  perfilPreci: unknown,
  circle: RaioFamiliarCircle | null
): Record<string, unknown> {
  const base =
    perfilPreci && typeof perfilPreci === 'object'
      ? { ...(perfilPreci as Record<string, unknown>) }
      : {};
  if (!circle) return base;
  return {
    ...base,
    volumeFamiliar: circle.preferencias.volumeFamiliar,
    mercadoPreferidoId:
      circle.preferencias.mercadoPreferidoId ?? base.mercadoPreferidoId,
  };
}
