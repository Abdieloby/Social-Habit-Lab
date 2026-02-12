import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Zap } from 'lucide-react';
import React from 'react';

export const useGlobalHabits = () => {
    const [globalHabits, setGlobalHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userData } = useAuth();
    const { showToast } = useUI();

    useEffect(() => {
        const globalHabitsRef = collection(db, 'habits');
        const unsubGlobal = onSnapshot(query(globalHabitsRef, orderBy('createdAt', 'desc')), (snapshot) => {
            setGlobalHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching global habits:", error);
            setLoading(false);
        });

        return () => unsubGlobal();
    }, []);

    const handleCreateHabit = async (name, weight, note) => {
        if (!userData) return;
        try {
            const newGlobal = {
                name,
                baseWeight: weight,
                description: note,
                createdBy: userData.uid,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'habits'), newGlobal);

            await setDoc(doc(db, 'users', userData.uid, 'habits', docRef.id), {
                name,
                baseWeight: weight,
                personalMod: 1.0,
                globalId: docRef.id,
                history: {},
                createdAt: serverTimestamp()
            });

            showToast('Hábito Creado', 'Sincronizado globalmente.', <Zap size={16} />);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const adoptHabit = async (gh) => {
        if (!userData) return;
        try {
            await setDoc(doc(db, 'users', userData.uid, 'habits', gh.id), {
                name: gh.name,
                baseWeight: gh.baseWeight,
                personalMod: 1.0,
                globalId: gh.id,
                history: {},
                createdAt: serverTimestamp()
            });
            showToast('Hábito Adoptado', `"${gh.name}" añadido a tu protocolo.`, <Zap size={16} />);
        } catch (e) {
            console.error(e);
        }
    };

    return { globalHabits, loading, handleCreateHabit, adoptHabit };
};
