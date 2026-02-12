import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
    const { userData } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header (Inspired by App.jsx) */}
            <header className="px-6 pt-12 pb-6 flex justify-between items-center max-w-lg mx-auto">
                <div className="animate-in slide-in-from-left-4 duration-500">
                    <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">
                        Hola, {userData?.name?.split(' ')[0] || 'Agente'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-md">Racha {userData?.streak || 0}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-md">{userData?.points || 0} pts</span>
                    </div>
                </div>
                <div className="relative animate-in slide-in-from-right-4 duration-500">
                    <div
                        className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{ backgroundColor: userData?.auraColor || '#ccc' }}
                    >
                        {userData?.name?.[0] || '?'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full border-2 border-white">NV.1</div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-6">
                <Outlet />
            </main>

            <Navbar />
        </div>
    );
};

export default MainLayout;
