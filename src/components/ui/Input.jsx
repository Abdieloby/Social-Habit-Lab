import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-black uppercase text-slate-400 ml-2 mb-1 tracking-widest">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    "w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed",
                    error && "ring-2 ring-rose-500 bg-rose-50",
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="mt-1 ml-2 text-[10px] font-bold text-rose-500">{error}</p>
            )}
        </div>
    );
});
Input.displayName = "Input";

export default Input;
