import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSquad } from '../hooks/useSquad';
import { useSquadActions } from '../hooks/useSquadActions';
import { Heart, Bell } from 'lucide-react';

const SquadPage = () => {
    const { userData } = useAuth();
    const { squad, loading } = useSquad();
    const { handleKudos, handleNudge } = useSquadActions();

    if (loading) return <div className="p-8 text-center text-slate-400">Cargando squad...</div>;

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-24">
            <div className="bg-indigo-600 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
                <h2 className="text-2xl font-black italic tracking-tighter relative z-10">CLASIFICACIÓN</h2>
                <p className="text-indigo-200 text-xs relative z-10">Comunidad</p>
            </div>
            {squad.map((member, idx) => (
                <div key={member.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="font-black text-slate-200 text-xl w-6">{idx + 1}</div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: member.auraColor || '#ccc' }}>
                            {member.name?.[0]}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{member.name} {member.id === userData?.uid && '(Tú)'}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-bold text-indigo-500">{member.points} pts</span>
                            </div>
                        </div>
                    </div>
                    {member.id !== userData?.uid && (
                        <div className="flex gap-2">
                            <button onClick={() => handleNudge(member)} className="bg-slate-50 p-3 rounded-2xl text-slate-400 active:scale-95 hover:bg-white"><Bell size={18} /></button>
                            <button onClick={() => handleKudos(member)} className="bg-pink-50 text-pink-500 p-3 rounded-2xl active:scale-95 hover:bg-pink-100"><Heart size={18} /></button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
export default SquadPage;
