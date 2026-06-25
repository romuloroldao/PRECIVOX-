/**
 * Envio transacional via SendGrid (SMTP) ou SMTP genérico.
 * Prioridade: SENDGRID_API_KEY → SMTP_HOST/SMTP_USER/SMTP_PASS
 *
 * Todos os templates usam o layout base `renderLayout` para manter
 * identidade visual consistente e responsiva entre os e-mails.
 */

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailSendResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'send_failed'; detail?: string };

const BRAND = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  success: '#16a34a',
  text: '#0f172a',
  muted: '#64748b',
  bg: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  softBg: '#f8fafc',
};

/**
 * URL base canônica usada para montar links nos e-mails e nas rotas.
 * Exportada para que as rotas de auth usem a MESMA resolução (evita links quebrados).
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL.replace(/\/$/, '');
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function resolveSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
} | null {
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  if (sendgridKey) {
    return {
      host: 'smtp.sendgrid.net',
      port: 587,
      user: 'apikey',
      pass: sendgridKey,
      from: process.env.SMTP_FROM?.trim() || 'noreply@precivox.com.br',
    };
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim() || process.env.SMTP_PASSWORD?.trim();
  if (!host || !user || !pass) return null;

  return {
    host,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user,
    pass,
    from: process.env.SMTP_FROM?.trim() || user,
  };
}

export function isEmailConfigured(): boolean {
  return resolveSmtpConfig() !== null;
}

async function getTransporter() {
  const cfg = resolveSmtpConfig();
  if (!cfg) return null;
  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  const cfg = resolveSmtpConfig();
  if (!cfg) {
    const msg = '[email] SMTP/SendGrid não configurado — e-mail não enviado';
    if (process.env.NODE_ENV === 'development') {
      console.log(msg, { to: options.to, subject: options.subject });
    } else {
      console.error(msg, { to: options.to, subject: options.subject });
    }
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const transporter = await getTransporter();
    if (!transporter) return { ok: false, reason: 'not_configured' };

    await transporter.sendMail({
      from: `Precivox <${cfg.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[email] Erro ao enviar:', detail);
    return { ok: false, reason: 'send_failed', detail };
  }
}

/* -------------------------------------------------------------------------- */
/*  Componentes de layout reutilizáveis                                       */
/* -------------------------------------------------------------------------- */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function button(href: string, label: string, variant: 'primary' | 'success' = 'primary'): string {
  const bg = variant === 'success' ? BRAND.success : BRAND.primary;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 10px; background: ${bg};">
          <a href="${href}" target="_blank"
             style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

type LayoutParams = {
  /** Texto curto exibido como prévia na caixa de entrada */
  preheader?: string;
  /** Conteúdo HTML do corpo (já dentro do card) */
  bodyHtml: string;
  /** Linha extra no rodapé (ex.: link de descadastro) */
  footerExtraHtml?: string;
};

function renderLayout({ preheader, bodyHtml, footerExtraHtml }: LayoutParams): string {
  const year = new Date().getFullYear();
  const baseUrl = getBaseUrl();
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>Precivox</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bg}; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.bg};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="width: 100%; max-width: 600px; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <!-- Header -->
          <tr>
            <td style="padding: 8px 8px 20px;">
              <a href="${baseUrl}" target="_blank" style="text-decoration: none;">
                <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: ${BRAND.primary};">Precivox</span>
              </a>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 16px; padding: 36px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 16px; text-align: center;">
              <p style="margin: 0 0 6px; color: ${BRAND.muted}; font-size: 13px;">
                Precivox — economize de verdade nas suas compras.
              </p>
              ${footerExtraHtml ?? ''}
              <p style="margin: 8px 0 0; color: ${BRAND.muted}; font-size: 12px;">
                © ${year} Precivox. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; color: ${BRAND.text}; font-weight: 700;">${text}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">${html}</p>`;
}

function muted(html: string): string {
  return `<p style="margin: 16px 0 0; font-size: 13px; line-height: 1.5; color: ${BRAND.muted};">${html}</p>`;
}

/* -------------------------------------------------------------------------- */
/*  Templates                                                                  */
/* -------------------------------------------------------------------------- */

export async function sendWelcomeEmail(params: { nome: string; email: string }): Promise<EmailSendResult> {
  const baseUrl = getBaseUrl();
  const nome = escapeHtml(params.nome);
  const bodyHtml = `
    ${heading(`Bem-vindo(a) ao Precivox, ${nome}! 🎉`)}
    ${paragraph('Seu e-mail foi confirmado e sua conta está ativa. Agora você pode aproveitar tudo que preparamos para você economizar:')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px 0 4px;">
      <tr><td style="padding: 6px 0; font-size: 15px; color: #334155;">🛒&nbsp;&nbsp;Montar listas de compras inteligentes</td></tr>
      <tr><td style="padding: 6px 0; font-size: 15px; color: #334155;">💸&nbsp;&nbsp;Comparar preços entre mercados em tempo real</td></tr>
      <tr><td style="padding: 6px 0; font-size: 15px; color: #334155;">📊&nbsp;&nbsp;Acompanhar quanto você economiza</td></tr>
    </table>
    ${button(`${baseUrl}/cliente/home`, 'Acessar minha conta')}
    ${muted('Se você não criou esta conta, pode ignorar este e-mail com segurança.')}
  `;
  return sendEmail({
    to: params.email,
    subject: 'Bem-vindo(a) ao Precivox! Sua conta está pronta 🎉',
    html: renderLayout({ preheader: 'Sua conta foi ativada — comece a economizar agora.', bodyHtml }),
    text: `Olá, ${params.nome}! Seu e-mail foi confirmado e sua conta no Precivox está ativa. Acesse: ${baseUrl}/cliente/home`,
  });
}

export async function sendVerificationEmail(params: {
  nome: string;
  email: string;
  confirmLink: string;
}): Promise<EmailSendResult> {
  const nome = escapeHtml(params.nome);
  const bodyHtml = `
    ${heading(`Confirme seu e-mail, ${nome}`)}
    ${paragraph('Sua conta no Precivox foi criada! Para ativá-la e liberar todos os recursos, confirme seu e-mail clicando no botão abaixo:')}
    ${button(params.confirmLink, 'Confirmar meu e-mail')}
    ${paragraph(`Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${params.confirmLink}" style="color: ${BRAND.primary}; word-break: break-all;">${params.confirmLink}</a>`)}
    ${muted('Este link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.')}
  `;
  return sendEmail({
    to: params.email,
    subject: 'Confirme seu e-mail — Precivox',
    html: renderLayout({ preheader: 'Falta só um passo para ativar sua conta no Precivox.', bodyHtml }),
    text: `Olá, ${params.nome}! Confirme seu e-mail em: ${params.confirmLink}. Este link expira em 24 horas.`,
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  nome?: string | null;
  resetLink: string;
}): Promise<EmailSendResult> {
  const saudacao = params.nome ? `, ${escapeHtml(params.nome)}` : '';
  const bodyHtml = `
    ${heading('Redefinição de senha')}
    ${paragraph(`Olá${saudacao}! Recebemos uma solicitação para redefinir a senha da sua conta Precivox.`)}
    ${button(params.resetLink, 'Redefinir minha senha')}
    ${paragraph(`Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${params.resetLink}" style="color: ${BRAND.primary}; word-break: break-all;">${params.resetLink}</a>`)}
    ${muted('Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.')}
  `;
  return sendEmail({
    to: params.email,
    subject: 'Redefinir sua senha — Precivox',
    html: renderLayout({ preheader: 'Use o link para criar uma nova senha (expira em 1 hora).', bodyHtml }),
    text: `Redefinir senha: ${params.resetLink}. Este link expira em 1 hora. Se não foi você, ignore.`,
  });
}

/**
 * Confirmação para o lead que solicitou uma demonstração comercial.
 */
export async function sendDemoConfirmationEmail(params: {
  nome: string;
  email: string;
  ticketId: string;
  empresa?: string | null;
  interesse?: string | null;
}): Promise<EmailSendResult> {
  const nome = escapeHtml(params.nome);
  const ticket = escapeHtml(params.ticketId);
  const detalhes = [
    params.empresa ? `<tr><td style="padding: 4px 0; font-size: 14px; color: ${BRAND.muted};">Empresa</td><td style="padding: 4px 0; font-size: 14px; color: ${BRAND.text}; text-align: right;">${escapeHtml(params.empresa)}</td></tr>` : '',
    params.interesse ? `<tr><td style="padding: 4px 0; font-size: 14px; color: ${BRAND.muted};">Interesse</td><td style="padding: 4px 0; font-size: 14px; color: ${BRAND.text}; text-align: right;">${escapeHtml(params.interesse)}</td></tr>` : '',
    `<tr><td style="padding: 4px 0; font-size: 14px; color: ${BRAND.muted};">Protocolo</td><td style="padding: 4px 0; font-size: 14px; color: ${BRAND.text}; text-align: right; font-weight: 600;">${ticket}</td></tr>`,
  ].join('');

  const bodyHtml = `
    ${heading(`Recebemos sua solicitação, ${nome}!`)}
    ${paragraph('Obrigado pelo interesse no Precivox. Nossa equipe comercial vai entrar em contato em <strong>até 1 dia útil</strong> para agendar sua demonstração.')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 4px; background: ${BRAND.softBg}; border: 1px solid ${BRAND.border}; border-radius: 12px;">
      <tr><td style="padding: 16px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detalhes}</table>
      </td></tr>
    </table>
    ${muted('Guarde o número do protocolo para agilizar o atendimento. Se não foi você que solicitou, pode ignorar este e-mail.')}
  `;
  return sendEmail({
    to: params.email,
    subject: `Solicitação de demonstração recebida — ${params.ticketId}`,
    html: renderLayout({ preheader: 'Recebemos seu pedido de demonstração. Em breve entraremos em contato.', bodyHtml }),
    text: `Olá, ${params.nome}! Recebemos sua solicitação de demonstração (protocolo ${params.ticketId}). Entraremos em contato em até 1 dia útil.`,
  });
}

export type ListaResumoItem = {
  nome: string;
  mercado?: string | null;
  preco?: number | null;
};

/**
 * Resumo/economia de uma Lista Inteligente enviado ao cliente.
 */
export async function sendListaResumoEmail(params: {
  nome: string;
  email: string;
  listaNome: string;
  totalItens: number;
  totalEstimado: number;
  economia: number;
  melhorMercado?: string | null;
  itens?: ListaResumoItem[];
  listaLink?: string;
}): Promise<EmailSendResult> {
  const baseUrl = getBaseUrl();
  const nome = escapeHtml(params.nome);
  const listaNome = escapeHtml(params.listaNome);
  const link = params.listaLink || `${baseUrl}/cliente/listas`;
  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const economiaBlock = params.economia > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 4px 0 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
         <tr><td style="padding: 18px 20px; text-align: center;">
           <div style="font-size: 13px; color: ${BRAND.success}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Sua economia estimada</div>
           <div style="font-size: 30px; font-weight: 800; color: ${BRAND.success}; margin-top: 4px;">${brl(params.economia)}</div>
           ${params.melhorMercado ? `<div style="font-size: 13px; color: ${BRAND.muted}; margin-top: 4px;">comprando no <strong>${escapeHtml(params.melhorMercado)}</strong></div>` : ''}
         </td></tr>
       </table>`
    : '';

  const itensRows = (params.itens ?? [])
    .slice(0, 12)
    .map(
      (it) => `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.text}; border-bottom: 1px solid ${BRAND.border};">${escapeHtml(it.nome)}</td>
        <td style="padding: 8px 0; font-size: 13px; color: ${BRAND.muted}; border-bottom: 1px solid ${BRAND.border}; text-align: right;">${it.mercado ? escapeHtml(it.mercado) : '—'}</td>
        <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.text}; border-bottom: 1px solid ${BRAND.border}; text-align: right; font-weight: 600;">${typeof it.preco === 'number' ? brl(it.preco) : '—'}</td>
      </tr>`
    )
    .join('');

  const itensBlock = itensRows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 4px 0 8px;">
         <tr>
           <th align="left" style="padding: 4px 0; font-size: 12px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
           <th align="right" style="padding: 4px 0; font-size: 12px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Mercado</th>
           <th align="right" style="padding: 4px 0; font-size: 12px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Preço</th>
         </tr>
         ${itensRows}
       </table>`
    : '';

  const bodyHtml = `
    ${heading(`Resumo da lista "${listaNome}"`)}
    ${paragraph(`Olá, ${nome}! Aqui está o resumo da sua lista com <strong>${params.totalItens} ${params.totalItens === 1 ? 'item' : 'itens'}</strong>, total estimado de <strong>${brl(params.totalEstimado)}</strong>.`)}
    ${economiaBlock}
    ${itensBlock}
    ${button(link, 'Ver lista completa', 'success')}
    ${muted('Os preços podem variar. Confira a lista no app para os valores mais atualizados.')}
  `;
  return sendEmail({
    to: params.email,
    subject: `Sua lista "${params.listaNome}" — economia de ${brl(params.economia)}`,
    html: renderLayout({ preheader: `Total ${brl(params.totalEstimado)} · economia ${brl(params.economia)}.`, bodyHtml }),
    text: `Resumo da lista "${params.listaNome}": ${params.totalItens} itens, total ${brl(params.totalEstimado)}, economia ${brl(params.economia)}. Veja em: ${link}`,
  });
}

/**
 * E-mail de boas-vindas à newsletter (opt-in).
 */
export async function sendNewsletterWelcomeEmail(params: {
  email: string;
  nome?: string | null;
  unsubscribeLink?: string;
}): Promise<EmailSendResult> {
  const baseUrl = getBaseUrl();
  const saudacao = params.nome ? `, ${escapeHtml(params.nome)}` : '';
  const unsubscribe = params.unsubscribeLink || `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(params.email)}`;
  const footerExtraHtml = `<p style="margin: 0; color: ${BRAND.muted}; font-size: 12px;">
    Você recebe este e-mail porque assinou nossa newsletter.
    <a href="${unsubscribe}" style="color: ${BRAND.muted}; text-decoration: underline;">Descadastrar</a>.
  </p>`;
  const bodyHtml = `
    ${heading('Você está na lista! 📬')}
    ${paragraph(`Obrigado por assinar a newsletter do Precivox${saudacao}. A partir de agora você vai receber:`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px 0 4px;">
      <tr><td style="padding: 6px 0; font-size: 15px; color: #334155;">📉&nbsp;&nbsp;Alertas das maiores quedas de preço</td></tr>
      <tr><td style="padding: 6px 0; font-size: 15px; color: #334155;">🧠&nbsp;&nbsp;Dicas para economizar nas compras</td></tr>
      <tr><td style="padding: 6px 0; font-size: 15px; color: #334155;">✨&nbsp;&nbsp;Novidades e recursos do Precivox</td></tr>
    </table>
    ${button(baseUrl, 'Conhecer o Precivox')}
  `;
  return sendEmail({
    to: params.email,
    subject: 'Bem-vindo(a) à newsletter do Precivox 📬',
    html: renderLayout({
      preheader: 'Confirmada a assinatura — novidades e economia a caminho.',
      bodyHtml,
      footerExtraHtml,
    }),
    text: `Obrigado por assinar a newsletter do Precivox! Para descadastrar: ${unsubscribe}`,
  });
}
