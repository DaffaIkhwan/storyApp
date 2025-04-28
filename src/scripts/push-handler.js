self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'no data'}"`);

  const pushData = event.data ? event.data.json() : {};

  const title = pushData.title || 'Storyku Notification';
  const options = {
    body: pushData.body || 'Ada notifikasi baru untukmu!',
    icon: pushData.icon || 'icons/icon-192x192.png',
    badge: pushData.badge || 'icons/icon-72x72.png',
    data: pushData.data || { url: '/#/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/#/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});