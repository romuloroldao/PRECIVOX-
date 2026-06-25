/**
 * OtpService — emissão e verificação de OTP por telefone.
 *
 * - Código de 6 dígitos, guardado apenas como SHA-256 (PhoneOtpChallenge.codeHash).
 * - Expira em 5 min; máx. 5 tentativas; comparação em tempo constante.
 * - Strategy: recebe uma lista de providers e usa o primeiro que suporta o canal.
 */
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import {
  ConsoleSmsProvider,
  TwilioSmsProvider,
  AwsSnsSmsProvider,
  WhatsAppBusinessProvider,
} from './providers.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

export class OtpService {
  /** @param {Array<{name:string, supports:(c:string)=>boolean, send:Function}>} providers */
  constructor(providers) {
    this.providers = providers;
  }

  #hash(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  #pickProvider(channel) {
    const provider = this.providers.find((p) => p.supports(channel));
    if (!provider) throw new Error(`Nenhum provider para o canal ${channel}`);
    return provider;
  }

  /**
   * Gera e envia um novo OTP.
   * @param {string} phone - E.164
   * @param {'SMS'|'WHATSAPP'} channel
   * @param {{ ip?: string, userAgent?: string }} meta
   */
  async request(phone, channel = 'SMS', meta = {}) {
    const code = String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');

    await prisma.phoneOtpChallenge.create({
      data: {
        phone,
        codeHash: this.#hash(code),
        channel,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    const provider = this.#pickProvider(channel);
    await provider.send({
      to: phone,
      channel,
      body: `Precivox: seu código de acesso é ${code}. Válido por 5 minutos.`,
    });

    return { sent: true, channel, provider: provider.name, expiresInSeconds: OTP_TTL_MS / 1000 };
  }

  /**
   * Valida um OTP. Retorna true só se válido, não-expirado, não-consumido e
   * dentro do limite de tentativas.
   * @param {string} phone
   * @param {string} code
   */
  async verify(phone, code) {
    const challenge = await prisma.phoneOtpChallenge.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) return false;
    if (challenge.attempts >= challenge.maxAttempts) return false;

    const provided = Buffer.from(this.#hash(String(code)), 'hex');
    const stored = Buffer.from(challenge.codeHash, 'hex');
    const ok = provided.length === stored.length && crypto.timingSafeEqual(provided, stored);

    if (!ok) {
      await prisma.phoneOtpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    await prisma.phoneOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    return true;
  }
}

/**
 * Composição via env OTP_PROVIDER (twilio | aws-sns | whatsapp | console).
 * Trocar de provedor = mudar a env, sem refatorar o core.
 */
function buildProviders() {
  const selected = (process.env.OTP_PROVIDER || 'console').toLowerCase();
  switch (selected) {
    case 'twilio':
      return [new TwilioSmsProvider(), new WhatsAppBusinessProvider()];
    case 'aws-sns':
      return [new AwsSnsSmsProvider(), new ConsoleSmsProvider()];
    case 'whatsapp':
      return [new WhatsAppBusinessProvider(), new TwilioSmsProvider()];
    case 'console':
    default:
      return [new ConsoleSmsProvider()];
  }
}

export const otpService = new OtpService(buildProviders());
export default otpService;
