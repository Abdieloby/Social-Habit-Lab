import React, { useState } from 'react';
import { db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useUI } from '../../../context/UIContext';
import { Globe, Trash2, Bell, Zap, AlertCircle } from 'lucide-react';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import { Button } from '../../ui/Button';

const HabitCard = ({ habit, selectedDate, onLog, onDelete }) => {
    const { userData } = useAuth();
    const { showToast } = useUI();

    const [modModalOpen, setModModalOpen] = useState(false);
    const [notifModalOpen, setNotifModalOpen] = useState(false);
    const [tempMod, setTempMod] = useState(habit.personalMod || 1);
    const [tempTime, setTempTime] = useState(habit.notificationTime || '');

    const currentStatus = habit.history?.[selectedDate] || null;

    const pointsMap = {
        1: { green: 10, yellow: 5, red: -4 },
        2: { green: 20, yellow: 8, red: -4 },
        3: { green: 30, yellow: 12, red: -5 }
    };

    const calculatePoints = (status, weight, mod) => {
        if (!status) return 0;
        const base = pointsMap[weight]?.[status] || 0;
        return Math.ceil(base * mod);
    };

    const pGreen = calculatePoints('green', habit.baseWeight, habit.personalMod);
    const pYellow = calculatePoints('yellow', habit.baseWeight, habit.personalMod);
    const pRed = calculatePoints('red', habit.baseWeight, habit.personalMod);

    const handleSaveMod = async (e) => {
        e.preventDefault();
        if (!userData) return;

        const val = parseFloat(tempMod);
        if (!isNaN(val) && val > 0) {
            await updateDoc(doc(db, 'users', userData.uid, 'habits', habit.id), {
                personalMod: val
            });
            showToast('Dificultad Ajustada', `Tu multiplicador ahora es ${val}x`, <Zap size={16} />);
            setModModalOpen(false);
        } else {
            showToast('Valor inválido', 'Usa números como 0.5, 1, 1.2', <AlertCircle size={16} />);
        }
    };

    const handleSaveNotification = async (e) => {
        e.preventDefault();
        if (!userData) return;

        await updateDoc(doc(db, 'users', userData.uid, 'habits', habit.id), {
            notificationTime: tempTime === '' ? null : tempTime
        });
        showToast('Recordatorio Actualizado', tempTime ? `Alarma a las ${tempTime}` : 'Alarma desactivada', <Bell size={16} />);
        setNotifModalOpen(false);
    };

    return (
        <>
            <div className={`bg-white rounded-3xl p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border transition-all hover:-translate-y-1 relative group ${habit.isFlagged ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-bold text-lg text-slate-800">{habit.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="flex flex-col bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Base</span>
                                <span className="text-xs font-bold text-slate-700">{habit.baseWeight === 1 ? 'Fácil' : habit.baseWeight === 2 ? 'Medio' : 'Difícil'}</span>
                            </div>
                            <span className="text-slate-300">×</span>
                            <button
                                onClick={() => {
                                    setTempMod(habit.personalMod || 1);
                                    setModModalOpen(true);
                                }}
                                className="flex flex-col px-3 py-1 rounded-lg border bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-indigo-200 transition-colors text-left group/mod"
                                title="Clic para editar tu ajuste"
                            >
                                <span className="text-[9px] font-black uppercase text-slate-400 group-hover/mod:text-indigo-400">Ajuste ✎</span>
                                <span className="text-xs font-bold text-slate-700">{habit.personalMod}x</span>
                            </button>

                            {habit.notificationTime && (
                                <div className="flex flex-col px-3 py-1 rounded-lg border bg-indigo-50 border-indigo-100">
                                    <span className="text-[9px] font-black uppercase text-indigo-400">Alarma</span>
                                    <span className="text-xs font-bold text-indigo-700">{habit.notificationTime}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => {
                                setTempTime(habit.notificationTime || '');
                                setNotifModalOpen(true);
                            }}
                            title="Configurar Recordatorio"
                            className={`transition-all p-2 rounded-xl ${habit.notificationTime ? 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-300 hover:text-indigo-400 hover:bg-slate-50'}`}
                        >
                            <Bell size={18} className={habit.notificationTime ? "fill-current" : ""} />
                        </button>
                        {habit.globalId && <button title="Hábito Global" className="text-slate-300 p-2"><Globe size={18} /></button>}
                        <button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[{ s: 'green', v: pGreen, bg: 'bg-emerald-500', i: '🟢' }, { s: 'yellow', v: pYellow, bg: 'bg-amber-400', i: '🟡' }, { s: 'red', v: pRed, bg: 'bg-rose-500', i: '🔴' }].map((opt) => (
                        <button
                            key={opt.s}
                            onClick={() => onLog(habit.id, opt.s)}
                            className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${currentStatus === opt.s
                                ? `${opt.bg} text-white shadow-lg scale-[1.02] ring-2 ring-white ring-offset-2`
                                : 'bg-slate-50 text-slate-300 hover:bg-white hover:shadow-md hover:text-slate-400'
                                }`}
                        >
                            <span className={`text-xl ${currentStatus !== opt.s && 'grayscale opacity-60'}`}>{opt.i}</span>
                            {currentStatus !== opt.s && <span className="text-[9px] font-bold mt-1 opacity-70">{opt.v > 0 ? '+' : ''}{opt.v}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <Modal
                isOpen={modModalOpen}
                onClose={() => setModModalOpen(false)}
                title="Ajuste Personal"
            >
                <form onSubmit={handleSaveMod} className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Multiplica los puntos de este hábito según tu esfuerzo personal.
                        <br />1.0 = Normal, 0.5 = Fácil, 1.5 = Difícil.
                    </p>
                    <Input
                        label="Multiplicador"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={tempMod}
                        onChange={(e) => setTempMod(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full">Guardar Ajuste</Button>
                </form>
            </Modal>

            <Modal
                isOpen={notifModalOpen}
                onClose={() => setNotifModalOpen(false)}
                title="Recordatorio"
            >
                <form onSubmit={handleSaveNotification} className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Configura una hora para recibir alertas (Formato 24h).
                        Deja vacío para desactivar.
                    </p>
                    <Input
                        label="Hora (HH:MM)"
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                    />
                    <Button type="submit" className="w-full">Guardar Alarma</Button>
                </form>
            </Modal>
        </>
    );
};

export default HabitCard;
