import React from 'react';
import { Zap, Activity, Clock } from 'lucide-react';

const MovementStats = () => {
    const stats = [
        { label: 'Active Trackers', val: '28', change: '+4 Today', icon: <Zap size={16} />, color: 'primary' },
        { label: 'Total Logs', val: '12,450', change: 'Last 24h', icon: <Activity size={16} />, color: 'primary' },
        { label: 'High Risk Alert', val: '3', change: 'Action Required', icon: <Zap size={16} />, color: 'rose' },
        { label: 'System Health', val: 'Optimal', change: 'Stable Latency', icon: <Clock size={16} />, color: 'emerald' }
    ];

    return (
        <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-[24px] border border-border-light shadow-premium flex flex-col gap-2 group hover:border-primary/20 transition-all duration-300">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold text-[#adb5bd] uppercase tracking-[0.05em]">{stat.label}</span>
                        <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${stat.color === 'rose' ? 'bg-rose-50 text-rose-500' :
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' :
                                    'bg-primary-light text-primary'
                            }`}>
                            {stat.icon}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[18px] font-black text-primary-dark leading-tight">{stat.val}</span>
                        <span className={`text-[10px] font-bold ${stat.color === 'rose' ? 'text-rose-500' :
                                stat.color === 'emerald' ? 'text-emerald-500' :
                                    'text-primary-medium'
                            }`}>{stat.change}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MovementStats;
