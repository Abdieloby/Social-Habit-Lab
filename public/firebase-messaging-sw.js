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

// Force SW to activate immediately
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Aggressive Fallback: Ensure SOMETHING is shown
    const notificationTitle = payload.notification?.title || 'Social Habit Lab Update';
    const notificationOptions = {
        body: payload.notification?.body || 'New activity in your squad!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: payload.data,
        // Android specific
        tag: 'social-habit-lab-notification',
        renotify: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url.includes('social-habit-lab') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
