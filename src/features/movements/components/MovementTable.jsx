import React from 'react';
import { Activity, MapPin, Clock, Zap, AlertCircle } from 'lucide-react';

const MovementTable = ({ movements, loading }) => {
    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-bg-soft rounded-xl animate-pulse shimmer"></div>
                ))}
            </div>
        );
    }

    if (movements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
                <Activity size={40} />
                <p className="text-[14px] font-bold">No movement logs detected</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-bg-soft/30">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Entity ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Geo Coordinates</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Timestamp</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Telemetry</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                    {movements.map((move, idx) => (
                        <tr key={move.id} className="group hover:bg-bg-soft/40 transition-all duration-300" style={{ animationDelay: `${idx * 40}ms` }}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-[11px]">
                                        {move.tagId.substring(0, 2)}
                                    </div>
                                    <span className="text-[13px] font-bold text-primary-dark">{move.tagId}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-mono font-bold text-primary-medium">
                                        {move.lat?.toFixed(4)}, {move.lng?.toFixed(4)}
                                    </span>
                                    <span className="text-[10px] font-medium text-text-gray flex items-center gap-1">
                                        <MapPin size={10} /> {move.zoneName || move.zone || 'Global Zone'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-2 items-center">
                                    <Clock size={12} className="text-[#adb5bd]" />
                                    <span className="text-[12px] font-bold text-primary-dark opacity-90">
                                        {new Date(move.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold">
                                        <Activity size={10} /> {move.speed}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold">
                                        <Zap size={10} /> {move.battery}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MovementTable;
