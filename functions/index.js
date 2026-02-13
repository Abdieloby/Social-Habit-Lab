const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// --- 1. Secure Point Transaction ---
// Callable function to add/remove points safely from the client
exports.addPoints = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { amount, reason, type } = data;
    const uid = context.auth.uid;

    // 2. Validate Input
    if (!amount || isNaN(amount)) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount must be a number.');
    }

    // Safety check: Prevent massive point injection (e.g., max 100 pts per single transaction)
    if (Math.abs(amount) > 100) {
        throw new functions.https.HttpsError('out-of-range', 'Transaction limit exceeded.');
    }

    try {
        // 3. Execute Transaction
        const { fcmToken } = await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);

            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'User not found.');
            }

            const userData = userDoc.data();
            const newTotal = (userData.points || 0) + amount;

            t.update(userRef, { points: newTotal });

            // 4. Log to Feed (Server-side timestamp for accuracy)
            const feedRef = db.collection('feed').doc();
            t.set(feedRef, {
                userId: uid,
                user: userData.name || 'Agente Anónimo',
                aura: userData.auraColor || '#6366f1',
                action: reason || 'adjusted points',
                type: type || 'system',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return { fcmToken: userData.fcmToken };
        });

        // 5. Send Push Notification if token exists
        if (fcmToken) {
            try {
                await admin.messaging().send({
                    token: fcmToken,
                    notification: {
                        title: 'Social Lab Update',
                        body: `Recibiste ${amount} puntos: ${reason || 'Recompensa del sistema'}`
                    },
                    android: {
                        notification: {
                            icon: 'https://social-habit-lab.web.app/pwa-192x192.png',
                            color: '#6366f1'
                        }
                    },
                    webpush: {
                        notification: {
                            icon: '/pwa-192x192.png'
                        }
                    }
                });
            } catch (msgError) {
                console.log('Error sending notification:', msgError);
                // Don't fail the function if notification fails
            }
        }

        return { success: true, message: 'Points updated successfully' };
    } catch (error) {
        console.error("Transaction failure:", error);
        throw new functions.https.HttpsError('internal', 'Transaction failed');
    }
});

// --- 2. User Setup Trigger ---
// Triggered when a new user is created in Firebase Auth
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;

    try {
        // Create User Document with defaults
        await db.collection('users').doc(uid).set({
            email: email,
            name: displayName || 'Nuevo Recluta',
            points: 50, // Welcome bonus
            auraColor: '#6366f1',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            role: 'agent'
        });

        // Add Welcome Feed Item
        await db.collection('feed').add({
            userId: 'SYSTEM',
            user: 'SOCIAL LAB',
            aura: '#000000',
            action: 'ha reclutado un nuevo agente.',
            type: 'system',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`User ${uid} initialized.`);
    } catch (error) {
        console.error("Error initializing user:", error);
    }
});

// --- 3. Notification Triggers (Kudos & Nudges) ---
// Listens for new feed items to send push notifications
exports.onFeedItemCreate = functions.firestore.document('feed/{feedId}').onCreate(async (snap, context) => {
    const feedItem = snap.data();
    const { type, targetId, user, action } = feedItem;

    // Only process kudos and nudges that have a target
    if (!['kudos', 'nudge'].includes(type) || !targetId) return null;

    try {
        const targetRef = db.collection('users').doc(targetId);
        const targetDoc = await targetRef.get();

        if (!targetDoc.exists) {
            console.log(`Target user ${targetId} not found.`);
            return null;
        }

        const { fcmToken } = targetDoc.data();

        if (fcmToken) {
            const title = type === 'kudos' ? '¡Recibiste Kudos!' : '¡Alguien te anima!';
            const body = `${user} ${action}`;
            const icon = type === 'kudos' ? '/icons/kudos.png' : '/icons/nudge.png'; // Assume exist or fallback

            await admin.messaging().send({
                token: fcmToken,
                notification: { title, body },
                webpush: {
                    notification: {
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png',
                        click_action: 'https://social-habit-lab.web.app/squad'
                    }
                }
            });
            console.log(`Notification sent to ${targetId} for ${type}`);
        } else {
            console.log(`No FCM token for user ${targetId}`);
        }
    } catch (error) {
        console.error("Error sending notification:", error);
    }
});

// --- 4. Scheduled Maintenance ---
// Runs every 24 hours to clean up old feed items
exports.cleanupFeed = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7); // Keep only last 7 days

    try {
        const snapshot = await db.collection('feed')
            .where('timestamp', '<', limitDate)
            .get();

        if (snapshot.empty) {
            console.log('No old feed items to delete.');
            return null;
        }

        // Batch delete (max 500 per batch)
        // const batch = db.batch();
        // snapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        // });
        // await batch.commit();

        // DRY RUN SAFE MODE:
        console.log(`[DRY RUN] Would have deleted ${snapshot.size} old feed items. No changes made.`);
    } catch (error) {
        console.error("Cleanup failed:", error);
    }
});
