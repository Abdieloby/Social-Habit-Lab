import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const useFeed = () => {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'feed'), orderBy('timestamp', 'desc'), limit(50));
        const unsub = onSnapshot(q, (snapshot) => {
            setFeed(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feed:", error);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { feed, loading };
};
