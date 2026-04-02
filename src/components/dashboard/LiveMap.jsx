import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, LoaderCircle, Map } from 'lucide-react';

/** Stable pseudo-random position in % for schematic map (0–100). */
const hashPosition = (seed, salt = 0) => {
    const s = `${seed}:${salt}`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    const u1 = ((h >>> 0) % 1000) / 1000;
    const u2 = ((Math.imul(h, 31) >>> 0) % 1000) / 1000;
    return { top: 14 + u1 * 72, left: 12 + u2 * 76 };
};

const scatterByCoordinates = (items) => {
    const withCoord = items.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (withCoord.length === 0) {
        return items.map((m, i) => ({ ...m, ...hashPosition(m.id, i) }));
    }
    const lats = withCoord.map((m) => m.lat);
    const lngs = withCoord.map((m) => m.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    if (maxLat === minLat) {
        minLat -= 0.001;
        maxLat += 0.001;
    }
    if (maxLng === minLng) {
        minLng -= 0.001;
        maxLng += 0.001;
    }
    const pad = 0.1;
    return items.map((m, i) => {
        if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) {
            return { ...m, ...hashPosition(m.id, i) };
        }
        const nx = (m.lng - minLng) / (maxLng - minLng);
        const ny = (m.lat - minLat) / (maxLat - minLat);
        return {
            ...m,
            left: pad * 100 + nx * (100 - 2 * pad * 100),
            top: pad * 100 + (1 - ny) * (100 - 2 * pad * 100),
        };
    });
};

/**
 * Schematic overview of recent animal telemetry (tag positions from movement API).
 */
const LiveMap = ({ movements = [], loading = false }) => {
    const placed = useMemo(() => scatterByCoordinates(movements), [movements]);

    const emptyMessage =
        !loading && movements.length === 0
            ? 'No recent telemetry yet. Positions appear when tagged animals report in.'
            : null;

    return (
        <div className="relative col-span-2 flex flex-col rounded-2xl border border-border-light bg-white p-4 shadow-premium">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="mb-0 text-[13px] font-semibold text-primary-dark">Live Tracking Map</h3>
                    {loading && (
                        <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-medium" aria-hidden />
                    )}
                </div>
                <Link
                    to="/dashboard/map-tracking"
                    className="inline-flex w-fit items-center gap-1 rounded-full border border-border-light bg-white px-2.5 py-1 text-[9px] font-semibold text-primary-dark transition hover:border-primary-medium hover:bg-primary-light/20"
                >
                    <Map size={10} />
                    Full map
                </Link>
            </div>

            <div className="relative mt-1 min-h-[200px] flex-1 overflow-hidden rounded-xl bg-[#e9ecef]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(143,184,162,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(143,184,162,0.12)_1px,transparent_1px)] bg-[length:20px_20px]" />

                {emptyMessage && (
                    <div className="absolute inset-0 z-[2] flex items-center justify-center px-6 text-center">
                        <p className="max-w-xs text-[11px] leading-relaxed text-text-gray">{emptyMessage}</p>
                    </div>
                )}

                <div className="relative h-full min-h-[200px] w-full">
                    {placed.map((m) => (
                        <div
                            key={m.id}
                            className="absolute z-[2] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#fab005] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] ring-2 ring-white/90"
                            style={{ top: `${m.top}%`, left: `${m.left}%` }}
                            title={`Telemetry: ${m.tagId}`}
                        >
                            <Activity size={12} aria-hidden />
                            <span className="pointer-events-none absolute inset-0 rounded-full bg-[#fab005] opacity-40 animate-ping" />
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-2 border-t border-border-light/80 pt-2 text-[9px] text-text-gray">
                Each marker is a recent tag position (up to 10). Open the full map for geographic detail.
            </p>
        </div>
    );
};

export default LiveMap;
