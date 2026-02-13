import { useState, useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase';
import { useUI } from '../context/UIContext';
import { Bell } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
    const { userData } = useAuth();
    const { showToast } = useUI();
    const [permission, setPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);
    const messageListenerSet = useRef(false);

    // Effect 1: Initialize messaging when permission is granted
    useEffect(() => {
        if (Notification.permission === 'granted') {
            registerServiceWorker();
            initializeMessaging();
        }
    }, []);

    // Effect 2: CRITICAL FIX — Save token to Firestore whenever BOTH are ready
    // This solves the race condition where token arrives before auth resolves
    useEffect(() => {
        if (userData?.uid && fcmToken) {
            console.log('[Notifications] Saving FCM token to Firestore for user:', userData.uid);
            updateDoc(doc(db, 'users', userData.uid), {
                fcmToken: fcmToken
            }).then(() => {
                console.log('[Notifications] ✅ FCM Token saved to Firestore successfully');
            }).catch(err => {
                console.error('[Notifications] ❌ Failed to save FCM token:', err);
            });
        }
    }, [userData, fcmToken]);

    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered with scope:', registration.scope);
            } catch (err) {
                console.error('Service Worker registration failed:', err);
            }
        }
    };

    const initializeMessaging = async () => {
        try {
            const messaging = getMessaging(app);

            let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if (!serviceWorkerRegistration) {
                serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            }

            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration
            });

            if (currentToken) {
                console.log('FCM Token:', currentToken);
                setFcmToken(currentToken);
                // Token saving now happens in Effect 2 above (no longer here)
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }

            // Set up foreground message listener (only once)
            if (!messageListenerSet.current) {
                messageListenerSet.current = true;
                onMessage(messaging, (payload) => {
                    console.log('🔔 FOREGROUND MSG RECEIVED:', payload);
                    const { title, body } = payload.notification || {};

                    if (title) {
                        // 1. Show In-App Toast (PRIORITY)
                        try {
                            showToast(title, body, <Bell size={16} />);
                        } catch (e) {
                            console.error('Toast failed:', e);
                        }

                        // 2. Try system notification too (belt and suspenders)
                        try {
                            if (Notification.permission === 'granted') {
                                new Notification(title, {
                                    body: body,
                                    icon: '/pwa-192x192.png'
                                });
                            }
                        } catch (e) {
                            console.warn('System notification failed:', e);
                        }

                        // 3. Play Sound
                        try {
                            import('../utils/soundEffects').then(({ playSound }) => playSound('kudos'));
                        } catch (e) {
                            console.error('Sound failed:', e);
                        }
                    }
                });
            }

        } catch (err) {
            console.log('An error occurred while retrieving token. ', err);
        }
    };

    const requestPermission = async () => {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm === 'granted') {
            initializeMessaging();
            showToast('Notificaciones Activas', 'Recibirás alertas de tu squad.', <Bell size={16} />);
        } else {
            showToast('Permiso Denegado', 'No podremos enviarte alertas.', <Bell size={16} />);
        }
    };

    return { permission, requestPermission, fcmToken };
};
