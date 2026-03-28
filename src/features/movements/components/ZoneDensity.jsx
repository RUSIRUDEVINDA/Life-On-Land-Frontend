import React from 'react';
import { Activity, Clock, MapPin } from 'lucide-react';

const ZoneDensity = ({ summary }) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-primary-dark text-white rounded-[24px] p-6 shadow-elevated relative overflow-hidden group">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="text-[14px] font-black tracking-tight">Activity Pulse</h3>
                            <span className="text-[10px] text-primary-medium font-bold uppercase tracking-widest">Network Status</span>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform duration-500">
                            <Activity size={20} className="text-primary-medium animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div className="flex gap-2.5 items-center">
                                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary-medium"><Clock size={14} /></div>
                                <span className="text-[13px] font-bold text-white/80">Ingress Rate</span>
                            </div>
                            <span className="text-[13px] font-black text-primary-light">2.4/min</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2.5 items-center">
                                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary-medium"><MapPin size={14} /></div>
                                <span className="text-[13px] font-bold text-white/80">Active Sector</span>
                            </div>
                            <span className="text-[13px] font-black">12 / 15</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-primary rounded-full blur-[60px] opacity-20"></div>
            </div>

            <div className="bg-white rounded-[24px] p-6 border border-border-light shadow-premium flex flex-col gap-5 hover:shadow-elevated transition-shadow duration-500">
                <div className="flex flex-col">
                    <h3 className="text-[14px] font-black text-primary-dark tracking-tight">Zone Density</h3>
                    <span className="text-[10px] text-[#adb5bd] font-bold uppercase tracking-widest">Log Distribution</span>
                </div>
                <div className="flex flex-col gap-4">
                    {summary?.data?.map((zone, idx) => (
                        <div key={idx} className="flex flex-col gap-2 group">
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="font-bold text-primary-dark group-hover:text-primary transition-colors">{zone.zoneDetails?.name || zone._id}</span>
                                <span className="text-[10px] font-black bg-bg-soft px-1.5 py-0.5 rounded-md text-text-gray">{zone.count}</span>
                            </div>
                            <div className="w-full h-1.5 bg-bg-soft rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary-medium rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(100, (zone.count / 100) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )) || (
                            <div className="flex flex-col items-center py-4 gap-2 opacity-40">
                                <Activity size={24} />
                                <p className="text-[11px] font-bold">No data</p>
                            </div>
                        )}
                </div>
                <button className="mt-1 w-full py-3 text-[11px] font-black text-primary uppercase tracking-widest border border-primary/20 rounded-xl hover:bg-primary-light transition-all active:scale-95">Analytics</button>
            </div>
        </div>
    );
};

export default ZoneDensity;
