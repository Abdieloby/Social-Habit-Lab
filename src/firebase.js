import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase Project Configuration
// Get this from: Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
    apiKey: "AIzaSyDerc5XGEH1bJBSQm5QpiYGtREfbWiRS7Q",
    authDomain: "social-habit-lab.firebaseapp.com",
    projectId: "social-habit-lab",
    storageBucket: "social-habit-lab.firebasestorage.app",
    messagingSenderId: "861201868189",
    appId: "1:861201868189:web:baa13f69feee340ca53b74"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
