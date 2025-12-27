// Service Worker for push notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();

  // Discreet notification - no health details exposed
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    // Don't show sensitive info on lock screen
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'thehole.app', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Service worker install
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Service worker activate
self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
