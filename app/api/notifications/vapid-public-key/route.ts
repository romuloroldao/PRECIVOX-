import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push-web';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ success: false, error: 'VAPID não configurado' }, { status: 503 });
  }
  return NextResponse.json({ success: true, publicKey });
}
