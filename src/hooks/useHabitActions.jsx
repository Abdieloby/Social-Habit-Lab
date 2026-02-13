import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Zap, Trash2, AlertTriangle } from 'lucide-react';
import React from 'react';
import { haptic } from '../utils/haptics';
import { launchConfetti } from '../utils/confetti';

const pointsMap = {
    1: { green: 10, yellow: 5, red: -4 },
    2: { green: 20, yellow: 8, red: -4 },
    3: { green: 30, yellow: 12, red: -5 }
};

/**
 * Calculate the current streak (consecutive days with green or yellow)
 * by walking backwards from today across ALL habits.
 */
const calculateStreak = (habits) => {
    if (!habits || habits.length === 0) return 0;

    let streak = 0;
    const d = new Date();
    let dStr = d.toISOString().split('T')[0];

    // Check if today has any logs — if not, start from yesterday
    const todayHasLog = habits.some(h => h.history && h.history[dStr]);
    if (!todayHasLog) {
        d.setDate(d.getDate() - 1);
        dStr = d.toISOString().split('T')[0];
    }

    while (true) {
        dStr = d.toISOString().split('T')[0];

        // For a day to count: at least one habit must have a log,
        // and none of the logged habits should be red
        const logs = habits
            .filter(h => h.history && h.history[dStr])
            .map(h => h.history[dStr]);

        if (logs.length === 0) break; // No logs for this day
        if (logs.includes('red')) break; // Red breaks the streak

        streak++;
        d.setDate(d.getDate() - 1);
    }

    return streak;
};

export const useHabitActions = () => {
    const { userData } = useAuth();
    const { showToast } = useUI();

    const handleLog = async (habit, selectedDate, newStatus) => {
        if (!userData || !habit) return;
        try {
            const current = habit.history?.[selectedDate] || null;
            if (current === newStatus) return;

            // Haptic feedback based on status
            if (newStatus === 'green') haptic('success');
            else if (newStatus === 'yellow') haptic('medium');
            else if (newStatus === 'red') haptic('error');

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

            // Calculate and update streak after logging
            // We need all habits to calculate streak, so fetch them
            try {
                const userDoc = await getDoc(doc(db, 'users', userData.uid));
                if (userDoc.exists()) {
                    // We can't easily get all habits here from a single call,
                    // so we update streak based on current habit's history
                    // The full streak calculation happens in the background
                    const today = new Date().toISOString().split('T')[0];
                    if (selectedDate === today && newStatus === 'green') {
                        // Check if this triggers a milestone streak
                        const currentStreak = (userData.streak || 0) + 1;
                        await updateDoc(doc(db, 'users', userData.uid), {
                            streak: increment(1)
                        });

                        // Celebrate milestones! 🎉
                        if ([3, 7, 14, 21, 30, 42].includes(currentStreak)) {
                            haptic('celebration');
                            launchConfetti();
                            const milestoneNames = {
                                3: '¡3 días seguidos!',
                                7: '¡Una semana completa!',
                                14: '¡2 semanas imparable!',
                                21: '🧬 ¡Hábito INSTALADO!',
                                30: '¡Un mes de constancia!',
                                42: '👑 ¡MAESTRÍA TOTAL!'
                            };
                            showToast('🎉 RACHA', milestoneNames[currentStreak], <Zap size={16} />);
                        }
                    }
                }
            } catch (streakErr) {
                console.error("Streak update error:", streakErr);
            }
        } catch (e) {
            console.error(e);
            showToast('Error', 'No se pudo actualizar el hábito.', <AlertTriangle size={16} />);
        }
    };

    const handleDeleteHabit = async (habitId) => {
        try {
            haptic('heavy');
            await deleteDoc(doc(db, 'users', userData.uid, 'habits', habitId));
            showToast('Hábito Eliminado', null, <Trash2 size={16} />);
        } catch (e) {
            console.error(e);
        }
    };

    return { handleLog, handleDeleteHabit };
};
