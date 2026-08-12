importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAHCt72AmAb3Sc7mCwClVCdnmFhOcCGqtI",
  projectId: "http-chat-c63f5",
  messagingSenderId: "927724461836",
  appId: "1:927724461836:web:049f6d50629772bd80b329",
  authDomain: "http-chat-c63f5.firebaseapp.com",
  storageBucket: "http-chat-c63f5.firebasestorage.app"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'HTTP CHAT';
  const notificationOptions = {
    body: payload.notification?.body || 'New message',
    icon: '/favicon.ico',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
