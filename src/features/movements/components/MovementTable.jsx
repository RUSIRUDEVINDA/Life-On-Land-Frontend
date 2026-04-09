import React from 'react';
import { Activity, Clock } from 'lucide-react';

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
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Protected Area</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Zone</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#adb5bd] uppercase tracking-[0.1em] border-b border-border-light">Date &amp; Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                    {movements.map((move, idx) => {
                        const movementId =
                            move?.id ||
                            move?._id ||
                            (move?.tagId && move?.timestamp ? `${move.tagId}-${move.timestamp}` : `movement-${idx}`);
                        const tagLabel = move?.tagId || 'Unknown';
                        const lat = Number(move?.lat);
                        const lng = Number(move?.lng);
                        const latLabel = Number.isFinite(lat) ? lat.toFixed(4) : '--';
                        const lngLabel = Number.isFinite(lng) ? lng.toFixed(4) : '--';
                        const timestamp = move?.timestamp ? new Date(move.timestamp) : null;
                        const dateLabel = timestamp
                            ? timestamp.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' })
                            : 'Unknown';
                        const timeLabel = timestamp
                            ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : 'Unknown';
                        const protectedAreaLabel =
                            move?.protectedAreaName ||
                            move?.protectedArea?.name ||
                            'Unknown Protected Area';
                        const zoneLabel =
                            move?.zoneName ||
                            move?.zone?.name ||
                            'Unknown Zone';

                        return (
                            <tr key={movementId} className="group hover:bg-bg-soft/40 transition-all duration-300" style={{ animationDelay: `${idx * 40}ms` }}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-[11px]">
                                            {tagLabel.substring(0, 2)}
                                        </div>
                                        <span className="text-[13px] font-bold text-primary-dark">{tagLabel}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-mono font-bold text-primary-medium">
                                            {latLabel}, {lngLabel}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[12px] font-semibold text-primary-dark">{protectedAreaLabel}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[12px] font-semibold text-primary-dark">{zoneLabel}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2 items-center">
                                        <Clock size={12} className="text-[#adb5bd]" />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-primary-dark">{dateLabel}</span>
                                            <span className="text-[12px] font-bold text-primary-dark opacity-90">{timeLabel}</span>
                                        </div>
                                    </div>
                                </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default MovementTable;
