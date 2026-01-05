/**
 * Firebase Cloud Messaging Helper
 * 
 * SQUAD B - Backend
 * 
 * Funções para enviar notificações push via FCM
 * 
 * Configuração necessária:
 * 1. Criar projeto no Firebase Console
 * 2. Baixar service account key (JSON)
 * 3. Adicionar ao .env: FIREBASE_SERVICE_ACCOUNT (JSON string ou path)
 */

import * as admin from 'firebase-admin';

let fcmInitialized = false;

/**
 * Inicializar Firebase Admin SDK
 */
function initializeFCM() {
  if (fcmInitialized || !admin) {
    return;
  }

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
      console.warn('FIREBASE_SERVICE_ACCOUNT não configurado, notificações push desabilitadas');
      return;
    }

    // Tentar parsear como JSON string ou usar como path
    let serviceAccountObj;
    try {
      serviceAccountObj = JSON.parse(serviceAccount);
    } catch {
      // Se não for JSON, tentar como path
      const fs = require('fs');
      const path = require('path');
      const serviceAccountPath = path.resolve(process.cwd(), serviceAccount);
      serviceAccountObj = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountObj as any),
    });

    fcmInitialized = true;
    console.log('✅ Firebase Admin SDK inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin SDK:', error);
    console.warn('Notificações push desabilitadas');
  }
}

// Inicializar na importação
initializeFCM();

/**
 * Enviar notificação push para um token
 */
export async function sendNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  if (!fcmInitialized || !admin) {
    return { success: false, error: 'FCM não inicializado' };
  }

  try {
    const message: any = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        fcmOptions: {
          link: data?.link || '/',
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin!.messaging().send(message);
    console.log('✅ Notificação enviada:', response);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação:', error);

    // Se token inválido, marcar para remover
    if ((error as any).code === 'messaging/invalid-registration-token' || 
        (error as any).code === 'messaging/registration-token-not-registered') {
      return { success: false, error: 'INVALID_TOKEN' };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Enviar notificação para múltiplos tokens
 */
export async function sendNotificationToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  if (!fcmInitialized || !admin || tokens.length === 0) {
    return { successCount: 0, failureCount: tokens.length, errors: ['FCM não inicializado'] };
  }

  try {
    const message: any = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        fcmOptions: {
          link: data?.link || '/',
        },
      },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin!.messaging().sendEachForMulticast(message);
    
    console.log(`✅ Notificações enviadas: ${response.successCount}/${tokens.length}`);
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.responses
        .map((r, i) => (!r.success ? `Token ${i}: ${r.error?.message}` : null))
        .filter(Boolean) as string[],
    };
  } catch (error: any) {
    console.error('❌ Erro ao enviar notificações:', error);
    return {
      successCount: 0,
      failureCount: tokens.length,
      errors: [error.message],
    };
  }
}

/**
 * Verificar se FCM está disponível
 */
export function isFCMAvailable(): boolean {
  return fcmInitialized;
}

