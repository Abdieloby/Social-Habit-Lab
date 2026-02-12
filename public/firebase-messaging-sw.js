// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // User will need to replace this if using env vars or config
    authDomain: "social-habit-lab.firebaseapp.com",
    projectId: "social-habit-lab",
    storageBucket: "social-habit-lab.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // TODO: Replace with actual ID
    appId: "YOUR_APP_ID" // TODO: Replace with actual ID
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here if needed
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
