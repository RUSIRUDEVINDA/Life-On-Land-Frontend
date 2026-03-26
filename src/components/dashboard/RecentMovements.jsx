import React from 'react';

const RecentMovements = ({ movements }) => {
    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col flex-1">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[13px] font-semibold text-primary-dark mb-0">Recent Movements</h3>
            </div>
            <div className="flex flex-col gap-3">
                {movements.map((item, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-[3px] mt-1 shrink-0 ${item.statusColor}`}></span>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="text-[12px] font-medium text-primary-dark whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                            <span className="text-[10px] text-[#adb5bd] whitespace-nowrap overflow-hidden text-ellipsis">{item.description} • {item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentMovements;
