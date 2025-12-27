// Service Worker for push notifications
// Version 3 - adds in-app notifications with sound

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

  // Post message to all clients so in-app notification can show
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'thehole.app', options),
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            payload: {
              title: data.title || 'thehole.app',
              body: data.body || 'You have a new notification',
              url: data.url || '/',
            },
          });
        });
      }),
    ])
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlPath = event.notification.data?.url || '/';
  const fullUrl = new URL(urlPath, self.location.origin).href;

  // On iOS, always open the URL directly - client.navigate() doesn't work reliably
  event.waitUntil(
    clients.openWindow(fullUrl)
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
