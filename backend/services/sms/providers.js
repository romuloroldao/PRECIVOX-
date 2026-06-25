/**
 * Providers de mensageria (Adapter/Strategy).
 *
 * Cada provider implementa a "porta" MessageProvider:
 *   - name: string
 *   - supports(channel): boolean        // 'SMS' | 'WHATSAPP'
 *   - async send({ to, body, channel }): { providerMessageId, provider }
 *
 * Trocar o provedor (Twilio -> AWS SNS -> WhatsApp Business) é só mudar a
 * composição em ./otp.service.js — o core do OTP NÃO muda.
 */

/** Dev/local: não envia de verdade, apenas loga o código no servidor. */
export class ConsoleSmsProvider {
  name = 'console';
  supports(channel) {
    return channel === 'SMS' || channel === 'WHATSAPP';
  }
  async send({ to, body, channel }) {
    console.log(`📨 [ConsoleSmsProvider] (${channel}) -> ${to}: ${body}`);
    return { providerMessageId: `console-${Date.now()}`, provider: this.name };
  }
}

/**
 * Twilio via REST API (sem SDK — usa fetch + Basic Auth).
 * Suporta SMS e WhatsApp (canal WhatsApp Business via Twilio).
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM, TWILIO_WHATSAPP_FROM
 */
export class TwilioSmsProvider {
  name = 'twilio';
  supports(channel) {
    return channel === 'SMS' || channel === 'WHATSAPP';
  }
  async send({ to, body, channel }) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN ausentes');

    const from =
      channel === 'WHATSAPP'
        ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`
        : process.env.TWILIO_SMS_FROM;
    const dest = channel === 'WHATSAPP' ? `whatsapp:${to}` : to;

    const form = new URLSearchParams({ To: dest, From: from, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Twilio falhou: ${data.message || res.status}`);
    return { providerMessageId: data.sid, provider: this.name };
  }
}

/**
 * Placeholder do AWS SNS — só envia SMS. A implementação real exige SigV4
 * (ou @aws-sdk/client-sns). Mantido para demonstrar a troca via Strategy.
 * Env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */
export class AwsSnsSmsProvider {
  name = 'aws-sns';
  supports(channel) {
    return channel === 'SMS';
  }
  async send() {
    throw new Error('AwsSnsSmsProvider não configurado: instale @aws-sdk/client-sns e implemente send().');
  }
}

/**
 * Placeholder do WhatsApp Business API (Meta Cloud API), arquitetura preparada.
 * Env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TOKEN
 */
export class WhatsAppBusinessProvider {
  name = 'whatsapp-business';
  supports(channel) {
    return channel === 'WHATSAPP';
  }
  async send({ to, body }) {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    if (!phoneId || !token) throw new Error('WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_TOKEN ausentes');

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`WhatsApp falhou: ${data.error?.message || res.status}`);
    return { providerMessageId: data.messages?.[0]?.id ?? 'unknown', provider: this.name };
  }
}
