import React from 'react';

const IncidentMetricCard = ({ label, value, helper, tone = 'default' }) => {
    const toneClasses = {
        default: 'bg-white text-primary-dark border-border-light',
        accent: 'bg-primary-dark text-white border-primary-dark',
        subtle: 'bg-primary-light/15 text-primary-dark border-primary-light/30',
    };

    return (
        <div className={`rounded-3xl border p-5 shadow-premium ${toneClasses[tone]}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === 'accent' ? 'text-white/70' : 'text-text-gray'}`}>
                {label}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
                <h3 className="text-[30px] font-bold tracking-tight">{value}</h3>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone === 'accent' ? 'bg-white/10 text-white' : 'bg-primary-light/20 text-primary-dark'}`}>
                    {helper}
                </span>
            </div>
        </div>
    );
};

export default IncidentMetricCard;
