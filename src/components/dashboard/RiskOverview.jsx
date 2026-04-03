import React, { useMemo } from 'react';

const CX = 70;
const CY = 70;
const R_OUT = 62;
const R_IN = 40;
/** Start at 12 o'clock, sweep clockwise (SVG y-down + sweep 1). */
const PIE_START = -Math.PI / 2;

/**
 * Annulus sector from angle a1 → a2 (radians), clockwise from a1 to a2.
 */
const donutSectorPath = (a1, a2) => {
    const cos = Math.cos;
    const sin = Math.sin;
    const x1o = CX + R_OUT * cos(a1);
    const y1o = CY + R_OUT * sin(a1);
    const x2o = CX + R_OUT * cos(a2);
    const y2o = CY + R_OUT * sin(a2);
    const x2i = CX + R_IN * cos(a2);
    const y2i = CY + R_IN * sin(a2);
    const x1i = CX + R_IN * cos(a1);
    const y1i = CY + R_IN * sin(a1);
    const sweep = a2 - a1;
    const largeArc = sweep > Math.PI ? 1 : 0;
    return [
        `M ${x1o} ${y1o}`,
        `A ${R_OUT} ${R_OUT} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x2i} ${y2i}`,
        `A ${R_IN} ${R_IN} 0 ${largeArc} 0 ${x1i} ${y1i}`,
        'Z',
    ].join(' ');
};

const fullGreyRing = () => [
    { key: 'ring-a', d: donutSectorPath(PIE_START, PIE_START + Math.PI), color: '#dee2e6' },
    { key: 'ring-b', d: donutSectorPath(PIE_START + Math.PI, PIE_START + 2 * Math.PI), color: '#dee2e6' },
];

/**
 * Full pie (donut) risk breakdown from aggregated zone risk levels (e.g. GET /api/risk-map).
 * safe = LOW, elevated = MEDIUM+HIGH+CRITICAL, unassigned = unknown / no tier
 */
const RiskOverview = ({ safe = 0, elevated = 0, unassigned = 0, loading = false }) => {
    const total = safe + elevated + unassigned;
    const lowRiskPct = total > 0 ? Math.round((safe / total) * 100) : 0;

    const sectors = useMemo(() => {
        const fullTurn = PIE_START + 2 * Math.PI;

        const parts = [
            { color: '#2a5a45', n: safe },
            { color: '#E63946', n: elevated },
            { color: '#dee2e6', n: unassigned },
        ].filter((p) => p.n > 0);

        if (parts.length === 0) {
            return fullGreyRing();
        }

        const t = total;
        const fullRingOneColor = (color, keyPrefix) => [
            { key: `${keyPrefix}-a`, d: donutSectorPath(PIE_START, PIE_START + Math.PI), color },
            { key: `${keyPrefix}-b`, d: donutSectorPath(PIE_START + Math.PI, fullTurn), color },
        ];

        if (parts.length === 1) {
            return fullRingOneColor(parts[0].color, 'risk-seg');
        }

        let θ = PIE_START;
        const list = [];
        parts.forEach((p, i) => {
            const δ = (p.n / t) * 2 * Math.PI;
            const θ2 = i === parts.length - 1 ? fullTurn : θ + δ;
            list.push({
                key: `risk-seg-${i}`,
                d: donutSectorPath(θ, θ2),
                color: p.color,
            });
            θ = θ2;
        });
        return list;
    }, [safe, elevated, unassigned, total]);

    return (
        <div className="bg-white rounded-2xl p-4 border border-border-light shadow-premium flex flex-col items-center pb-4">
            <h3 className="text-[13px] font-semibold text-primary-dark mb-3 self-start">Protected Zone Risk</h3>
            <div className="relative mt-1 flex h-[140px] w-[140px] shrink-0 items-center justify-center">
                <svg
                    width="140"
                    height="140"
                    className="block"
                    viewBox="0 0 140 140"
                    aria-hidden
                >
                    {sectors.map((s) => (
                        <path key={s.key} d={s.d} fill={s.color} stroke="none" />
                    ))}
                    <circle cx={CX} cy={CY} r={R_IN} fill="white" />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-bold leading-none text-primary-dark">
                        {loading ? '—' : total === 0 ? '—' : `${lowRiskPct}%`}
                    </span>
                    <span className="mt-0.5 text-[9px] text-[#868e96]">
                        {loading ? 'Loading…' : total === 0 ? 'No zone data' : 'Low risk zones'}
                    </span>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 text-[9px] text-[#868e96]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Safe ({loading ? '—' : safe})
                </span>
                <span className="flex items-center gap-1 text-[9px] text-[#868e96]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E63946]" />
                    Elevated ({loading ? '—' : elevated})
                </span>
                <span className="flex items-center gap-1 text-[9px] text-[#868e96]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border-light" />
                    Unassigned ({loading ? '—' : unassigned})
                </span>
            </div>
        </div>
    );
};

export default RiskOverview;
