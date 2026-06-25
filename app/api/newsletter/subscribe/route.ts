import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendNewsletterWelcomeEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  nome: z.string().trim().min(1).max(120).optional(),
  origem: z.string().trim().max(40).optional(),
});

/**
 * POST /api/newsletter/subscribe
 * Público — registra (ou reativa) um assinante e envia o e-mail de boas-vindas.
 * Resposta neutra para não revelar se o e-mail já existia.
 */
export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const email = parsed.email.trim().toLowerCase();
  const successMessage = 'Pronto! Verifique seu e-mail para confirmar a inscrição.';

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

    // Já ativo: não reenvia nem duplica.
    if (existing && existing.status === 'active') {
      return NextResponse.json({ success: true, message: successMessage });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        nome: parsed.nome ?? null,
        origem: parsed.origem ?? 'site',
        status: 'active',
      },
      update: {
        status: 'active',
        unsubscribedAt: null,
        ...(parsed.nome ? { nome: parsed.nome } : {}),
      },
    });

    sendNewsletterWelcomeEmail({ email, nome: parsed.nome ?? null }).catch((err) => {
      console.error('[newsletter/subscribe] falha ao enviar boas-vindas:', err);
    });

    return NextResponse.json({ success: true, message: successMessage });
  } catch (error) {
    console.error('[newsletter/subscribe] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar inscrição. Tente novamente.' },
      { status: 500 },
    );
  }
}
