// Service Worker for push notifications
// Version 2 - adds click-to-navigate

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
