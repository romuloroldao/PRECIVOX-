/**
 * Serviço de envio de e-mails (SMTP via Nodemailer).
 * Se SMTP não estiver configurado, apenas loga em desenvolvimento.
 */

const getBaseUrl = () =>
  process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXTAUTH_URL || 'http://localhost:3000';

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: false,
    auth: { user, pass },
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = await getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[email] (SMTP não configurado) Envio simulado:', {
        to: options.to,
        subject: options.subject,
      });
    }
    return true;
  }
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@precivox.com.br';
    await transporter.sendMail({
      from: `Precivox <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (err) {
    console.error('[email] Erro ao enviar:', err);
    return false;
  }
}

export async function sendWelcomeEmail(params: { nome: string; email: string }): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Bem-vindo(a) ao Precivox!</h2>
      <p>Olá, <strong>${params.nome}</strong>!</p>
      <p>Sua conta foi criada com sucesso. Agora você pode:</p>
      <ul>
        <li>Criar listas de compras</li>
        <li>Comparar preços entre mercados</li>
        <li>Acompanhar sua economia</li>
      </ul>
      <p><a href="${baseUrl}/cliente/home" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Acessar minha conta</a></p>
      <p style="color: #666; font-size: 14px;">Se você não criou esta conta, ignore este e-mail.</p>
      <p style="color: #666; font-size: 12px;">— Equipe Precivox</p>
    </body>
    </html>
  `;
  return sendEmail({
    to: params.email,
    subject: 'Bem-vindo ao Precivox — sua conta foi criada',
    html,
    text: `Olá, ${params.nome}! Sua conta no Precivox foi criada. Acesse: ${baseUrl}/cliente/home`,
  });
}

export async function sendVerificationEmail(params: {
  nome: string;
  email: string;
  confirmLink: string;
}): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Bem-vindo(a) ao Precivox!</h2>
      <p>Olá, <strong>${params.nome}</strong>!</p>
      <p>Sua conta foi criada. Para ativar e acessar todos os recursos, confirme seu e-mail clicando no botão abaixo:</p>
      <p><a href="${params.confirmLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Confirmar meu e-mail</a></p>
      <p style="color: #666; font-size: 14px;">Este link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.</p>
      <p style="color: #666; font-size: 12px;">— Equipe Precivox</p>
    </body>
    </html>
  `;
  return sendEmail({
    to: params.email,
    subject: 'Confirme seu e-mail — Precivox',
    html,
    text: `Olá, ${params.nome}! Confirme seu e-mail em: ${params.confirmLink}. Este link expira em 24 horas.`,
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  nome?: string | null;
  resetLink: string;
}): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Redefinição de senha</h2>
      <p>Olá${params.nome ? `, ${params.nome}` : ''}!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta Precivox.</p>
      <p><a href="${params.resetLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Redefinir senha</a></p>
      <p>Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.</p>
      <p style="color: #666; font-size: 12px;">— Equipe Precivox</p>
    </body>
    </html>
  `;
  return sendEmail({
    to: params.email,
    subject: 'Redefinir sua senha — Precivox',
    html,
    text: `Redefinir senha: ${params.resetLink}. Este link expira em 1 hora.`,
  });
}
