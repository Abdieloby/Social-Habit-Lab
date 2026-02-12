import React from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUp, MessageCircle, Users, Store, Settings } from 'lucide-react';

const Navbar = () => {
    const navItems = [
        { id: 'dashboard', label: 'Protocolo', path: '/', icon: <TrendingUp size={24} /> },
        { id: 'feed', label: 'Feed', path: '/feed', icon: <MessageCircle size={24} /> },
        { id: 'squad', label: 'Squad', path: '/squad', icon: <Users size={24} /> },
        { id: 'store', label: 'Tienda', path: '/store', icon: <Store size={24} /> },
        { id: 'profile', label: 'Perfil', path: '/profile', icon: <Settings size={24} /> }
    ];

    return (
        <nav className="fixed bottom-8 left-6 right-6 max-w-lg mx-auto h-20 bg-white/90 backdrop-blur-lg rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-white/50 flex items-center justify-evenly z-50 px-2 ring-1 ring-slate-100">
            {navItems.map(tab => (
                <NavLink
                    key={tab.id}
                    to={tab.path}
                    className={({ isActive }) => `
                        p-4 rounded-full transition-all duration-300 relative group
                        ${isActive
                            ? 'bg-slate-900 text-white -translate-y-6 shadow-xl shadow-slate-900/30 scale-110'
                            : 'text-slate-300 hover:text-indigo-400 hover:bg-slate-50'
                        }
                    `}
                >
                    {tab.icon}
                    <span className="sr-only">{tab.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default Navbar;
