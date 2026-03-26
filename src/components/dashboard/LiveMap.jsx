import React from 'react';
import { Navigation, Activity, AlertTriangle } from 'lucide-react';

const LiveMap = () => {
    return (
        <div className="col-span-2 bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col relative">
            <div className="flex justify-between items-center mb-0">
                <h3 className="text-[13px] font-semibold text-primary-dark mb-0">Live Tracking Map</h3>
                <div className="flex gap-1.5">
                    <span className="text-[9px] px-2 py-1 rounded-full bg-primary-dark text-white cursor-pointer font-medium">All</span>
                    <span className="text-[9px] px-2 py-1 rounded-full bg-bg-soft text-text-gray cursor-pointer font-medium">Zones</span>
                    <span className="text-[9px] px-2 py-1 rounded-full bg-bg-soft text-text-gray cursor-pointer font-medium">Patrols</span>
                    <span className="text-[9px] px-2 py-1 rounded-full bg-bg-soft text-text-gray cursor-pointer font-medium">Animals</span>
                </div>
            </div>
            <div className="flex-1 mt-2 rounded-xl overflow-hidden relative bg-[#e9ecef] min-h-[180px]">
                <div className="w-full h-full bg-[linear-gradient(to_right,rgba(143,184,162,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(143,184,162,0.1)_1px,transparent_1px)] bg-[length:20px_20px] relative">
                    {/* Zones */}
                    <div className="absolute px-1.5 py-0.5 bg-white/90 border border-border-light rounded-md text-[9px] font-semibold text-primary-dark -translate-x-1/2 -translate-y-1/2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-[1]" style={{ top: '20%', left: '10%' }}>Zone A</div>
                    <div className="absolute px-1.5 py-0.5 bg-white/90 border border-[#E63946] rounded-md text-[9px] font-semibold text-[#E63946] -translate-x-1/2 -translate-y-1/2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-[1]" style={{ top: '60%', left: '15%' }}>Zone C (High Risk)</div>

                    {/* Entities */}
                    <div className="absolute w-6 h-6 rounded-full flex justify-center items-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] -translate-x-1/2 -translate-y-1/2 z-[2] bg-primary" style={{ top: '30%', left: '40%' }}>
                        <Navigation size={12} className="animate-spin-slow" />
                        <span className="absolute inset-0 rounded-full bg-inherit opacity-50 animate-ping"></span>
                    </div>
                    <div className="absolute w-6 h-6 rounded-full flex justify-center items-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] -translate-x-1/2 -translate-y-1/2 z-[2] bg-[#fab005]" style={{ top: '60%', left: '70%' }}>
                        <Activity size={12} />
                        <span className="absolute inset-0 rounded-full bg-inherit opacity-50 animate-ping"></span>
                    </div>
                    <div className="absolute w-6 h-6 rounded-full flex justify-center items-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] -translate-x-1/2 -translate-y-1/2 z-[2] bg-[#E63946]" style={{ top: '45%', left: '20%' }}>
                        <AlertTriangle size={12} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveMap;
