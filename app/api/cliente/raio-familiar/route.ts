import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import {
  criarRaioFamiliar,
  entrarRaioFamiliar,
  obterRaioFamiliar,
  sairRaioFamiliar,
  transferirAdministracaoCasa,
  atualizarPreferenciasCasa,
  sincronizarListaCompartilhada,
  type ItemListaCompartilhada,
} from '@/lib/raio-familiar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const estado = await obterRaioFamiliar(user.id);
    return NextResponse.json({
      success: true,
      data: {
        ativo: estado.ativo,
        meuRole: estado.meuRole,
        circle: estado.circle
          ? {
              circleId: estado.circle.circleId,
              nomeCasa: estado.circle.nomeCasa,
              codigoConvite: estado.circle.codigoConvite,
              adminUserId: estado.circle.adminUserId,
              membros: estado.circle.membros,
              preferencias: estado.circle.preferencias,
              listaCompartilhada: estado.circle.listaCompartilhada,
              criadoEm: estado.circle.criadoEm,
            }
          : null,
      },
    });
  } catch (e) {
    console.error('[raio-familiar GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const acao = String(body.acao ?? 'criar');

    if (acao === 'entrar') {
      const codigo = String(body.codigo ?? '').trim();
      if (!codigo) {
        return NextResponse.json({ success: false, error: 'Código obrigatório' }, { status: 400 });
      }
      const circle = await entrarRaioFamiliar(user.id, codigo);
      return NextResponse.json({ success: true, data: { circle, meuRole: 'membro' } });
    }

    if (acao === 'sair') {
      await sairRaioFamiliar(user.id);
      return NextResponse.json({ success: true, message: 'Você saiu do raio familiar' });
    }

    if (acao === 'preferencias') {
      const prefs = await atualizarPreferenciasCasa(user.id, {
        volumeFamiliar: body.volumeFamiliar,
        mercadoPreferidoId: body.mercadoPreferidoId,
        compartilharListas: body.compartilharListas,
      });
      return NextResponse.json({ success: true, data: { preferencias: prefs } });
    }

    if (acao === 'transferir-admin') {
      const novoAdminUserId = String(body.novoAdminUserId ?? '').trim();
      if (!novoAdminUserId) {
        return NextResponse.json({ success: false, error: 'Membro obrigatório' }, { status: 400 });
      }
      const circle = await transferirAdministracaoCasa(user.id, novoAdminUserId);
      return NextResponse.json({
        success: true,
        message: 'Administração transferida',
        data: { circle, meuRole: 'membro' },
      });
    }

    if (acao === 'sync-lista') {
      const itens = (body.itens ?? []) as ItemListaCompartilhada[];
      const snapshot = await sincronizarListaCompartilhada(user.id, itens);
      return NextResponse.json({ success: true, data: { listaCompartilhada: snapshot } });
    }

    const nomeCasa = String(body.nomeCasa ?? 'Minha casa');
    const circle = await criarRaioFamiliar(user.id, nomeCasa);
    return NextResponse.json({ success: true, data: { circle, meuRole: 'admin' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao processar';
    console.error('[raio-familiar POST]', e);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
