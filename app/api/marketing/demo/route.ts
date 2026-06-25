import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendDemoConfirmationEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DemoPayload = {
  nome?: string;
  email?: string;
  empresa?: string;
  cidade?: string;
  telefone?: string;
  interesse?: string;
  porte?: string;
  mensagem?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarTicketId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `DEMO-${ts}-${rand}`;
}

async function notificarWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.MARKETING_DEMO_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[marketing/demo] webhook falhou:', err);
  }
}

/**
 * POST /api/marketing/demo
 * Público — recebe solicitações de demonstração comercial e persiste no banco.
 */
export async function POST(req: NextRequest) {
  let body: DemoPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const nome = String(body.nome ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const empresa = String(body.empresa ?? '').trim();
  const cidade = String(body.cidade ?? '').trim();
  const interesse = String(body.interesse ?? '').trim();

  if (!nome || nome.length < 2) {
    return NextResponse.json({ success: false, error: 'Nome inválido' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 });
  }
  if (!empresa || empresa.length < 2) {
    return NextResponse.json({ success: false, error: 'Empresa/mercado é obrigatório' }, { status: 400 });
  }
  if (!cidade || cidade.length < 2) {
    return NextResponse.json({ success: false, error: 'Cidade é obrigatória' }, { status: 400 });
  }
  if (!interesse) {
    return NextResponse.json({ success: false, error: 'Selecione o interesse' }, { status: 400 });
  }

  const ticketId = gerarTicketId();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  try {
    await prisma.demoRequest.create({
      data: {
        ticketId,
        nome,
        email,
        empresa,
        cidade,
        telefone: String(body.telefone ?? '').trim() || null,
        interesse,
        porte: String(body.porte ?? '').trim() || null,
        mensagem: String(body.mensagem ?? '').trim().slice(0, 2000) || null,
        origem: 'site-demo',
        ip,
      },
    });
  } catch (err) {
    console.error('[marketing/demo] erro ao salvar no banco:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar solicitação' },
      { status: 500 },
    );
  }

  await notificarWebhook({
    ticketId,
    nome,
    email,
    empresa,
    cidade,
    telefone: String(body.telefone ?? '').trim() || null,
    interesse,
    porte: String(body.porte ?? '').trim() || null,
    mensagem: String(body.mensagem ?? '').trim().slice(0, 2000) || null,
    origem: 'site-demo',
    criadoEm: new Date().toISOString(),
    ip,
  });

  // E-mail de confirmação ao lead (best-effort, não bloqueia a resposta).
  sendDemoConfirmationEmail({ nome, email, ticketId, empresa, interesse }).catch((err) => {
    console.error('[marketing/demo] falha ao enviar confirmação:', err);
  });

  return NextResponse.json({
    success: true,
    ticketId,
    message: 'Solicitação recebida. Entraremos em contato em até 1 dia útil.',
  });
}
