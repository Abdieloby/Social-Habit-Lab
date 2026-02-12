import React, { useState } from 'react';

const CalendarWidget = ({ habits }) => {
    const [view, setView] = useState('all');

    // Helper: Calculate advanced streaks from a history mapping { 'YYYY-MM-DD': 'status' }
    const calculateStreaks = (historyMap) => {
        const dates = Object.keys(historyMap).sort();
        if (dates.length === 0) return { currentReg: 0, bestReg: 0, currentPerf: 0, bestPerf: 0 };

        let maxReg = 0;
        let maxPerf = 0;

        let tempReg = 0, tempPerf = 0;

        // Calculate start date (earliest log) to Today
        const start = new Date(dates[0]);
        const end = new Date();

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dStr = d.toISOString().split('T')[0];
            const status = historyMap[dStr];

            if (status === 'green' || status === 'yellow') {
                tempReg++;
            } else {
                if (tempReg > maxReg) maxReg = tempReg;
                tempReg = 0;
            }

            if (status === 'green') {
                tempPerf++;
            } else {
                if (tempPerf > maxPerf) maxPerf = tempPerf;
                tempPerf = 0;
            }
        }

        if (tempReg > maxReg) maxReg = tempReg;
        if (tempPerf > maxPerf) maxPerf = tempPerf;

        // Current Streak Calculation (Backwards from Today)
        const checkBackwards = (requiredStatusFn) => {
            let streak = 0;
            let d = new Date();
            let dStr = d.toISOString().split('T')[0];

            // Should we start from Today or Yesterday?
            // If today is not logged, check yesterday. If today is logged but fails condition, streak breaks.
            if (!historyMap[dStr]) {
                // Today not logged yet, check yesterday
                d.setDate(d.getDate() - 1);
                dStr = d.toISOString().split('T')[0];
            }

            while (true) {
                dStr = d.toISOString().split('T')[0];
                if (historyMap[dStr] && requiredStatusFn(historyMap[dStr])) {
                    streak++;
                    d.setDate(d.getDate() - 1);
                } else {
                    break;
                }
            }
            return streak;
        }

        const currentRegCalc = checkBackwards(s => s === 'green' || s === 'yellow');
        const currentPerfCalc = checkBackwards(s => s === 'green');

        return {
            currentReg: currentRegCalc,
            bestReg: maxReg,
            currentPerf: currentPerfCalc,
            bestPerf: maxPerf
        };
    };

    const getGeneralHistory = () => {
        const agg = {};
        if (!habits) return {};

        habits.forEach(h => {
            if (!h.history) return;
            Object.keys(h.history).forEach(date => {
                if (!agg[date]) agg[date] = [];
                agg[date].push(h.history[date]);
            });
        });

        const finalMap = {};
        Object.keys(agg).forEach(date => {
            const statuses = agg[date];
            if (statuses.includes('red')) finalMap[date] = 'red';
            else if (statuses.every(s => s === 'green') && statuses.length >= habits.length) finalMap[date] = 'green';
            else finalMap[date] = 'yellow';
        });
        return finalMap;
    };

    const targetHistory = view === 'all' ? getGeneralHistory() : habits.find(h => h.id === view)?.history || {};
    const stats = calculateStreaks(targetHistory);
    const daysIdx = [...Array(35).keys()].reverse();
    const today = new Date();

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h4 className="font-black text-slate-800 italic text-xl uppercase tracking-tighter">Mis Rachas</h4>
                <div className="bg-slate-100 rounded-xl px-3 py-1">
                    <select value={view} onChange={(e) => setView(e.target.value)} className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer">
                        <option value="all">General</option>
                        {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-evenly mb-8 relative z-10">
                <div className="text-center group hover:scale-105 transition-transform">
                    <div className="text-4xl mb-1 group-hover:scale-110 transition-transform">🔥</div>
                    <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Días Seguidos</div>
                    <div className="text-4xl font-black text-slate-800">{stats.currentReg}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Racha Actual</div>
                    <div className="mt-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg inline-block shadow-sm">🏆 Récord: {stats.bestReg}</div>
                </div>
                <div className="w-px bg-slate-100 h-24"></div>
                <div className="text-center group hover:scale-105 transition-transform">
                    <div className="text-4xl mb-1 group-hover:scale-110 transition-transform">🌿</div>
                    <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Días Perfectos</div>
                    <div className="text-4xl font-black text-slate-800">{stats.currentPerf}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Racha Actual</div>
                    <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block shadow-sm">🏆 Récord: {stats.bestPerf}</div>
                </div>
            </div>

            {/* Heatmap */}
            <div>
                <div className="flex justify-between mb-2 px-1">
                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Actividad 35 días</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-center text-[9px] font-black text-slate-300 mb-1">{d}</div>)}
                    {daysIdx.map(i => {
                        const d = new Date();
                        d.setDate(today.getDate() - i);
                        const dStr = d.toISOString().split('T')[0];
                        const st = targetHistory[dStr];
                        const isToday = i === 0;

                        let bg = 'bg-slate-50';
                        let text = 'text-slate-300';

                        if (st === 'green') { bg = 'bg-emerald-400 shadow-md shadow-emerald-200'; text = 'text-white/90'; }
                        else if (st === 'yellow') { bg = 'bg-amber-400 shadow-md shadow-amber-200'; text = 'text-white/90'; }
                        else if (st === 'red') { bg = 'bg-rose-400'; text = 'text-white/90'; }

                        return (
                            <div key={i} className="flex flex-col items-center gap-1 group relative">
                                <div className={`w-8 h-8 rounded-full ${bg} transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${text} ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'group-hover:scale-110'}`}>
                                    {d.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarWidget;
