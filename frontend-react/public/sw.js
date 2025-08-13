// Service Worker para PRECIVOX
const CACHE_NAME = 'precivox-v1.1'; // Atualizando versão do cache
const STATIC_CACHE = 'precivox-static-v1.1';
const DYNAMIC_CACHE = 'precivox-dynamic-v1.1';
const API_CACHE = 'precivox-api-v1.1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/precivox-logo.svg'
];

const IMAGE_CACHE_NAME = 'precivox-images-v1.0.2';

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// ✅ INSTALAÇÃO DO SERVICE WORKER
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Cachando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// ✅ ATIVAÇÃO DO SERVICE WORKER
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker ativado');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remover caches antigos
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// ✅ INTERCEPTAÇÃO DE REQUESTS
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia baseada no tipo de recurso
  if (request.method !== 'GET') {
    return; // Não cachear requests não-GET
  }

  // ✅ CACHE PARA RECURSOS ESTÁTICOS
  if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request));
  }
  // ✅ CACHE PARA APIs
  else if (isApiCall(url)) {
    event.respondWith(handleApiCall(request));
  }
  // ✅ CACHE PARA IMAGENS
  else if (isImageResource(url)) {
    event.respondWith(handleImageResource(request));
  }
  // ✅ FALLBACK PARA OUTROS RECURSOS
  else {
    event.respondWith(handleGenericResource(request));
  }
});

// ✅ VERIFICAR SE É RECURSO ESTÁTICO
function isStaticResource(url) {
  const staticExtensions = ['.js', '.css', '.html', '.json', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname === '/' ||
         url.pathname.includes('/assets/');
}

// ✅ VERIFICAR SE É CHAMADA DE API
function isApiCall(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname !== self.location.hostname;
}

// ✅ VERIFICAR SE É IMAGEM
function isImageResource(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext)) ||
         url.pathname.includes('/placeholder/');
}

// ✅ ESTRATÉGIA CACHE-FIRST PARA RECURSOS ESTÁTICOS
async function handleStaticResource(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Cache hit (estático):', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const contentType = networkResponse.headers.get('content-type');
      // Só cachear se o content-type estiver correto
      if (contentType && (
        contentType.includes('javascript') || 
        contentType.includes('css') || 
        contentType.includes('html') ||
        contentType.includes('image') ||
        contentType.includes('json')
      )) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        console.log('💾 Cached (estático):', request.url);
      } else {
        console.log('⚠️ MIME type inválido, não cacheando:', request.url, contentType);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Erro ao buscar recurso estático:', error);
    return new Response('Recurso não disponível offline', { status: 503 });
  }
}

// ✅ ESTRATÉGIA NETWORK-FIRST PARA APIs
async function handleApiCall(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear apenas GETs de API por tempo limitado
      if (request.method === 'GET') {
        const cache = await caches.open(API_CACHE);
        const clonedResponse = networkResponse.clone();
        
        // Adicionar timestamp para controle de expiração
        const responseWithTimestamp = new Response(clonedResponse.body, {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers: {
            ...Object.fromEntries(clonedResponse.headers.entries()),
            'sw-cached-at': Date.now().toString()
          }
        });
        
        cache.put(request, responseWithTimestamp);
        console.log('💾 Cached (API):', request.url);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network falhou, tentando cache para API:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const cacheAge = Date.now() - parseInt(cachedAt || '0');
      
      // Cache de API válido por 5 minutos
      if (cacheAge < 5 * 60 * 1000) {
        console.log('📦 Cache hit (API):', request.url);
        return cachedResponse;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Serviço indisponível offline',
      cached: false 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ✅ ESTRATÉGIA STALE-WHILE-REVALIDATE PARA IMAGENS
async function handleImageResource(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Servir do cache imediatamente se disponível
  if (cachedResponse) {
    console.log('📦 Cache hit (imagem):', request.url);
    
    // Revalidar em background
    fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          console.log('🔄 Revalidated (imagem):', request.url);
        }
      })
      .catch(() => {
        // Falha silenciosa na revalidação
      });
    
    return cachedResponse;
  }
  
  // Se não tem cache, buscar da rede
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('💾 Cached (imagem):', request.url);
    }
    return networkResponse;
  } catch (error) {
    // Retornar imagem placeholder se falhar
    return new Response('', { 
      status: 404,
      statusText: 'Imagem não disponível offline' 
    });
  }
}

