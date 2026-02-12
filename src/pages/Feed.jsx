import React from 'react';
import { useFeed } from '../hooks/useFeed';

const FeedPage = () => {
    const { feed, loading } = useFeed();
    if (loading) return <div className="p-8 text-center text-slate-400">Cargando feed...</div>;

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Actividad Reciente</h3>
            </div>
            {feed.map(item => (
                <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md" style={{ backgroundColor: item.aura || '#ccc' }}>
                        {item.user?.[0]}
                    </div>
                    <div>
                        <p className="text-sm text-slate-800 leading-tight"><span className="font-bold">{item.user}</span> {item.action}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                            {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'Reciente'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeedPage;
