import React from 'react';

const RiskOverview = ({ percentage, label }) => {
    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col items-center pb-4">
            <h3 className="text-[13px] font-semibold text-primary-dark mb-3 self-start">Protected Zone Risk</h3>
            <div className="w-[140px] h-[70px] relative overflow-hidden mt-1">
                <div className="w-[140px] h-[140px] rounded-full absolute bottom-0 flex justify-center items-center bg-[conic-gradient(var(--color-primary)_0deg_244deg,var(--color-primary-light)_244deg_360deg)]">
                    <div className="w-[100px] h-[100px] bg-white rounded-full flex flex-col justify-start items-center pt-[15px]">
                        <span className="text-[22px] font-bold text-primary-dark leading-none">{percentage}%</span>
                        <span className="text-[9px] text-[#868e96]">{label}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mt-3">
                <span className="text-[9px] text-[#868e96] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Safe</span>
                <span className="text-[9px] text-[#868e96] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#E63946]"></span> Elevated</span>
                <span className="text-[9px] text-[#868e96] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-border-light"></span> Unassigned</span>
            </div>
        </div>
    );
};

export default RiskOverview;
