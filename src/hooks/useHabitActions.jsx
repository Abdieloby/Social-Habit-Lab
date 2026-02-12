import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Zap, Trash2, AlertTriangle } from 'lucide-react';
import React from 'react';

export const useHabitActions = () => {
    const { userData } = useAuth();
    const { showToast } = useUI();

    const handleLog = async (habit, selectedDate, newStatus) => {
        if (!userData || !habit) return;
        try {
            const current = habit.history?.[selectedDate] || null;
            if (current === newStatus) return;

            const pointsMap = {
                1: { green: 10, yellow: 5, red: -4 },
                2: { green: 20, yellow: 8, red: -4 },
                3: { green: 30, yellow: 12, red: -5 }
            };

            const getPoints = (status) => {
                if (!status) return 0;
                const base = pointsMap[habit.baseWeight]?.[status] || 0;
                return Math.ceil(base * (habit.personalMod || 1));
            };

            const oldPoints = getPoints(current);
            const newPoints = getPoints(newStatus);
            const diff = newPoints - oldPoints;

            const habitRef = doc(db, 'users', userData.uid, 'habits', habit.id);
            await updateDoc(habitRef, {
                [`history.${selectedDate}`]: newStatus
            });

            await updateDoc(doc(db, 'users', userData.uid), {
                points: increment(diff)
            });

            if (newStatus === 'green' && diff > 0) {
                await addDoc(collection(db, 'feed'), {
                    userId: userData.uid, user: userData.name, aura: userData.auraColor,
                    action: `completó: "${habit.name}"`, type: 'habit_log', timestamp: serverTimestamp()
                });
            }

            showToast('Hábito Registrado', `${diff >= 0 ? '+' : ''}${diff} pts`, <Zap size={16} />);
        } catch (e) {
            console.error(e);
            showToast('Error', 'No se pudo actualizar el hábito.', <AlertTriangle size={16} />);
        }
    };

    const handleDeleteHabit = async (habit) => {
        if (!confirm('¿Eliminar hábito permanentemente?')) return;
        try {
            await deleteDoc(doc(db, 'users', userData.uid, 'habits', habit.id));
            showToast('Hábito Eliminado', null, <Trash2 size={16} />);
        } catch (e) {
            console.error(e);
        }
    };

    return { handleLog, handleDeleteHabit };
};
