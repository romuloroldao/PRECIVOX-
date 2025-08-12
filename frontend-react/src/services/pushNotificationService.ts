// services/pushNotificationService.ts - SERVIÇO DE NOTIFICAÇÕES PUSH
import { loggingService } from './loggingService';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

interface PushConfig {
  vapidPublicKey: string;
  serverEndpoint: string;
  enableAutoSubscription: boolean;
  retryAttempts: number;
  batchSize: number;
}

class PushNotificationService {
  private config: PushConfig = {
    vapidPublicKey: 'BOmGpX8jfzOc_j2-KjqV8_2c7JzZGX2hXCIWvqB9fN0eYXzVkD8cNfL7K0mN9xQP1wE8r6Y4vGhL2oT5xZqN3cF',
    serverEndpoint: '/api/push/subscription',
    enableAutoSubscription: false,
    retryAttempts: 3,
    batchSize: 100
  };

  private subscription: PushSubscription | null = null;
  private permission: NotificationPermission = 'default';
  private isSubscribing = false;

  constructor() {
    this.initializeService();
  }

  // ✅ VERIFICAR SUPORTE A PUSH NOTIFICATIONS
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // ✅ VERIFICAR PERMISSÃO ATUAL
  async checkPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    this.permission = Notification.permission;
    loggingService.debug('PUSH', `Permissão atual: ${this.permission}`);
    return this.permission;
  }

  // ✅ SOLICITAR PERMISSÃO
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications não são suportadas');
    }

    try {
      loggingService.info('PUSH', 'Solicitando permissão para notificações');
      
      this.permission = await Notification.requestPermission();
      
      loggingService.info('PUSH', `Permissão concedida: ${this.permission}`);
      return this.permission;
    } catch (error) {
      loggingService.error('PUSH', 'Erro ao solicitar permissão', error);
      throw error;
    }
  }

  // ✅ INSCREVER-SE PARA RECEBER PUSH NOTIFICATIONS
  async subscribe(userId?: string): Promise<PushSubscription> {
    if (this.isSubscribing) {
      throw new Error('Inscrição já em andamento');
    }

    if (!this.isSupported()) {
      throw new Error('Push notifications não são suportadas');
    }

    try {
      this.isSubscribing = true;
      loggingService.info('PUSH', 'Iniciando inscrição para push notifications');

      // Verificar permissão
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        const newPermission = await this.requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Permissão negada para notificações');
        }
      }

      // Obter service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se já existe uma inscrição
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        loggingService.info('PUSH', 'Usando inscrição existente');
        await this.updateSubscriptionOnServer(userId);
        return existingSubscription;
      }

      // Criar nova inscrição
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
      });

      this.subscription = subscription;
      
      // Salvar no servidor
      await this.saveSubscriptionToServer(subscription, userId);
      
      loggingService.info('PUSH', 'Inscrição criada com sucesso', {
        endpoint: subscription.endpoint,
        userId
      });

      return subscription;
    } catch (error) {
      loggingService.error('PUSH', 'Erro na inscrição', error);
      throw error;
    } finally {
      this.isSubscribing = false;
    }
  }

  // ✅ CANCELAR INSCRIÇÃO
  async unsubscribe(): Promise<boolean> {
    try {
      loggingService.info('PUSH', 'Cancelando inscrição');

      if (this.subscription) {
        const success = await this.subscription.unsubscribe();
        
        if (success) {
          // Remover do servidor
          await this.removeSubscriptionFromServer();
          this.subscription = null;
          
          loggingService.info('PUSH', 'Inscrição cancelada com sucesso');
        }
        
        return success;
      }

      return true;
    } catch (error) {
      loggingService.error('PUSH', 'Erro ao cancelar inscrição', error);
      throw error;
    }
  }

  // ✅ OBTER INSCRIÇÃO ATUAL
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      loggingService.error('PUSH', 'Erro ao obter inscrição', error);
      return null;
    }
  }

  // ✅ ENVIAR NOTIFICAÇÃO LOCAL (PARA TESTE)
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notificações não são suportadas');
    }

    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão não concedida para notificações');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        image: payload.image,
        data: payload.data,
        tag: payload.tag,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [200, 100, 200]
      });

      loggingService.info('PUSH', 'Notificação local exibida', {
        title: payload.title,
        tag: payload.tag
      });
    } catch (error) {
      loggingService.error('PUSH', 'Erro ao exibir notificação local', error);
      throw error;
    }
  }

  // ✅ CONFIGURAR NOTIFICAÇÕES AUTOMÁTICAS
  setupAutomaticNotifications(): void {
    // Notificações de preços em promoção
    this.scheduleNotification({
      title: 'Novas Promoções! 🏷️',
      body: 'Produtos em oferta próximos a você foram encontrados',
      tag: 'promotions',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Ver Ofertas' },
        { action: 'dismiss', title: 'Dispensar' }
      ]
    }, 'daily', 9); // Diariamente às 9h

    // Lembrete de lista de compras
    this.scheduleNotification({
      title: 'Lista de Compras 📝',
      body: 'Não esqueça de sua lista de compras!',
      tag: 'shopping-reminder',
      actions: [
        { action: 'view-list', title: 'Ver Lista' },
        { action: 'dismiss', title: 'Mais Tarde' }
      ]
    }, 'weekly', 10); // Semanalmente às 10h
  }

  // ✅ NOTIFICAÇÕES ESPECÍFICAS DO PRECIVOX
  async notifyPriceAlert(productName: string, oldPrice: number, newPrice: number): Promise<void> {
    const savings = oldPrice - newPrice;
    const savingsPercent = Math.round((savings / oldPrice) * 100);

    await this.showLocalNotification({
      title: `💰 Preço Baixou ${savingsPercent}%`,
      body: `${productName}: de R$ ${oldPrice.toFixed(2)} por R$ ${newPrice.toFixed(2)}`,
      icon: '/icons/price-alert.png',
      tag: 'price-alert',
      requireInteraction: true,
      data: { type: 'price_alert', productName, oldPrice, newPrice },
      actions: [
        { action: 'view-product', title: 'Ver Produto' },
        { action: 'add-to-list', title: 'Adicionar à Lista' }
      ]
    });
  }

  async notifyNewOffers(count: number): Promise<void> {
    await this.showLocalNotification({
      title: `🎉 ${count} Novas Ofertas!`,
      body: 'Produtos em promoção foram encontrados próximos a você',
      tag: 'new-offers',
      data: { type: 'new_offers', count },
      actions: [
        { action: 'view-offers', title: 'Ver Ofertas' },
        { action: 'dismiss', title: 'Depois' }
      ]
    });
  }

  async notifyListReminder(listName: string, itemCount: number): Promise<void> {
    await this.showLocalNotification({
      title: `📋 Lembrete: ${listName}`,
      body: `Sua lista tem ${itemCount} itens. Que tal fazer as compras?`,
      tag: 'list-reminder',
      data: { type: 'list_reminder', listName, itemCount },
      actions: [
        { action: 'view-list', title: 'Ver Lista' },
        { action: 'find-stores', title: 'Encontrar Lojas' }
      ]
    });
  }

  // ✅ ESTATÍSTICAS DE NOTIFICAÇÕES
  getNotificationStats(): {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    endpoint?: string;
  } {
    return {
      supported: this.isSupported(),
      permission: this.permission,
      subscribed: !!this.subscription,
      endpoint: this.subscription?.endpoint
    };
  }

  // ✅ MÉTODOS PRIVADOS
  private async initializeService(): Promise<void> {
    if (!this.isSupported()) {
      loggingService.warn('PUSH', 'Push notifications não são suportadas');
      return;
    }

    await this.checkPermission();
    await this.getSubscription();

    if (this.config.enableAutoSubscription && this.permission === 'granted' && !this.subscription) {
      try {
        await this.subscribe();
      } catch (error) {
        loggingService.warn('PUSH', 'Auto-inscrição falhou', error);
      }
    }

    loggingService.info('PUSH', 'Serviço de push notifications inicializado');
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async saveSubscriptionToServer(subscription: PushSubscription, userId?: string): Promise<void> {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
      },
      userId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    try {
      const response = await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      loggingService.info('PUSH', 'Inscrição salva no servidor');
    } catch (error) {
      loggingService.error('PUSH', 'Erro ao salvar inscrição no servidor', error);
      // Não relançar erro para não bloquear a funcionalidade local
    }
  }

  private async updateSubscriptionOnServer(userId?: string): Promise<void> {
    if (!this.subscription) return;
    await this.saveSubscriptionToServer(this.subscription, userId);
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    if (!this.subscription) return;

    try {
      const response = await fetch(`${this.config.serverEndpoint}/${encodeURIComponent(this.subscription.endpoint)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      loggingService.info('PUSH', 'Inscrição removida do servidor');
    } catch (error) {
      loggingService.error('PUSH', 'Erro ao remover inscrição do servidor', error);
    }
  }

  private scheduleNotification(payload: NotificationPayload, frequency: 'daily' | 'weekly', hour: number): void {
    // Implementação simplificada - em produção usaria service worker com background sync
    const now = new Date();
    let nextTrigger = new Date();
    
    nextTrigger.setHours(hour, 0, 0, 0);
    
    if (frequency === 'daily') {
      if (nextTrigger <= now) {
        nextTrigger.setDate(nextTrigger.getDate() + 1);
      }
    } else if (frequency === 'weekly') {
      nextTrigger.setDate(nextTrigger.getDate() + (7 - nextTrigger.getDay()));
      if (nextTrigger <= now) {
        nextTrigger.setDate(nextTrigger.getDate() + 7);
      }
    }

    const delay = nextTrigger.getTime() - now.getTime();
    
    setTimeout(() => {
      this.showLocalNotification(payload).catch(error => {
        loggingService.error('PUSH', 'Erro na notificação agendada', error);
      });
    }, Math.min(delay, 2147483647)); // Limite do setTimeout

    loggingService.info('PUSH', `Notificação agendada para ${nextTrigger.toISOString()}`);
  }

  // ✅ CONFIGURAÇÃO
  configure(newConfig: Partial<PushConfig>): void {
    this.config = { ...this.config, ...newConfig };
    loggingService.info('PUSH', 'Configuração atualizada', newConfig);
  }

  getConfig(): PushConfig {
    return { ...this.config };
  }
}

// ✅ INSTANCE SINGLETON
export const pushNotificationService = new PushNotificationService();

// ✅ HOOK PARA USO EM COMPONENTES
export const usePushNotifications = () => {
  return {
    isSupported: () => pushNotificationService.isSupported(),
    checkPermission: () => pushNotificationService.checkPermission(),
    requestPermission: () => pushNotificationService.requestPermission(),
    subscribe: (userId?: string) => pushNotificationService.subscribe(userId),
    unsubscribe: () => pushNotificationService.unsubscribe(),
    getSubscription: () => pushNotificationService.getSubscription(),
    showLocalNotification: (payload: NotificationPayload) => 
      pushNotificationService.showLocalNotification(payload),
    
    // Notificações específicas
    notifyPriceAlert: (productName: string, oldPrice: number, newPrice: number) =>
      pushNotificationService.notifyPriceAlert(productName, oldPrice, newPrice),
    notifyNewOffers: (count: number) =>
      pushNotificationService.notifyNewOffers(count),
    notifyListReminder: (listName: string, itemCount: number) =>
      pushNotificationService.notifyListReminder(listName, itemCount),
    
    // Controles
    setupAutomaticNotifications: () => pushNotificationService.setupAutomaticNotifications(),
    getNotificationStats: () => pushNotificationService.getNotificationStats(),
    configure: (config: Partial<PushConfig>) => pushNotificationService.configure(config)
  };
};

export default pushNotificationService;