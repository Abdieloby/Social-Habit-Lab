const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyData() {
    console.log("--- CHECKING LAST 5 FEED ITEMS ---");
    const feedSnap = await db.collection('feed')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

    feedSnap.forEach(doc => {
        const data = doc.data();
        console.log(`[${doc.id}] Type: ${data.type}, Target: ${data.targetId || 'N/A'}, Action: ${data.action}`);
        if (data.type === 'nudge' && data.targetId) {
            checkUser(data.targetId);
        }
    });
}

async function checkUser(uid) {
    console.log(`\n--- CHECKING USER ${uid} ---`);
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        console.log("USER DOC DOES NOT EXIST!");
    } else {
        const data = userDoc.data();
        console.log(`Name: ${data.name}`);
        console.log(`FCM Token: ${data.fcmToken ? (data.fcmToken.substring(0, 20) + '...') : 'MISSING'}`);
    }
}

verifyData();
