import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const Modal = ({ isOpen, onClose, title, children, className }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isMounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Content */}
            <div
                className={cn(
                    "bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
                    className
                )}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    {title && (
                        <h3 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">
                            {title}
                        </h3>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
