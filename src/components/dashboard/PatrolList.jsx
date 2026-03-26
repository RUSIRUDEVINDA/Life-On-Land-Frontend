import React from 'react';

const PatrolList = ({ patrols }) => {
    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[13px] font-semibold text-primary-dark mb-0">Active Patrols</h3>
            </div>
            <div className="flex flex-col gap-3">
                {patrols.map((patrol, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 ${patrol.color} text-primary-dark rounded-full flex justify-center items-center text-[10px] border-none shrink-0 font-bold`}>
                            {patrol.initials}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="text-[12px] font-medium text-primary-dark overflow-hidden text-ellipsis">{patrol.name}</span>
                            <span className="text-[10px] text-[#adb5bd] overflow-hidden text-ellipsis">{patrol.unit} • {patrol.zone}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${patrol.status === 'Patrolling' ? 'bg-primary/10 text-primary' : 'bg-bg-soft text-[#868e96]'}`}>
                            {patrol.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatrolList;
