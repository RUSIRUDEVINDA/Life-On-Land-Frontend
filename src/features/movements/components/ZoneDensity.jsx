import React from 'react';
import { Activity } from 'lucide-react';

const ZoneDensity = ({ summary, zoneLookup = {}, areaLookup = {} }) => {
    const data = summary?.data || [];
    const totalCount = summary?.pagination?.total || 0;
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[24px] p-6 border border-border-light shadow-premium flex flex-col gap-5 hover:shadow-elevated transition-shadow duration-500">
                <div className="flex flex-col">
                    <h3 className="text-[14px] font-black text-primary-dark tracking-tight">Zone Density</h3>
                    <span className="text-[10px] text-[#adb5bd] font-bold uppercase tracking-widest">Log Distribution</span>
                </div>
                <div className="flex flex-col gap-4">
                    {data.length > 0 ? (
                        data.map((zone, idx) => {
                            const zoneName = zone.zoneDetails?.name || zoneLookup[zone._id] || zone._id || 'Unknown Zone';
                            const zoneType = zone.zoneDetails?.zoneType || zone.zoneType || 'Unknown';
                            const areaId = zone.zoneDetails?.protectedAreaId || zone.protectedAreaId;
                            const areaName =
                                zone.protectedAreaName ||
                                zone.zoneDetails?.protectedArea?.name ||
                                areaLookup?.[areaId] ||
                                'Unknown Protected Area';
                            const activeTags = Array.isArray(zone.animals) ? zone.animals.length : 0;
                            const lastSeen = zone.latestTimestamp
                                ? new Date(zone.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '--';

                            return (
                                <div key={idx} className="flex flex-col gap-2.5 group">
                                    <div className="flex justify-between items-center text-[12px]">
                                        <span className="font-bold text-primary-dark group-hover:text-primary transition-colors">
                                            {zoneName}
                                        </span>
                                        <span className="text-[10px] font-black bg-bg-soft px-1.5 py-0.5 rounded-md text-text-gray">{zone.count}</span>
                                    </div>
                                    <div className="text-[10px] font-semibold text-text-gray flex flex-wrap gap-x-2 gap-y-1">
                                        <span className="uppercase tracking-widest">{zoneType}</span>
                                        <span className="opacity-60">•</span>
                                        <span className="text-primary-dark/80">{areaName}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-text-gray">
                                        <span>Last sync: {lastSeen}</span>
                                        <span>Active tags: {activeTags}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-bg-soft rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-primary-medium rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.min(100, (zone.count / (totalCount || 100)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center py-4 gap-2 opacity-40">
                            <Activity size={24} />
                            <p className="text-[11px] font-bold">No data</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ZoneDensity;