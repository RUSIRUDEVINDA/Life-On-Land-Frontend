import React from 'react';

const formatValue = (value) => {
    if (!Number.isFinite(value)) return '0';
    return Math.round(value).toLocaleString('en-US');
};

const BarChartCard = ({ title, subtitle, items = [], loading = false, emptyLabel = 'No data yet.' }) => {
    const maxValue = items.reduce((max, item) => Math.max(max, Number(item.value) || 0), 0);

    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col gap-3">
            <div className="flex flex-col">
                <h3 className="text-[13px] font-semibold text-primary-dark">{title}</h3>
                {subtitle && <p className="text-[10px] text-text-gray">{subtitle}</p>}
            </div>

            {loading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="h-2 w-12 rounded bg-border-light" />
                            <div className="h-2 flex-1 rounded bg-bg-soft" />
                            <div className="h-2 w-8 rounded bg-border-light" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <p className="text-[11px] text-[#adb5bd]">{emptyLabel}</p>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {items.map((item) => {
                        const width = maxValue > 0 ? Math.round((Number(item.value) / maxValue) * 100) : 0;
                        return (
                            <div key={item.label} className="flex items-center gap-2">
                                <span className="w-16 text-[10px] font-semibold text-text-gray truncate">{item.label}</span>
                                <div className="flex-1 h-2 rounded-full bg-bg-soft overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${width}%`, backgroundColor: item.color || '#2a5a45' }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-primary-dark w-8 text-right">
                                    {formatValue(Number(item.value) || 0)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BarChartCard;
