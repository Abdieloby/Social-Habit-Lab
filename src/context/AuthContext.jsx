import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setAuthUser(user);
            if (user) {
                const unsubDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    } else {
                        setUserData(null); // Should not happen ideally
                    }
                    setLoading(false);
                });
                return () => unsubDoc();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAuth = async (isSignUp, email, password, name, aura) => {
        if (isSignUp) {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', res.user.uid), {
                name, email, auraColor: aura, points: 0, streak: 0, role: 'Member', createdAt: serverTimestamp()
            });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    };

    const handleSignOut = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ authUser, userData, loading, handleAuth, handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
};
