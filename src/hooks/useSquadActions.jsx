import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Heart, Bell } from 'lucide-react';
import React from 'react';

export const useSquadActions = () => {
    const { userData } = useAuth();
    const { showToast } = useUI();

    const handleKudos = async (target) => {
        if (!userData || userData.points < 5) return;
        try {
            await updateDoc(doc(db, 'users', userData.uid), { points: increment(-5) });
            await updateDoc(doc(db, 'users', target.id), { points: increment(5) });
            await addDoc(collection(db, 'feed'), {
                userId: userData.uid, user: userData.name, aura: userData.auraColor,
                action: `envió Kudos a ${target.name}`, type: 'kudos', timestamp: serverTimestamp()
            });
            showToast('Kudos Enviados', '5 puntos transferidos.', <Heart size={16} />);
        } catch (e) { console.error(e); }
    };

    const handleNudge = async (target) => {
        // Could add logic for nudge fees or limits
        showToast('Nudge Enviado', `Has animado a ${target.name}`, <Bell size={16} />);
    };

    return { handleKudos, handleNudge };
};
