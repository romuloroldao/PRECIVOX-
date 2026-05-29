/**
 * Web Push (VAPID) — complementa FCM para PWA/browser
 */

import webpush from 'web-push';

const WP_PREFIX = 'wp:';

export type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

let webPushReady = false;

export function initWebPush(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return false;
  try {
    webpush.setVapidDetails('mailto:contato@precivox.com.br', publicKey, privateKey);
    webPushReady = true;
    return true;
  } catch {
    return false;
  }
}

initWebPush();

export function isWebPushAvailable(): boolean {
  return webPushReady;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

export function encodeWebPushToken(sub: WebPushSubscriptionPayload): string {
  return `${WP_PREFIX}${JSON.stringify(sub)}`;
}

export function decodeWebPushToken(token: string): WebPushSubscriptionPayload | null {
  if (!token.startsWith(WP_PREFIX)) return null;
  try {
    const parsed = JSON.parse(token.slice(WP_PREFIX.length)) as WebPushSubscriptionPayload;
    if (!parsed?.endpoint || !parsed?.keys?.p256dh || !parsed?.keys?.auth) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isWebPushToken(token: string): boolean {
  return token.startsWith(WP_PREFIX);
}

export async function sendWebPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  if (!webPushReady) {
    return { success: false, error: 'Web Push não configurado' };
  }
  const sub = decodeWebPushToken(token);
  if (!sub) {
    return { success: false, error: 'Token Web Push inválido' };
  }
  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({
        title,
        body,
        data: data ?? {},
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('410') || msg.includes('404') || msg.includes('expired')) {
      return { success: false, error: 'INVALID_TOKEN' };
    }
    return { success: false, error: msg };
  }
}
