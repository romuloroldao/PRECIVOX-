/* PRECIVOX — service worker para Web Push (retenção) */
self.addEventListener('push', (event) => {
  let payload = { title: 'PRECIVOX', body: '', data: {} };
  try {
    payload = { ...payload, ...JSON.parse(event.data?.text() ?? '{}') };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo-precivox.svg',
      badge: '/logo-precivox.svg',
      data: payload.data,
      tag: payload.data?.type || 'precivox-retencao',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/cliente/home';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
