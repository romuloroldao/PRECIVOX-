import { sendNotification, isFCMAvailable } from '@/lib/fcm';
import { sendWebPush, isWebPushToken, isWebPushAvailable } from '@/lib/push-web';

export function isPushDeliveryAvailable(): boolean {
  return isFCMAvailable() || isWebPushAvailable();
}

export async function deliverPushToToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  if (isWebPushToken(token)) {
    return sendWebPush(token, title, body, data);
  }
  if (isFCMAvailable()) {
    return sendNotification(token, title, body, data);
  }
  return { success: false, error: 'Nenhum canal push configurado' };
}
