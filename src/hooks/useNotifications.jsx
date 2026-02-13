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
            initializeMessaging();
        }
    }, []);

    // Effect 2: Save token to Firestore whenever BOTH are ready
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

    const initializeMessaging = async () => {
        try {
            const messaging = getMessaging(app);

            // Step 1: Register the SW
            console.log('[Notifications] Registering Service Worker...');
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // Step 2: Wait for SW to be fully activated
            console.log('[Notifications] Waiting for Service Worker to activate...');
            const serviceWorkerRegistration = await navigator.serviceWorker.ready;
            console.log('[Notifications] ✅ Service Worker is READY:', serviceWorkerRegistration.scope);

            // Step 3: Get the token (SW is guaranteed active)
            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration
            });

            if (currentToken) {
                console.log('[Notifications] FCM Token:', currentToken);
                setFcmToken(currentToken);
            } else {
                console.log('[Notifications] No registration token available.');
            }

            // Step 4: Set up foreground message listener (only once)
            if (!messageListenerSet.current) {
                messageListenerSet.current = true;
                console.log('[Notifications] 🎧 Foreground message listener REGISTERED');

                onMessage(messaging, (payload) => {
                    console.log('🔔 FOREGROUND MSG RECEIVED:', JSON.stringify(payload));

                    // Handle both notification messages AND data-only messages
                    const title = payload.notification?.title || payload.data?.title || 'Notification';
                    const body = payload.notification?.body || payload.data?.body || '';

                    if (title) {
                        try {
                            showToast(title, body, <Bell size={16} />);
                            console.log('🔔 Toast shown');
                        } catch (e) {
                            console.error('Toast failed:', e);
                        }

                        try {
                            if (Notification.permission === 'granted') {
                                new Notification(title, {
                                    body: body,
                                    icon: '/pwa-192x192.png'
                                });
                                console.log('🔔 System notification shown');
                            }
                        } catch (e) {
                            console.warn('System notification failed:', e);
                        }

                        try {
                            import('../utils/soundEffects').then(({ playSound }) => playSound('kudos'));
                        } catch (e) {
                            console.error('Sound failed:', e);
                        }
                    }
                });
            }

        } catch (err) {
            console.error('[Notifications] Error during init:', err);
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
