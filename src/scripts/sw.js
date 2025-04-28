import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Do precaching
precacheAndRoute(self.__WB_MANIFEST);

// Handle push events for new stories
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received');
    console.log('Raw push data:', event.data?.text());

    let notificationData;

    try {
        const payload = event.data ? event.data.json() : {};
        console.log('Parsed payload:', payload);

        // Match Dicoding's API notification format exactly
        notificationData = {
            title: payload.title || 'Story berhasil dibuat',
            options: {
                body: payload.options?.body || 'Ada story baru telah ditambahkan!',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [100, 50, 100],
                tag: 'story-notification',
                renotify: true,
                requireInteraction: true,
                data: {
                    url: self.location.origin + '/#/stories'
                }
            }
        };

        // Log notification data for debugging
        console.log('Notification Data:', notificationData);

    } catch (error) {
        console.error('[Service Worker] Push data parsing error:', error);
        notificationData = {
            title: 'Story App',
            options: {
                body: 'Ada story baru!',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [100, 50, 100]
            }
        };
    }

    event.waitUntil(
        (async () => {
            try {
                await self.registration.showNotification(
                    notificationData.title, 
                    notificationData.options
                );
                console.log('Notification shown successfully');
            } catch (error) {
                console.error('Show notification error:', error);
            }
        })()
    );
});

// Add handling for notification action clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.notification.tag);
    event.notification.close();

    const urlToOpen = event.notification.data?.url || self.location.origin + '/#/stories';

    // Handle action clicks
    if (event.action === 'view-story') {
        console.log('View story action clicked');
    }

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(urlToOpen);
        })
    );
});