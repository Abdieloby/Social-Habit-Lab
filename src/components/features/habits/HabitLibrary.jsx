import React, { useState } from 'react';
import { useGlobalHabits } from '../../../hooks/useGlobalHabits';
import { Plus, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import { cn } from '../../../utils/cn';

const HabitLibrary = () => {
    const { globalHabits, loading, handleCreateHabit, adoptHabit } = useGlobalHabits();
    const { userData } = useAuth();
    const [showCreator, setShowCreator] = useState(false);

    if (loading) return <div className="p-4 text-center text-slate-400">Cargando biblioteca...</div>;

    const inputClasses = "w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 mt-1 transition-all";

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Biblioteca Global</h3>
            </div>

            <Button
                variant="outline"
                className="w-full py-8 border-dashed text-slate-400 hover:text-slate-600 hover:border-slate-300"
                onClick={() => setShowCreator(true)}
            >
                <Plus size={20} className="mr-2" />
                Crear Nuevo Hábito Global
            </Button>

            <div className="space-y-3">
                {globalHabits.map(gh => (
                    <div key={gh.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
                        <div>
                            <h4 className="font-bold text-slate-800">{gh.name}</h4>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-tighter">
                                    Dif: {gh.baseWeight === 1 ? 'Fácil' : gh.baseWeight === 2 ? 'Medio' : 'Difícil'}
                                </span>
                                {gh.description && <span className="text-[8px] text-slate-300 font-bold uppercase truncate max-w-[100px]">{gh.description}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => adoptHabit(gh)}
                                className="shadow-indigo-100"
                            >
                                Adoptar
                            </Button>
                        </div>
                    </div>
                ))}
                {globalHabits.length === 0 && <div className="text-center text-slate-300 italic py-8">Biblioteca vacía.</div>}
            </div>

            <Modal
                isOpen={showCreator}
                onClose={() => setShowCreator(false)}
                title="Nuevo Hábito"
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const success = await handleCreateHabit(e.target.hname.value, Number(e.target.hweight.value), e.target.hnote.value);
                        if (success) setShowCreator(false);
                    }}
                    className="space-y-4"
                >
                    <Input
                        name="hname"
                        label="Nombre"
                        required
                        placeholder="Ej. Leer 5 páginas"
                    />

                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 ml-2 mb-1 tracking-widest">Dificultad Base</label>
                        <select name="hweight" className={cn(inputClasses)}>
                            <option value="1">Fácil (1x Base)</option>
                            <option value="2">Medio (2x Base)</option>
                            <option value="3">Difícil (3x Base)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 ml-2 mb-1 tracking-widest">Nota (Opcional)</label>
                        <textarea
                            name="hnote"
                            placeholder="Descripción breve..."
                            className={cn(inputClasses, "text-xs")}
                            rows="2"
                        ></textarea>
                    </div>

                    <Button type="submit" className="w-full py-6 text-base">
                        <Zap size={18} className="mr-2" />
                        Crear Global
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default HabitLibrary;
