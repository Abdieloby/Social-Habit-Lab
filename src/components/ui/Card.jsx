import React from 'react';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
Card.displayName = "Card";

export default Card;
