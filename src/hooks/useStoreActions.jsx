import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Store, Trash2, Edit } from 'lucide-react';
import React from 'react';
import { haptic } from '../utils/haptics';

export const useStoreActions = () => {
    const { userData } = useAuth();
    const { showToast } = useUI();

    const handleBuy = async (item) => {
        if (!userData || userData.points < item.cost) return;
        try {
            await updateDoc(doc(db, 'users', userData.uid), { points: increment(-item.cost) });
            haptic('success');
            showToast(`Canjeado: ${item.name}`, '¡Disfrútalo!', <Store size={16} />);
            await addDoc(collection(db, 'feed'), {
                userId: userData.uid,
                user: userData.name,
                aura: userData.auraColor,
                action: `canjeó su racha por: "${item.name}"`,
                type: 'store_buy',
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateItem = async (name, cost, icon) => {
        if (!userData) return;
        try {
            const newItem = {
                name,
                cost: Number(cost),
                icon,
                desc: 'Recompensa del Squad',
                category: 'Comunidad',
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'store'), newItem);
            haptic('medium');
            showToast("Recompensa Creada", "Disponible en la tienda.", <Store size={16} />);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const handleDeleteItem = async (id, name) => {
        await deleteDoc(doc(db, 'store', id));
        showToast('Premio Eliminado', null, <Trash2 size={16} />);
    };

    return { handleBuy, handleCreateItem, handleDeleteItem };
};
