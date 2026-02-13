import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Zap, AlertTriangle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const LoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const { authUser, handleAuth } = useAuth();
    const { showToast } = useUI();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (authUser) {
            navigate('/');
        }
    }, [authUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const name = isSignUp ? e.target.username.value : null;
        const aura = isSignUp ? e.target.color.value : null;

        try {
            await handleAuth(isSignUp, email, password, name, aura);
            showToast(isSignUp ? 'Bienvenido Agente' : 'Sesión Iniciada', 'Protocolo activado.', <Zap size={16} />);
            navigate('/'); // Force navigate on success
        } catch (err) {
            console.error(err);
            showToast('Error de Autenticación', err.message, <AlertTriangle size={16} />);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-900">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic text-slate-900">SOCIAL LAB</h1>
                    <p className="text-slate-400 font-medium">Fase de Reconstrucción</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-2">Nombre de Agente</label>
                            <input name="username" required placeholder="Tu Nombre" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-2">Email</label>
                        <input name="email" type="email" required placeholder="correo@ejemplo.com" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-2">Contraseña</label>
                        <input name="password" type="password" required placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    {isSignUp && (
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-2">Aura</label>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                                {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                                    <label key={color} className="cursor-pointer">
                                        <input type="radio" name="color" value={color} className="peer sr-only" defaultChecked={color === '#6366f1'} />
                                        <div className="w-full aspect-square rounded-full bg-slate-100 peer-checked:ring-4 ring-offset-2 ring-indigo-500 transition-all" style={{ backgroundColor: color }}></div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                        {isSignUp ? 'Registrar Agente' : 'Iniciar Sesión'}
                    </button>
                    <div className="text-center space-y-2">
                        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-indigo-500 hover:underline block mx-auto">
                            {isSignUp ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo recluta? Regístrate'}
                        </button>
                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={async () => {
                                    const email = document.querySelector('input[name="email"]')?.value;
                                    if (!email) {
                                        showToast('Ingresa tu email', 'Escribe tu correo arriba primero.', <Mail size={16} />);
                                        return;
                                    }
                                    try {
                                        await sendPasswordResetEmail(auth, email);
                                        showToast('Correo enviado', `Revisa ${email} para restablecer tu contraseña.`, <Mail size={16} />);
                                    } catch (err) {
                                        showToast('Error', err.message, <AlertTriangle size={16} />);
                                    }
                                }}
                                className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
