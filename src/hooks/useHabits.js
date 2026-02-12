import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useHabits = () => {
    const { userData } = useAuth();
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData) {
            setHabits([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'users', userData.uid, 'habits'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching habits:", error);
            setLoading(false);
        });

        return () => unsub();
    }, [userData]);

    return { habits, loading };
};
