import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, MapPinned } from 'lucide-react';

const severityTone = {
    CRITICAL: 'bg-[#E63946]/35 text-white border border-[#E63946]/55',
    HIGH: 'bg-[#f76707]/30 text-white border border-[#f76707]/50',
    MEDIUM: 'bg-[#fab005]/30 text-white border border-[#fab005]/50',
    LOW: 'bg-emerald-500/25 text-emerald-50 border border-emerald-400/40',
};

const statusTone = {
    REPORTED: 'bg-amber-400/20 text-amber-50 border border-amber-300/35',
    VERIFIED: 'bg-emerald-500/25 text-emerald-50 border border-emerald-400/40',
    INVESTIGATING: 'bg-white/15 text-white border border-white/30',
    UNVERIFIED: 'bg-white/10 text-white/95 border border-white/25',
    RESOLVED: 'bg-sky-500/20 text-sky-50 border border-sky-300/35',
};

const IncidentCard = ({
    title,
    description = '',
    location = '',
    severity,
    status,
    time,
    timeDetail = '',
    loading = false,
    incidentId = '',
}) => {
    const detailTo = incidentId ? `/dashboard/incidents?id=${encodeURIComponent(incidentId)}` : '/dashboard/incidents';

    const severityKey = String(severity || '').toUpperCase();
    const statusKey = String(status || 'UNVERIFIED').toUpperCase();
    const severityClass = severityTone[severityKey] || 'bg-white/10 text-white/90 border border-white/20';
    const statusClass = statusTone[statusKey] || statusTone.UNVERIFIED;

    return (
        <div className="rounded-2xl p-4 flex flex-col shadow-premium bg-primary-dark text-white bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:16px_16px]">
            <h3 className="text-[13px] font-semibold text-white mb-3">Recent Incidents</h3>
            {loading ? (
                <div className="flex flex-col gap-3 animate-pulse mt-1 mb-4">
                    <div className="flex gap-3">
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-white/10" />
                        <div className="flex flex-1 flex-col gap-2 min-w-0">
                            <div className="h-4 w-4/5 max-w-[200px] rounded bg-white/15" />
                            <div className="flex gap-1.5">
                                <div className="h-5 w-16 rounded-full bg-white/10" />
                                <div className="h-5 w-20 rounded-full bg-white/10" />
                            </div>
                            <div className="h-3 w-full rounded bg-white/10" />
                            <div className="h-3 w-2/3 rounded bg-white/10" />
                            <div className="h-3.5 w-28 rounded bg-white/10" />
                        </div>
                    </div>
                </div>
            ) : !title ? (
                <div className="mt-2 mb-4">
                    <p className="text-[12px] text-white/75 mb-3">No incidents logged yet. Reports will show here.</p>
                </div>
            ) : (
                <div className="flex gap-3 mt-1 mb-4 min-h-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-primary-light ring-1 ring-white/10">
                        <AlertTriangle size={22} strokeWidth={2.25} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <h4 className="text-[14px] font-bold leading-snug tracking-tight text-white">{title}</h4>

                        <div className="flex flex-wrap gap-1.5">
                            {severityKey ? (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${severityClass}`}
                                >
                                    {severityKey}
                                </span>
                            ) : null}
                            <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusClass}`}
                            >
                                {statusKey.replaceAll('_', ' ')}
                            </span>
                        </div>

                        {location ? (
                            <div className="flex items-start gap-1.5 text-[11px] leading-snug text-white/85">
                                <MapPinned size={14} className="mt-0.5 shrink-0 text-primary-light" strokeWidth={2} />
                                <span>{location}</span>
                            </div>
                        ) : null}

                        {description.trim() ? (
                            <p className="border-l-2 border-white/25 pl-2.5 text-[11px] leading-relaxed text-white/70 line-clamp-3">
                                {description.trim()}
                            </p>
                        ) : null}

                        <div className="mt-0.5 flex flex-col gap-0.5 border-t border-white/10 pt-2">
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                                <Clock size={14} className="shrink-0 text-primary-light" strokeWidth={2} />
                                <span>{time}</span>
                            </div>
                            {timeDetail ? (
                                <p className="pl-[22px] text-[10px] font-medium text-white/55">{timeDetail}</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
            <Link
                to={detailTo}
                className="bg-primary text-white border border-white/20 p-2 rounded-md text-[11px] font-semibold cursor-pointer transition-all duration-200 hover:bg-white hover:text-primary-dark outline-none text-center no-underline"
            >
                View Incident Details
            </Link>
        </div>
    );
};

export default IncidentCard;
