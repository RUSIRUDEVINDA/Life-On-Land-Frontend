import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const IncidentCard = ({ title, description, time, loading = false, incidentId = '' }) => {
    const detailTo = incidentId ? `/dashboard/incidents?id=${encodeURIComponent(incidentId)}` : '/dashboard/incidents';

    return (
        <div className="rounded-2xl p-4 flex flex-col shadow-premium bg-primary-dark text-white bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:16px_16px]">
            <h3 className="text-[13px] font-semibold text-white mb-3">Recent Incidents</h3>
            {loading ? (
                <div className="flex flex-col gap-3 animate-pulse mt-2 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-[42px] h-[42px] bg-white/10 rounded-xl shrink-0" />
                        <div className="flex flex-col flex-1 gap-2">
                            <div className="h-3.5 w-2/3 rounded bg-white/15" />
                            <div className="h-2.5 w-full rounded bg-white/10" />
                            <div className="h-4 w-24 rounded-md bg-white/10" />
                        </div>
                    </div>
                </div>
            ) : !title ? (
                <div className="mt-2 mb-4">
                    <p className="text-[12px] text-white/75 mb-3">No incidents logged yet. Reports will show here.</p>
                </div>
            ) : (
                <div className="flex items-center gap-3 mt-2 mb-4">
                    <div className="w-[42px] h-[42px] bg-white/10 rounded-xl flex justify-center items-center text-primary-medium shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="text-[13px] font-bold mb-0.5">{title}</h4>
                        <p className="text-[10px] text-white/70 mb-1.5 line-clamp-3">{description}</p>
                        <span className="inline-block text-[8px] bg-primary-medium/20 text-primary-medium px-1.5 py-0.5 rounded-md self-start">
                            {time}
                        </span>
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
