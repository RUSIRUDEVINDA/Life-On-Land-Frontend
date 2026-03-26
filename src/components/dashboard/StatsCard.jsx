import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const StatsCard = ({ title, value, unit, icon: Icon, trend, trendColor, isDark = false }) => {
    return (
        <div className={`rounded-2xl p-4 flex flex-col shadow-premium ${isDark ? 'bg-primary-dark text-white' : 'bg-white text-primary-dark border border-border-light'}`}>
            <div className="flex justify-between items-center mb-3">
                <h3 className={`text-[12px] font-medium m-0 ${isDark ? 'text-white' : ''}`}>{title}</h3>
                <div className={`w-7 h-7 rounded-full flex justify-center items-center ${isDark ? 'bg-white text-primary-dark' : 'bg-transparent border border-border-light text-primary-dark'}`}>
                    <Icon size={14} />
                </div>
            </div>
            <div className="text-2xl font-bold mb-1.5 leading-none">
                {value}
                {unit && <span className="text-sm pl-1">{unit}</span>}
            </div>
            <div className="text-[10px]">
                <span className={`inline-flex items-center gap-1 ${trendColor || (isDark ? 'text-primary-medium' : 'text-[#868e96]')}`}>
                    {trend.includes('+') || trend.includes('Active') ? <ArrowUpRight size={10} /> : null}
                    {trend}
                </span>
            </div>
        </div>
    );
};

export default StatsCard;
