import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST /api/auth/otp/request  { phone, channel? } */
export async function POST(req: NextRequest) {
  try {
    const { phone, channel } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Telefone é obrigatório' }, { status: 400 });
    }

    const backendRes = await internalFetch('/api/v1/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, channel: channel || 'SMS' }),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[otp/request]', err);
    return NextResponse.json({ success: false, error: 'Erro ao solicitar código' }, { status: 500 });
  }
}
