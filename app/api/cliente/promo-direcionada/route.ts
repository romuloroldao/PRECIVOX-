import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/admin-auth';
import { promosParaUsuario } from '@/lib/monetizacao/promo-direcionada';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ success: true, data: { promos: [] } });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const promos = await promosParaUsuario(user.id, mercadoId);

    return NextResponse.json({
      success: true,
      data: {
        promos,
        explicacao:
          promos.length > 0
            ? 'Ofertas personalizadas com base no seu perfil PRECIVOX.'
            : null,
      },
    });
  } catch (e) {
    console.error('[cliente/promo-direcionada GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
