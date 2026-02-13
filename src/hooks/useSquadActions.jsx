import { playSound } from '../utils/soundEffects';

export const useSquadActions = () => {
    const { userData } = useAuth();
    const { showToast } = useUI();

    const handleKudos = async (target) => {
        if (!userData || userData.points < 5) return;
        try {
            playSound('kudos');
            // ... (rest of logic)
            await updateDoc(doc(db, 'users', userData.uid), { points: increment(-5) });
            await updateDoc(doc(db, 'users', target.id), { points: increment(5) });
            await addDoc(collection(db, 'feed'), {
                userId: userData.uid, user: userData.name, aura: userData.auraColor,
                action: `envió Kudos a ${target.name}`, type: 'kudos', timestamp: serverTimestamp(),
                targetId: target.id // Critical: Target ID for notifications
            });
            showToast('Kudos Enviados', '5 puntos transferidos.', <Heart size={16} />);
        } catch (e) { console.error(e); }
    };

    const handleNudge = async (target) => {
        playSound('nudge');
        // trigger backend notification via feed item
        await addDoc(collection(db, 'feed'), {
            userId: userData.uid, user: userData.name, aura: userData.colors?.aura || '#6366f1',
            action: `dio un toque a ${target.name}`, type: 'nudge', timestamp: serverTimestamp(),
            targetId: target.id
        });
        showToast('Nudge Enviado', `Has animado a ${target.name}`, <Bell size={16} />);
    };

    return { handleKudos, handleNudge };
};
