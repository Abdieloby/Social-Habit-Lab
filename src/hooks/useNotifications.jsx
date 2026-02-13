import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase'; // Import the initialized app
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

    useEffect(() => {
        if (Notification.permission === 'granted') {
            initializeMessaging();
        }
    }, []);

    const initializeMessaging = async () => {
        try {
            const messaging = getMessaging(app);

            // Request permission
            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });

            if (currentToken) {
                console.log('FCM Token:', currentToken);
                setFcmToken(currentToken);

                // Save token to user profile if logged in
                if (userData?.uid) {
                    await updateDoc(doc(db, 'users', userData.uid), {
                        fcmToken: currentToken
                    });
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }

            // Listen for foreground messages
            onMessage(messaging, (payload) => {
                console.log('Message received. ', payload);
                const { title, body } = payload.notification;
                showToast(title, body, <Bell size={16} />);
            });

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
