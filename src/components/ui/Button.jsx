import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {

    const variants = {
        default: "bg-slate-900 text-white shadow-xl hover:bg-slate-800",
        primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700",
        secondary: "bg-white text-slate-900 border border-slate-100 shadow-sm hover:bg-slate-50",
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-500",
        danger: "bg-rose-50 text-rose-500 hover:bg-rose-100",
        outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600"
    };

    const sizes = {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-14 rounded-[1.25rem] px-8 text-base",
        icon: "h-10 w-10 flex items-center justify-center p-0",
    };

    const baseStyles = "inline-flex items-center justify-center rounded-2xl text-sm font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = "Button";

export { Button };