// ✅ ESTRATÉGIA GENÉRICA
async function handleGenericResource(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Cache hit (genérico):', request.url);
      return cachedResponse;
    }
    
    return new Response('Recurso não disponível', { status: 503 });
  }
}

// ✅ LIMPEZA PERIÓDICA DE CACHE
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🧹 Limpando caches...');
    
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
        .then(() => {
          console.log('✅ Todos os caches limpos');
          return self.registration.update();
        })
    );
  }
});

// ✅ NOTIFICAÇÕES PUSH AVANÇADAS
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  
  if (event.data) {
    try {
      const notificationData = event.data.json();
      console.log('📬 Notification data:', notificationData);
      
      const options = {
        body: notificationData.body || 'Nova notificação do PRECIVOX',
        icon: notificationData.icon || '/icons/icon-192x192.png',
        badge: notificationData.badge || '/icons/icon-72x72.png',
        image: notificationData.image,
        data: notificationData.data || {},
        tag: notificationData.tag || 'precivox-notification',
        requireInteraction: notificationData.requireInteraction || false,
        silent: notificationData.silent || false,
        vibrate: notificationData.vibrate || [200, 100, 200],
        actions: notificationData.actions || [
          { action: 'view', title: 'Ver', icon: '/icons/view-action.png' },
          { action: 'dismiss', title: 'Dispensar', icon: '/icons/dismiss-action.png' }
        ],
        timestamp: Date.now()
      };
      
      event.waitUntil(
        self.registration.showNotification(
          notificationData.title || 'PRECIVOX',
          options
        )
      );
    } catch (error) {
      console.error('❌ Erro ao processar push notification:', error);
      
      // Fallback para notificação básica
      event.waitUntil(
        self.registration.showNotification('PRECIVOX', {
          body: 'Você tem uma nova notificação',
          icon: '/icons/icon-192x192.png',
          tag: 'precivox-fallback'
        })
      );
    }
  } else {
    // Push sem dados - mostrar notificação genérica
    event.waitUntil(
      self.registration.showNotification('PRECIVOX', {
        body: 'Você tem uma nova atualização',
        icon: '/icons/icon-192x192.png',
        tag: 'precivox-generic'
      })
    );
  }
});

// ✅ CLICK EM NOTIFICAÇÕES COM AÇÕES
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let targetUrl = '/';
  
  // Determinar URL baseada na ação e dados
  if (action === 'view' || !action) {
    switch (data.type) {
      case 'price_alert':
        targetUrl = `/#search?q=${encodeURIComponent(data.productName || '')}`;
        break;
      case 'new_offers':
        targetUrl = '/#search?filter=promocao';
        break;
      case 'list_reminder':
        targetUrl = '/#listas';
        break;
      default:
        targetUrl = data.url || '/';
    }
  } else if (action === 'view-product') {
    targetUrl = `/#search?q=${encodeURIComponent(data.productName || '')}`;
  } else if (action === 'view-offers') {
    targetUrl = '/#search?filter=promocao';
  } else if (action === 'view-list') {
    targetUrl = '/#listas';
  } else if (action === 'add-to-list') {
    targetUrl = `/#search?q=${encodeURIComponent(data.productName || '')}&action=add-to-list`;
  } else if (action === 'find-stores') {
    targetUrl = '/#search?view=stores';
  } else if (action === 'dismiss') {
    // Apenas fechar a notificação
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Verificar se já há uma janela aberta do PRECIVOX
        for (const client of clientList) {
          if (client.url.includes('precivox') && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action,
              data,
              targetUrl
            });
            return client;
          }
        }
        
        // Se não há janela aberta, abrir nova
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('❌ Erro ao processar click da notificação:', error);
      })
  );
});

// ✅ FECHAMENTO DE NOTIFICAÇÕES
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event.notification.tag);
  
  // Analytics de notificações fechadas
  const data = event.notification.data || {};
  
  // Enviar evento para analytics (se disponível)
  if (data.type) {
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: data.type,
        tag: event.notification.tag,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Ignorar erros de analytics
    });
  }
});

console.log('🚀 Service Worker PRECIVOX carregado');