import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function unsubscribe(email: string): Promise<boolean> {
  const norm = email.trim().toLowerCase();
  if (!EMAIL_RE.test(norm)) return false;
  await prisma.newsletterSubscriber
    .updateMany({
      where: { email: norm, status: 'active' },
      data: { status: 'unsubscribed', unsubscribedAt: new Date() },
    })
    .catch(() => {});
  return true;
}

function htmlPage(ok: boolean): string {
  const title = ok ? 'Inscrição cancelada' : 'Não foi possível cancelar';
  const msg = ok
    ? 'Você não receberá mais e-mails da newsletter do Precivox. Sentiremos sua falta!'
    : 'O endereço informado é inválido ou já estava descadastrado.';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Precivox</title></head>
<body style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#f1f5f9;">
<div style="max-width:480px;margin:80px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:36px 40px;text-align:center;">
<div style="font-size:24px;font-weight:800;color:#2563eb;margin-bottom:16px;">Precivox</div>
<h1 style="font-size:20px;color:#0f172a;margin:0 0 12px;">${title}</h1>
<p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">${msg}</p>
<a href="/" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Voltar ao site</a>
</div></body></html>`;
}

/** GET /api/newsletter/unsubscribe?email= — descadastro em um clique (link do e-mail). */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') ?? '';
  const ok = await unsubscribe(email);
  return new NextResponse(htmlPage(ok), {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/** POST /api/newsletter/unsubscribe { email } — descadastro programático. */
export async function POST(request: NextRequest) {
  let email = '';
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email : '';
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }
  const ok = await unsubscribe(email);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: 'Inscrição cancelada.' });
}
