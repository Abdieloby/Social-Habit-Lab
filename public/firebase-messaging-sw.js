// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyBU4hc4gYYiDWxeVHPJWhEnhAFTlyRMpdM",
    authDomain: "social-habit-lab.firebaseapp.com",
    projectId: "social-habit-lab",
    storageBucket: "social-habit-lab.firebasestorage.app",
    messagingSenderId: "861201868189",
    appId: "1:861201868189:web:baa13f69feee340ca53b74"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// v2.1 - Force SW to activate immediately
console.log('[SW] Service Worker loaded v2.1');

self.addEventListener('install', (event) => {
    console.log('[SW] Installing v2.1');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating v2.1');
    event.waitUntil(clients.claim());
});

// Handle background messages (both notification and data-only)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 🔔 BACKGROUND MESSAGE RECEIVED:', JSON.stringify(payload));

    const title = payload.notification?.title || payload.data?.title || 'Social Habit Lab Update';
    const body = payload.notification?.body || payload.data?.body || 'New activity in your squad!';

    const notificationOptions = {
        body: body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: payload.data,
        tag: 'social-habit-lab-notification',
        renotify: true
    };

    return self.registration.showNotification(title, notificationOptions);
});

// Catch ALL push events as a final fallback
self.addEventListener('push', (event) => {
    console.log('[SW] 📬 RAW PUSH EVENT:', event);
    if (event.data) {
        console.log('[SW] Push data:', event.data.text());
    }
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click received.');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.includes('social-habit-lab') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
