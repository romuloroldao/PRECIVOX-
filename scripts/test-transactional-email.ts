/**
 * Testa envio transacional (SendGrid/SMTP).
 *
 * Uso:
 *   npx tsx scripts/test-transactional-email.ts destino@email.com [template]
 *
 * Templates disponíveis: basic (padrão), welcome, verify, reset, demo, lista, newsletter, all
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.production') });
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const to = process.argv[2]?.trim();
  const template = (process.argv[3]?.trim() || 'basic').toLowerCase();
  if (!to) {
    console.error('Uso: npx tsx scripts/test-transactional-email.ts destino@email.com [basic|welcome|verify|reset|demo|lista|newsletter|all]');
    process.exit(1);
  }

  const email = await import('../lib/email');

  if (!email.isEmailConfigured()) {
    console.error('❌ E-mail não configurado. Defina SMTP_HOST/SMTP_USER/SMTP_PASS (KingHost) ou SENDGRID_API_KEY em .env.local / .env.production');
    process.exit(1);
  }

  const base = email.getBaseUrl();
  const senders: Record<string, () => Promise<email.EmailSendResult>> = {
    basic: () =>
      email.sendEmail({
        to,
        subject: 'Teste Precivox — e-mail transacional',
        html: '<p>Se você recebeu isto, o SendGrid/SMTP está funcionando.</p>',
        text: 'Se você recebeu isto, o SendGrid/SMTP está funcionando.',
      }),
    welcome: () => email.sendWelcomeEmail({ nome: 'Rômulo', email: to }),
    verify: () =>
      email.sendVerificationEmail({
        nome: 'Rômulo',
        email: to,
        confirmLink: `${base}/confirmar-email?token=demo-token-123`,
      }),
    reset: () =>
      email.sendPasswordResetEmail({
        email: to,
        nome: 'Rômulo',
        resetLink: `${base}/resetar-senha?token=demo-token-123`,
      }),
    demo: () =>
      email.sendDemoConfirmationEmail({
        nome: 'Rômulo',
        email: to,
        ticketId: 'DEMO-TESTE-ABC123',
        empresa: 'Mercado Exemplo',
        interesse: 'Plano Pro',
      }),
    lista: () =>
      email.sendListaResumoEmail({
        nome: 'Rômulo',
        email: to,
        listaNome: 'Compras da semana',
        totalItens: 3,
        totalEstimado: 87.4,
        economia: 15.3,
        melhorMercado: 'Supermercado Econômico',
        itens: [
          { nome: 'Arroz 5kg', mercado: 'Econômico', preco: 24.9 },
          { nome: 'Feijão 1kg', mercado: 'Econômico', preco: 8.5 },
          { nome: 'Café 500g', mercado: 'Atacadão', preco: 18.0 },
        ],
      }),
    newsletter: () => email.sendNewsletterWelcomeEmail({ email: to, nome: 'Rômulo' }),
  };

  const toRun = template === 'all' ? Object.keys(senders) : [template];
  if (!toRun.every((t) => senders[t])) {
    console.error(`❌ Template inválido: ${template}. Use: ${Object.keys(senders).join(', ')}, all`);
    process.exit(1);
  }

  let failed = false;
  for (const t of toRun) {
    const result = await senders[t]();
    if (result.ok) {
      console.log(`✅ [${t}] enviado para ${to}`);
    } else {
      console.error(`❌ [${t}] falha:`, result);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
