import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useHabitActions } from '../hooks/useHabitActions';
import HabitCard from '../components/features/habits/HabitCard';
import CalendarWidget from '../components/habits/CalendarWidget';
import HabitLibrary from '../components/features/habits/HabitLibrary';
import { Info, X } from 'lucide-react';

const Dashboard = () => {
    const { userData } = useAuth();
    const { habits, loading } = useHabits();
    const { handleLog, handleDeleteHabit } = useHabitActions();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('my_protocol');
    const [showInfoModal, setShowInfoModal] = useState(false);

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Cargando protocolo...</div>;

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
            {/* View Toggle */}
            <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-2">
                <button
                    onClick={() => setViewMode('my_protocol')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'my_protocol' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Mi Protocolo
                </button>
                <button
                    onClick={() => setViewMode('reports')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'reports' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Reporte
                </button>
                <button
                    onClick={() => setViewMode('library')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'library' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Biblioteca
                </button>
            </div>

            {viewMode === 'my_protocol' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocolo Del</h3>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none font-black text-indigo-600 text-xs p-0 focus:ring-0 cursor-pointer"
                            />
                        </div>
                        <button onClick={() => setShowInfoModal(true)} className="text-slate-300 hover:text-indigo-400 transition-colors">
                            <Info size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {habits.map(h => (
                            <HabitCard
                                key={h.id}
                                habit={h}
                                selectedDate={selectedDate}
                                onLog={(habitId, status) => handleLog(h, selectedDate, status)}
                                onDelete={handleDeleteHabit}
                            />
                        ))}

                        {habits.length === 0 && (
                            <div className="text-center py-16 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <Info className="mx-auto text-slate-300 mb-3" size={40} />
                                <p className="text-slate-400 font-bold text-sm">No tienes hábitos activos.</p>
                                <button onClick={() => setViewMode('library')} className="text-indigo-500 font-black text-[10px] uppercase mt-3 tracking-widest bg-indigo-50 px-4 py-2 rounded-xl">Explorar Biblioteca</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'reports' && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <CalendarWidget habits={habits} />
                </div>
            )}

            {viewMode === 'library' && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <HabitLibrary />
                </div>
            )}

            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowInfoModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">Sistema LAB</h3>
                            <button onClick={() => setShowInfoModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <div className="bg-slate-50 p-5 rounded-3xl">
                                <h4 className="font-black text-slate-800 mb-3 uppercase text-[10px] tracking-widest text-indigo-500">🧬 Puntos y Dificultad</h4>
                                <p className="text-xs leading-relaxed">Ganarás puntos según el color (🟢, 🟡, 🔴) y la dificultad del hábito. Tu multiplicador personal afectará el resultado final.</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-3xl">
                                <h4 className="font-black text-slate-800 mb-3 uppercase text-[10px] tracking-widest text-emerald-500">🎓 Graduación</h4>
                                <p className="text-xs leading-relaxed">Llega a 21 días para instalar el hábito. A los 42 días obtendrás la Maestría y el hábito se archivará como un éxito total.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
