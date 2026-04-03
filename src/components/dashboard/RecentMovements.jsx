import React from 'react';

const RecentMovements = ({ movements = [], loading = false }) => {
    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col flex-1">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[13px] font-semibold text-primary-dark mb-0">Recent Movements</h3>
            </div>
            {loading ? (
                <div className="flex flex-col gap-3 py-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-2.5 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-[3px] mt-1 shrink-0 bg-border-light" />
                            <div className="flex flex-col flex-1 gap-1.5">
                                <span className="h-3 w-3/4 max-w-[180px] rounded bg-border-light" />
                                <span className="h-2.5 w-full max-w-[220px] rounded bg-bg-soft" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : movements.length === 0 ? (
                <p className="text-[11px] text-[#adb5bd] py-2">No movement logs yet. Telemetry will appear here.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {movements.map((item) => (
                        <div key={item.id} className="flex items-start gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-[3px] mt-1 shrink-0 ${item.statusColor}`} />
                            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                                <span className="text-[12px] font-medium text-primary-dark whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.name}
                                </span>
                                <span className="text-[10px] text-[#adb5bd] whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.description} • {item.time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentMovements;
