import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const ProfilePage = () => {
    const { userData, handleSignOut } = useAuth();
    const { permission, requestPermission, fcmToken } = useNotifications();

    if (!userData) return null;

    return (
        <div className="space-y-6 pt-10 text-center pb-24">
            {/* ... avatar and name ... */}
            <div
                className="w-32 h-32 mx-auto rounded-full text-5xl flex items-center justify-center text-white font-black shadow-2xl animate-in zoom-in duration-500"
                style={{ backgroundColor: userData.auraColor }}
            >
                {userData.name[0]}
            </div>
            <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter">{userData.name}</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">{userData.role || 'Agente'}</p>

            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 text-left border border-slate-50">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="block font-black text-slate-800 text-sm uppercase tracking-wide">Notificaciones</span>
                        <span className="text-xs text-slate-400 font-medium">
                            {permission === 'granted' ? 'Alertas activas' : 'Recibe alertas de tu squad'}
                        </span>
                    </div>
                    {permission === 'granted' ? (
                        <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
                            Activado
                        </span>
                    ) : (
                        <button
                            onClick={requestPermission}
                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                        >
                            Activar
                        </button>
                    )}
                </div>
                <div className="h-px bg-slate-100"></div>
                <button
                    onClick={handleSignOut}
                    className="w-full py-4 text-rose-500 font-black bg-rose-50 rounded-2xl uppercase tracking-widest text-xs hover:bg-rose-100 transition-all shadow-sm shadow-rose-100"
                >
                    Cerrar Sesión
                </button>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white text-left relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <h3 className="font-black italic text-xl mb-4">ESTADÍSTICAS VITALES</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <span className="block text-[10px] font-black uppercase text-white/40 mb-1">Puntos</span>
                            <span className="text-2xl font-black">{userData.points}</span>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <span className="block text-[10px] font-black uppercase text-white/40 mb-1">Racha</span>
                            <span className="text-2xl font-black">{userData.streak}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Debug Zone */}
            <div className="bg-slate-900/5 p-4 rounded-3xl space-y-3 mt-8">
                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Debug Zone (v2.1)</h3>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            import('../utils/soundEffects').then(({ playSound }) => playSound('kudos'));
                        }}
                        className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm active:scale-95 transition-transform"
                    >
                        🔊 Test Sound
                    </button>
                    <button
                        onClick={() => {
                            if (Notification.permission === 'granted') {
                                new Notification('Test Notification', { body: 'This is a local test.', icon: '/pwa-192x192.png' });
                            } else {
                                alert('Permission not granted: ' + Notification.permission);
                            }
                        }}
                        className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm active:scale-95 transition-transform"
                    >
                        🔔 Test Notify
                    </button>
                </div>

                <div className="text-[10px] font-mono text-slate-400 break-all bg-white p-2 rounded-lg">
                    Token: {fcmToken ? 'Active ✅' : 'Missing ❌'} <br />
                    ID: {userData?.uid || 'Loading...'}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
