import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const useSquad = () => {
    const [squad, setSquad] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const squadData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSquad(squadData);

            const mapping = {};
            squadData.forEach(u => mapping[u.id] = u);
            setUsersMap(mapping);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching squad:", error);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { squad, usersMap, loading };
};
