import React from 'react';
import { useUI } from '../../context/UIContext';
import { Zap } from 'lucide-react';

const Toast = () => {
    const { notification } = useUI();

    if (!notification) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-200 w-[90%] max-w-sm">
            <div className="text-amber-400 mt-1">{notification.icon || <Zap size={16} />}</div>
            <div>
                <div className="text-xs font-black uppercase tracking-widest">{notification.msg}</div>
                {notification.subMsg && <div className="text-[10px] text-slate-300 font-medium mt-1">{notification.subMsg}</div>}
            </div>
        </div>
    );
};

export default Toast;
