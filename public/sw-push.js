// Push Notification Service Worker Extension
// This file handles push notification events

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  let data = {
    title: 'Task Matrix',
    body: 'You have a new notification',
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'task-matrix-notification',
  };

  // Parse the push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        title: pushData.title || data.title,
        body: pushData.body || data.body,
        icon: pushData.icon || data.icon,
        badge: pushData.badge || data.badge,
        tag: pushData.tag || data.tag,
        data: pushData.data || {},
      };
    } catch (e) {
      // If JSON parsing fails, try text
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [200, 100, 200],
    renotify: true,
    requireInteraction: false,
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'open' action - open the app
  const urlToOpen = '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus the existing window
            client.focus();

            // If notification has task data, navigate to it
            if (event.notification.data?.taskId) {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                taskId: event.notification.data.taskId,
                notificationType: event.notification.data.type,
              });
            }

            return client;
          }
        }

        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed:', event);

  // Re-subscribe and update the server
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
      })
      .then((subscription) => {
        // Send the new subscription to your server
        // This would require a fetch to your backend
        console.log('[SW] New subscription:', subscription);
      })
      .catch((error) => {
        console.error('[SW] Failed to resubscribe:', error);
      })
  );
});
